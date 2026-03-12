const express = require('express');
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

// Initialize Express app
const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'https://myveed-frontend.vercel.app',
  'https://maveed.io',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log('Blocked by CORS:', origin);
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
// Explicitly handle preflight requests
app.options('*', cors(corsOptions));

app.use(express.json({
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const origin = req.headers.origin || 'N/A';
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${origin}`);
  next();
});

// Health check endpoint (moved under /api as per requirement or kept original?)
// Requirement says "Ensure these endpoints work: /api/health"
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Video SaaS API is running',
    timestamp: new Date().toISOString()
  });
});

// Original health check for backward compatibility
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

module.exports = app;
