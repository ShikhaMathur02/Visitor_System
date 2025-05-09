import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box, Typography, TextField, Button, Paper, CircularProgress,
  FormControl, InputLabel, Select, MenuItem, Alert,
  FormHelperText, InputAdornment
} from '@mui/material';
import { useNotification } from '../context/NotificationContext';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import SubjectIcon from '@mui/icons-material/Subject';

function EntryForm() {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    purpose: '',
    department: '',
    faculty: ''
  });

  // Validation state
  const [errors, setErrors] = useState({
    name: '',
    phone: '',
    purpose: '',
    department: '',
    faculty: ''
  });

  // Form submission state
  const [facultyList, setFacultyList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({});
  const { addNotification } = useNotification();
  const baseUrl = import.meta.env.VITE_API_URL || "https://visitor-system-backend.onrender.com"

  // Departments list
  const departments = ['Management', 'Engineering', 'Pharma', 'Nursing', 'Teaching'];

  // Validation rules
  const validateField = (name, value) => {
    let errorMessage = '';
    
    switch (name) {
      case 'name':
        if (!value.trim()) {
          errorMessage = 'Name is required';
        } else if (value.trim().length < 3) {
          errorMessage = 'Name must be at least 3 characters';
        } else if (!/^[A-Za-z\s.]+$/.test(value)) {
          errorMessage = 'Name should contain only letters, spaces and periods';
        }
        break;
        
      case 'phone':
        if (!value.trim()) {
          errorMessage = 'Phone number is required';
        } else if (!/^[0-9]{10}$/.test(value.replace(/[\s-]/g, ''))) {
          errorMessage = 'Please enter a valid 10-digit phone number';
        }
        break;
        
      case 'purpose':
        if (!value.trim()) {
          errorMessage = 'Purpose is required';
        } else if (value.trim().length < 5) {
          errorMessage = 'Please provide a more detailed purpose';
        } else if (value.trim().length > 200) {
          errorMessage = 'Purpose should not exceed 200 characters';
        }
        break;
        
      case 'department':
        if (!value) {
          errorMessage = 'Please select a department';
        }
        break;
        
      case 'faculty':
        if (!value && formData.department) {
          errorMessage = 'Please select a faculty member';
        }
        break;
        
      default:
        break;
    }
    
    return errorMessage;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Mark field as touched
    if (!touched[name]) {
      setTouched(prev => ({
        ...prev,
        [name]: true
      }));
    }
    
    // Validate field
    const errorMessage = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: errorMessage
    }));
  };

  // Handle field blur for validation
  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    // Mark field as touched
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Validate field
    const errorMessage = validateField(name, value);
    setErrors(prev => ({
      ...prev,
      [name]: errorMessage
    }));
  };

  // Fetch faculty members when department changes
  useEffect(() => {
    if (formData.department) {
      const fetchFaculty = async () => {
        try {
          const response = await axios.get(`${baseUrl}/faculty/department/${formData.department}`);
          setFacultyList(response.data);
          
          // Reset faculty selection when department changes
          if (formData.faculty) {
            setFormData(prev => ({
              ...prev,
              faculty: ''
            }));
          }
        } catch (err) {
          console.error('Error fetching faculty:', err);
          addNotification('Failed to load faculty members', 'error');
        }
      };

      fetchFaculty();
    } else {
      setFacultyList([]);
    }
  }, [formData.department, baseUrl, addNotification]);

  // Validate entire form
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    
    // Validate each field
    Object.keys(formData).forEach(field => {
      const errorMessage = validateField(field, formData[field]);
      newErrors[field] = errorMessage;
      
      if (errorMessage) {
        isValid = false;
      }
    });
    
    setErrors(newErrors);
    setTouched({
      name: true,
      phone: true,
      purpose: true,
      department: true,
      faculty: true
    });
    
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields before submission
    if (!validateForm()) {
      addNotification('Please correct the errors in the form', 'error');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    try {
      await axios.post(`${baseUrl}/visitors/register`, {
        name: formData.name,
        phone: formData.phone,
        purpose: formData.purpose,
        department: formData.department,
        faculty: formData.faculty
      });

      // Reset form
      setFormData({
        name: '',
        phone: '',
        purpose: '',
        department: '',
        faculty: ''
      });
      setTouched({});
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
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Visitor Entry Form
      </Typography>

      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
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

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            label="Full Name"
            name="name"
            fullWidth
            margin="normal"
            value={formData.name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.name && Boolean(errors.name)}
            helperText={touched.name && errors.name}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon color={errors.name && touched.name ? "error" : "primary"} />
                </InputAdornment>
              ),
            }}
            placeholder="Enter your full name"
          />

          <TextField
            label="Phone Number"
            name="phone"
            fullWidth
            margin="normal"
            value={formData.phone}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.phone && Boolean(errors.phone)}
            helperText={touched.phone && errors.phone}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PhoneIcon color={errors.phone && touched.phone ? "error" : "primary"} />
                </InputAdornment>
              ),
            }}
            placeholder="Enter your 10-digit phone number"
          />

          <TextField
            label="Purpose of Visit"
            name="purpose"
            fullWidth
            margin="normal"
            value={formData.purpose}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.purpose && Boolean(errors.purpose)}
            helperText={touched.purpose && errors.purpose}
            required
            multiline
            rows={2}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SubjectIcon color={errors.purpose && touched.purpose ? "error" : "primary"} />
                </InputAdornment>
              ),
            }}
            placeholder="Briefly describe your purpose of visit"
          />

          <FormControl 
            fullWidth 
            margin="normal" 
            required 
            error={touched.department && Boolean(errors.department)}
          >
            <InputLabel>Department</InputLabel>
            <Select
              name="department"
              value={formData.department}
              label="Department"
              onChange={handleChange}
              onBlur={handleBlur}
            >
              {departments.map((dept) => (
                <MenuItem key={dept} value={dept}>
                  {dept}
                </MenuItem>
              ))}
            </Select>
            {touched.department && errors.department && (
              <FormHelperText error>{errors.department}</FormHelperText>
            )}
          </FormControl>

          <FormControl 
            fullWidth 
            margin="normal" 
            required 
            disabled={!formData.department || facultyList.length === 0}
            error={touched.faculty && Boolean(errors.faculty)}
          >
            <InputLabel>Faculty Member</InputLabel>
            <Select
              name="faculty"
              value={formData.faculty}
              label="Faculty Member"
              onChange={handleChange}
              onBlur={handleBlur}
            >
              {facultyList.map((f) => (
                <MenuItem key={f._id} value={f._id}>
                  {f.name}
                </MenuItem>
              ))}
            </Select>
            {touched.faculty && errors.faculty && (
              <FormHelperText error>{errors.faculty}</FormHelperText>
            )}
            {formData.department && facultyList.length === 0 && (
              <FormHelperText>No faculty members found for this department</FormHelperText>
            )}
          </FormControl>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ 
              mt: 3, 
              py: 1.5, 
              fontWeight: 'bold',
              borderRadius: 2,
              '&:hover': {
                backgroundColor: '#1565c0'
              }
            }}
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