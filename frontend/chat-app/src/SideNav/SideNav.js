import { Link } from "react-router-dom";
import { Home, User } from "lucide-react";
import logo from "../assets/logo.svg";
import "./SideNav.css";

function SideNav() {
  return (
    <aside className="side-nav">
      <div style={ { display: "flex", alignItems: "center",marginBottom: "20px" } }>
        <img src={logo} style={{width: "50px", height: "50px"}} alt="Logo Chato" />
        <h1>Chato</h1>
      </div>
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
