/**
 * Enhanced server setup with load balancing, error handling, and optimization
 * for college environment with high request volumes
 */

require('dotenv').config();
const cluster = require('cluster');
const os = require('os');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require("socket.io");
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const compression = require('compression');
const errorHandler = require('./middleware/errorHandler');

// Determine number of CPU cores for clustering
const numCPUs = os.cpus().length;

// Load balancing using Node.js cluster module
if (cluster.isMaster) {
  console.log(`Master process ${process.pid} is running`);
  
  // Create a worker for each CPU core
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
  
  // Handle worker crashes and restart them
  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died with code: ${code} and signal: ${signal}`);
    console.log('Starting a new worker...');
    cluster.fork();
  });
} else {
  // Worker processes share the same port
  const app = express();
  const server = http.createServer(app);
  
  // Security middleware
  app.use(helmet());
  
  // Rate limiting to prevent abuse
  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
  });
  app.use('/api/', apiLimiter);
  
  // Compression middleware to reduce response size
  app.use(compression());
  
  // Configure CORS
  const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    optionsSuccessStatus: 200,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  };
  app.use(cors(corsOptions));
  
  // Request parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // Request logging middleware
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    next();
  });
  
  // Use optimized database connection pool
  const { connectWithRetry, getDatabaseStats } = require('./utils/dbConnection');
  
  // Connect to database with optimized connection pool
  connectWithRetry()
    .then(() => {
      console.log('MongoDB Connected with optimized connection pool');
    })
    .catch(err => {
      console.error('Failed to connect to MongoDB after multiple retries:', err);
      // In production, you might want to exit the process here
      // process.exit(1);
    });
    
  // Add database stats to health check endpoint
  app.get('/health', async (req, res) => {
    try {
      const dbStats = await getDatabaseStats();
      res.status(200).json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage(),
        database: dbStats
      });
    } catch (error) {
      res.status(500).json({
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  });
  
  // Setup Socket.IO with enhanced error handling and connection management
  const io = new Server(server, {
    cors: corsOptions,
    pingTimeout: 60000, // Close connection after 60s of inactivity
    maxHttpBufferSize: 1e6, // 1MB max message size
    connectTimeout: 45000, // Connection timeout after 45s
    // Reconnection settings
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    // Transport options
    transports: ['websocket', 'polling'],
    // Upgrade from polling to websocket when possible
    upgradeTimeout: 10000
  });
  
  // Make io available to other modules
  app.set('io', io);
  exports.io = io;
  
  // Socket.IO middleware for logging and error handling
  io.use((socket, next) => {
    const clientIp = socket.handshake.address;
    console.log(`Socket connection attempt from ${clientIp}`);
    
    // You could add authentication here if needed
    // if (!socket.handshake.auth.token) {
    //   return next(new Error('Authentication error'));
    // }
    
    next();
  });
  
  // Socket.IO connection handling with comprehensive error handling
  io.on('connection', (socket) => {
    console.log(`New client connected: ${socket.id} from ${socket.handshake.address}`);
    
    // Handle room joining for targeted notifications
    socket.on('joinRoom', (room) => {
      if (typeof room !== 'string' || !room.trim()) {
        socket.emit('error', { message: 'Invalid room name' });
        return;
      }
      
      socket.join(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
      socket.emit('notification', { message: `Joined room: ${room}`, type: 'success' });
    });
    
    // Handle client-side errors
    socket.on('client_error', (error) => {
      console.error(`Client error from ${socket.id}:`, error);
    });
    
    socket.on('disconnect', (reason) => {
      console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
    });
    
    // Handle socket errors
    socket.on('error', (error) => {
      console.error(`Socket ${socket.id} error:`, error);
    });
    
    // Ping/pong for connection health check
    socket.on('ping_server', (callback) => {
      if (typeof callback === 'function') {
        callback({ status: 'ok', time: new Date().toISOString() });
      }
    });
  });
  
  // Handle server-side socket errors
  io.engine.on('connection_error', (err) => {
    console.error('Connection error:', err);
  });
  
  // Import routes
  const visitorRoutes = require('./routes/visitorRoutes');
  const studentRoutes = require('./routes/studentRoutes');
  const statsRoutes = require('./routes/statsRoutes');
  const authRoutes = require('./authRoutes');
  const adminRoutes = require('./routes/adminRoutes');
  const facultyRoutes = require('./routes/facultyRoutes');
  const metricsRoutes = require('./routes/metricsRoutes');
  
  // Import monitoring middleware
  const { performanceMonitor } = require('./middleware/monitor');
  const { cacheMiddleware } = require('./middleware/cache');
  
  // Apply performance monitoring middleware
  app.use(performanceMonitor);
  
  // Apply routes
  app.use('/visitors', visitorRoutes);
  app.use('/students', studentRoutes);
  app.use('/stats', cacheMiddleware(60), statsRoutes); // Cache stats for 60 seconds
  app.use('/auth', authRoutes);
  app.use('/admin', adminRoutes);
  app.use('/faculty', facultyRoutes);
  app.use('/metrics', metricsRoutes);
  
  // Health check endpoint is now defined above with database stats
  
  // Basic route
  app.get('/', (req, res) => {
    res.send('Visitor Management System Backend Running');
  });
  
  // 404 handler for undefined routes
  app.use((req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
  });
  
  // Global error handler
  app.use(errorHandler);
  
  // Start Server
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`Worker ${process.pid} started and listening on port ${PORT}`);
  });
  
  // Handle uncaught exceptions and unhandled rejections
  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Log to monitoring service if available
    process.exit(1); // Exit with failure
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    // Log to monitoring service if available
  });
}