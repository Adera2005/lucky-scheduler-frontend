// ============================================================
// Navigationbar.jsx  (updated)
// Added:
//   • Per-user notification bell (NotificationBell component)
//   • Dark / light mode toggle button
//   • Shadow effect on all nav action buttons
//   • Dark mode awareness via ThemeContext
// ============================================================

import { useNavigate }      from 'react-router-dom';
import '../styling/Navigation.css';
import groundBreaking       from '../assets/groundbreaker-svgrepo-com.svg';
import NotificationBell     from './NotificationBell.jsx';
import { useTheme }         from '../context/ThemeContext.jsx';
import { getUserId }        from '../utils/auth.js';

function Navigationbar({ onMenuClick, isOpen }) {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();

  const userId = getUserId();

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('name');
    localStorage.removeItem('userId');
    navigate('/');
  };

  return (
    <nav className="navigationbar">

      {/* ── Left: hamburger toggle ── */}
      <div onClick={onMenuClick} className="menu-button" role="button" aria-label="Toggle menu" tabIndex={0}>
        <span className={`hamburger ${isOpen ? 'hidden' : ''}`}>☰</span>
        <span className={`close-icon ${isOpen ? 'visible' : ''}`}>✕</span>
      </div>

      {/* ── Centre: logo + app name (absolutely centred) ── */}
      <div className="navigation-centre">
        <img
          src={groundBreaking}
          alt="Lucky Scheduler logo"
          className="navigation-logo"
        />
        <span className="navigation-app-name">Lucky Scheduler</span>
      </div>

      {/* ── Right: notification bell + theme toggle + logout ── */}
      <div className="nav-right-group">

        {/* Notification bell */}
        <NotificationBell userId={userId} />

        {/* Dark / light mode toggle */}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        {/* Logout */}
        <button onClick={logout} className="logout-button">
          Logout
        </button>

      </div>
    </nav>
  );
}

export default Navigationbar;
