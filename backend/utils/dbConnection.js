/**
 * Database connection utility with connection pooling
 * Optimizes MongoDB connections for high traffic environments
 */

const mongoose = require('mongoose');

// Connection options with pooling configuration
const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 100, // Maximum number of connections in the pool
  minPoolSize: 5,   // Minimum number of connections in the pool
  socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
  serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
  heartbeatFrequencyMS: 10000, // Check server health every 10 seconds
  retryWrites: true, // Retry write operations if they fail
  w: 'majority', // Write concern for better data durability
};

/**
 * Connect to MongoDB with retry logic
 * @returns {Promise} Mongoose connection
 */
const connectWithRetry = async () => {
  const maxRetries = 5;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, connectionOptions);
      console.log('MongoDB Connected');
    
      
      // Set up connection event listeners
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
        if (err.name === 'MongoNetworkError') {
          console.log('Attempting to reconnect to MongoDB...');
          setTimeout(() => mongoose.connect(process.env.MONGODB_URI, connectionOptions), 5000);
        }
      });
      
      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected. Attempting to reconnect...');
        setTimeout(() => mongoose.connect(process.env.MONGODB_URI, connectionOptions), 5000);
      });
      
      // Log connection pool information
      const db = mongoose.connection.db;
      if (db) {
        console.log(`MongoDB connection pool size: ${connectionOptions.maxPoolSize}`);
      }
      
      return mongoose.connection;
    } catch (err) {
      console.error(`MongoDB connection attempt ${retries + 1} failed:`, err);
      retries++;
      
      if (retries >= maxRetries) {
        console.error('Maximum connection retries reached. Exiting...');
        throw err;
      }
      
      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, retries), 30000);
      console.log(`Retrying connection in ${delay / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

/**
 * Get database statistics
 * @returns {Promise<Object>} Database statistics
 */
const getDatabaseStats = async () => {
  try {
    if (!mongoose.connection || mongoose.connection.readyState !== 1) {
      return { error: 'Database not connected' };
    }
    
    const db = mongoose.connection.db;
    const stats = await db.stats();
    
    // Get connection pool stats if available
    let poolStats = {};
    if (db.serverConfig && db.serverConfig.s && db.serverConfig.s.pool) {
      const pool = db.serverConfig.s.pool;
      poolStats = {
        totalConnections: pool.totalConnectionCount,
        availableConnections: pool.availableConnectionCount,
        maxPoolSize: connectionOptions.maxPoolSize,
        minPoolSize: connectionOptions.minPoolSize
      };
    }
    
    return {
      dbName: stats.db,
      collections: stats.collections,
      documents: stats.objects,
      dataSize: formatBytes(stats.dataSize),
      storageSize: formatBytes(stats.storageSize),
      indexes: stats.indexes,
      indexSize: formatBytes(stats.indexSize),
      connectionPool: poolStats
    };
  } catch (error) {
    console.error('Error getting database stats:', error);
    return { error: error.message };
  }
};

/**
 * Format bytes to human-readable format
 * @param {number} bytes - Bytes to format
 * @returns {string} Formatted size
 */
const formatBytes = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

module.exports = {
  connectWithRetry,
  getDatabaseStats,
  connectionOptions
};