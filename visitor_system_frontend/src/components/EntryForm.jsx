import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, TextField, Button, Paper, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Alert
} from '@mui/material';
import { useNotification } from '../context/NotificationContext';

function EntryForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [purpose, setPurpose] = useState('');
  const [department, setDepartment] = useState('');
  const [faculty, setFaculty] = useState('');
  const [facultyList, setFacultyList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { addNotification } = useNotification();
  const baseUrl = 'http://localhost:5000';

  // Departments list
  const departments = ['Management', 'Engineering', 'Pharma', 'Nursing', 'Teaching'];

  // Fetch faculty members when department changes
  useEffect(() => {
    if (department) {
      const fetchFaculty = async () => {
        try {
          const response = await axios.get(`${baseUrl}/faculty/department/${department}`);
          setFacultyList(response.data);
        } catch (err) {
          console.error('Error fetching faculty:', err);
          addNotification('Failed to load faculty members', 'error');
        }
      };

      fetchFaculty();
    } else {
      setFacultyList([]);
    }
  }, [department, baseUrl, addNotification]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      await axios.post(`${baseUrl}/visitors/register`, {
        name,
        phone,
        purpose,
        department,
        faculty
      });

      // Reset form
      setName('');
      setPhone('');
      setPurpose('');
      setDepartment('');
      setFaculty('');
      setSuccess(true);
      addNotification('Visitor registered successfully!', 'success');
    } catch (err) {
      console.error('Error registering visitor:', err);
      setError(err.response?.data?.message || 'Failed to register visitor');
      addNotification(err.response?.data?.message || 'Failed to register visitor', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 2 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center">
        Visitor Entry Form
      </Typography>

      <Paper elevation={3} sx={{ p: 3 }}>
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Visitor registered successfully!
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            label="Full Name"
            fullWidth
            margin="normal"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <TextField
            label="Phone Number"
            fullWidth
            margin="normal"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />

          <TextField
            label="Purpose of Visit"
            fullWidth
            margin="normal"
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            required
            multiline
            rows={2}
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Department</InputLabel>
            <Select
              value={department}
              label="Department"
              onChange={(e) => setDepartment(e.target.value)}
            >
              {departments.map((dept) => (
                <MenuItem key={dept} value={dept}>
                  {dept}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal" required disabled={!department || facultyList.length === 0}>
            <InputLabel>Faculty Member</InputLabel>
            <Select
              value={faculty}
              label="Faculty Member"
              onChange={(e) => setFaculty(e.target.value)}
            >
              {facultyList.map((f) => (
                <MenuItem key={f._id} value={f._id}>
                  {f.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3 }}
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : 'Register Visitor'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}

export default EntryForm;