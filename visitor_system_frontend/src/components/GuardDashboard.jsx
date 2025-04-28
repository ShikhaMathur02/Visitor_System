import { useState, useEffect } from 'react';
import axios from 'axios';
// Import MUI components
import { 
  Box, Typography, CircularProgress, Alert, Grid, Card, Divider,
  CardContent, CardActions, Button, Paper, Stepper, Step, StepLabel,
  StepContent, Chip, useTheme
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import DoneIcon from '@mui/icons-material/Done';
import PendingIcon from '@mui/icons-material/Pending';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import SchoolIcon from '@mui/icons-material/School';
import { useNotification } from '../context/NotificationContext';

function GuardDashboard() {
  // State for the three different stages of requests
  const [pendingApproval, setPendingApproval] = useState({ visitors: [], students: [] });
  const [readyForExit, setReadyForExit] = useState({ visitors: [], students: [] });
  const [completedToday, setCompletedToday] = useState({ visitors: [], students: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const theme = useTheme();
  const { addNotification } = useNotification?.() || { addNotification: (msg) => alert(msg) };

  useEffect(() => {
    async function fetchAllRequests() {
      try {
        setLoading(true);
        setError(null);
        
        // Helper function to handle API requests with error handling
        const fetchData = async (url) => {
          try {
            const response = await axios.get(url);
            return Array.isArray(response.data) ? response.data : [];
          } catch (error) {
            console.error(`Error fetching from ${url}:`, error);
            return [];
          }
        };

        // 1. Fetch pending faculty approval (exitRequested=true, exitApproved=false)
        const pendingVisitors = await fetchData(`${baseUrl}/visitors/pending-faculty-approval`);
        const pendingStudents = await fetchData(`${baseUrl}/students/pending-faculty-approval`);
        
        // 2. Fetch ready for exit confirmation (exitApproved=true, hasExited=false)
        const readyVisitors = await fetchData(`${baseUrl}/visitors/approved-exits`);
        const readyStudents = await fetchData(`${baseUrl}/students/approved-exits`);
        
        // 3. Fetch completed today (hasExited=true, exitTime is today)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const completedVisitors = await fetchData(`${baseUrl}/visitors/exited-today`);
        const completedStudents = await fetchData(`${baseUrl}/students/exited-today`);
        
        // Update all state at once
        setPendingApproval({ visitors: pendingVisitors, students: pendingStudents });
        setReadyForExit({ visitors: readyVisitors, students: readyStudents });
        setCompletedToday({ visitors: completedVisitors, students: completedStudents });
        setLoading(false);
      } catch (err) {
        console.error("Error fetching requests:", err);
        setError("Failed to load requests. Please try again later.");
        setLoading(false);
      }
    }
    
    fetchAllRequests();
    
    // Poll every 30 seconds
    const intervalId = setInterval(fetchAllRequests, 30000);
    return () => clearInterval(intervalId);
  }, [baseUrl]);

  const handleConfirmExit = async (id, type, phone) => { 
    try {
      let endpoint = '';
      let payload = {};

      if (type === 'student') {
        endpoint = `${baseUrl}/students/confirm-exit`;
        payload = { id };
      } else {
        endpoint = `${baseUrl}/visitors/confirm-exit`;
        payload = { phone }; 
      }
        
      await axios.post(endpoint, payload);
      
      // Update local state by removing from readyForExit and adding to completedToday
      if (type === 'student') {
        setReadyForExit(prev => ({
          ...prev,
          students: prev.students.filter(student => student._id !== id)
        }));
        
        // Find the student to move to completed
        const student = readyForExit.students.find(s => s._id === id);
        if (student) {
          setCompletedToday(prev => ({
            ...prev,
            students: [...prev.students, {...student, exitTime: new Date()}]
          }));
        }
      } else {
        setReadyForExit(prev => ({
          ...prev,
          visitors: prev.visitors.filter(visitor => visitor.phone !== phone)
        }));
        
        // Find the visitor to move to completed
        const visitor = readyForExit.visitors.find(v => v.phone === phone);
        if (visitor) {
          setCompletedToday(prev => ({
            ...prev,
            visitors: [...prev.visitors, {...visitor, exitTime: new Date()}]
          }));
        }
      }
      
      addNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} exit confirmed`, "success");
    } catch (err) {
      console.error(`Error confirming ${type} exit:`, err);
      const errorMsg = err.response?.data?.message || `Failed to confirm ${type} exit.`;
      addNotification(errorMsg, "error");
    }
  };

  // Helper function to render a request card
  const renderRequestCard = (person, type, status) => {
    const isVisitor = type === 'visitor';
    const statusColors = {
      pending: { bg: theme.palette.warning.light, color: theme.palette.warning.dark },
      ready: { bg: theme.palette.info.light, color: theme.palette.info.dark },
      completed: { bg: theme.palette.success.light, color: theme.palette.success.dark }
    };
    
    // Choose icon based on person type
    const PersonIcon = isVisitor ? AccountCircleIcon : SchoolIcon;

    return (
      <Grid item xs={12} sm={6} md={4} key={person._id}>
        <Card variant="outlined" sx={{
          borderLeft: `4px solid ${statusColors[status].color}`,
          position: 'relative',
          transition: 'transform 0.2s',
          '&:hover': { transform: 'translateY(-5px)' }
        }}>
          <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
            <Chip 
              size="small" 
              color={status === 'pending' ? 'warning' : status === 'ready' ? 'info' : 'success'}
              label={status === 'pending' ? 'Awaiting Faculty' : status === 'ready' ? 'Ready for Exit' : 'Completed'}
              icon={status === 'pending' ? <PendingIcon /> : status === 'ready' ? <AccessTimeIcon /> : <DoneIcon />}
            />
          </Box>
          <CardContent sx={{ pt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <PersonIcon color={isVisitor ? 'primary' : 'secondary'} sx={{ mr: 1 }} />
              <Typography variant="h6" component="div">
                {person.name}
              </Typography>
            </Box>
            <Typography sx={{ mb: 1 }} color="text.secondary">
              {isVisitor ? `Phone: ${person.phone}` : `ID: ${person.studentId}`}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Purpose: {person.purpose}
            </Typography>
            <Typography variant="caption" display="block" color="text.secondary">
              Entry: {new Date(person.entryTime).toLocaleString()}
            </Typography>
            {person.exitTime && (
              <Typography variant="caption" display="block" color="text.secondary">
                Exit: {new Date(person.exitTime).toLocaleString()}
              </Typography>
            )}
          </CardContent>
          {status === 'ready' && (
            <CardActions>
              <Button 
                size="small" 
                variant="contained" 
                color="primary"
                fullWidth
                startIcon={<CheckCircleOutlineIcon />}
                onClick={() => handleConfirmExit(person._id, type, isVisitor ? person.phone : null)}
              >
                Confirm Exit
              </Button>
            </CardActions>
          )}
        </Card>
      </Grid>
    );
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  if (error) return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;

  // Calculate total counts for each stage
  const pendingCount = pendingApproval.visitors.length + pendingApproval.students.length;
  const readyCount = readyForExit.visitors.length + readyForExit.students.length;
  const completedCount = completedToday.visitors.length + completedToday.students.length;

  return (
    <Box sx={{ pb: 4 }}> 
      <Typography variant="h4" gutterBottom component="h2">
        Guard Dashboard
      </Typography>
      
      <Paper elevation={2} sx={{ mb: 4, p: 2, borderRadius: 2 }}>
        <Typography variant="h6" gutterBottom>
          Activity Timeline
        </Typography>
        
        <Stepper orientation="vertical">
          {/* Stage 1: Pending Faculty Approval */}
          <Step active expanded>
            <StepLabel 
              StepIconComponent={() => 
                <HourglassEmptyIcon color="warning" fontSize="large" />
              }
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Typography variant="subtitle1">
                  Pending Faculty Approval
                </Typography>
                <Chip label={pendingCount} color="warning" size="small" />
              </Box>
            </StepLabel>
            <StepContent>
              <Box sx={{ mt: 2 }}>
                {pendingCount === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No requests pending faculty approval
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {pendingApproval.visitors.map(visitor => 
                      renderRequestCard(visitor, 'visitor', 'pending')
                    )}
                    {pendingApproval.students.map(student => 
                      renderRequestCard(student, 'student', 'pending')
                    )}
                  </Grid>
                )}
              </Box>
            </StepContent>
          </Step>
          
          {/* Stage 2: Ready for Exit Confirmation */}
          <Step active expanded>
            <StepLabel 
              StepIconComponent={() => 
                <AccessTimeIcon color="info" fontSize="large" />
              }
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Typography variant="subtitle1">
                  Awaiting Exit Confirmation
                </Typography>
                <Chip label={readyCount} color="info" size="small" />
              </Box>
            </StepLabel>
            <StepContent>
              <Box sx={{ mt: 2 }}>
                {readyCount === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No exit confirmations pending
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {readyForExit.visitors.map(visitor => 
                      renderRequestCard(visitor, 'visitor', 'ready')
                    )}
                    {readyForExit.students.map(student => 
                      renderRequestCard(student, 'student', 'ready')
                    )}
                  </Grid>
                )}
              </Box>
            </StepContent>
          </Step>
          
          {/* Stage 3: Completed Today */}
          <Step active expanded>
            <StepLabel 
              StepIconComponent={() => 
                <DoneIcon color="success" fontSize="large" />
              }
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Typography variant="subtitle1">
                  Completed Today
                </Typography>
                <Chip label={completedCount} color="success" size="small" />
              </Box>
            </StepLabel>
            <StepContent>
              <Box sx={{ mt: 2 }}>
                {completedCount === 0 ? (
                  <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
                    No exits completed today
                  </Typography>
                ) : (
                  <Grid container spacing={2}>
                    {completedToday.visitors.map(visitor => 
                      renderRequestCard(visitor, 'visitor', 'completed')
                    )}
                    {completedToday.students.map(student => 
                      renderRequestCard(student, 'student', 'completed')
                    )}
                  </Grid>
                )}
              </Box>
            </StepContent>
          </Step>
        </Stepper>
      </Paper>
    </Box>
  );
}

export default GuardDashboard;