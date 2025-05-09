import { useState } from 'react';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import { 
  Box, Typography, TextField, Button, CircularProgress, Alert, Paper 
} from '@mui/material';

function StudentEntryForm() {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null); // To show QR/success message
  const { addNotification } = useNotification();
  const baseUrl = import.meta.env.VITE_API_URL || 'https://visitor-system-backend.onrender.com';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessInfo(null); // Clear previous success info

    try {
      const response = await axios.post(`${baseUrl}/students/entry`, { 
        name, 
        studentId,
        purpose 
      });
      
      if (response.status === 201) {
        const successMessage = response.data.message || 'Student entry registered successfully!';
        addNotification(successMessage, 'success'); 
        setSuccessInfo({
          message: successMessage,
          qrCode: response.data.qrCode // Assuming backend sends qrCode data URL
        });
        // Clear the form
        setName('');
        setStudentId('');
        setPurpose('');
      } else {
         throw new Error(response.data?.message || `Registration failed with status ${response.status}`);
      }
    } catch (err) {
      console.error("Error registering student:", err);
      // Handle specific error for existing entry
      let errorMsg = err.response?.data?.message || err.message || "Failed to register student entry.";
      if (err.response?.status === 400 && err.response?.data?.message.includes("active entry")) {
         errorMsg = "This student ID already has an active entry. Please exit first.";
      }
      setError(errorMsg); 
      addNotification(errorMsg, 'error'); 
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, maxWidth: '600px', margin: 'auto', mt: 4 }}>
      <Typography variant="h4" component="h2" gutterBottom align="center">
        Student Entry Form
      </Typography>
      
      {/* Show success message and QR code if available */}
      {successInfo && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successInfo.message}
          {successInfo.qrCode && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Typography variant="body1">Scan QR Code for Exit Request:</Typography>
              <img src={successInfo.qrCode} alt="Exit QR Code" style={{ maxWidth: '150px', marginTop: '10px' }} />
            </Box>
          )}
        </Alert>
      )}

      {/* Show error Alert if error exists */}
      {error && !successInfo && <Alert severity="error" sx={{ width: '100%', mb: 2 }}>{error}</Alert>}

      {/* Hide form if success message is shown, allow re-entry */}
      {!successInfo ? (
        <Box 
          component="form" 
          onSubmit={handleSubmit} 
          sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
          <TextField 
            label="Full Name" 
            variant="outlined" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            fullWidth 
          />
          <TextField 
            label="Student ID" 
            variant="outlined" 
            value={studentId} 
            onChange={(e) => setStudentId(e.target.value)} 
            required 
            fullWidth 
          />
          <TextField 
            label="Purpose of Entry/Exit" 
            variant="outlined" 
            value={purpose} 
            onChange={(e) => setPurpose(e.target.value)} 
            required 
            fullWidth 
            multiline 
            rows={3} 
          />
          
          <Box sx={{ position: 'relative', width: '100%', mt: 1 }}>
            <Button 
              type="submit" 
              variant="contained" 
              color="primary" 
              disabled={loading} 
              fullWidth
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
                  marginTop: '-12px', 
                  marginLeft: '-12px', 
                }}
              />
            )}
          </Box>
        </Box>
      ) : (
         <Button variant="outlined" onClick={() => setSuccessInfo(null)} fullWidth sx={{mt: 2}}>
            Register Another Student
         </Button>
      )}
    </Paper>
  );
}

export default StudentEntryForm;