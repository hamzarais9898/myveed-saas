require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/authRoutes');
const videoRoutes = require('./routes/videoRoutes');
const imageRoutes = require('./routes/imageRoutes');
const publishRoutes = require('./routes/publishRoutes');
const tiktokAccountRoutes = require('./routes/tiktokAccountRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const ttsRoutes = require('./routes/ttsRoutes');
const shortsRoutes = require('./routes/shortsRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const goalsRoutes = require('./routes/goalsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const contactRoutes = require('./routes/contactRoutes');
const starsRoutes = require('./routes/starsRoutes');
const influencerRoutes = require('./routes/influencerRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const platformRoutes = require('./routes/platformRoutes');

// Import scheduler
const schedulerService = require('./services/schedulerService');

// Initialize Express app
const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://maveed.io',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for now, but log it
      console.log('CORS request from:', origin);
    }
  },
  credentials: true
}));
app.use(express.json({
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Video SaaS API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/images', imageRoutes);
app.use('/api', publishRoutes);
app.use('/api/tiktok-accounts', tiktokAccountRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/tts', ttsRoutes);
app.use('/api/shorts', shortsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/goals', goalsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/stars', starsRoutes);
app.use('/api/influencers', influencerRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api', platformRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
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

  // Bonus: Warning if scheduler not initialized after 10s (for debug)
  if (process.env.DEBUG_SCHEDULER === 'true') {
    setTimeout(() => {
      // Note: we'd need to expose the init state or check if logs appeared
      // For simplicity, we just log that we expect it to be running
      console.log(`[SCHEDULER DEBUG] 10s check: Connection state is ${mongoose.connection.readyState}`);
    }, 10000);
  }

  app.listen(PORT, () => {
    console.log(`🚀 MAVEED Server running on port ${PORT}`);
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
