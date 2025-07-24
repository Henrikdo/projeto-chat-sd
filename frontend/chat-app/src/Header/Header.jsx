import { Link } from "react-router-dom";
import "./Header.css";

function Header() {
  return (
    <header className="main-header">
      <nav className="nav">
        <h2 className="logo">💬 ChatApp</h2>
        <ul className="nav-links">
          <li><Link to="/">🏠 Home</Link></li>
          <li><Link to="/user">👤 User</Link></li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
