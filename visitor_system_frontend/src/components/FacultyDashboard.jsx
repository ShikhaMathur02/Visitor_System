import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from '../context/AuthContext';
// Import MUI components
import {
  Box, Typography, CircularProgress, Alert, Grid, Card,
  CardContent, CardActions, Button, Paper, Stack, TextField, // Added TextField for search
  FormControl, InputLabel, Select, MenuItem // Added for filtering
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid'; // Import DataGrid
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import SchoolIcon from '@mui/icons-material/School';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import SearchIcon from '@mui/icons-material/Search'; // Import Search Icon
import RefreshIcon from '@mui/icons-material/Refresh';
import io from 'socket.io-client';

// Helper component for Stats Card (keep as is)
const StatCard = ({ title, value, icon, color = "text.secondary" }) => (
  <Paper elevation={2} sx={{ p: 2, textAlign: 'center', flexGrow: 1 }}>
    <Box sx={{ color: color, mb: 1 }}>{icon}</Box>
    <Typography variant="h6">{value}</Typography>
    <Typography variant="body2" color="text.secondary">{title}</Typography>
  </Paper>
);


function FacultyDashboard() {
  const [pendingStudents, setPendingStudents] = useState([]); // Renamed from students
  const [pendingVisitors, setPendingVisitors] = useState([]); // Renamed from visitors
  const [allRecords, setAllRecords] = useState([]); // State for combined daily records
  const [filteredRecords, setFilteredRecords] = useState([]); // State for filtered/searched records
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [recordsLoading, setRecordsLoading] = useState(true); // Loading state for all records table
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState(''); // State for search input
  const [filterType, setFilterType] = useState('all'); // State for filter dropdown ('all', 'visitor', 'student')
  const { addNotification } = useNotification();
  const { currentUser } = useAuth();
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Fetch pending exit requests (keep existing logic)
  const fetchRequests = async () => {
    try {
      // Fetch pending student exit requests
      const studentResponse = await axios.get(`${baseUrl}/students/pending-exits`);
      setPendingStudents(Array.isArray(studentResponse.data) ? studentResponse.data : []);

      // Fetch pending visitor exit requests
      const visitorResponse = await axios.get(`${baseUrl}/visitors/pending-exits`);
      setPendingVisitors(Array.isArray(visitorResponse.data) ? visitorResponse.data : []);

    } catch (err) {
      console.error("Error fetching exit requests:", err);
      const errorMsg = err.response?.data?.message || "Failed to load exit requests";
      setError(errorMsg);
      setPendingStudents([]);
      setPendingVisitors([]);
      addNotification("Failed to fetch exit requests", "error");
    }
  };

  // Fetch daily statistics (keep existing logic)
  const fetchStats = async () => {
    try {
      setStatsLoading(true);
      const response = await axios.get(`${baseUrl}/stats/today`);
      setStats(response.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
      addNotification("Failed to load dashboard statistics", "error");
    } finally {
      setStatsLoading(false);
    }
  };

  // Fetch all daily records (New Function)
  const fetchAllDailyRecords = async () => {
    setRecordsLoading(true);
    try {
      const [visitorRes, studentRes] = await Promise.all([
        axios.get(`${baseUrl}/visitors/daily-records`),
        axios.get(`${baseUrl}/students/daily-records`)
      ]);

      // Log the responses to check what's coming from the API
      console.log('Visitors data:', visitorRes.data);
      console.log('Students data:', studentRes.data);

      const visitorsData = (Array.isArray(visitorRes.data) ? visitorRes.data : []).map(v => ({ ...v, type: 'visitor', id: `v-${v._id}` }));
      const studentsData = (Array.isArray(studentRes.data) ? studentRes.data : []).map(s => ({ ...s, type: 'student', id: `s-${s._id}` }));

      const combinedRecords = [...visitorsData, ...studentsData];
      // Sort by entry time descending by default
      combinedRecords.sort((a, b) => new Date(b.entryTime) - new Date(a.entryTime));

      console.log('Combined records:', combinedRecords); // Log the combined data

      setAllRecords(combinedRecords);
      setFilteredRecords(combinedRecords); // Initialize filtered records

    } catch (err) {
      console.error("Error fetching daily records:", err);
      addNotification("Failed to load daily records", "error");
      setAllRecords([]);
      setFilteredRecords([]);
    } finally {
      setRecordsLoading(false);
    }
  };


  // Combined initial load and polling
  const loadData = async () => {
     setLoading(true); // Set main loading true for initial combined load
     // Fetch pending requests, stats, and all daily records
     await Promise.all([fetchRequests(), fetchStats(), fetchAllDailyRecords()]);
     setLoading(false); // Set main loading false after all complete
  };

  useEffect(() => {
    loadData(); // Initial load

    // Set up polling for pending requests and stats (adjust interval as needed)
    const intervalId = setInterval(() => {
      fetchRequests();
      fetchStats();
      // Optionally poll daily records too, or provide a refresh button
      // fetchAllDailyRecords();
    }, 60000); // Poll every 60 seconds

    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [baseUrl]); // Dependency array

  // Handle search and filter changes
  useEffect(() => {
    let result = allRecords;

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(record => record.type === filterType);
    }

    // Filter by search term
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(record =>
        (record.name && record.name.toLowerCase().includes(lowerSearchTerm)) ||
        (record.phone && record.phone.includes(lowerSearchTerm)) || // Visitors have phone
        (record.studentId && record.studentId.includes(lowerSearchTerm)) // Students have studentId
      );
    }

    setFilteredRecords(result);
  }, [searchTerm, filterType, allRecords]);


  // Approve Visitor Exit
  const handleApproveVisitor = async (visitor) => {
    try {
      // Send phone number instead of ID
      await axios.post(`${baseUrl}/visitors/approve-exit`, { phone: visitor.phone });
      addNotification('Visitor exit approved successfully!', 'success');
      fetchRequests(); // Re-fetch pending requests
      fetchStats(); // Re-fetch stats
      fetchAllDailyRecords(); // Also refresh the records table
    } catch (err) {
      console.error("Error approving visitor exit:", err);
      addNotification(err.response?.data?.message || 'Failed to approve visitor exit', 'error');
    }
  };

  // Approve Student Exit (keep existing logic)
  const handleApproveStudent = async (id) => {
     try {
      await axios.post(`${baseUrl}/students/approve-exit`, { id });
      addNotification('Student exit approved successfully!', 'success');
      fetchRequests(); // Re-fetch pending requests
      fetchStats(); // Re-fetch stats
    } catch (err) {
      console.error("Error approving student exit:", err);
      addNotification(err.response?.data?.message || 'Failed to approve student exit', 'error');
    }
  };

  // --- Define Columns for DataGrid ---
  const columns = [
    {
      field: 'type',
      headerName: 'Type',
      width: 100,
      valueGetter: (params) => {
        if (!params || !params.row) return 'N/A';
        return params.row.type === 'student' ? 'Student' : 'Visitor';
      }
    },
    {
      field: 'name',
      headerName: 'Name',
      width: 180,
      valueGetter: (params) => {
        if (!params || !params.row) return 'N/A';
        return params.row.name || 'N/A';
      }
    },
    {
      field: 'identifier',
      headerName: 'Phone / Student ID',
      width: 150,
      valueGetter: (params) => {
        if (!params || !params.row) return 'N/A';
        return params.row.type === 'student' ? params.row.studentId : params.row.phone;
      },
    },
    {
      field: 'purpose',
      headerName: 'Purpose',
      width: 200,
      valueGetter: (params) => {
        if (!params || !params.row) return 'N/A';
        return params.row.purpose || 'N/A';
      }
    },
    {
      field: 'entryTime',
      headerName: 'Entry Time',
      width: 180,
      valueGetter: (params) => {
        if (!params || !params.row) return 'N/A';
        return params.row.entryTime ? new Date(params.row.entryTime).toLocaleString() : 'N/A';
      },
    },
    {
      field: 'exitTime',
      headerName: 'Exit Time',
      width: 180,
      valueGetter: (params) => {
        if (!params || !params.row) return 'N/A';
        return params.row.exitTime ? new Date(params.row.exitTime).toLocaleString() : 'N/A';
      },
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      valueGetter: (params) => {
        if (!params || !params.row) return 'N/A';
        if (params.row.hasExited) return 'Exited';
        if (params.row.exitApproved) return 'Approved (Pending Exit)';
        if (params.row.exitRequested) return 'Requested Exit';
        return 'Inside';
      },
    },
  ];

  // Socket connection effect - MOVED HERE
  useEffect(() => {
    const socket = io(baseUrl);

    // Join a room specific to this faculty member
    if (currentUser && currentUser._id) {
      socket.emit('joinRoom', `user_${currentUser._id}`);
    }

    socket.on('newVisitor', (data) => {
      addNotification(data.message, 'info');
      // Refresh data
      fetchRequests();
      fetchStats();
      // Consider refreshing all records too if needed
      // fetchAllDailyRecords(); 
    });

    // Add listener for visitor exit events
    socket.on('visitorExited', (data) => {
      addNotification(data.message, 'success');
      // Refresh data to update the records
      fetchRequests();
      fetchStats();
      fetchAllDailyRecords();
    });

    return () => {
      socket.disconnect();
    };
  }, [baseUrl, currentUser, addNotification]); // Socket connection effect dependencies


  // --- Render Logic ---
  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  if (error && !stats && pendingVisitors.length === 0 && pendingStudents.length === 0) {
    // Show main error only if nothing else loaded
    return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>Faculty Dashboard</Typography>

      {/* Statistics Section */}
      <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>Today's Statistics</Typography>
      {statsLoading ? <CircularProgress size={24} /> : stats ? (
        <Grid container spacing={2} sx={{ mb: 4 }}>
           {/* Visitor Stats */}
           <StatCard title="Visitors Today" value={stats.visitors.totalToday} icon={<PeopleAltIcon />} color="primary.main" />
           <StatCard title="Visitors Exited Today" value={stats.visitors.exitedToday} icon={<ExitToAppIcon />} color="success.main" />
           <StatCard title="Visitors Pending Approval" value={stats.visitors.pendingApproval} icon={<HourglassEmptyIcon />} color="warning.main" />
           <StatCard title="Visitors Currently Inside" value={stats.visitors.currentlyInside} icon={<MeetingRoomIcon />} color="info.main" />
           {/* Student Stats */}
           <StatCard title="Students Today" value={stats.students.totalToday} icon={<SchoolIcon />} color="secondary.main" />
           <StatCard title="Students Exited Today" value={stats.students.exitedToday} icon={<ExitToAppIcon />} color="success.dark" />
           <StatCard title="Students Pending Approval" value={stats.students.pendingApproval} icon={<HourglassEmptyIcon />} color="warning.dark" />
           <StatCard title="Students Currently Inside" value={stats.students.currentlyInside} icon={<MeetingRoomIcon />} color="info.dark" />
        </Grid>
      ) : <Alert severity="warning">Could not load statistics.</Alert>}

      {/* Pending Exit Requests Section */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>Pending Exit Approvals</Typography>
      {error && <Alert severity="warning" sx={{ mb: 2 }}>{error}</Alert>} {/* Show non-blocking error */}

      {pendingVisitors.length === 0 && pendingStudents.length === 0 && !loading && !error && (
         <Typography sx={{ mb: 2 }}>No pending exit requests.</Typography>
      )}

      <Grid container spacing={2}>
        {/* Pending Visitors */}
        {pendingVisitors.map((visitor) => (
          <Grid item xs={12} sm={6} md={4} key={`v-${visitor._id}`}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6">{visitor.name} (Visitor)</Typography>
                <Typography color="text.secondary">Phone: {visitor.phone}</Typography>
                <Typography color="text.secondary">Purpose: {visitor.purpose}</Typography>
                <Typography color="text.secondary">Entered: {new Date(visitor.entryTime).toLocaleString()}</Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleOutlineIcon />}
                  onClick={() => handleApproveVisitor(visitor)} // Pass the entire visitor object
                >
                  Approve Exit
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
        {/* Pending Students */}
        {pendingStudents.map((student) => (
          <Grid item xs={12} sm={6} md={4} key={`s-${student._id}`}>
            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6">{student.name} (Student)</Typography>
                <Typography color="text.secondary">ID: {student.studentId}</Typography>
                <Typography color="text.secondary">Purpose: {student.purpose}</Typography>
                <Typography color="text.secondary">Entered: {new Date(student.entryTime).toLocaleString()}</Typography>
              </CardContent>
              <CardActions>
                <Button
                  size="small"
                  variant="contained"
                  color="success"
                  startIcon={<CheckCircleOutlineIcon />}
                  onClick={() => handleApproveStudent(student._id)}
                >
                  Approve Exit
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

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
             sx={{ flexGrow: 1, minWidth: '300px' }} // Allow search to grow
           />
           {/* Filter Dropdown */}
           <FormControl size="small" sx={{ minWidth: 150 }}>
             <InputLabel>Filter by Type</InputLabel>
             <Select
               value={filterType}
               label="Filter by Type"
               onChange={(e) => setFilterType(e.target.value)}
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
           >
             Refresh
           </Button>
        </Stack>
      </Paper>

      {/* Add debug info to see if data is available */}
      {filteredRecords.length === 0 && !recordsLoading && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No records found. {allRecords.length > 0 ? 'Try adjusting your filters.' : ''}
        </Alert>
      )}

      {/* DataGrid for displaying records */}
      <div style={{ height: 600, width: '100%', marginBottom: '2rem' }}>
        <DataGrid
          rows={filteredRecords}
          columns={columns}
          loading={recordsLoading}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: {
              paginationModel: { pageSize: 10, page: 0 },
            },
            sorting: {
              sortModel: [{ field: 'entryTime', sort: 'desc' }],
            },
          }}
          getRowId={(row) => row.id || `fallback-${Math.random()}`} // Add fallback ID
          disableRowSelectionOnClick
        />
      </div>
    </Box>
  );

  // REMOVED Socket connection effect from here
  // useEffect(() => { ... }); 
}

export default FacultyDashboard;
