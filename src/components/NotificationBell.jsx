// ============================================================
// NotificationBell.jsx
// Per-user notification bell component.
// Reads notifications from localStorage keyed by userId so
// every student has their own independent notification list.
//
// Notifications are created here and also consumed/cleared here.
// External code can push a notification via the exported helper:
//   pushNotification(userId, { title, body, type })
// ============================================================

import { useState, useEffect, useRef } from 'react';
import '../styling/NotificationBell.css';

// ── Helpers ──────────────────────────────────────────────────

/**
 * Returns the localStorage key for a given user's notifications.
 */
export function notifKey(userId) {
  return `notifs_${userId}`;
}

/**
 * Push a notification into the user's notification list.
 * Can be called from any module (e.g. useStudyNotifications).
 *
 * @param {string|number} userId
 * @param {{ title: string, body: string, type?: string }} notification
 */
export function pushNotification(userId, { title, body, type = 'info' }) {
  if (!userId) return;
  const key = notifKey(userId);
  const existing = JSON.parse(localStorage.getItem(key) || '[]');
  const newNotif = {
    id:        Date.now() + Math.random(),
    title,
    body,
    type,       // 'info' | 'reminder' | 'success' | 'warning'
    read:       false,
    createdAt:  new Date().toISOString(),
  };
  localStorage.setItem(key, JSON.stringify([newNotif, ...existing].slice(0, 50)));
  // Dispatch a custom event so all mounted bells update immediately
  window.dispatchEvent(new Event('notifications-updated'));
}

// ── Type → emoji mapping ──────────────────────────────────────
const TYPE_ICON = {
  reminder: '⏰',
  success:  '✅',
  warning:  '⚠️',
  info:     '📌',
};

// ── Component ─────────────────────────────────────────────────
function NotificationBell({ userId }) {
  const [open,          setOpen]          = useState(false);
  const [notifications, setNotifications] = useState([]);
  const panelRef = useRef(null);

  // Load from localStorage
  const load = () => {
    if (!userId) return;
    const raw = localStorage.getItem(notifKey(userId));
    setNotifications(raw ? JSON.parse(raw) : []);
  };

  useEffect(() => {
    load();
    window.addEventListener('notifications-updated', load);
    return () => window.removeEventListener('notifications-updated', load);
  }, [userId]);

  // Close panel on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const unread = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    localStorage.setItem(notifKey(userId), JSON.stringify(updated));
    setNotifications(updated);
  };

  const clearAll = () => {
    localStorage.setItem(notifKey(userId), '[]');
    setNotifications([]);
  };

  const markRead = (id) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    localStorage.setItem(notifKey(userId), JSON.stringify(updated));
    setNotifications(updated);
  };

  const deleteOne = (id) => {
    const updated = notifications.filter((n) => n.id !== id);
    localStorage.setItem(notifKey(userId), JSON.stringify(updated));
    setNotifications(updated);
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1)  return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    if (diffHrs < 24)  return `${diffHrs}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="notif-bell-wrapper" ref={panelRef}>
      {/* Bell button */}
      <button
        className="notif-bell-btn"
        onClick={() => {
          setOpen((prev) => !prev);
          if (!open) markAllRead();
        }}
        aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ''}`}
        title="Notifications"
      >
        <span className="notif-bell-icon">🔔</span>
        {unread > 0 && (
          <span className="notif-badge" aria-live="polite">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="notif-panel" role="dialog" aria-label="Notifications">
          <div className="notif-panel-header">
            <span className="notif-panel-title">Notifications</span>
            <div className="notif-panel-actions">
              {notifications.length > 0 && (
                <button className="notif-action-btn" onClick={clearAll}>
                  Clear all
                </button>
              )}
            </div>
          </div>

          <div className="notif-list">
            {notifications.length === 0 ? (
              <div className="notif-empty">
                <span className="notif-empty-icon">🔕</span>
                <p>No notifications yet</p>
                <p className="notif-empty-hint">
                  You'll see study reminders and session alerts here.
                </p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`notif-item ${n.read ? 'notif-item--read' : 'notif-item--unread'}`}
                  onClick={() => markRead(n.id)}
                >
                  <span className="notif-item-icon">
                    {TYPE_ICON[n.type] || '📌'}
                  </span>
                  <div className="notif-item-content">
                    <p className="notif-item-title">{n.title}</p>
                    <p className="notif-item-body">{n.body}</p>
                    <span className="notif-item-time">{formatTime(n.createdAt)}</span>
                  </div>
                  <button
                    className="notif-item-delete"
                    onClick={(e) => { e.stopPropagation(); deleteOne(n.id); }}
                    aria-label="Dismiss notification"
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
