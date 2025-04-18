import { useState, useEffect } from 'react';
import axios from 'axios';

function GuardDashboard() {
  const [visitors, setVisitors] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const baseUrl = 'http://localhost:5000';

  useEffect(() => {
    async function fetchRequests() {
      try {
        setLoading(true);
        setError(null); // Reset error state before new request
        
        // Get approved exit requests for visitors
        try {
          const visitorResponse = await axios.get(`${baseUrl}/visitors/approved-exits`);
          setVisitors(visitorResponse.data);
        } catch (visitorErr) {
          console.error("Error fetching approved visitor exits:", visitorErr);
          setVisitors([]);
        }
        
        // Get approved exit requests for students
        try {
          const studentResponse = await axios.get(`${baseUrl}/students/approved-exits`);
          setStudents(studentResponse.data);
        } catch (studentErr) {
          console.error("Error fetching approved student exits:", studentErr);
          setStudents([]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching approved exits:", err);
        setError("Failed to load approved exits. Please try again later.");
        setLoading(false);
      }
    }
    
    fetchRequests();
    
    // Set up polling to refresh data every 30 seconds
    const intervalId = setInterval(fetchRequests, 30000);
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [baseUrl]);

  const handleConfirmExit = async (id, type) => {
    try {
      const endpoint = type === 'student' 
        ? `${baseUrl}/students/confirm-exit` 
        : `${baseUrl}/visitors/confirm-exit`;
        
      await axios.post(endpoint, { id });
      
      // Update local state to remove the confirmed exit
      if (type === 'student') {
        setStudents(students.filter(student => student._id !== id));
      } else {
        setVisitors(visitors.filter(visitor => visitor._id !== id));
      }
      
      alert(`${type.charAt(0).toUpperCase() + type.slice(1)} exit confirmed`);
    } catch (err) {
      console.error(`Error confirming ${type} exit:`, err);
      alert(`Failed to confirm ${type} exit. Please try again.`);
    }
  };

  if (loading) return <div className="loading">Loading approved exits...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="container">
      <h2>Guard Dashboard</h2>
      
      <h3>Approved Visitor Exits</h3>
      {visitors.length === 0 ? (
        <p>No approved visitor exits pending</p>
      ) : (
        <div className="exit-list">
          {visitors.map((visitor) => (
            <div key={visitor._id} className="exit-card">
              <div className="exit-info">
                <h4>{visitor.name}</h4>
                <p><strong>Phone:</strong> {visitor.phone}</p>
                <p><strong>Purpose:</strong> {visitor.purpose}</p>
                <p><strong>Entry Time:</strong> {new Date(visitor.entryTime).toLocaleString()}</p>
              </div>
              <button 
                onClick={() => handleConfirmExit(visitor._id, 'visitor')}
                className="confirm-btn"
              >
                Confirm Exit
              </button>
            </div>
          ))}
        </div>
      )}

      <h3>Approved Student Exits</h3>
      {students.length === 0 ? (
        <p>No approved student exits pending</p>
      ) : (
        <div className="exit-list">
          {students.map((student) => (
            <div key={student._id} className="exit-card">
              <div className="exit-info">
                <h4>{student.name}</h4>
                <p><strong>Student ID:</strong> {student.studentId}</p>
                <p><strong>Purpose:</strong> {student.purpose}</p>
                <p><strong>Entry Time:</strong> {new Date(student.entryTime).toLocaleString()}</p>
              </div>
              <button 
                onClick={() => handleConfirmExit(student._id, 'student')}
                className="confirm-btn"
              >
                Confirm Exit
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default GuardDashboard;