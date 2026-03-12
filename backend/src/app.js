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

// Allowed frontend origins
const allowedOrigins = [
  'http://localhost:3000',
  'https://myveed-frontend.vercel.app',
  'https://maveed.io',
  process.env.FRONTEND_URL
].filter(Boolean);

// Early request log
app.use((req, res, next) => {
  const origin = req.headers.origin || 'N/A';
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${origin}`);
  next();
});

// Manual CORS + explicit preflight handling
app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  if (req.method === 'OPTIONS') {
    console.log(`✅ Preflight handled for ${req.path} from ${origin || 'N/A'}`);
    return res.sendStatus(204);
  }

  next();
});

// cors middleware as secondary protection
app.use(cors({
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
}));

app.use(express.json({
  limit: '50mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoints
app.get('/api/health', (req, res) => {
  return res.status(200).json({
    success: true,
    route: '/api/health',
    message: 'Video SaaS API is running',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  return res.status(200).json({
    success: true,
    route: '/health',
    message: 'Video SaaS API is running',
    timestamp: new Date().toISOString()
  });
});

// Specific API routes first
app.use('/api/auth', authRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/images', imageRoutes);
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

// Generic /api routes last
app.use('/api', publishRoutes);
app.use('/api', platformRoutes);

// 404 handler
app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Vary', 'Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }

  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

module.exports = app;