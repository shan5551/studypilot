const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  // Production always requires a real MongoDB (Atlas, etc.).
  if (process.env.NODE_ENV === 'production' && !uri) {
    console.error('MONGODB_URI is required in production.');
    process.exit(1);
  }

  // Connection options shared by both real and in-memory connections
  const options = {
    serverSelectionTimeoutMS: 5000,
    maxPoolSize: 10,
    retryWrites: true
  };

  // Try the configured MongoDB first (fail fast instead of buffering forever).
  if (uri && process.env.USE_IN_MEMORY_DB !== 'true') {
    try {
      const conn = await mongoose.connect(uri, options);
      console.log(`MongoDB connected: ${conn.connection.host}`);
    } catch (err) {
      console.warn(`Could not connect to MongoDB at ${uri}: ${err.message.split('\n')[0]}`);
      if (process.env.NODE_ENV === 'production') {
        console.error('Database connection failed in production.');
        process.exit(1);
      }
      console.log('Falling back to in-memory MongoDB for local development...');
      return await connectInMemory();
    }
  } else {
    return await connectInMemory();
  }
};

async function connectInMemory() {
  const { MongoMemoryServer } = require('mongodb-memory-server');
  const mem = await MongoMemoryServer.create();
  const memUri = mem.getUri();
  const conn = await mongoose.connect(memUri);
  console.log(`MongoDB connected: (in-memory) ${memUri}`);
  global.__MEMDB__ = mem;
  return conn;
}

// ─── Connection event listeners ───────────────────────────────────
mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected.');
});

mongoose.connection.on('error', (err) => {
  console.error(`MongoDB connection error: ${err.message}`);
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected.');
});

module.exports = connectDB;
