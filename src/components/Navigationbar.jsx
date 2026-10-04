import { useNavigate } from "react-router-dom";
import "../styling/Navigation.css";
import groundBreaking from '../assets/groundbreaker-svgrepo-com.svg'

function Navigationbar({ onMenuClick, isOpen }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    navigate('/');
  };

  return (
    <nav className="navigationbar">

      <div className="navigation-left">

        <div
          onClick={onMenuClick}
          className="menu-button"
        >

          {/* Hamburger — fades out */}
          <span className={`hamburger ${isOpen ? "hidden" : ""}`}>
            ☰
          </span>

          {/* X — fades in */}
          <span className={`close-icon ${isOpen ? "visible" : ""}`}>
            ✕
          </span>

        </div>

        <h2 className="navigation-title">
          <img src={groundBreaking} alt="Ground breaking Image" height="30px" width="30px" />
          Lucky Scheduler
        </h2>

      </div>

      <button onClick={logout} className="logout-button">
        Logout
      </button>

    </nav>
  );
}

export default Navigationbar;