import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext'; // Import notification hook
// Import MUI components
import { 
  Box, Typography, TextField, Button, CircularProgress, Alert 
} from '@mui/material';

function EntryForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(''); // Added phone state
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false); // State for loading indicator
  const [error, setError] = useState(null); // State for error message
  const navigate = useNavigate();
  const { addNotification } = useNotification(); // Get notification function
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true); // Start loading
    setError(null); // Clear previous errors

    try {
      const response = await axios.post(`${baseUrl}/visitors/entry`, { 
        name, 
        phone, // Include phone in payload
        purpose 
      });
      
      if (response.status === 201) {
        // Use notification hook for success message
        addNotification('Visitor entry registered successfully! Exit requested automatically.', 'success'); 
        // Optionally clear the form or navigate away
        setName('');
        setPhone('');
        setPurpose('');
        // navigate('/'); // Example: navigate back home after successful entry
      } else {
         // Handle unexpected success status
         throw new Error(response.data?.message || `Registration failed with status ${response.status}`);
      }
    } catch (err) {
      console.error("Error registering visitor:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to register visitor entry.";
      setError(errorMsg); // Set error state to display Alert
      // Use notification hook for error message
      addNotification(errorMsg, 'error'); 
    } finally {
      setLoading(false); // Stop loading regardless of outcome
    }
  };

  return (
    // Use Box for layout and styling
    <Box 
      component="form" // Render as a form element
      onSubmit={handleSubmit} 
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2, // Spacing between elements
        p: 3, // Padding
        maxWidth: '500px', // Limit form width
        margin: 'auto', // Center the form
        mt: 4, // Margin top
        border: '1px solid', // Optional border
        borderColor: 'grey.300', // Optional border color
        borderRadius: 1, // Optional border radius
        boxShadow: 1 // Optional subtle shadow
      }}
    >
      <Typography variant="h4" component="h2" gutterBottom>
        Visitor Entry Form
      </Typography>
      
      {/* Display error Alert if error exists */}
      {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}

      {/* Use TextField for inputs */}
      <TextField 
        label="Name" 
        variant="outlined" 
        value={name} 
        onChange={(e) => setName(e.target.value)} 
        required 
        fullWidth // Take full width of container
      />
      <TextField 
        label="Phone Number" 
        variant="outlined" 
        type="tel" // Use tel type for phone numbers
        value={phone} 
        onChange={(e) => setPhone(e.target.value)} 
        required 
        fullWidth 
      />
      <TextField 
        label="Purpose of Visit" 
        variant="outlined" 
        value={purpose} 
        onChange={(e) => setPurpose(e.target.value)} 
        required 
        fullWidth 
        multiline // Allow multiple lines for purpose
        rows={3} 
      />
      
      {/* Use Button for submission, show CircularProgress when loading */}
      <Box sx={{ position: 'relative', width: '100%' }}>
        <Button 
          type="submit" 
          variant="contained" 
          color="primary" 
          disabled={loading} // Disable button while loading
          fullWidth
          sx={{ mt: 2 }} // Add margin top to the button
        >
          Register Entry
        </Button>
        {loading && (
          <CircularProgress
            size={24}
            sx={{
              color: 'primary.main',
              position: 'absolute',
              top: '50%',
              left: '50%',
              marginTop: '-12px', // Center vertically
              marginLeft: '-12px', // Center horizontally
            }}
          />
        )}
      </Box>
    </Box>
  );
}

export default EntryForm;