/**
 * In-memory caching middleware for frequently accessed data
 * Reduces database load and improves response times
 */

const NodeCache = require('node-cache');

// Initialize cache with standard TTL of 5 minutes and check period of 10 minutes
const cache = new NodeCache({ 
  stdTTL: 300, 
  checkperiod: 600,
  useClones: false // For better performance with large objects
});

/**
 * Middleware to cache responses
 * @param {number} duration - Cache duration in seconds
 * @returns {function} Express middleware function
 */
const cacheMiddleware = (duration) => {
  return (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Create a cache key from the request URL and any query parameters
    const key = `__express__${req.originalUrl || req.url}`;
    
    // Try to get cached response
    const cachedResponse = cache.get(key);
    
    if (cachedResponse) {
      // Return cached response
      console.log(`Cache hit for ${key}`);
      return res.send(cachedResponse);
    }

    // Store the original send function
    const originalSend = res.send;
    
    // Override the send function to cache the response before sending
    res.send = function(body) {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, body, duration);
        console.log(`Cached ${key} for ${duration} seconds`);
      }
      
      // Call the original send function
      originalSend.call(this, body);
    };
    
    next();
  };
};

/**
 * Clear cache for a specific key or pattern
 * @param {string} pattern - Key or pattern to match
 */
const clearCache = (pattern) => {
  if (!pattern) {
    // Clear all cache if no pattern provided
    cache.flushAll();
    console.log('Entire cache cleared');
    return;
  }
  
  // Get all keys that match the pattern
  const keys = cache.keys().filter(key => key.includes(pattern));
  
  // Delete each matching key
  keys.forEach(key => {
    cache.del(key);
    console.log(`Cache cleared for ${key}`);
  });
};

module.exports = {
  cacheMiddleware,
  clearCache,
  cache // Export the cache instance for direct access if needed
};