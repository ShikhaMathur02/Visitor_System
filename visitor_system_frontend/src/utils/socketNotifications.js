/**
 * Socket.io notification utilities
 * Provides functions for handling socket notifications in the frontend
 */

import { useSocket } from '../context/SocketContext';
import { useNotification } from '../context/NotificationContext';
import { useEffect } from 'react';

/**
 * Hook to listen for socket notifications
 * @param {string} roomId - Optional room ID to join for targeted notifications
 * @returns {Object} - Socket connection status information
 */
export const useSocketNotifications = (roomId = null) => {
  const { socket, isConnected, connectionError, joinRoom } = useSocket();
  const { addNotification } = useNotification();

  // Join room if roomId is provided
  useEffect(() => {
    if (isConnected && roomId) {
      joinRoom(roomId);
    }
  }, [isConnected, roomId, joinRoom]);

  // Listen for notification events
  useEffect(() => {
    if (!socket) return;

    // Handler for general notifications
    const handleNotification = (data) => {
      const { message, type = 'info' } = typeof data === 'string' ? { message: data } : data;
      addNotification(message, type);
    };

    // Handler for visitor notifications
    const handleVisitorNotification = (data) => {
      addNotification(`Visitor notification: ${data.message || 'New visitor update'}`, data.type || 'info');
    };

    // Handler for student notifications
    const handleStudentNotification = (data) => {
      addNotification(`Student notification: ${data.message || 'New student update'}`, data.type || 'info');
    };

    // Handler for error notifications
    const handleErrorNotification = (error) => {
      console.error('Socket error:', error);
      addNotification(`Socket error: ${error.message || 'Unknown error'}`, 'error');
    };

    // Register event listeners
    socket.on('notification', handleNotification);
    socket.on('visitor_notification', handleVisitorNotification);
    socket.on('student_notification', handleStudentNotification);
    socket.on('error', handleErrorNotification);

    // Clean up event listeners on unmount
    return () => {
      socket.off('notification', handleNotification);
      socket.off('visitor_notification', handleVisitorNotification);
      socket.off('student_notification', handleStudentNotification);
      socket.off('error', handleErrorNotification);
    };
  }, [socket, addNotification]);

  return { isConnected, connectionError };
};

/**
 * Send a notification through the socket
 * @param {Object} socket - Socket.io instance
 * @param {string} event - Event name
 * @param {Object} data - Notification data
 * @returns {boolean} - Success status
 */
export const sendSocketNotification = (socket, event, data) => {
  if (!socket || !socket.connected) {
    console.error('Cannot send notification: Socket not connected');
    return false;
  }

  try {
    socket.emit(event, data);
    return true;
  } catch (error) {
    console.error('Error sending socket notification:', error);
    return false;
  }
};