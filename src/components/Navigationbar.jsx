import { useNavigate } from "react-router-dom";
import "../styling/Navigation.css";
import groundBreaking from '../assets/groundbreaker-svgrepo-com.svg';

function Navigationbar({ onMenuClick, isOpen }) {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    navigate('/');
  };

  return (
    <nav className="navigationbar">

      {/* Left — hamburger toggle */}
      <div onClick={onMenuClick} className="menu-button">

        {/* Hamburger — fades out when sidebar opens */}
        <span className={`hamburger ${isOpen ? "hidden" : ""}`}>
          ☰
        </span>

        {/* X — fades in when sidebar opens */}
        <span className={`close-icon ${isOpen ? "visible" : ""}`}>
          ✕
        </span>

      </div>

      {/* Centre — logo + "Lucky Scheduler" title.
          Absolutely positioned so it stays perfectly centred
          no matter how wide the hamburger or logout button are. */}
      <div className="navigation-centre">
        <img
          src={groundBreaking}
          alt="Lucky Scheduler logo"
          className="navigation-logo"
        />
        <span className="navigation-app-name">Lucky Scheduler</span>
      </div>

      {/* Right — logout */}
      <button onClick={logout} className="logout-button">
        Logout
      </button>

    </nav>
  );
}

export default Navigationbar;
