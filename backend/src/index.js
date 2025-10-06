require('dotenv').config();

const app = require('./app');
const { connectDatabase } = require('./config/database');

const PORT = process.env.PORT || 8080;

async function startServer() {
  try {
    await connectDatabase();

    const server = app.listen(PORT, () => {
      console.log(`API server listening on port ${PORT}`);
    });

    const shutdown = (signal) => {
      console.log(`Received ${signal}. Gracefully closing.`);
      server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
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
