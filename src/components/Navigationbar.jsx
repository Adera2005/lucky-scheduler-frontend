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
        <div onClick={onMenuClick} style={{ cursor: "pointer", width: "24px", height: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <span style={{
            display: "block", height: "2px", background: "white", borderRadius: "2px",
            transform: isOpen ? "rotate(45deg) translateY(9px)" : "rotate(0)",
            transition: "all 0.3s ease"
          }}></span>
          <span style={{
            display: "block", height: "2px", background: "white", borderRadius: "2px",
            opacity: isOpen ? 0 : 1,
            transition: "all 0.3s ease"
          }}></span>
          <span style={{
            display: "block", height: "2px", background: "white", borderRadius: "2px",
            transform: isOpen ? "rotate(-45deg) translateY(-9px)" : "rotate(0)",
            transition: "all 0.3s ease"
          }}></span>
        </div>
        <h2 style={{ color: "white", margin: 0, fontSize: "18px" }}>📚 Lucky Scheduler</h2>
      </div>
      <button onClick={logout} style={{
        background: "#e74c3c",
        color: "white",
        border: "none",
        padding: "8px 16px",
        cursor: "pointer",
        borderRadius: "6px",
        fontWeight: "bold"
      }}>
        Logout
      </button>
    </nav>
  );
}

export default Navigationbar;