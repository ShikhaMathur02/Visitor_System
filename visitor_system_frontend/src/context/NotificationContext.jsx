import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const NotificationContext = createContext();

export function useNotification() {
  return useContext(NotificationContext);
}

export function NotificationProvider({ children }) {
  // State to hold the queue of notifications
  const [notifications, setNotifications] = useState([]); 
  // State for the currently displayed notification details
  const [currentNotification, setCurrentNotification] = useState(null); 
  // State to control Snackbar visibility
  const [open, setOpen] = useState(false); 

  // Function to add a new notification to the queue
  const addNotification = useCallback((message, type = 'info') => {
    // Add new notification to the end of the queue
    setNotifications(prev => [...prev, { message, type, key: new Date().getTime() }]); 
  }, []);

  // Effect to process the notification queue when 'notifications' or 'open' changes
  useEffect(() => {
    // If the snackbar is closed and there are notifications in the queue...
    if (!open && notifications.length > 0) { 
      // ...take the first notification from the queue...
      const [nextNotification, ...rest] = notifications; 
      // ...set it as the current notification...
      setCurrentNotification(nextNotification); 
      // ...remove it from the queue...
      setNotifications(rest); 
      // ...and open the snackbar.
      setOpen(true); 
    }
  }, [notifications, open]); // Dependencies: run when queue or open state changes

  // Function to handle closing the Snackbar
  const handleClose = (event, reason) => {
    // Prevent closing if the user clicks away
    if (reason === 'clickaway') { 
      return;
    }
    // Close the snackbar
    setOpen(false); 
    // Note: The useEffect above will handle opening the next notification if the queue is not empty
  };

  // Function called when the Snackbar finishes its exit transition
  const handleExited = () => {
     // Clear the current notification *after* it has animated out
     setCurrentNotification(null);
  };


  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      {/* Render the Snackbar component */}
      <Snackbar
        key={currentNotification?.key} // Use key to force re-render on new message
        open={open}
        autoHideDuration={6000} // Hide after 6 seconds
        onClose={handleClose}
        // Adjust anchorOrigin for position (e.g., bottom-left, top-center)
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }} 
        // Ensure the Snackbar cleans up the current notification after closing
        TransitionProps={{ onExited: handleExited }} 
      >
        {/* 
          Render the Alert inside the Snackbar. 
          Add a check for currentNotification to prevent errors during closing transition.
        */}
        {currentNotification ? (
          <Alert 
            onClose={handleClose} // Add close button to the Alert itself
            severity={currentNotification.type} // Set severity (info, success, warning, error)
            variant="filled" // Use filled variant for better visibility
            sx={{ width: '100%' }} // Ensure Alert fills Snackbar width
          >
            {currentNotification.message}
          </Alert>
        ) : null /* Render nothing if there's no current notification */}
      </Snackbar>
    </NotificationContext.Provider>
  );
}