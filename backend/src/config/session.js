const session = require('express-session');
const MongoStore = require('connect-mongo');

const ONE_WEEK = 1000 * 60 * 60 * 24 * 7;

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
    sameSite: 'lax',
    maxAge: ONE_WEEK,
    secure: process.env.NODE_ENV === 'production'
  },
  store: createSessionStore()
});
