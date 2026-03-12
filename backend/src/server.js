require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');
const schedulerService = require('./services/schedulerService');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  // Initialize scheduler for automated publishing AFTER DB is ready
  const bootScheduler = () => {
    schedulerService.initScheduler();
    console.log(`✅ Scheduler booted (pid=${process.pid}, env=${process.env.NODE_ENV || 'development'}) - ${new Date().toISOString()}`);
  };

  if (mongoose.connection.readyState === 1) {
    bootScheduler();
  } else {
    mongoose.connection.once('open', bootScheduler);
  }

  app.listen(PORT, () => {
    console.log(`🚀 MAVEED Local Server running on port ${PORT}`);
    console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  });
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});
