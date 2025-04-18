import { Link } from 'react-router-dom';

function FacultyPanel() {
  return (
    <div className="container">
      <h2>Faculty Panel</h2>
      <nav>
        <Link to="/faculty/dashboard">Faculty Dashboard</Link>
      </nav>
    </div>
  );
}

export default FacultyPanel;
