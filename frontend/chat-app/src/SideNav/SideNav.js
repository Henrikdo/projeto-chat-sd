import { Link } from "react-router-dom";
import { Home, User } from "lucide-react";
import "./SideNav.css";

function SideNav() {
  return (
    <aside className="side-nav">
      <h2 className="logo">💬 ChatApp</h2>
      <nav className="nav-links">
        <ul>
          <li>
            <Link to="/">
              <Home size={18} style={{ marginRight: "8px" }} />
              Home
            </Link>
          </li>
          <li>
            <Link to="/user">
              <User size={18} style={{ marginRight: "8px" }} />
              User
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

export default SideNav;
