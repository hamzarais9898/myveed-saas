const mongoose = require('mongoose');
const app = require('../src/app');

// Cached connection variable
let cachedDb = null;

const connectToDatabase = async () => {
  if (cachedDb) {
    console.log('=> Using existing database connection');
    return cachedDb;
  }

  console.log('=> Creating new database connection');
  
  // Connection options optimized for serverless
  const opts = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  };

  try {
    const db = await mongoose.connect(process.env.MONGODB_URI, opts);
    cachedDb = db;
    console.log('✅ MongoDB connected successfully (Serverless)');
    return cachedDb;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// Vercel serverless function entry point
module.exports = async (req, res) => {
  try {
    // Ensure DB is connected
    await connectToDatabase();
    
    // Call the express app
    return app(req, res);
  } catch (error) {
    console.error('Serverless Error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
