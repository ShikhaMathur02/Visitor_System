const notifyDirector = (message, type = 'info') => {
  try {
    const io = require('../index').io;
    if (io) {
      io.emit('directorNotification', {
        message,
        type,
        timestamp: new Date().toISOString()
      });
      console.log(`Director notification sent: ${message}`);
    } else {
      console.warn('Socket.io instance not available for director notification');
    }
  } catch (error) {
    console.error('Error sending director notification:', error);
  }
};

const notifyGuard = (message, type = 'info') => {
  try {
    const io = require('../index').io;
    if (io) {
      io.emit('guardNotification', {
        message,
        type,
        timestamp: new Date().toISOString()
      });
      console.log(`Guard notification sent: ${message}`);
    } else {
      console.warn('Socket.io instance not available for guard notification');
    }
  } catch (error) {
    console.error('Error sending guard notification:', error);
  }
};

const setupNotifications = (io) => {
  io.on('connection', (socket) => {
    console.log('New client connected for notifications');
    
    socket.on('disconnect', () => {
      console.log('Notification client disconnected');
    });
  });
};

module.exports = {
  notifyDirector,
  notifyGuard,
  setupNotifications  // Make sure to export the function
};
