/**
 * Routes for system metrics and monitoring
 */

const express = require('express');
const router = express.Router();
const { getMetrics, resetMetrics } = require('../middleware/monitor');

// Middleware to check admin authorization
const isAdmin = (req, res, next) => {
  // Check if user is authenticated and has admin role
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ 
      success: false, 
      message: 'Access denied. Admin privileges required.' 
    });
  }
  next();
};

/**
 * @route GET /metrics
 * @description Get system performance metrics
 * @access Admin only
 */
router.get('/', isAdmin, (req, res) => {
  try {
    const metrics = getMetrics();
    res.json({
      success: true,
      metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve metrics',
      error: error.message
    });
  }
});

/**
 * @route POST /metrics/reset
 * @description Reset performance metrics
 * @access Admin only
 */
router.post('/reset', isAdmin, (req, res) => {
  try {
    resetMetrics();
    res.json({
      success: true,
      message: 'Metrics reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reset metrics',
      error: error.message
    });
  }
});

module.exports = router;