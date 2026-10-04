import { Link } from "react-router-dom";
import "../styling/Sidebar.css";
import dashboardIcon from '../assets/dashboard-alt-svgrepo-com.svg';
import scheduleIcon from '../assets/note-edit-svgrepo-com.svg';

function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose}></div>
      )}

      <nav className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
        <Link to="/dashboard" onClick={onClose}>
          <img src={dashboardIcon} alt="Dashboard Icon"  height="20px" width="20px"/>
          Dashboard
        </Link>

        <Link to="/create-schedule" onClick={onClose}>
          <img src={scheduleIcon} alt="Schedule Icon"  height="25px" width="25px"/>
          Create Schedule
        </Link>

        <Link to="/assistant" onClick={onClose}>
          🤖 Study Assistant
        </Link>
      </nav>
    </>
  );
}

export default Sidebar;