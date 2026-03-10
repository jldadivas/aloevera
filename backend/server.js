const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const connectToDatabase = require('./config/database');
const { validateEnv } = require('./config/validateEnv');
const errorHandler = require('./middlewares/errorHandler');

// Load environment variables
dotenv.config();
validateEnv();

// Connect to database
connectToDatabase();

// Initialize Express app
const app = express();

// Parse and configure CORS origins.
// When CORS_ORIGIN is unset, reflect request origin (works with credentials).
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : [];

const corsOptions = allowedOrigins.length
  ? {
      origin: (origin, callback) => {
        // Allow non-browser and same-origin requests with no Origin header.
        if (!origin || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true
    }
  : {
      origin: true,
      credentials: true
    };

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/plants', require('./routes/plants'));
app.use('/api/v1/scans', require('./routes/scans'));
app.use('/api/v1/diseases', require('./routes/diseases'));
app.use('/api/v1/analytics', require('./routes/analytics'));
app.use('/api/v1/training', require('./routes/training'));
app.use('/api/v1/admin', require('./routes/admin'));
app.use('/api/v1/tickets', require('./routes/tickets'));
app.use('/api/v1/chatbot', require('./routes/chatbot'));
app.use('/api/v1/ml', require('./routes/ml'));  // ML Integration endpoints
app.use('/api/v1/community', require('./routes/community'));
app.use('/api/v1/map', require('./routes/map'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;
