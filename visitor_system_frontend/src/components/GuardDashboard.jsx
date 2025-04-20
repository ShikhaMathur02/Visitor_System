import { useState, useEffect } from 'react';
import axios from 'axios';
// Import MUI components
import { 
  Box, Typography, CircularProgress, Alert, Grid, Card, 
  CardContent, CardActions, Button 
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // Example icon

function GuardDashboard() {
  const [visitors, setVisitors] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'; 

  useEffect(() => {
    async function fetchRequests() {
      try {
        setLoading(true);
        setError(null); // Reset error state before new request
        
        // Get approved exit requests for visitors
        try {
          const visitorResponse = await axios.get(`${baseUrl}/visitors/approved-exits`);
          // Ensure data is an array
          setVisitors(Array.isArray(visitorResponse.data) ? visitorResponse.data : []); 
        } catch (visitorErr) {
          console.error("Error fetching approved visitor exits:", visitorErr);
          setVisitors([]); // Set to empty array on error
        }
        
        // Get approved exit requests for students
        try {
          const studentResponse = await axios.get(`${baseUrl}/students/approved-exits`);
           // Ensure data is an array
          setStudents(Array.isArray(studentResponse.data) ? studentResponse.data : []);
        } catch (studentErr) {
          console.error("Error fetching approved student exits:", studentErr);
          setStudents([]); // Set to empty array on error
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching approved exits:", err);
        setError("Failed to load approved exits. Please try again later.");
        setLoading(false);
      }
    }
    
    fetchRequests();
    
    // Set up polling to refresh data every 30 seconds
    const intervalId = setInterval(fetchRequests, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [baseUrl]); // Dependency array includes baseUrl

  // Modified handleConfirmExit to accept phone and send correct payload
  const handleConfirmExit = async (id, type, phone) => { 
    try {
      let endpoint = '';
      let payload = {};

      if (type === 'student') {
        endpoint = `${baseUrl}/students/confirm-exit`;
        payload = { id }; // Student uses _id
      } else {
        endpoint = `${baseUrl}/visitors/confirm-exit`;
        // *** Send phone number for visitors ***
        payload = { phone }; 
      }
        
      await axios.post(endpoint, payload); // Send the correct payload
      
      // Update local state to remove the confirmed exit
      if (type === 'student') {
        setStudents(prevStudents => prevStudents.filter(student => student._id !== id));
      } else {
         // *** Filter visitors by phone ***
        setVisitors(prevVisitors => prevVisitors.filter(visitor => visitor.phone !== phone));
      }
      
      // TODO: Replace alert with MUI Snackbar via NotificationContext
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} exit confirmed`); 
    } catch (err) {
      console.error(`Error confirming ${type} exit:`, err);
      const errorMsg = err.response?.data?.message || `Failed to confirm ${type} exit.`;
      // TODO: Replace alert with MUI Snackbar via NotificationContext
      alert(errorMsg); 
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

  return (
    // Use Box for layout instead of div with className="container"
    <Box> 
      <Typography variant="h4" gutterBottom component="h2">
        Guard Dashboard
      </Typography>
      
      <Typography variant="h5" gutterBottom component="h3">
        Approved Visitor Exits ({visitors.length})
      </Typography>
      {visitors.length === 0 ? (
        <Typography sx={{ mb: 3 }}>No approved visitor exits pending</Typography>
      ) : (
        // Use Grid for responsive layout
        <Grid container spacing={2} sx={{ mb: 3 }}> 
          {Array.isArray(visitors) && visitors.map((visitor) => ( 
            // Grid item takes up space depending on screen size
            <Grid item xs={12} sm={6} md={4} key={visitor._id}> 
              {/* Use Card component for each item */}
              <Card variant="outlined"> 
                <CardContent>
                  <Typography variant="h6" component="div">
                    {visitor.name}
                  </Typography>
                  <Typography sx={{ mb: 1.5 }} color="text.secondary">
                    Phone: {visitor.phone}
                  </Typography>
                  <Typography variant="body2">
                    Purpose: {visitor.purpose}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    Entry: {new Date(visitor.entryTime).toLocaleString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    variant="contained" 
                    color="primary"
                    startIcon={<CheckCircleOutlineIcon />}
                    onClick={() => handleConfirmExit(visitor._id, 'visitor', visitor.phone)}
                  >
                    Confirm Exit
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Typography variant="h5" gutterBottom component="h3">
        Approved Student Exits ({students.length})
      </Typography>
      {students.length === 0 ? (
         <Typography sx={{ mb: 3 }}>No approved student exits pending</Typography>
      ) : (
         <Grid container spacing={2} sx={{ mb: 3 }}>
          {Array.isArray(students) && students.map((student) => (
            <Grid item xs={12} sm={6} md={4} key={student._id}>
              <Card variant="outlined">
                 <CardContent>
                   <Typography variant="h6" component="div">
                     {student.name}
                   </Typography>
                   <Typography sx={{ mb: 1.5 }} color="text.secondary">
                     ID: {student.studentId}
                   </Typography>
                   <Typography variant="body2">
                     Purpose: {student.purpose}
                   </Typography>
                   <Typography variant="caption" display="block" color="text.secondary">
                     Entry: {new Date(student.entryTime).toLocaleString()}
                   </Typography>
                 </CardContent>
                 <CardActions>
                   <Button 
                     size="small" 
                     variant="contained" 
                     color="primary"
                     startIcon={<CheckCircleOutlineIcon />}
                     onClick={() => handleConfirmExit(student._id, 'student', null)}
                   >
                     Confirm Exit
                   </Button>
                 </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

export default GuardDashboard;