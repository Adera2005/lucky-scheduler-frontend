import { Link } from "react-router-dom";
import "../styling/Sidebar.css";

function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose}></div>
      )}

      <nav className={`sidebar ${isOpen ? "sidebar-open" : ""}`}>
        <Link to="/dashboard" onClick={onClose}>
          📊 Dashboard
        </Link>

        <Link to="/create-schedule" onClick={onClose}>
          📅 Create Schedule
        </Link>

        <Link to="/assistant" onClick={onClose}>
          🤖 Study Assistant
        </Link>
      </nav>
    </>
  );
}

export default Sidebar;