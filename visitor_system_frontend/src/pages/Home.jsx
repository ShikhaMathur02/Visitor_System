import React from 'react';
import { Link as RouterLink } from 'react-router-dom'; // Use alias to avoid conflict
// Import MUI components
import { 
  Container, Box, Typography, Button, Grid, Paper 
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login'; // Example icon
import SecurityIcon from '@mui/icons-material/Security'; // Example icon
import SchoolIcon from '@mui/icons-material/School'; // Example icon

function Home() {
  return (
    // Use Container to center and manage max width
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}> 
      <Paper elevation={3} sx={{ p: 4, textAlign: 'center' }}> {/* Add Paper for background/elevation */}
        <Typography variant="h3" component="h1" gutterBottom>
          Welcome to the Visitor Management System
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 4 }}>
          Please select your destination or action.
        </Typography>
        
        {/* Use Grid to layout the navigation buttons */}
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} sm={4}>
            <Button 
              component={RouterLink} // Use RouterLink for navigation
              to="/entry" 
              variant="contained" 
              color="primary" 
              size="large"
              startIcon={<LoginIcon />}
              fullWidth // Make button take full grid item width
            >
              Visitor Entry
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button 
              component={RouterLink} 
              to="/guard" 
              variant="outlined" 
              color="secondary" 
              size="large"
              startIcon={<SecurityIcon />}
              fullWidth
            >
              Guard Panel
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button 
              component={RouterLink} 
              to="/faculty" 
              variant="outlined" 
              color="secondary" 
              size="large"
              startIcon={<SchoolIcon />}
              fullWidth
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
