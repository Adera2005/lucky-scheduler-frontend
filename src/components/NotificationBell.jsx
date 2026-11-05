// ============================================================
// NotificationBell.jsx
// Per-user notification bell — reads from the database API,
// NOT from localStorage, so notifications are fully isolated
// per student even on shared devices.
//
// Exported helper:
//   pushNotification(userId, { title, body, type })
//   → POSTs to /api/notifications and fires the custom event
//     'notifications-updated' so all mounted bells refresh.
// ============================================================

import { useState, useEffect, useRef } from 'react';
import '../styling/NotificationBell.css';
import api from '../services/api.js';

// ── Public helper — used by useStudyNotifications hook ────

export async function pushNotification(_userId, { title, body, type = 'info' }) {
  // _userId is unused now — the API authenticates via JWT
  try {
    await api.post('/api/notifications', { title, body, type });
    window.dispatchEvent(new Event('notifications-updated'));
  } catch (err) {
    // Non-fatal — if the API is down, silently skip
    console.warn('pushNotification failed:', err.message);
  }
}

// ── Icon per notification type ─────────────────────────────
const TYPE_ICON = {
  reminder: '⏰',
  success:  '✅',
  warning:  '⚠️',
  info:     '📌',
};

// ── Component ──────────────────────────────────────────────
function NotificationBell() {
  const [open,          setOpen]          = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadError,     setLoadError]     = useState(false);
  const panelRef = useRef(null);

  // ── Load from API ──────────────────────────────────────────
  const load = async () => {
    try {
      const res = await api.get('/api/notifications');
      setNotifications(res.data.data.notifications || []);
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  };

  useEffect(() => {
    load();
    window.addEventListener('notifications-updated', load);
    return () => window.removeEventListener('notifications-updated', load);
  }, []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const unread = notifications.filter((n) => !n.read).length;

  // ── Actions ────────────────────────────────────────────────

  const handleOpen = () => {
    const nowOpen = !open;
    setOpen(nowOpen);
    if (nowOpen && unread > 0) markAllRead();
  };

  const markAllRead = async () => {
    try {
      await api.patch('/api/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch { /* silent */ }
  };

  const markOneRead = async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, read: true } : n)
      );
    } catch { /* silent */ }
  };

  const deleteOne = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/api/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch { /* silent */ }
  };

  const clearAll = async () => {
    try {
      await api.delete('/api/notifications');
      setNotifications([]);
    } catch { /* silent */ }
  };

  const formatTime = (iso) => {
    const d       = new Date(iso);
    const diffMs  = Date.now() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1)  return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return d.toLocaleDateString();
  };

  // ── Render ─────────────────────────────────────────────────
  return (
    <div className="notif-bell-wrapper" ref={panelRef}>

      <button
        className="notif-bell-btn"
        onClick={handleOpen}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        title="Notifications"
      >
        <span className="notif-bell-icon">🔔</span>
        {unread > 0 && (
          <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && (
        <div className="notif-panel" role="dialog" aria-label="Notifications">

          <div className="notif-panel-header">
            <span className="notif-panel-title">Notifications</span>
            {notifications.length > 0 && (
              <button className="notif-action-btn" onClick={clearAll}>
                Clear all
              </button>
            )}
          </div>

          <div className="notif-list">
            {loadError ? (
              <div className="notif-empty">
                <span className="notif-empty-icon">⚠️</span>
                <p>Could not load notifications.</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty">
                <span className="notif-empty-icon">🔕</span>
                <p>No notifications yet</p>
                <p className="notif-empty-hint">
                  Study reminders and session alerts will appear here.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notif-item ${n.read ? 'notif-item--read' : 'notif-item--unread'}`}
                  onClick={() => !n.read && markOneRead(n.id)}
                >
                  <span className="notif-item-icon">{TYPE_ICON[n.type] || '📌'}</span>
                  <div className="notif-item-content">
                    <p className="notif-item-title">{n.title}</p>
                    <p className="notif-item-body">{n.body}</p>
                    <span className="notif-item-time">{formatTime(n.createdAt)}</span>
                  </div>
                  <button
                    className="notif-item-delete"
                    onClick={(e) => deleteOne(e, n.id)}
                    aria-label="Dismiss"
                    title="Dismiss"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>

        </div>
      )}
    </div>
  );
}

export default NotificationBell;
