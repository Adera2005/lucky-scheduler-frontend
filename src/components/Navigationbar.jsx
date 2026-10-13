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

       <div className="navigation-title">
  <img
    src={groundBreaking}
    alt="Lucky Scheduler logo"
    className="navigation-logo"
  />

  <span className="font">Lucky Scheduler</span>
</div>

      </div>

      <button onClick={logout} className="logout-button">
        Logout
      </button>

    </nav>
  );
}

export default Navigationbar;