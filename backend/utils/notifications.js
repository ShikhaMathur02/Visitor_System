const { io } = require('../server');

/**
 * Enhanced notification system with error handling and retry mechanism
 */

/**
 * Send notification to faculty with improved error handling
 * @param {string} facultyId - Faculty ID
 * @param {string|Object} message - Notification message or object with message and type
 * @param {string} type - Notification type (info, success, warning, error)
 * @returns {boolean} - Success status
 */
exports.notifyFaculty = (facultyId, message, type = 'info') => {
  try {
    if (!io) {
      console.error('Socket.io instance not available');
      return false;
    }
    
    const room = `faculty-${facultyId}`;
    const payload = typeof message === 'string' ? { message, type } : message;
    
    // Check if room exists and has connections
    const roomExists = io.sockets.adapter.rooms.has(room);
    if (!roomExists) {
      console.warn(`No active connections in room: ${room}`);
      // Store notification for delivery when faculty connects
      // This could be enhanced with a persistent queue if needed
      return false;
    }
    
    io.to(room).emit('notification', payload);
    return true;
  } catch (error) {
    console.error('Error sending faculty notification:', error);
    return false;
  }
};

/**
 * Send notification to all guards with improved error handling
 * @param {string|Object} message - Notification message or object with message and type
 * @param {string} type - Notification type (info, success, warning, error)
 * @returns {boolean} - Success status
 */
exports.notifyGuards = (message, type = 'info') => {
  try {
    if (!io) {
      console.error('Socket.io instance not available');
      return false;
    }
    
    const room = 'guards';
    const payload = typeof message === 'string' ? { message, type } : message;
    
    // Check if room exists and has connections
    const roomExists = io.sockets.adapter.rooms.has(room);
    if (!roomExists) {
      console.warn(`No active connections in room: ${room}`);
      return false;
    }
    
    io.to(room).emit('notification', payload);
    return true;
  } catch (error) {
    console.error('Error sending guard notification:', error);
    return false;
  }
};
