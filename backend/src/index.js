require('dotenv').config();

const app = require('./app');
const { connectDatabase } = require('./config/database');
const { initializeRedis, disconnectRedis } = require('./config/redis');
const { createSocketServer, closeSocketServer } = require('./socket');
const {
  startMessageNotificationScheduler,
  stopMessageNotificationScheduler
} = require('./jobs/messageNotificationScheduler');

const PORT = process.env.PORT || 8080;

async function startServer() {
  try {
  await connectDatabase();
  await initializeRedis();

    const server = app.listen(PORT, () => {
      console.log(`API server listening on port ${PORT}`);
    });

    createSocketServer(server).catch((error) => {
      console.warn('Failed to bootstrap socket server:', error?.message || error);
    });

    startMessageNotificationScheduler();

    const shutdown = (signal) => {
      console.log(`Received ${signal}. Gracefully closing.`);
      server.close(() => {
        console.log('HTTP server closed');
        Promise.resolve(closeSocketServer())
          .catch((error) => {
            console.warn('Failed to close socket server gracefully:', error?.message || error);
          })
          .finally(() => {
            Promise.resolve(stopMessageNotificationScheduler())
              .catch((error) => {
                console.warn('Failed to stop notification scheduler gracefully:', error?.message || error);
              })
              .finally(() => {
                Promise.resolve(disconnectRedis())
              .catch((error) => {
                console.warn('Failed to close Redis connection gracefully:', error?.message || error);
              })
              .finally(() => {
                process.exit(0);
              });
              });
          });
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to boot server:', error);
    process.exit(1);
  }
}

startServer();
