const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const passport = require('passport');
const lusca = require('lusca');

const sessionMiddleware = require('./config/session');
const configurePassport = require('./config/passport');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const { attachUser } = require('./middleware/auth');

configurePassport(passport);

const app = express();
app.set('trust proxy', 1);

const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((origin) => origin.trim()).filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:3000'];

const isDev = process.env.NODE_ENV !== 'production';

const isAllowedOrigin = (origin) => {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  if (isDev) {
    try {
      const { hostname, protocol } = new URL(origin);

      const isLoopback = hostname === 'localhost'
        || hostname === '0.0.0.0'
        || hostname === '::1'
        || hostname.startsWith('127.');

      if (protocol === 'http:' && isLoopback) {
        return true;
      }

      if (hostname.endsWith('.app.github.dev') || hostname.endsWith('.githubpreview.dev')) {
        return true;
      }
    } catch (error) {
      return false;
    }
  }

  return false;
};

app.use(helmet());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(compression());
app.use(cors({
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, origin || true);
    }
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(sessionMiddleware);
app.use(passport.initialize());
app.use(passport.session());
app.use(attachUser);

app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));

app.use(['/api', '/'], routes);

app.use((req, res, next) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(errorHandler);

module.exports = app;
