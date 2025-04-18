import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNotification } from '../context/NotificationContext';

function FacultyDashboard() {
  const [students, setStudents] = useState([]);
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { addNotification } = useNotification();
  const baseUrl = 'http://localhost:5000';

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch pending student exit requests
      const studentResponse = await axios.get(`${baseUrl}/students/pending-exits`);
      console.log('Student response:', studentResponse.data);
      setStudents(Array.isArray(studentResponse.data) ? studentResponse.data : []);

      // Fetch pending visitor exit requests
      const visitorResponse = await axios.get(`${baseUrl}/visitors/pending-exits`);
      console.log('Visitor response:', visitorResponse.data);
      setVisitors(Array.isArray(visitorResponse.data) ? visitorResponse.data : []);

    } catch (err) {
      console.error("Error fetching exit requests:", err);
      setError(err.response?.data?.message || "Failed to load exit requests");
      setStudents([]);
      setVisitors([]);
      addNotification("Failed to fetch exit requests", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    const intervalId = setInterval(fetchRequests, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const handleExitApproval = async (id, type) => {
    try {
      if (!id) {
        throw new Error(`Invalid ${type} ID`);
      }

      const endpoint = `${baseUrl}/${type}s/approve-exit`;
      const payload = type === 'student' ? { id } : { phone: id };
      
      const response = await axios.post(endpoint, payload);

      if (response.status === 200) {
        addNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} exit approved successfully`, 'success');
        
        // Update local state
        if (type === 'student') {
          setStudents(prev => prev.filter(student => student._id !== id));
        } else {
          setVisitors(prev => prev.filter(visitor => visitor.phone !== id));
        }
        
        // Refresh data
        fetchRequests();
      }
    } catch (err) {
      console.error(`Error approving ${type} exit:`, err);
      const errorMsg = err.response?.data?.message || 
                      `Failed to approve ${type} exit. Please try again.`;
      addNotification(errorMsg, 'error');
    }
  };

  if (loading) return <div className="loading">Loading exit requests...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="container">
      <h2>Faculty Dashboard</h2>

      <h3>Student Exit Requests ({students.length})</h3>
      {students.length === 0 ? (
        <p>No pending student exit requests</p>
      ) : (
        <div className="request-list">
          {students.map((student) => (
            <div key={student._id} className="request-card">
              <div className="request-info">
                <h4>{student.name}</h4>
                <p><strong>Student ID:</strong> {student.studentId}</p>
                <p><strong>Purpose:</strong> {student.purpose}</p>
                <p><strong>Entry Time:</strong> {new Date(student.entryTime).toLocaleString()}</p>
                <p><strong>Status:</strong> {student.exitRequested ? 'Exit Requested' : 'Active'}</p>
              </div>
              {student.exitRequested && !student.exitApproved && (
                <button 
                  onClick={() => handleExitApproval(student._id, 'student')}
                  className="approve-btn"
                >
                  Approve Exit
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <h3>Visitor Exit Requests ({visitors.length})</h3>
      {visitors.length === 0 ? (
        <p>No pending visitor exit requests</p>
      ) : (
        <div className="request-list">
          {visitors.map((visitor) => (
            <div key={visitor._id || visitor.phone} className="request-card">
              <div className="request-info">
                <h4>{visitor.name}</h4>
                <p><strong>Phone:</strong> {visitor.phone}</p>
                <p><strong>Purpose:</strong> {visitor.purpose}</p>
                <p><strong>Entry Time:</strong> {new Date(visitor.entryTime).toLocaleString()}</p>
                <p><strong>Status:</strong> {visitor.exitRequested ? 'Exit Requested' : 'Active'}</p>
              </div>
              {visitor.exitRequested && !visitor.exitApproved && (
                <button 
                  onClick={() => handleExitApproval(visitor.phone, 'visitor')}
                  className="approve-btn"
                >
                  Approve Exit
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FacultyDashboard;
