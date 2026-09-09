const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  // Production always requires a real MongoDB (Atlas, etc.).
  if (process.env.NODE_ENV === 'production' && !uri) {
    console.error('MONGODB_URI is required in production.');
    process.exit(1);
  }

  // Try the configured MongoDB first (fail fast instead of buffering forever).
  if (uri && process.env.USE_IN_MEMORY_DB !== 'true') {
    try {
      const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log(`MongoDB connected: ${conn.connection.host}`);
      return;
    } catch (err) {
      console.warn(`Could not connect to MongoDB at ${uri}: ${err.message.split('\n')[0]}`);
      if (process.env.NODE_ENV === 'production') {
        console.error('Database connection failed in production.');
        process.exit(1);
      }
      console.log('Falling back to in-memory MongoDB for local development…');
    }
  }

  // Fallback: spin up an in-memory MongoDB (mongodb-memory-server).
  // Note: data is ephemeral — it resets when the server restarts.
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mem = await MongoMemoryServer.create();
  const memUri = mem.getUri();
  const conn = await mongoose.connect(memUri);
  console.log(`MongoDB connected: (in-memory) ${memUri}`);
  // Keep a reference so we can stop it cleanly on shutdown.
  global.__MEMDB__ = mem;
  return conn;
};

module.exports = connectDB;
