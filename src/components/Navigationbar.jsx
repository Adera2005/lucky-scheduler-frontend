import { useNavigate } from "react-router-dom";

function Navigationbar({ onMenuClick, isOpen }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    navigate('/');
  };

  return (
    <nav style={{
      background: "#1a1a2e",
      padding: "10px 20px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      position: "fixed",
      top: 0,
      width: "100%",
      zIndex: 1000,
      boxSizing: "border-box",
      boxShadow: "0 2px 10px rgba(0,0,0,0.3)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>

        <div onClick={onMenuClick} style={{ cursor: "pointer", width: "36px", height: "36px", position: "relative" }}>
          
          {/* Hamburger — fades out */}
          <span style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "white",
            fontSize: "28px",
            opacity: isOpen ? 0 : 1,
            transition: "opacity 0.3s ease",
            lineHeight: 1,
          }}>☰</span>

          {/* X — fades in */}
          <span style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "white",
            fontSize: "28px",
            opacity: isOpen ? 1 : 0,
            transition: "opacity 0.6s ease",
            lineHeight: 1,
          }}>✕</span>

        </div>

        <h2 style={{ color: "white", margin: 0, fontSize: "20px" }}>📚 Lucky Scheduler</h2>
      </div>

      <button onClick={logout} style={{
        background: "#e74c3c",
        color: "white",
        border: "none",
        padding: "10px 20px",
        cursor: "pointer",
        borderRadius: "6px",
        fontWeight: "bold",
        fontSize: "14px",
      }}>
        Logout
      </button>
    </nav>
  );
}

export default Navigationbar;