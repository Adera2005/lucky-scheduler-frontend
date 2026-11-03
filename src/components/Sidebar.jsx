import { Link, useLocation } from "react-router-dom";
import "../styling/Sidebar.css";
import dashboardIcon    from '../assets/dashboard-alt-svgrepo-com.svg';
import createIcon       from '../assets/note-edit-svgrepo-com.svg';
import viewIcon         from '../assets/clipboard-list-svgrepo-com (1).svg';

/* ─────────────────────────────────────────────────────────────
   Sidebar.jsx  (redesigned)
   Modern ChatGPT-style slide-in drawer:
   • Dark background panel with icon + label per nav item
   • Active page highlighted with a bright accent bar
   • Hover: item lifts slightly + changes colour
   • "Study Assistant" link removed as requested
   ───────────────────────────────────────────────────────────── */

const NAV_ITEMS = [
  {
    to:    '/dashboard',
    icon:  dashboardIcon,
    alt:   'Dashboard',
    label: 'Dashboard',
  },
  {
    to:    '/create-schedule',
    icon:  createIcon,
    alt:   'Create Schedule',
    label: 'Create Schedule',
  },
  {
    to:    '/view-schedules',
    icon:  viewIcon,
    alt:   'View Schedules',
    label: 'View Schedules',
  },
];

function Sidebar({ isOpen, onClose }) {
  // useLocation lets us highlight the currently active nav item
  const { pathname } = useLocation();

  return (
    <>
      {/* Semi-transparent backdrop — click to close */}
      {isOpen && (
        <div className="sidebar-overlay" onClick={onClose} />
      )}

      <nav className={`sidebar ${isOpen ? 'sidebar-open' : ''}`}>

        {/* ── Branding at the top of the drawer ── */}
        <div className="sidebar-brand">
          <span className="sidebar-brand-text">Navigation</span>
        </div>

        {/* ── Divider ── */}
        <div className="sidebar-divider" />

        {/* ── Nav items ── */}
        <ul className="sidebar-nav-list">
          {NAV_ITEMS.map(({ to, icon, alt, label }) => {
            const isActive = pathname === to;
            return (
              <li key={to}>
                <Link
                  to={to}
                  onClick={onClose}
                  className={`sidebar-nav-item ${isActive ? 'sidebar-nav-item--active' : ''}`}
                >
                  {/* Coloured accent bar on the left edge when active */}
                  {isActive && <span className="sidebar-active-bar" />}

                  {/* Icon */}
                  <img
                    src={icon}
                    alt={alt}
                    className="sidebar-nav-icon"
                  />

                  {/* Label */}
                  <span className="sidebar-nav-label">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* ── Footer spacer / version note ── */}
        <div className="sidebar-footer">
          <span>Lucky Scheduler</span>
        </div>

      </nav>
    </>
  );
}

export default Sidebar;
