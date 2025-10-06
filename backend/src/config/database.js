const mongoose = require('mongoose');

let isConnected = false;

mongoose.set('strictQuery', true);

async function connectDatabase() {
  if (isConnected) {
    return mongoose.connection;
  }

  const uri = process.env.MONGO_URI;

  if (!uri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  await mongoose.connect(uri, {
    autoIndex: process.env.NODE_ENV !== 'production'
  });

  isConnected = true;
  console.log('Connected to MongoDB');
  return mongoose.connection;
}

module.exports = {
  connectDatabase
};
