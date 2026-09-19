import { Link } from "react-router-dom";

function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {isOpen && (
        <div onClick={onClose} style={{
          position: "fixed", top: 0, left: 0,
          width: "100%", height: "100%",
          background: "rgba(0,0,0,0.5)",
          zIndex: 998,
        }} />
      )}
      <nav style={{
        background: "#16213e",
        position: "fixed",
        top: 0,
        left: isOpen ? '0' : '-250px',
        width: '250px',
        height: '100%',
        padding: '70px 20px 20px',
        transition: 'left 0.3s ease',
        zIndex: 999,
        boxSizing: "border-box",
        boxShadow: isOpen ? "2px 0 10px rgba(0,0,0,0.3)" : "none",
      }}>
        <Link to='/dashboard' onClick={onClose} style={{
          color: "white", display: "block",
          marginBottom: "20px", padding: "10px",
          borderRadius: "6px", textDecoration: "none",
          fontSize: "16px",
        }}>
          📊 Dashboard
        </Link>
        <Link to='/create-schedule' onClick={onClose} style={{
          color: "white", display: "block",
          marginBottom: "20px", padding: "10px",
          borderRadius: "6px", textDecoration: "none",
          fontSize: "16px",
        }}>
          📅 Create Schedule
        </Link>
        <Link to='/assistant' onClick={onClose} style={{
          color: "white", display: "block",
          marginBottom: "20px", padding: "10px",
          borderRadius: "6px", textDecoration: "none",
          fontSize: "16px",
        }}>
          🤖 Study Assistant
        </Link>
      </nav>
    </>
  );
}

export default Sidebar;