const mongoose = require('mongoose');

let isConnected = false;

mongoose.set('strictQuery', false);

async function connectDatabase() {
  if (isConnected) {
    return mongoose.connection;
  }

  const uri =
    process.env.MONGO_URI ||
    process.env.MONGODB_URI ||
    process.env.DATABASE_URL ||
    null;

  if (!uri) {
    throw new Error('Mongo connection string is not defined in environment variables');
  }

  await mongoose.connect(uri, {
    autoIndex: process.env.NODE_ENV !== 'production',
    useNewUrlParser: true,
    useUnifiedTopology: true
  });

  isConnected = true;
  console.log(`Connected to MongoDB database: ${mongoose.connection.name}`);
  return mongoose.connection;
}

module.exports = {
  connectDatabase
};
