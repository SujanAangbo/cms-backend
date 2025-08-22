const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/database');
const { errorHandler, notFound } = require('./middlewares/error.middleware');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth.routes');
const studentRoutes = require('./routes/student.routes');
const teacherRoutes = require('./routes/teacher.routes');
const adminRoutes = require('./routes/admin.routes');
const staticRoutes = require('./routes/static_routes');

// Initialize express app
const app = express();

// Connect to database
connectDB();

// Middleware`
app.use(helmet()); // Security headers
app.use(cors({
  origin: 'http://127.0.0.1:5500', // <-- set to your frontend's URL
  credentials: true,
})); // Enable CORS

app.use(morgan('dev')); // HTTP request logger
app.use(compression()); // Compress responses
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(cookieParser()); // Parse cookies

// Serve static files from the public directory
app.use(express.static('public'));

app.use('/uploads', express.static('uploads', {
  setHeaders: (res, path) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET');
  }
}));

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', staticRoutes);

// Handle 404 routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

// Export app
module.exports = app;