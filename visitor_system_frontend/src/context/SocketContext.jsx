/**
 * Socket.IO Context Provider
 * 
 * This module provides a React context for Socket.IO connections,
 * handling connection state, error management, and reconnection logic.
 * It centralizes socket connection management for the entire application.
 * 
 * @module SocketContext
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

/**
 * Custom hook to access the Socket.IO context
 * @returns {Object} The socket context value
 */
export function useSocket() {
  return useContext(SocketContext);
}

/**
 * Socket.IO Provider Component
 * Manages socket connection and provides connection state and utility functions to children
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Provider component
 */
export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const baseUrl = import.meta.env.VITE_API_URL || 'https://visitor-system-backend.onrender.com';

  useEffect(() => {
    // Create socket connection with error handling and reconnection options
    const socketInstance = io(baseUrl, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
      path: '/socket.io/',
      transports: ['websocket'], // Try polling first, then upgrade to websocket
      forceNew: true
    });

    // Set up event listeners
    socketInstance.on('connect', () => {
      console.log('Socket connected:', socketInstance.id);
      setIsConnected(true);
      setConnectionError(null);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionError(`Connection error: ${error.message}`);
      setIsConnected(false);
      
      // Attempt to reconnect after a delay if not already reconnecting
      setTimeout(() => {
        if (!socketInstance.connected && !socketInstance.connecting) {
          console.log('Attempting to reconnect...');
          socketInstance.connect();
        }
      }, 5000);
    });
    
    socketInstance.on('reconnect', (attemptNumber) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      setIsConnected(true);
      setConnectionError(null);
    });
    
    socketInstance.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Socket reconnection attempt #${attemptNumber}`);
    });

    socketInstance.on('reconnect_failed', () => {
      console.error('Socket reconnection failed after maximum attempts');
      setConnectionError('Failed to connect after multiple attempts. Please refresh the page or try again later.');
    });
    
    socketInstance.on('error', (error) => {
      console.error('Socket error:', error);
      setConnectionError(`Socket error: ${typeof error === 'string' ? error : error.message || 'Unknown error'}`);
    });

    // Save socket instance to state
    setSocket(socketInstance);

    // Clean up on unmount
    return () => {
      console.log('Cleaning up socket connection');
      socketInstance.disconnect();
    };
  }, [baseUrl]); // Recreate socket if baseUrl changes

  // Function to join a room (for targeted notifications)
  const joinRoom = (room, callback) => {
    if (!room || typeof room !== 'string') {
      console.error('Invalid room name provided');
      if (callback) callback({ success: false, error: 'Invalid room name' });
      return false;
    }
    
    if (socket && isConnected) {
      socket.emit('joinRoom', room, (response) => {
        if (response && response.success) {
          console.log(`Successfully joined room: ${room}`);
          if (callback) callback({ success: true });
        } else {
          console.warn(`Failed to join room: ${room}`, response?.error);
          if (callback) callback({ success: false, error: response?.error || 'Unknown error' });
        }
      });
      return true;
    } else {
      const error = 'Cannot join room: Socket not connected';
      console.warn(error);
      if (callback) callback({ success: false, error });
      return false;
    }
  };

  // Function to manually reconnect
  const reconnect = () => {
    if (socket) {
      console.log('Manually reconnecting socket...');
      socket.connect();
      return true;
    }
    return false;
  };
  
  // Function to check connection health
  const pingServer = (callback) => {
    if (socket && isConnected) {
      const startTime = Date.now();
      socket.emit('ping_server', (response) => {
        const latency = Date.now() - startTime;
        console.log(`Server ping: ${latency}ms`, response);
        if (callback) callback({ success: true, latency, response });
      });
      return true;
    } else {
      console.warn('Cannot ping server: Socket not connected');
      if (callback) callback({ success: false, error: 'Socket not connected' });
      return false;
    }
  };

  /**
   * Context value with socket connection and utility functions
   * @type {Object}
   * @property {Socket|null} socket - The Socket.IO client instance
   * @property {boolean} isConnected - Whether the socket is currently connected
   * @property {string|null} connectionError - Current connection error message, if any
   * @property {Function} joinRoom - Function to join a notification room
   * @property {Function} reconnect - Function to manually reconnect the socket
   * @property {Function} pingServer - Function to check connection health
   */
  const value = {
    socket,
    isConnected,
    connectionError,
    joinRoom,
    reconnect,
    pingServer
  };

  return (
    <SocketContext.Provider value={value}>
      {connectionError && (
        <div 
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            backgroundColor: '#f44336',
            color: 'white',
            padding: '10px 15px',
            borderRadius: '4px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '400px'
          }}
        >
          <span>{connectionError}</span>
          <button 
            onClick={reconnect}
            style={{
              marginLeft: '10px',
              backgroundColor: 'white',
              color: '#f44336',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Reconnect
          </button>
        </div>
      )}
      {children}
    </SocketContext.Provider>
  );
}