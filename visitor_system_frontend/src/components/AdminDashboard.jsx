import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import {
  Box, Typography, CircularProgress, Alert, Grid, Paper,
  Button, Tabs, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Dialog, DialogTitle, DialogContent, 
  DialogActions, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import SchoolIcon from '@mui/icons-material/School';
import SecurityIcon from '@mui/icons-material/Security';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';

function AdminDashboard() {
  const [value, setValue] = useState(0);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'faculty',
    department: ''
  });
  
  const { addNotification } = useNotification();
  const { currentUser } = useAuth();
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  
  // Departments list
  const departments = ['Management', 'Engineering', 'Pharma', 'Nursing', 'Teaching'];

  const fetchData = async () => {
    try {
      setLoading(true);
      const [usersRes, statsRes] = await Promise.all([
        axios.get(`${baseUrl}/admin/users`),
        axios.get(`${baseUrl}/admin/stats`)
      ]);
      
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Error fetching admin data:", err);
      addNotification("Failed to load admin data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [baseUrl, addNotification]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  
  const handleOpenDialog = () => {
    setOpenDialog(true);
  };
  
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewUser({
      name: '',
      email: '',
      password: '',
      role: 'faculty',
      department: ''
    });
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser({
      ...newUser,
      [name]: value
    });
  };
  
  const handleCreateUser = async () => {
    try {
      await axios.post(`${baseUrl}/admin/users`, newUser);
      addNotification('User created successfully!', 'success');
      handleCloseDialog();
      // Refresh users list
      fetchData();
    } catch (err) {
      console.error('Error creating user:', err);
      addNotification(err.response?.data?.message || 'Failed to create user', 'error');
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>
      <Typography variant="subtitle1" gutterBottom>
        Welcome, {currentUser?.name || 'Admin'}
      </Typography>

      {/* Stats Overview */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 4, mt: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
              <Box sx={{ color: 'primary.main', mb: 1 }}><PeopleAltIcon /></Box>
              <Typography variant="h6">{stats.totalVisitors || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Total Visitors</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
              <Box sx={{ color: 'secondary.main', mb: 1 }}><SchoolIcon /></Box>
              <Typography variant="h6">{stats.totalStudents || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Total Students</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
              <Box sx={{ color: 'success.main', mb: 1 }}><SecurityIcon /></Box>
              <Typography variant="h6">{stats.totalGuards || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Total Guards</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
              <Box sx={{ color: 'info.main', mb: 1 }}><PersonIcon /></Box>
              <Typography variant="h6">{stats.totalFaculty || 0}</Typography>
              <Typography variant="body2" color="text.secondary">Total Faculty</Typography>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Tabs for different sections */}
      <Box sx={{ width: '100%', mb: 2 }}>
        <Tabs value={value} onChange={handleChange} aria-label="admin tabs">
          <Tab label="Users" />
          <Tab label="System Logs" />
          <Tab label="Settings" />
        </Tabs>
      </Box>

      {/* Users Tab */}
      {value === 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
            >
              Add New User
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user._id}>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>{user.department || 'N/A'}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" color="primary">Edit</Button>
                      <Button size="small" variant="outlined" color="error" sx={{ ml: 1 }}>Delete</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* System Logs Tab */}
      {value === 1 && (
        <Paper sx={{ p: 2 }}>
          <Typography>System logs will be displayed here</Typography>
        </Paper>
      )}

      {/* Settings Tab */}
      {value === 2 && (
        <Paper sx={{ p: 2 }}>
          <Typography>System settings will be displayed here</Typography>
        </Paper>
      )}

      {/* User creation dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Add New User</DialogTitle>
        <DialogContent>
          <TextField
            margin="dense"
            name="name"
            label="Full Name"
            fullWidth
            value={newUser.name}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="email"
            label="Email Address"
            type="email"
            fullWidth
            value={newUser.email}
            onChange={handleInputChange}
          />
          <TextField
            margin="dense"
            name="password"
            label="Password"
            type="password"
            fullWidth
            value={newUser.password}
            onChange={handleInputChange}
          />
          <FormControl fullWidth margin="dense">
            <InputLabel>Role</InputLabel>
            <Select
              name="role"
              value={newUser.role}
              label="Role"
              onChange={handleInputChange}
            >
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="faculty">Faculty</MenuItem>
              <MenuItem value="guard">Guard</MenuItem>
            </Select>
          </FormControl>
          
          {newUser.role === 'faculty' && (
            <FormControl fullWidth margin="dense">
              <InputLabel>Department</InputLabel>
              <Select
                name="department"
                value={newUser.department}
                label="Department"
                onChange={handleInputChange}
              >
                {departments.map((dept) => (
                  <MenuItem key={dept} value={dept}>
                    {dept}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleCreateUser} color="primary">Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminDashboard;