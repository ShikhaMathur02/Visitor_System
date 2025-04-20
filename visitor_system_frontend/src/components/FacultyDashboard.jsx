import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
// Import MUI components
import { 
  Box, Typography, CircularProgress, Alert, Grid, Card, 
  CardContent, CardActions, Button 
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'; // Icon for approve button

function FacultyDashboard() {
  const [students, setStudents] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addNotification } = useNotification();
  // Consider using environment variable like in GuardDashboard
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'; 

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch pending student exit requests
      const studentResponse = await axios.get(`${baseUrl}/students/pending-exits`);
      setStudents(Array.isArray(studentResponse.data) ? studentResponse.data : []);

      // Fetch pending visitor exit requests
      const visitorResponse = await axios.get(`${baseUrl}/visitors/pending-exits`);
      setVisitors(Array.isArray(visitorResponse.data) ? visitorResponse.data : []);

    } catch (err) {
      console.error("Error fetching exit requests:", err);
      const errorMsg = err.response?.data?.message || "Failed to load exit requests";
      setError(errorMsg);
      setStudents([]);
      setVisitors([]);
      // Use addNotification for feedback
      addNotification("Failed to fetch exit requests", "error"); 
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const intervalId = setInterval(fetchRequests, 30000);
    return () => clearInterval(intervalId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Consider adding dependencies if needed, e.g., [baseUrl, addNotification]

  const handleExitApproval = async (identifier, type) => { // Use 'identifier' for clarity
    try {
      if (!identifier) {
        throw new Error(`Invalid ${type} identifier`);
      }

      const endpoint = `${baseUrl}/${type}s/approve-exit`;
      // For students, identifier is _id; for visitors, it's phone
      const payload = type === 'student' ? { id: identifier } : { phone: identifier }; 
      
      const response = await axios.post(endpoint, payload);

      if (response.status === 200) {
        // Use addNotification for success feedback
        addNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} exit approved successfully`, 'success'); 
        
        // Update local state immediately for better UX
        if (type === 'student') {
          setStudents(prev => prev.filter(student => student._id !== identifier));
        } else {
          setVisitors(prev => prev.filter(visitor => visitor.phone !== identifier));
        }
        
        // Optionally, you might not need to call fetchRequests() again immediately
        // if the local state update is sufficient. Polling will refresh later.
        // fetchRequests(); 
      } else {
         // Handle non-200 success statuses if necessary
         throw new Error(response.data?.message || `Approval failed with status ${response.status}`);
      }
    } catch (err) {
      console.error(`Error approving ${type} exit:`, err);
      const errorMsg = err.response?.data?.message || 
                      err.message || // Include error message if no response data
                      `Failed to approve ${type} exit. Please try again.`;
      // Use addNotification for error feedback
      addNotification(errorMsg, 'error'); 
    }
  };

  // Use MUI components for loading and error states
  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

  return (
    // Use Box for layout
    <Box> 
      <Typography variant="h4" gutterBottom component="h2">
        Faculty Dashboard - Pending Exit Approvals
      </Typography>

      {/* Student Section */}
      <Typography variant="h5" gutterBottom component="h3">
        Student Exit Requests ({students.length})
      </Typography>
      {students.length === 0 ? (
        <Typography sx={{ mb: 3 }}>No pending student exit requests</Typography>
      ) : (
        // Use Grid for responsive layout
        <Grid container spacing={2} sx={{ mb: 3 }}> 
          {students.map((student) => (
            // Grid item for each student card
            <Grid item xs={12} sm={6} md={4} key={student._id}> 
              {/* Card component */}
              <Card variant="outlined"> 
                <CardContent>
                  <Typography variant="h6" component="div">
                    {student.name}
                  </Typography>
                  <Typography sx={{ mb: 1.5 }} color="text.secondary">
                    Student ID: {student.studentId}
                  </Typography>
                  <Typography variant="body2">
                    Purpose: {student.purpose}
                  </Typography>
                  <Typography variant="caption" display="block" color="text.secondary">
                    Entry: {new Date(student.entryTime).toLocaleString()}
                  </Typography>
                   <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                     Status: {student.exitRequested ? 'Exit Requested' : 'Active'}
                   </Typography>
                </CardContent>
                {/* Only show button if exit is requested and not yet approved */}
                {student.exitRequested && !student.exitApproved && (
                  <CardActions>
                    <Button 
                      size="small" 
                      variant="contained" 
                      color="primary"
                      startIcon={<CheckCircleOutlineIcon />}
                      onClick={() => handleExitApproval(student._id, 'student')}
                    >
                      Approve Exit
                    </Button>
                  </CardActions>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Visitor Section */}
      <Typography variant="h5" gutterBottom component="h3">
        Visitor Exit Requests ({visitors.length})
      </Typography>
      {visitors.length === 0 ? (
        <Typography sx={{ mb: 3 }}>No pending visitor exit requests</Typography>
      ) : (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {visitors.map((visitor) => (
            // Use phone as key if _id might be missing temporarily, but prefer _id
            <Grid item xs={12} sm={6} md={4} key={visitor._id || visitor.phone}> 
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
                  <Typography variant="body2" sx={{ mt: 1, fontWeight: 'bold' }}>
                    Status: {visitor.exitRequested ? 'Exit Requested' : 'Active'}
                  </Typography>
                </CardContent>
                {visitor.exitRequested && !visitor.exitApproved && (
                  <CardActions>
                    <Button 
                      size="small" 
                      variant="contained" 
                      color="primary"
                      startIcon={<CheckCircleOutlineIcon />}
                      // Pass phone number as the identifier for visitors
                      onClick={() => handleExitApproval(visitor.phone, 'visitor')} 
                    >
                      Approve Exit
                    </Button>
                  </CardActions>
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}

export default FacultyDashboard;
