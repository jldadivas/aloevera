# Backend API

Express.js backend for Aloe Vera Harvest Readiness Assessment System.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `config/.env`

3. Start server:
```bash
npm start
```

## Project Structure

```
backend/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middlewares/     # Custom middlewares
├── models/          # Mongoose models
├── routes/          # API routes
├── services/        # Business logic services
├── utils/           # Utility functions
└── server.js        # Main server file
```

## API Documentation

See main README.md for API endpoints.

## Environment Variables

- `PORT` - Server port (default: 8000)
- `MONGO_URI` - MongoDB connection string
- `JWT_SECRET` - JWT secret key
- `JWT_EXPIRE` - JWT expiration time
- `CLOUDINARY_URL` - Cloudinary configuration
- `ML_SERVICE_URL` - ML inference service URL
- `CORS_ORIGIN` - Allowed CORS origins

