const session = require('express-session');
const MongoStore = require('connect-mongo');

const ONE_WEEK = 1000 * 60 * 60 * 24 * 7;

const allowedSameSite = new Set(['lax', 'strict', 'none']);

const resolveSameSite = () => {
  const raw = (process.env.COOKIE_SAMESITE || process.env.SESSION_COOKIE_SAMESITE || '').toLowerCase();
  const isProduction = process.env.NODE_ENV === 'production';

  if (allowedSameSite.has(raw)) {
    if (raw === 'none' && !isProduction) {
      return 'lax';
    }
    if (raw === 'none' && isProduction) {
      return 'none';
    }
    return raw;
  }

  return isProduction ? 'none' : 'lax';
};

function createSessionStore() {
  if (!process.env.MONGO_URI) {
    console.warn('MONGO_URI missing. Falling back to in-memory session store.');
    return undefined;
  }

  return MongoStore.create({
    mongoUrl: process.env.MONGO_URI,
    collectionName: 'sessions',
    ttl: ONE_WEEK / 1000
  });
}

module.exports = session({
  name: 'cebootcamp.sid',
  secret: process.env.SESSION_SECRET || 'cebootcamp-session',
  resave: false,
  saveUninitialized: false,
  proxy: process.env.NODE_ENV === 'production',
  cookie: {
    httpOnly: true,
    sameSite: resolveSameSite(),
    maxAge: ONE_WEEK,
    secure: process.env.NODE_ENV === 'production'
  },
  store: createSessionStore()
});
