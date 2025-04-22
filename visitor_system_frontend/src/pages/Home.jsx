import React from 'react';
import { Link as RouterLink } from 'react-router-dom'; // Use alias to avoid conflict
// Import MUI components
import { 
  Container, Box, Typography, Button, Grid, Paper 
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login'; // Visitor Entry icon
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd'; // Student Entry icon
import SecurityIcon from '@mui/icons-material/Security'; // Guard Panel icon
import SchoolIcon from '@mui/icons-material/School'; // Faculty Panel icon

function Home() {
  return (
    // Use Container to center and manage max width
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}> {/* Increased maxWidth */}
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}> {/* Add Paper for background/elevation */}
        <Typography variant="h3" component="h1" gutterBottom>
          Welcome to the Visitor Management System
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Please select your destination or action.
        </Typography>
        
        {/* Use Grid to layout the navigation buttons */}
        <Grid container spacing={3} justifyContent="center">
          {/* Visitor Entry Button */}
          <Grid item xs={12} sm={6} md={3}> {/* Adjusted grid size */}
            <Button 
              component={RouterLink} // Use RouterLink for navigation
              to="/entry" 
              variant="contained" 
              color="primary" 
              size="large"
              startIcon={<LoginIcon />}
              fullWidth // Make button take full grid item width
              sx={{ height: '100%' }} // Make buttons same height
            >
              Visitor Entry
            </Button>
          </Grid>
           {/* Student Entry Button */}
           <Grid item xs={12} sm={6} md={3}> {/* Adjusted grid size */}
            <Button 
              component={RouterLink} 
              to="/student-entry" 
              variant="contained" 
              color="success" // Different color for distinction
              size="large"
              startIcon={<AssignmentIndIcon />}
              fullWidth
              sx={{ height: '100%' }} 
            >
              Student Entry
            </Button>
          </Grid>
          {/* Guard Panel Button */}
          <Grid item xs={12} sm={6} md={3}> {/* Adjusted grid size */}
            <Button 
              component={RouterLink} 
              to="/guard" 
              variant="outlined" 
              color="secondary" 
              size="large"
              startIcon={<SecurityIcon />}
              fullWidth
              sx={{ height: '100%' }} 
            >
              Guard Panel
            </Button>
          </Grid>
          {/* Faculty Panel Button */}
          <Grid item xs={12} sm={6} md={3}> {/* Adjusted grid size */}
            <Button 
              component={RouterLink} 
              to="/faculty" 
              variant="outlined" 
              color="secondary" 
              size="large"
              startIcon={<SchoolIcon />}
              fullWidth
              sx={{ height: '100%' }} 
            >
              Faculty Panel
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}

export default Home;
