import { Link } from 'react-router-dom';

function GuardPanel() {
  return (
    <div className="container">
      <h2>Guard Panel</h2>
      <nav className="panel-nav">
        <Link to="/guard/dashboard" className="panel-link">Guard Dashboard</Link>
        <Link to="/guard/scanner" className="panel-link">QR Scanner</Link>
      </nav>
    </div>
  );
}

export default GuardPanel;
