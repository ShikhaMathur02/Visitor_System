import { useState, useEffect, useCallback, memo } from 'react';
import axios from 'axios';

// Use React components without MUI for better performance
const Dashboard = () => {
  // State management with proper initial values to prevent unnecessary renders
  const [requests, setRequests] = useState({
    pending: { visitors: [], students: [] },
    ready: { visitors: [], students: [] },
    completed: { visitors: [], students: [] }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Memoized fetch function to avoid recreating on every render
  const fetchAllRequests = useCallback(async () => {
    try {
      setLoading(true);
      
      // Create a single promise array for parallel fetching
      const endpoints = [
        `${baseUrl}/visitors/pending-faculty-approval`,
        `${baseUrl}/students/pending-faculty-approval`,
        `${baseUrl}/visitors/approved-exits`,
        `${baseUrl}/students/approved-exits`,
        `${baseUrl}/visitors/exited-today`,
        `${baseUrl}/students/exited-today`,
      ];
      
      // Fetch all data in parallel for better performance
      const responses = await Promise.all(
        endpoints.map(url => 
          axios.get(url)
            .then(res => Array.isArray(res.data) ? res.data : [])
            .catch(err => {
              console.error(`Error fetching from ${url}:`, err);
              return [];
            })
        )
      );
      
      // Get today for filtering
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Filter only today's pending requests
      const filteredPendingVisitors = responses[0].filter(visitor => {
        const requestTime = visitor.exitRequestTime ? new Date(visitor.exitRequestTime) : new Date(visitor.entryTime);
        return requestTime >= today;
      });
      
      const filteredPendingStudents = responses[1].filter(student => {
        const requestTime = student.exitRequestTime ? new Date(student.exitRequestTime) : new Date(student.entryTime);
        return requestTime >= today;
      });
      
      // Update all state at once to minimize renders
      setRequests({
        pending: { 
          visitors: filteredPendingVisitors, 
          students: filteredPendingStudents 
        },
        ready: { 
          visitors: responses[2], 
          students: responses[3] 
        },
        completed: { 
          visitors: responses[4], 
          students: responses[5] 
        }
      });
      
      setLastUpdated(new Date());
      setLoading(false);
    } catch (err) {
      console.error("Error fetching requests:", err);
      setError("Failed to load requests. Please try again later.");
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchAllRequests();
    
    // Use more efficient polling with clearTimeout for cleanup
    const timerId = setInterval(fetchAllRequests, 30000);
    return () => clearInterval(timerId);
  }, [fetchAllRequests]);

  const handleConfirmExit = async (id, type, phone) => { 
    try {
      let endpoint = '';
      let payload = {};

      if (type === 'student') {
        endpoint = `${baseUrl}/students/confirm-exit`;
        payload = { id };
      } else {
        endpoint = `${baseUrl}/visitors/confirm-exit`;
        payload = { phone }; 
      }
      
      // Show loading indicator for the specific card
      setRequests(prev => {
        // Create deep copy to avoid mutation
        const newState = JSON.parse(JSON.stringify(prev));
        
        // Find the specific item and mark it as processing
        if (type === 'student') {
          const studentIndex = newState.ready.students.findIndex(s => s._id === id);
          if (studentIndex !== -1) {
            newState.ready.students[studentIndex].processing = true;
          }
        } else {
          const visitorIndex = newState.ready.visitors.findIndex(v => v.phone === phone);
          if (visitorIndex !== -1) {
            newState.ready.visitors[visitorIndex].processing = true;
          }
        }
        
        return newState;
      });
        
      await axios.post(endpoint, payload);
      
      // Update local state by moving from ready to completed
      setRequests(prev => {
        // Create deep copy to avoid mutation
        const newState = JSON.parse(JSON.stringify(prev));
        
        if (type === 'student') {
          // Find the student to move
          const studentIndex = newState.ready.students.findIndex(s => s._id === id);
          if (studentIndex !== -1) {
            const student = newState.ready.students[studentIndex];
            student.exitTime = new Date().toISOString();
            student.processing = false;
            
            // Move to completed and remove from ready
            newState.completed.students.push(student);
            newState.ready.students.splice(studentIndex, 1);
          }
        } else {
          // Find the visitor to move
          const visitorIndex = newState.ready.visitors.findIndex(v => v.phone === phone);
          if (visitorIndex !== -1) {
            const visitor = newState.ready.visitors[visitorIndex];
            visitor.exitTime = new Date().toISOString();
            visitor.processing = false;
            
            // Move to completed and remove from ready
            newState.completed.visitors.push(visitor);
            newState.ready.visitors.splice(visitorIndex, 1);
          }
        }
        
        return newState;
      });
      
      // Show success notification
      showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} exit confirmed`, "success");
    } catch (err) {
      console.error(`Error confirming ${type} exit:`, err);
      const errorMsg = err.response?.data?.message || `Failed to confirm ${type} exit.`;
      showNotification(errorMsg, "error");
      
      // Reset processing state on error
      setRequests(prev => {
        const newState = JSON.parse(JSON.stringify(prev));
        
        if (type === 'student') {
          const studentIndex = newState.ready.students.findIndex(s => s._id === id);
          if (studentIndex !== -1) {
            newState.ready.students[studentIndex].processing = false;
          }
        } else {
          const visitorIndex = newState.ready.visitors.findIndex(v => v.phone === phone);
          if (visitorIndex !== -1) {
            newState.ready.visitors[visitorIndex].processing = false;
          }
        }
        
        return newState;
      });
    }
  };

  // Simple notification function (could be replaced with a toast library)
  const showNotification = (message, type) => {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.classList.add('show');
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => document.body.removeChild(notification), 300);
      }, 3000);
    }, 10);
  };

  // Calculate counts for each section
  const pendingCount = requests.pending.visitors.length + requests.pending.students.length;
  const readyCount = requests.ready.visitors.length + requests.ready.students.length;
  const completedCount = requests.completed.visitors.length + requests.completed.students.length;

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Guard Dashboard</h1>
        {lastUpdated && (
          <div className="last-updated">
            Last updated: {lastUpdated.toLocaleTimeString()}
            <button className="refresh-button" onClick={fetchAllRequests} disabled={loading}>
              ↻
            </button>
          </div>
        )}
      </header>

      {loading && <div className="loading-overlay">Loading...</div>}
      {error && <div className="error-alert">{error}</div>}

      <div className="dashboard-content">
        {/* Pending Section */}
        <Section 
          title="Pending Faculty Approval" 
          icon="⏳" 
          count={pendingCount}
          color="warning"
          description="Requests waiting for faculty approval before exit"
          emptyMessage="No requests pending faculty approval"
        >
          <CardGrid>
            {requests.pending.visitors.map(visitor => (
              <RequestCard 
                key={`visitor-${visitor.phone}`}
                person={visitor} 
                type="visitor" 
                status="pending" 
              />
            ))}
            {requests.pending.students.map(student => (
              <RequestCard 
                key={`student-${student._id}`}
                person={student} 
                type="student" 
                status="pending" 
              />
            ))}
          </CardGrid>
        </Section>

        {/* Ready Section */}
        <Section 
          title="Awaiting Exit Confirmation" 
          icon="⌛" 
          count={readyCount}
          color="info"
          description="These visitors/students are ready to exit. Confirm their exit at the gate."
          emptyMessage="No exit confirmations pending"
        >
          <CardGrid>
            {requests.ready.visitors.map(visitor => (
              <RequestCard 
                key={`visitor-${visitor.phone}`}
                person={visitor} 
                type="visitor" 
                status="ready"
                onConfirm={handleConfirmExit}
              />
            ))}
            {requests.ready.students.map(student => (
              <RequestCard 
                key={`student-${student._id}`}
                person={student} 
                type="student" 
                status="ready"
                onConfirm={handleConfirmExit}
              />
            ))}
          </CardGrid>
        </Section>

        {/* Completed Section */}
        <Section 
          title="Completed Today" 
          icon="✓" 
          count={completedCount}
          color="success"
          description="All entries that have exited today. No action needed."
          emptyMessage="No exits completed today"
        >
          <CardGrid>
            {requests.completed.visitors.map(visitor => (
              <RequestCard 
                key={`visitor-${visitor.phone}`}
                person={visitor} 
                type="visitor" 
                status="completed"
              />
            ))}
            {requests.completed.students.map(student => (
              <RequestCard 
                key={`student-${student._id}`}
                person={student} 
                type="student" 
                status="completed"
              />
            ))}
          </CardGrid>
        </Section>
      </div>
    </div>
  );
};

// Memoized components to prevent unnecessary re-renders
const Section = memo(({ title, icon, count, color, description, emptyMessage, children }) => (
  <section className={`dashboard-section ${color}`}>
    <div className="section-header">
      <div className="section-title">
        <span className="section-icon">{icon}</span>
        <h2>{title}</h2>
        <span className="section-count">{count}</span>
      </div>
      <p className="section-description">{description}</p>
    </div>
    <div className="section-content">
      {count === 0 ? (
        <div className="empty-state">{emptyMessage}</div>
      ) : children}
    </div>
  </section>
));

const CardGrid = memo(({ children }) => (
  <div className="card-grid">{children}</div>
));

const RequestCard = memo(({ person, type, status, onConfirm }) => {
  const isVisitor = type === 'visitor';
  const icon = isVisitor ? '👤' : '🎓';
  const isProcessing = person.processing;
  
  return (
    <div className={`request-card ${status} ${isProcessing ? 'processing' : ''}`}>
      <div className="card-header">
        <div className="person-info">
          <span className="person-icon">{icon}</span>
          <h3 className="person-name">{person.name}</h3>
        </div>
        <span className={`status-badge ${status}`}>
          {status === 'pending' ? 'Awaiting Faculty' : 
           status === 'ready' ? 'Ready for Exit' : 'Completed'}
        </span>
      </div>
      <div className="card-body">
        <p className="person-detail">
          {isVisitor ? `Phone: ${person.phone}` : `ID: ${person.studentId}`}
        </p>
        <p className="purpose">Purpose: {person.purpose}</p>
        <p className="timestamp entry-time">
          Entry: {new Date(person.entryTime).toLocaleString()}
        </p>
        {person.exitTime && (
          <p className="timestamp exit-time">
            Exit: {new Date(person.exitTime).toLocaleString()}
          </p>
        )}
      </div>
      {status === 'ready' && (
        <div className="card-actions">
          <button 
            className={`confirm-button ${isProcessing ? 'processing' : ''}`} 
            onClick={() => onConfirm(person._id, type, isVisitor ? person.phone : null)}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Confirm Exit'}
          </button>
        </div>
      )}
    </div>
  );
});

export default Dashboard;