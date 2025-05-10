import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
import { LinearProgress, Skeleton } from '@mui/material';
// Import MUI components
import {
  Box, Typography, CircularProgress, Alert, Grid, Card,
  CardContent, CardActions, Button, Paper, Stack, TextField,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import SchoolIcon from '@mui/icons-material/School';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import io from 'socket.io-client';

// Custom loading overlay for DataGrid with better performance
const CustomLoadingOverlay = () => {
  return (
    <div style={{ position: 'absolute', top: 0, width: '100%' }}>
      <LinearProgress />
    </div>
  );
};

// Helper component for Stats Card - memoized to prevent unnecessary re-renders
const StatCard = memo(({ title, value, icon, color = "text.secondary" }) => (
  <Paper elevation={2} sx={{ p: 2, textAlign: 'center', flexGrow: 1 }}>
    <Box sx={{ color: color, mb: 1 }}>{icon}</Box>
    <Typography variant="h6">{value}</Typography>
    <Typography variant="body2" color="text.secondary">{title}</Typography>
  </Paper>
));

function FacultyDashboard() {
  const [pendingStudents, setPendingStudents] = useState([]);
  const [pendingVisitors, setPendingVisitors] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  
  // Pagination state
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const { addNotification } = useNotification();
  const { currentUser } = useAuth();
  const baseUrl = import.meta.env.VITE_API_URL || 'https://visitor-system-backend.onrender.com';

  // Fetch pending exit requests
  const fetchRequests = useCallback(async () => {
    try {
      if (!currentUser || !currentUser._id) {
        console.error("No current user found");
        return;
      }

      // Fetch pending student exit requests
      const studentResponse = await axios.get(`${baseUrl}/students/pending-exits`);
      setPendingStudents(Array.isArray(studentResponse.data) ? studentResponse.data : []);

      // Fetch pending visitor exit requests for this faculty only
      const visitorResponse = await axios.get(`${baseUrl}/visitors/pending-exits/faculty/${currentUser._id}`);
      setPendingVisitors(Array.isArray(visitorResponse.data) ? visitorResponse.data : []);

    } catch (err) {
      console.error("Error fetching exit requests:", err);
      const errorMsg = err.response?.data?.message || "Failed to load exit requests";
      setError(errorMsg);
      setPendingStudents([]);
      setPendingVisitors([]);
      addNotification("Failed to fetch exit requests", "error");
    }
  }, [baseUrl, currentUser, addNotification]);

  // Fetch faculty-specific daily statistics
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      
      if (!currentUser || !currentUser._id) {
        console.error("No current user found for stats fetch");
        return;
      }
      
      // Get faculty-specific stats
      const response = await axios.get(`${baseUrl}/stats/today/faculty/${currentUser._id}`);
      console.log("Faculty stats response:", response.data);
      setStats(response.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
      addNotification("Failed to load dashboard statistics", "error");
    } finally {
      setStatsLoading(false);
    }
  }, [baseUrl, currentUser, addNotification]);

  // Fetch all daily records with better error handling, data processing, and pagination
  const fetchAllDailyRecords = useCallback(async () => {
    setRecordsLoading(true);
    try {
      if (!currentUser || !currentUser._id) {
        console.error("No current user found for records fetch");
        setAllRecords([]);
        setFilteredRecords([]);
        setRecordsLoading(false);
        addNotification("User data missing. Cannot fetch records.", "error");
        return;
      }

      // Add pagination parameters to the API calls
      const visitorUrl = `${baseUrl}/visitors/daily-records/faculty/${currentUser._id}?page=${page}&limit=${pageSize}`;
      const studentUrl = `${baseUrl}/students/daily-records?page=${page}&limit=${pageSize}`;
      
      // Make both API calls in parallel
      const [visitorRes, studentRes] = await Promise.all([
        axios.get(visitorUrl),
        axios.get(studentUrl)
      ]);

      // Extract pagination metadata if available
      const visitorTotal = visitorRes.data.total || visitorRes.data.length || 0;
      const studentTotal = studentRes.data.total || studentRes.data.length || 0;
      setTotalRecords(visitorTotal + studentTotal);

      // Ensure we're working with arrays
      const visitorsArray = Array.isArray(visitorRes.data) ? visitorRes.data : 
                          (visitorRes.data.records ? visitorRes.data.records : []);
      
      const studentsArray = Array.isArray(studentRes.data) ? studentRes.data : 
                            (studentRes.data.records ? studentRes.data.records : []);

      // Process visitor data with simplified mapping
      const visitorsData = visitorsArray.map(v => ({
        id: `v-${v._id || Math.random().toString(36).substr(2, 9)}`,
        _id: v._id,
        type: 'visitor',
        name: v.name || 'Unknown',
        phone: v.phone || 'N/A',
        purpose: v.purpose || 'N/A',
        entryTime: v.entryTime || null,
        exitTime: v.exitTime || null,
        exitRequested: v.exitRequested || false,
        exitApproved: v.exitApproved || false,
        hasExited: v.hasExited || false,
        faculty: v.faculty || null
      }));

      // Process student data with simplified mapping
      const studentsData = studentsArray.map(s => ({
        id: `s-${s._id || Math.random().toString(36).substr(2, 9)}`,
        _id: s._id,
        type: 'student',
        name: s.name || 'Unknown',
        studentId: s.studentId || 'N/A',
        purpose: s.purpose || 'N/A',
        entryTime: s.entryTime || null,
        exitTime: s.exitTime || null,
        exitRequested: s.exitRequested || false,
        exitApproved: s.exitApproved || false,
        hasExited: s.hasExited || false
      }));

      console.log("Processed visitors count:", visitorsData.length);
      console.log("Processed students count:", studentsData.length);

      // Log individual processed records to check structure
      if (visitorsData.length > 0) {
        console.log("Sample processed visitor:", visitorsData[0]);
      }
      if (studentsData.length > 0) {
        console.log("Sample processed student:", studentsData[0]);
      }

      // Combine records
      const combinedRecords = [...visitorsData, ...studentsData];
      
      // Sort by entry time if possible
      combinedRecords.sort((a, b) => {
        const timeA = a.entryTime ? new Date(a.entryTime) : new Date(0);
        const timeB = b.entryTime ? new Date(b.entryTime) : new Date(0);
        return timeB - timeA; // Descending order (newest first)
      });

      console.log("Total combined records:", combinedRecords.length);
      
      // Very important - set both state variables
      setAllRecords(combinedRecords);
      setFilteredRecords(combinedRecords);

    } catch (err) {
      console.error("Error fetching daily records:", err);
      console.error("Error details:", err.response?.data || err.message);
      addNotification("Failed to load daily records", "error");
      setAllRecords([]);
      setFilteredRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  }, [baseUrl, currentUser, addNotification]);

  // Combined initial load and polling with optimized loading
  const loadData = useCallback(async () => {
    setLoading(true);
    // Use Promise.allSettled instead of Promise.all to handle partial failures
    const results = await Promise.allSettled([fetchRequests(), fetchStats(), fetchAllDailyRecords()]);
    
    // Check for any failures and notify user only once
    const failures = results.filter(result => result.status === 'rejected');
    if (failures.length > 0) {
      console.error('Some data failed to load:', failures);
      addNotification('Some dashboard data could not be loaded. Please try refreshing.', 'warning');
    }
    
    setLoading(false);
  }, [fetchRequests, fetchStats, fetchAllDailyRecords, addNotification]);

  useEffect(() => {
    loadData(); // Initial load

    // Set up polling with staggered intervals to prevent concurrent requests
    const requestsIntervalId = setInterval(() => {
      fetchRequests();
    }, 65000); // Poll every 65 seconds
    
    const statsIntervalId = setInterval(() => {
      fetchStats();
    }, 70000); // Poll every 70 seconds
    
    // Only refresh all records when user is actively using the dashboard
    const recordsIntervalId = setInterval(() => {
      // Check if the tab is visible before fetching data
      if (document.visibilityState === 'visible') {
        fetchAllDailyRecords();
      }
    }, 120000); // Poll every 2 minutes

    // Clean up all intervals
    return () => {
      clearInterval(requestsIntervalId);
      clearInterval(statsIntervalId);
      clearInterval(recordsIntervalId);
    };
  }, [loadData, fetchRequests, fetchStats, fetchAllDailyRecords]);
  
  // Add visibility change listener to pause/resume data fetching
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Refresh data when tab becomes visible again
        fetchStats();
        fetchAllDailyRecords();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchStats, fetchAllDailyRecords]);

  // Use useEffect for filtering to avoid unnecessary recalculations
  useEffect(() => {
    if (!allRecords || allRecords.length === 0) {
      setFilteredRecords([]);
      return;
    }

    // Debounce search to avoid excessive filtering on every keystroke
    const debounceTimeout = setTimeout(() => {
      let result = [...allRecords]; // Create a new array to avoid mutations

      // Filter by type
      if (filterType !== 'all') {
        result = result.filter(record => record.type === filterType);
      }

      // Filter by search term
      if (searchTerm && searchTerm.trim() !== '') {
        const lowerSearchTerm = searchTerm.toLowerCase().trim();
        result = result.filter(record => {
          // Check if properties exist before accessing them
          const nameMatch = record.name ? record.name.toLowerCase().includes(lowerSearchTerm) : false;
          const phoneMatch = record.phone ? record.phone.includes(lowerSearchTerm) : false;
          const studentIdMatch = record.studentId ? record.studentId.includes(lowerSearchTerm) : false;
          
          return nameMatch || phoneMatch || studentIdMatch;
        });
      }

      setFilteredRecords(result);
    }, 300); // 300ms debounce delay

    return () => clearTimeout(debounceTimeout);
  }, [searchTerm, filterType, allRecords]);

  // Approve Visitor Exit - memoized to prevent unnecessary re-renders
  const handleApproveVisitor = useCallback(async (visitor) => {
    try {
      setLoading(true);
      await axios.post(`${baseUrl}/visitors/approve-exit`, { phone: visitor.phone });
      addNotification('Visitor exit approved successfully!', 'success');
      
      // Immediately update the UI by removing the approved visitor from pending list
      setPendingVisitors(prev => prev.filter(v => v.phone !== visitor.phone));
      
      // Then refresh only the necessary data
      await Promise.allSettled([
        fetchRequests(),
        fetchStats()
      ]);
      // Only update records if they're currently visible
      if (document.visibilityState === 'visible') {
        fetchAllDailyRecords();
      }
    } catch (err) {
      console.error("Error approving visitor exit:", err);
      addNotification(err.response?.data?.message || 'Failed to approve visitor exit', 'error');
    } finally {
      setLoading(false);
    }
  }, [baseUrl, addNotification, fetchRequests, fetchStats, fetchAllDailyRecords]);

  // Approve Student Exit - memoized to prevent unnecessary re-renders
  const handleApproveStudent = useCallback(async (id) => {
    try {
      setLoading(true);
      await axios.post(`${baseUrl}/students/approve-exit`, { id });
      addNotification('Student exit approved successfully!', 'success');
      
      // Immediately update the UI by removing the approved student from pending list
      setPendingStudents(prev => prev.filter(s => s._id !== id));
      
      // Then refresh only the necessary data
      await Promise.allSettled([
        fetchRequests(),
        fetchStats()
      ]);
      // Only update records if they're currently visible
      if (document.visibilityState === 'visible') {
        fetchAllDailyRecords();
      }
    } catch (err) {
      console.error("Error approving student exit:", err);
      addNotification(err.response?.data?.message || 'Failed to approve student exit', 'error');
    } finally {
      setLoading(false);
    }
  }, [baseUrl, addNotification, fetchRequests, fetchStats, fetchAllDailyRecords]);

  // Memoize column definitions to prevent unnecessary re-renders
  const columns = useMemo(() => [
    {
      field: 'type',
      headerName: 'Type',
      width: 100,
      renderCell: (params) => (params.row.type === 'student' ? 'Student' : 'Visitor')
    },
    {
      field: 'name',
      headerName: 'Name',
      width: 180,
    },
    {
      field: 'identifier',
      headerName: 'Phone / Student ID',
      width: 150,
      renderCell: (params) => params.row.type === 'student' ? params.row.studentId : params.row.phone
    },
    {
      field: 'purpose',
      headerName: 'Purpose',
      width: 200,
    },
    {
      field: 'entryTime',
      headerName: 'Entry Time',
      width: 180,
      renderCell: (params) => {
        if (!params.row.entryTime) return 'N/A';
        try {
          return new Date(params.row.entryTime).toLocaleString();
        } catch (e) {
          return 'Invalid Date';
        }
      }
    },
    {
      field: 'exitTime',
      headerName: 'Exit Time',
      width: 180,
      renderCell: (params) => {
        if (!params.row.exitTime) return 'N/A';
        try {
          return new Date(params.row.exitTime).toLocaleString();
        } catch (e) {
          return 'Invalid Date';
        }
      }
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => {
        if (params.row.hasExited) return 'Exited';
        if (params.row.exitApproved) return 'Approved (Pending Exit)';
        if (params.row.exitRequested) return 'Requested Exit';
        return 'Inside';
      }
    },
  ], []);

  // Handle page change
  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  // Handle page size change
  const handlePageSizeChange = useCallback((newPageSize) => {
    setPageSize(newPageSize);
    setPage(0); // Reset to first page when changing page size
  }, []);

  // Socket connection effect - memoized to prevent unnecessary reconnections
  useEffect(() => {
    let socket;
    
    // Only connect to socket if we have a current user
    if (currentUser && currentUser._id) {
      socket = io(baseUrl, {
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket']
      });

      // Join a room specific to this faculty member
      socket.emit('joinRoom', `user_${currentUser._id}`);
      
      // Create debounced refresh functions to prevent multiple refreshes
      const debouncedRefresh = debounce(() => {
        if (document.visibilityState === 'visible') {
          fetchRequests();
          fetchStats();
          // Only refresh records if user is actively viewing
          if (document.hasFocus()) {
            fetchAllDailyRecords();
          }
        }
      }, 1000);

      // Set up event listeners
      socket.on('newVisitor', (data) => {
        addNotification(data.message, 'info');
        debouncedRefresh();
      });

      socket.on('visitorExited', (data) => {
        addNotification(data.message, 'success');
        debouncedRefresh();
      });

      socket.on('studentExited', (data) => {
        addNotification(data.message, 'success');
        debouncedRefresh();
      });
      
      // Handle connection errors
      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [baseUrl, currentUser, addNotification, fetchRequests, fetchStats, fetchAllDailyRecords]);
  
  // Helper function for debouncing
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  if (error && !stats && pendingVisitors.length === 0 && pendingStudents.length === 0) {
    return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Faculty Dashboard</Typography>
      
      {/* Debug info - only visible in development */}
      {process.env.NODE_ENV === 'development' && (
        <Paper sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
          <Typography variant="subtitle2">Connection Info:</Typography>
          <Typography variant="body2">
            User ID: {currentUser?._id || 'Not available'}<br/>
            Department: {currentUser?.department || 'Not assigned'}<br/>
            Records loaded: {allRecords.length} (Filtered: {filteredRecords.length})<br/>
          </Typography>
        </Paper>
      )}
      
      <Typography variant="subtitle1" gutterBottom>
        Department: {currentUser?.department || 'Not Assigned'}
      </Typography>
      
      {/* Statistics Section */}
      <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>Your Department's Statistics</Typography>
      {statsLoading ? (
        <Grid container spacing={2} sx={{ mb: 4 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
            <Grid item xs={6} sm={3} key={`stat-skeleton-${item}`}>
              <Paper elevation={2} sx={{ p: 2, textAlign: 'center', flexGrow: 1 }}>
                <Skeleton variant="circular" width={40} height={40} sx={{ mx: 'auto', mb: 1 }} />
                <Skeleton variant="text" width="60%" height={32} sx={{ mx: 'auto' }} />
                <Skeleton variant="text" width="80%" sx={{ mx: 'auto' }} />
              </Paper>
            </Grid>
          ))}
        </Grid>
      ) : stats ? (
        <Grid container spacing={2} sx={{ mb: 4 }}>
           {/* Visitor Stats */}
           <Grid item xs={6} sm={3}><StatCard title="Visitors Today" value={stats.visitors.totalToday} icon={<PeopleAltIcon />} color="primary.main" /></Grid>
           <Grid item xs={6} sm={3}><StatCard title="Visitors Exited" value={stats.visitors.exitedToday} icon={<ExitToAppIcon />} color="success.main" /></Grid>
           <Grid item xs={6} sm={3}><StatCard title="Pending Approval" value={stats.visitors.pendingApproval} icon={<HourglassEmptyIcon />} color="warning.main" /></Grid>
           <Grid item xs={6} sm={3}><StatCard title="Currently Inside" value={stats.visitors.currentlyInside} icon={<MeetingRoomIcon />} color="info.main" /></Grid>
           
           {/* Student Stats - Only render if stats.students exists */}
           {stats.students ? (
             <>
               <Grid item xs={6} sm={3}><StatCard title="Students Today" value={stats.students.totalToday} icon={<SchoolIcon />} color="secondary.main" /></Grid>
               <Grid item xs={6} sm={3}><StatCard title="Students Exited" value={stats.students.exitedToday} icon={<ExitToAppIcon />} color="success.dark" /></Grid>
               <Grid item xs={6} sm={3}><StatCard title="Pending Approval" value={stats.students.pendingApproval} icon={<HourglassEmptyIcon />} color="warning.dark" /></Grid>
               <Grid item xs={6} sm={3}><StatCard title="Currently Inside" value={stats.students.currentlyInside} icon={<MeetingRoomIcon />} color="info.dark" /></Grid>
             </>
           ) : null}
        </Grid>
      ) : <Alert severity="warning">Could not load statistics.</Alert>}

      {/* Pending Exit Requests Section */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Pending Exit Approvals</Typography>
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Show skeleton loading state when loading */}
      {loading ? (
        <Box sx={{ width: '100%' }}>
          <Grid container spacing={2}>
            {[1, 2, 3].map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item}>
                <Card variant="outlined" sx={{ height: '180px' }}>
                  <CardContent>
                    <Skeleton variant="text" width="70%" height={32} />
                    <Skeleton variant="text" width="50%" />
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="80%" />
                  </CardContent>
                  <CardActions>
                    <Skeleton variant="rectangular" width={120} height={36} />
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : pendingVisitors.length === 0 && pendingStudents.length === 0 && !error ? (
        <Typography sx={{ mb: 2 }}>No pending exit requests.</Typography>
      ) : (
        <Box sx={{ width: '100%' }}>
          {/* Combine all pending requests for more efficient rendering */}
          {useMemo(() => {
            const allPendingRequests = [
              ...pendingVisitors.map(visitor => ({ 
                type: 'visitor', 
                data: visitor, 
                key: `v-${visitor._id}` 
              })),
              ...pendingStudents.map(student => ({ 
                type: 'student', 
                data: student, 
                key: `s-${student._id}` 
              }))
            ];
            
            return (
              <Grid container spacing={2}>
                {allPendingRequests.map((request) => (
                  <Grid item xs={12} sm={6} md={4} key={request.key}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6">
                          {request.type === 'visitor' ? request.data.name + ' (Visitor)' : request.data.name + ' (Student)'}
                        </Typography>
                        <Typography color="text.secondary">
                          {request.type === 'visitor' ? `Phone: ${request.data.phone}` : `ID: ${request.data.studentId}`}
                        </Typography>
                        <Typography color="text.secondary">Purpose: {request.data.purpose}</Typography>
                        <Typography color="text.secondary">
                          Entered: {new Date(request.data.entryTime).toLocaleString()}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircleOutlineIcon />}
                          onClick={() => request.type === 'visitor' 
                            ? handleApproveVisitor(request.data) 
                            : handleApproveStudent(request.data._id)}
                        >
                          Approve Exit
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            );
          }, [pendingVisitors, pendingStudents, handleApproveVisitor, handleApproveStudent])}
        </Box>
      )}

      {/* All Daily Records Table Section */}
      <Typography variant="h5" gutterBottom sx={{ mt: 5 }}>Daily Records (Visitors & Students)</Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
           {/* Search Input */}
           <TextField
             label="Search by Name, Phone, or Student ID"
             variant="outlined"
             size="small"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             InputProps={{
               startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
             }}
             sx={{ flexGrow: 1, minWidth: '300px' }}
             disabled={recordsLoading}
           />
           {/* Filter Dropdown */}
           <FormControl size="small" sx={{ minWidth: 150 }}>
             <InputLabel>Filter by Type</InputLabel>
             <Select
               value={filterType}
               label="Filter by Type"
               onChange={(e) => setFilterType(e.target.value)}
               disabled={recordsLoading}
             >
               <MenuItem value="all">All</MenuItem>
               <MenuItem value="visitor">Visitors Only</MenuItem>
               <MenuItem value="student">Students Only</MenuItem>
             </Select>
           </FormControl>
           {/* Add a refresh button */}
           <Button 
             variant="outlined" 
             onClick={fetchAllDailyRecords}
             startIcon={<RefreshIcon />}
             disabled={recordsLoading}
           >
             Refresh
           </Button>
        </Stack>
      </Paper>

      {/* Debug information for the records */}
      {process.env.NODE_ENV === 'development' && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2">
            Records Debug: Total={allRecords.length}, Filtered={filteredRecords.length}
            {filteredRecords.length > 0 && `, First Record ID=${filteredRecords[0].id}`}
          </Typography>
        </Box>
      )}

      {/* Display message when no records are found */}
      {filteredRecords.length === 0 && !recordsLoading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {allRecords.length === 0 
            ? "No records found for today." 
            : "No records match your current filters. Try adjusting your search or filter settings."}
        </Alert>
      )}

      {/* Updated DataGrid with virtualization, pagination and error handling */}
      <div style={{ height: 600, width: '100%', marginBottom: '2rem' }}>
        {recordsLoading && filteredRecords.length === 0 ? (
          <Box sx={{ width: '100%', mt: 2 }}>
            <Skeleton variant="rectangular" height={400} />
          </Box>
        ) : (
          <DataGrid
            rows={filteredRecords}
            columns={columns}
            loading={recordsLoading}
            pagination
            paginationMode="server"
            page={page}
            pageSize={pageSize}
            rowCount={totalRecords}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            rowsPerPageOptions={[10, 25, 50, 100]}
            disableSelectionOnClick
            getRowId={(row) => row.id}
            autoHeight
            density="standard"
            // Enable virtualization for better performance with large datasets
            components={{
              LoadingOverlay: CustomLoadingOverlay
            }}
            // Optimize rendering performance
            componentsProps={{
              cell: {
                style: { overflow: 'hidden', textOverflow: 'ellipsis' }
              }
            }}
            // Error handling
            error={error ? true : false}
            onError={(error) => {
              console.error('DataGrid error:', error);
              addNotification('Error loading data. Please try refreshing.', 'error');
            }}
            // Improve performance by disabling certain features when not needed
            disableColumnMenu={recordsLoading}
            disableColumnFilter={recordsLoading}
            disableColumnSelector={recordsLoading}
            disableDensitySelector={recordsLoading}
            // Cache the grid state to improve performance
            keepNonExistentRowsSelected
          />
        )}
      </div>
    </Box>
  );
}

export default FacultyDashboard;