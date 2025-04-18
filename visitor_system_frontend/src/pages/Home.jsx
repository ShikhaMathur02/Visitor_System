import { Link } from 'react-router-dom';

function Home() {
  return (
    <div className="container">
      <h1>Welcome to Visitor Management System</h1>
      <nav>
        <Link to="/entry">Visitor Entry</Link> | 
        <Link to="/guard">Guard Panel</Link> | 
        <Link to="/faculty">Faculty Panel</Link>
      </nav>
    </div>
  );
}

export default Home;
