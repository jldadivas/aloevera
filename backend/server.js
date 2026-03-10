// server.js
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

// ----------------- CORS SETUP -----------------

// Default frontend URLs
const defaultAllowedOrigins = ['http://localhost:3000'];

// Add Vercel frontend URL from environment variable (CORS_ORIGIN)
const allowedOrigins = process.env.CORS_ORIGIN
  ? [...defaultAllowedOrigins, ...process.env.CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean)]
  : defaultAllowedOrigins;

// Configure CORS middleware
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like Postman or server-to-server)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.error('Blocked CORS request from origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies
};

app.use(cors(corsOptions));

// ----------------- MIDDLEWARE -----------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());

// ----------------- HEALTH CHECK -----------------
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// ----------------- ROUTES -----------------
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/plants', require('./routes/plants'));
app.use('/api/v1/scans', require('./routes/scans'));
app.use('/api/v1/diseases', require('./routes/diseases'));
app.use('/api/v1/analytics', require('./routes/analytics'));
app.use('/api/v1/training', require('./routes/training'));
app.use('/api/v1/admin', require('./routes/admin'));
app.use('/api/v1/tickets', require('./routes/tickets'));
app.use('/api/v1/chatbot', require('./routes/chatbot'));
app.use('/api/v1/ml', require('./routes/ml'));
app.use('/api/v1/community', require('./routes/community'));
app.use('/api/v1/map', require('./routes/map'));

// ----------------- 404 HANDLER -----------------
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ----------------- ERROR HANDLER -----------------
app.use(errorHandler);

// ----------------- START SERVER -----------------
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled rejection: ${err.message}`);
  server.close(() => process.exit(1));
});

module.exports = app;