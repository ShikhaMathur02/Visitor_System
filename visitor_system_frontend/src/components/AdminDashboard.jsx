import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import {
  Box, Typography, CircularProgress, Grid, Paper,
  Button, Tabs, Tab, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, Dialog, DialogTitle, DialogContent, 
  DialogActions, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import SchoolIcon from '@mui/icons-material/School';
import SecurityIcon from '@mui/icons-material/Security';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';

// Create API service to centralize API calls
const adminService = {
  baseUrl: import.meta.env.VITE_API_URL || 'https://visitor-system-backend.onrender.com',
  
  getUsers: async () => {
    return axios.get(`${adminService.baseUrl}/admin/users`);
  },
  
  getStats: async () => {
    return axios.get(`${adminService.baseUrl}/admin/stats`);
  },
  
  createUser: async (userData) => {
    return axios.post(`${adminService.baseUrl}/admin/users`, userData);
  },
  
  updateUser: async (id, userData) => {
    return axios.put(`${adminService.baseUrl}/admin/users/${id}`, userData);
  },
  
  deleteUser: async (id) => {
    return axios.delete(`${adminService.baseUrl}/admin/users/${id}`);
  }
};

// Create separate components for better organization and performance

// Stats card component
const StatCard = ({ icon:  count, label, color }) => (
  <Grid item xs={12} sm={6} md={3}>
    <Paper elevation={2} sx={{ p: 2, textAlign: 'center' }}>
      <Box sx={{ color: `${color}.main`, mb: 1 }}><Icon /></Box>
      <Typography variant="h6">{count || 0}</Typography>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
    </Paper>
  </Grid>
);

// User form fields component (reused in both add and edit forms)
const UserFormFields = ({ userData, handleChange, departments, isNewUser = false }) => (
  <>
    <TextField
      margin="dense"
      name="name"
      label="Full Name"
      fullWidth
      value={userData.name}
      onChange={handleChange}
    />
    <TextField
      margin="dense"
      name="email"
      label="Email Address"
      type="email"
      fullWidth
      value={userData.email}
      onChange={handleChange}
    />
    {isNewUser && (
      <TextField
        margin="dense"
        name="password"
        label="Password"
        type="password"
        fullWidth
        value={userData.password}
        onChange={handleChange}
      />
    )}
    <FormControl fullWidth margin="dense">
      <InputLabel>Role</InputLabel>
      <Select
        name="role"
        value={userData.role}
        label="Role"
        onChange={handleChange}
      >
        <MenuItem value="admin">Admin</MenuItem>
        <MenuItem value="faculty">Faculty</MenuItem>
        <MenuItem value="guard">Guard</MenuItem>
      </Select>
    </FormControl>
    
    {userData.role === 'faculty' && (
      <FormControl fullWidth margin="dense">
        <InputLabel>Department</InputLabel>
        <Select
          name="department"
          value={userData.department}
          label="Department"
          onChange={handleChange}
        >
          {departments.map((dept) => (
            <MenuItem key={dept} value={dept}>
              {dept}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    )}
  </>
);

// Users table component
const UsersTable = ({ users, onEdit, onDelete }) => (
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
              <Button size="small" variant="outlined" color="primary" onClick={() => onEdit(user)}>
                Edit
              </Button>
              <Button 
                size="small" 
                variant="outlined" 
                color="error" 
                sx={{ ml: 1 }} 
                onClick={() => onDelete(user)}
              >
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

// Main component
function AdminDashboard() {
  // States
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [addDialog, setAddDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  
  // Form states
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'faculty',
    department: ''
  });
  
  const [editUser, setEditUser] = useState({
    id: '',
    name: '',
    email: '',
    role: '',
    department: ''
  });
  
  const [deleteTarget, setDeleteTarget] = useState(null);
  
  const { addNotification } = useNotification();
  const { currentUser } = useAuth();
  
  // Constants
  const departments = useMemo(() => ['Management', 'Engineering', 'Pharma', 'Nursing', 'Teaching'], []);
  
  // Fetch data function with useCallback to prevent unnecessary rerenders
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersRes, statsRes] = await Promise.all([
        adminService.getUsers(),
        adminService.getStats()
      ]);
      
      setUsers(usersRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Error fetching admin data:", err);
      addNotification("Failed to load admin data", "error");
    } finally {
      setLoading(false);
    }
  }, [addNotification]);

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Tab handling
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // Form input handlers with useCallback
  const handleNewUserChange = useCallback((e) => {
    const { name, value } = e.target;
    setNewUser(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);
  
  const handleEditUserChange = useCallback((e) => {
    const { name, value } = e.target;
    setEditUser(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);
  
  // Dialog handlers
  const handleOpenAddDialog = useCallback(() => {
    setAddDialog(true);
  }, []);
  
  const handleCloseAddDialog = useCallback(() => {
    setAddDialog(false);
    setNewUser({
      name: '',
      email: '',
      password: '',
      role: 'faculty',
      department: ''
    });
  }, []);
  
  const handleOpenEditDialog = useCallback((user) => {
    setEditUser({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department || ''
    });
    setEditDialog(true);
  }, []);
  
  const handleCloseEditDialog = useCallback(() => {
    setEditDialog(false);
  }, []);
  
  const handleOpenDeleteDialog = useCallback((user) => {
    setDeleteTarget(user);
    setDeleteDialog(true);
  }, []);
  
  const handleCloseDeleteDialog = useCallback(() => {
    setDeleteDialog(false);
    setDeleteTarget(null);
  }, []);
  
  // CRUD operations
  const handleCreateUser = useCallback(async () => {
    try {
      await adminService.createUser(newUser);
      addNotification('User created successfully!', 'success');
      handleCloseAddDialog();
      fetchData();
    } catch (err) {
      console.error('Error creating user:', err);
      addNotification(err.response?.data?.message || 'Failed to create user', 'error');
    }
  }, [newUser, addNotification, handleCloseAddDialog, fetchData]);
  
  const handleUpdateUser = useCallback(async () => {
    try {
      const userData = {
        name: editUser.name,
        email: editUser.email,
        role: editUser.role,
        department: editUser.role === 'faculty' ? editUser.department : undefined
      };
      
      await adminService.updateUser(editUser.id, userData);
      addNotification('User updated successfully!', 'success');
      handleCloseEditDialog();
      fetchData();
    } catch (err) {
      console.error('Error updating user:', err);
      addNotification(err.response?.data?.message || 'Failed to update user', 'error');
    }
  }, [editUser, addNotification, handleCloseEditDialog, fetchData]);
  
  const handleDeleteUser = useCallback(async () => {
    try {
      await adminService.deleteUser(deleteTarget._id);
      addNotification('User deleted successfully!', 'success');
      handleCloseDeleteDialog();
      fetchData();
    } catch (err) {
      console.error('Error deleting user:', err);
      addNotification(err.response?.data?.message || 'Failed to delete user', 'error');
    }
  }, [deleteTarget, addNotification, handleCloseDeleteDialog, fetchData]);
  
  // Memoize stats cards to prevent re-renders
  const statsCards = useMemo(() => {
    if (!stats) return null;
    
    return (
      <Grid container spacing={2} sx={{ mb: 4, mt: 2 }}>
        <StatCard icon={PeopleAltIcon} count={stats.totalVisitors} label="Total Visitors" color="primary" />
        <StatCard icon={SchoolIcon} count={stats.totalStudents} label="Total Students" color="secondary" />
        <StatCard icon={SecurityIcon} count={stats.totalGuards} label="Total Guards" color="success" />
        <StatCard icon={PersonIcon} count={stats.totalFaculty} label="Total Faculty" color="info" />
      </Grid>
    );
  }, [stats]);
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Admin Dashboard</Typography>
      <Typography variant="subtitle1" gutterBottom>
        Welcome, {currentUser?.name || 'Admin'}
      </Typography>

      {/* Stats Overview */}
      {statsCards}

      {/* Tabs for different sections */}
      <Box sx={{ width: '100%', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs">
          <Tab label="Users" />
          <Tab label="System Logs" />
          <Tab label="Settings" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {tabValue === 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<AddIcon />}
              onClick={handleOpenAddDialog}
            >
              Add New User
            </Button>
          </Box>
          <UsersTable 
            users={users} 
            onEdit={handleOpenEditDialog} 
            onDelete={handleOpenDeleteDialog} 
          />
        </>
      )}

      {tabValue === 1 && (
        <Paper sx={{ p: 2 }}>
          <Typography>System logs will be displayed here</Typography>
        </Paper>
      )}

      {tabValue === 2 && (
        <Paper sx={{ p: 2 }}>
          <Typography>System settings will be displayed here</Typography>
        </Paper>
      )}

      {/* Add User Dialog */}
      <Dialog 
        open={addDialog} 
        onClose={handleCloseAddDialog}
        aria-labelledby="add-user-dialog-title"
      >
        <DialogTitle id="add-user-dialog-title">Add New User</DialogTitle>
        <DialogContent>
          <UserFormFields 
            userData={newUser} 
            handleChange={handleNewUserChange} 
            departments={departments} 
            isNewUser={true}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog}>Cancel</Button>
          <Button onClick={handleCreateUser} color="primary">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog 
        open={editDialog} 
        onClose={handleCloseEditDialog}
        aria-labelledby="edit-user-dialog-title"
      >
        <DialogTitle id="edit-user-dialog-title">Edit User</DialogTitle>
        <DialogContent>
          <UserFormFields 
            userData={editUser} 
            handleChange={handleEditUserChange} 
            departments={departments}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button onClick={handleUpdateUser} color="primary">Update</Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <Dialog 
        open={deleteDialog} 
        onClose={handleCloseDeleteDialog}
        aria-labelledby="delete-user-dialog-title"
      >
        <DialogTitle id="delete-user-dialog-title">Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete user {deleteTarget?.name}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog}>Cancel</Button>
          <Button onClick={handleDeleteUser} color="error">Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminDashboard;