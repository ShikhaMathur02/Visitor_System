/**
 * Global error handling middleware
 * Provides consistent error responses across the application
 */

const errorHandler = (err, req, res, next) => {
  // Default error status and message
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  
  // Log the error for server-side debugging
  console.error(`[ERROR] ${statusCode} - ${message}`);
  if (err.stack) {
    console.error(err.stack);
  }
  
  // Add request information for better debugging
  const errorDetails = {
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  };
  
  // Only include stack trace in development environment
  if (process.env.NODE_ENV !== 'production') {
    errorDetails.stack = err.stack;
  }
  
  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    ...errorDetails
  });
};

module.exports = errorHandler;