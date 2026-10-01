const mongoose = require('mongoose');

// Global cache for serverless environments (e.g. Vercel)
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.warn('⚠️ MONGO_URI is not defined in environment variables.');
    return null;
  }

  if (!cached.promise) {
    const opts = {
      serverSelectionTimeoutMS: 5000,
    };

    cached.promise = mongoose.connect(mongoUri, opts).then((mongooseInstance) => {
      console.log(`MongoDB Connected: ${mongooseInstance.connection.host}`);
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error(`Error connecting to MongoDB: ${error.message}`);
    throw error;
  }

  return cached.conn;
};

module.exports = connectDB;
