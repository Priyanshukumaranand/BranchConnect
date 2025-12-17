const Redis = require('ioredis');

const state = {
  client: null,
  status: 'disabled',
  lastError: null,
  options: null
};

const recordError = (error) => {
  state.status = 'error';
  state.lastError = error ? error.message || String(error) : 'Unknown Redis error';
};

const toBool = (value) => {
  if (typeof value === 'string') {
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  }
  return Boolean(value);
};

const buildRedisOptions = () => {
  const {
    REDIS_URL,
    REDIS_HOST,
    REDIS_PORT,
    REDIS_USERNAME,
    REDIS_PASSWORD,
    REDIS_TLS
  } = process.env;

  if (REDIS_URL) {
    return {
      url: REDIS_URL,
      options: {
        lazyConnect: true,
        maxRetriesPerRequest: 2,
        enableAutoPipelining: true
      }
    };
  }

  if (!REDIS_HOST) {
    return null;
  }

  const port = Number.parseInt(REDIS_PORT, 10) || 6379;
  const tls = toBool(REDIS_TLS) ? {} : undefined;

  return {
    options: {
      host: REDIS_HOST,
      port,
      username: REDIS_USERNAME || undefined,
      password: REDIS_PASSWORD || undefined,
      tls,
      lazyConnect: true,
      maxRetriesPerRequest: 2,
      enableAutoPipelining: true
    }
  };
};

const attachEventHandlers = (client) => {
  client.on('ready', () => {
    state.status = 'ready';
    state.lastError = null;
  });

  client.on('connect', () => {
    if (state.status !== 'ready') {
      state.status = 'connected';
    }
  });

  client.on('error', (error) => {
    recordError(error);
  });

  client.on('end', () => {
    if (state.status !== 'disabled') {
      state.status = 'disconnected';
    }
  });

  client.on('reconnecting', () => {
    state.status = 'reconnecting';
  });
};

const ensureClient = () => {
  if (state.client) {
    return state.client;
  }

  const config = buildRedisOptions();

  if (!config) {
    state.status = 'disabled';
    return null;
  }

  const client = config.url
    ? new Redis(config.url, config.options)
    : new Redis(config.options);

  state.client = client;
  state.options = config;
  state.status = 'connecting';
  state.lastError = null;

  attachEventHandlers(client);

  return client;
};

const ensureConnected = async () => {
  const client = ensureClient();
  if (!client) {
    return null;
  }

  if (client.status === 'ready' || client.status === 'connecting') {
    return client;
  }

  try {
    await client.connect();
    return client;
  } catch (error) {
    recordError(error);
    console.warn('[redis] Unable to connect:', state.lastError);
    return null;
  }
};

async function initializeRedis() {
  const client = ensureClient();

  if (!client) {
    return null;
  }

  try {
    await client.connect();
  } catch (error) {
    recordError(error || 'Failed to connect to Redis');
    console.warn('[redis] Unable to connect:', state.lastError);
  }

  return client;
}

function getRedisClient() {
  return state.client;
}

async function getJson(key) {
  const client = await ensureConnected();
  if (!client) return null;

  try {
    const raw = await client.get(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    recordError(error);
    return null;
  }
}

async function setJson(key, value, ttlSeconds = null) {
  const client = await ensureConnected();
  if (!client) return false;

  try {
    const payload = JSON.stringify(value);
    if (ttlSeconds && Number.isFinite(ttlSeconds) && ttlSeconds > 0) {
      await client.set(key, payload, 'EX', Math.floor(ttlSeconds));
    } else {
      await client.set(key, payload);
    }
    return true;
  } catch (error) {
    recordError(error);
    return false;
  }
}

async function deleteKey(key) {
  const client = await ensureConnected();
  if (!client) return false;

  try {
    await client.del(key);
    return true;
  } catch (error) {
    recordError(error);
    return false;
  }
}

function getRedisHealth() {
  return {
    configured: Boolean(state.client),
    status: state.status,
    lastError: state.lastError
  };
}

async function disconnectRedis() {
  if (!state.client) {
    return;
  }

  try {
    await state.client.quit();
  } catch (error) {
    console.warn('[redis] Error during quit:', error?.message || error);
  } finally {
    state.client = null;
    state.status = 'disabled';
    state.lastError = null;
  }
}

module.exports = {
  initializeRedis,
  getRedisClient,
  getJson,
  setJson,
  deleteKey,
  getRedisHealth,
  disconnectRedis
};
