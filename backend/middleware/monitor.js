/**
 * Performance monitoring middleware
 * Tracks request times, memory usage, and other metrics
 * for system optimization and troubleshooting
 */

const os = require('os');

// Store metrics in memory
const metrics = {
  requests: 0,
  errors: 0,
  responseTime: {
    total: 0,
    count: 0,
    max: 0,
    min: Number.MAX_VALUE
  },
  startTime: Date.now(),
  endpoints: {}
};

/**
 * Middleware to monitor request performance
 */
const performanceMonitor = (req, res, next) => {
  // Skip monitoring for health check endpoints
  if (req.originalUrl === '/health') {
    return next();
  }
  
  // Record start time
  const start = process.hrtime();
  
  // Track endpoint usage
  const endpoint = `${req.method} ${req.route ? req.route.path : req.originalUrl}`;
  if (!metrics.endpoints[endpoint]) {
    metrics.endpoints[endpoint] = {
      count: 0,
      totalTime: 0,
      errors: 0
    };
  }
  
  // Increment request counter
  metrics.requests++;
  metrics.endpoints[endpoint].count++;
  
  // Function to finalize metrics once response is sent
  const finishMonitoring = () => {
    // Calculate response time
    const hrtime = process.hrtime(start);
    const responseTimeMs = hrtime[0] * 1000 + hrtime[1] / 1000000;
    
    // Update response time metrics
    metrics.responseTime.total += responseTimeMs;
    metrics.responseTime.count++;
    metrics.responseTime.max = Math.max(metrics.responseTime.max, responseTimeMs);
    metrics.responseTime.min = Math.min(metrics.responseTime.min, responseTimeMs);
    
    // Update endpoint metrics
    metrics.endpoints[endpoint].totalTime += responseTimeMs;
    
    // Track errors
    if (res.statusCode >= 400) {
      metrics.errors++;
      metrics.endpoints[endpoint].errors++;
    }
    
    // Log slow requests (over 1000ms)
    if (responseTimeMs > 1000) {
      console.warn(`Slow request: ${endpoint} took ${responseTimeMs.toFixed(2)}ms`);
    }
  };
  
  // Listen for response finish event
  res.on('finish', finishMonitoring);
  
  next();
};

/**
 * Get current system metrics
 * @returns {Object} System metrics
 */
const getMetrics = () => {
  const uptime = Date.now() - metrics.startTime;
  
  return {
    uptime: uptime,
    uptimeHuman: formatUptime(uptime),
    requests: metrics.requests,
    errors: metrics.errors,
    errorRate: metrics.requests > 0 ? (metrics.errors / metrics.requests * 100).toFixed(2) + '%' : '0%',
    averageResponseTime: metrics.responseTime.count > 0 ? 
      (metrics.responseTime.total / metrics.responseTime.count).toFixed(2) + 'ms' : '0ms',
    maxResponseTime: metrics.responseTime.max.toFixed(2) + 'ms',
    minResponseTime: metrics.responseTime.min === Number.MAX_VALUE ? 
      '0ms' : metrics.responseTime.min.toFixed(2) + 'ms',
    endpoints: Object.keys(metrics.endpoints).map(key => ({
      endpoint: key,
      hits: metrics.endpoints[key].count,
      averageResponseTime: metrics.endpoints[key].count > 0 ? 
        (metrics.endpoints[key].totalTime / metrics.endpoints[key].count).toFixed(2) + 'ms' : '0ms',
      errors: metrics.endpoints[key].errors,
      errorRate: metrics.endpoints[key].count > 0 ? 
        (metrics.endpoints[key].errors / metrics.endpoints[key].count * 100).toFixed(2) + '%' : '0%'
    })).sort((a, b) => b.hits - a.hits),
    system: {
      cpuUsage: process.cpuUsage(),
      memoryUsage: process.memoryUsage(),
      freeMemory: os.freemem(),
      totalMemory: os.totalmem(),
      memoryUsagePercentage: ((1 - os.freemem() / os.totalmem()) * 100).toFixed(2) + '%',
      loadAverage: os.loadavg(),
      cpuCount: os.cpus().length
    }
  };
};

/**
 * Reset metrics
 */
const resetMetrics = () => {
  metrics.requests = 0;
  metrics.errors = 0;
  metrics.responseTime = {
    total: 0,
    count: 0,
    max: 0,
    min: Number.MAX_VALUE
  };
  metrics.startTime = Date.now();
  metrics.endpoints = {};
};

/**
 * Format uptime in human-readable format
 * @param {number} ms - Uptime in milliseconds
 * @returns {string} Formatted uptime
 */
const formatUptime = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
};

module.exports = {
  performanceMonitor,
  getMetrics,
  resetMetrics
};