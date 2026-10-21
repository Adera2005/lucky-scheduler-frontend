// ============================================================
// useStudyNotifications.js
// Custom React hook — requests browser notification permission
// and schedules two notifications for every study session:
//   1. A "30 minutes to go" reminder before the session starts.
//   2. A "Time to study!" alert exactly when the session begins.
//
// Usage:
//   import useStudyNotifications from '../hooks/useStudyNotifications';
//   // Inside your component:
//   useStudyNotifications(schedule);   // pass the schedule object
// ============================================================

import { useEffect, useRef } from 'react';

/**
 * Parses a "HH:MM" time string and a day offset into a Date object
 * representing that time today (or on a future day if dayOffset > 0).
 *
 * @param {string} timeStr  - e.g. "09:30"
 * @param {number} dayOffset - number of days from today (0 = today)
 * @returns {Date}
 */
function buildSessionDate(timeStr, dayOffset = 0) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setDate(date.getDate() + dayOffset);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

/**
 * Returns the number of milliseconds until a future Date.
 * Returns null if the date is already in the past.
 *
 * @param {Date} targetDate
 * @returns {number|null}
 */
function msUntil(targetDate) {
  const diff = targetDate.getTime() - Date.now();
  return diff > 0 ? diff : null;
}

/**
 * Fires a browser notification if the Notifications API is supported
 * and permission has been granted.
 *
 * @param {string} title   - Notification title
 * @param {string} body    - Notification body text
 * @param {string} [icon]  - Optional icon URL
 */
function fireNotification(title, body, icon) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  try {
    new Notification(title, { body, icon });
  } catch (err) {
    console.warn('Notification failed:', err);
  }
}

/**
 * useStudyNotifications
 *
 * Schedules browser notifications for all pending study sessions
 * found in the provided schedule object.
 *
 * Two notifications per session:
 *   • 30 minutes before startTime  → "⏰ Study session in 30 minutes!"
 *   • Exactly at startTime         → "📖 Time to start reading!"
 *
 * Timers are cleared automatically when the component unmounts.
 *
 * @param {object|null} schedule - The schedule object from the API
 */
function useStudyNotifications(schedule) {
  // Store all active timer IDs so we can clear them on unmount / re-run
  const timerIds = useRef([]);

  useEffect(() => {
    // Clear any previously registered timers before setting new ones
    timerIds.current.forEach(clearTimeout);
    timerIds.current = [];

    // Nothing to do if no schedule is loaded yet
    if (!schedule || !schedule.tasks || schedule.tasks.length === 0) return;

    // Request permission if we don't already have it
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Work out which tasks are still pending (not completed)
    const pendingTasks = schedule.tasks.filter((t) => !t.completed);

    pendingTasks.forEach((task) => {
      // task.day is 1-based; day 1 = today, day 2 = tomorrow, etc.
      const dayOffset = task.day - 1;

      // ── Notification 1: 30 minutes before the session ──
      const sessionStart = buildSessionDate(task.startTime, dayOffset);
      const thirtyMinsBefore = new Date(sessionStart.getTime() - 30 * 60 * 1000);
      const msTo30 = msUntil(thirtyMinsBefore);

      if (msTo30 !== null) {
        const id30 = setTimeout(() => {
          fireNotification(
            '⏰ Study session in 30 minutes!',
            `Get ready — your ${schedule.course} session (pages ${task.pageStart}–${task.pageEnd}) starts at ${task.startTime}.`
          );
        }, msTo30);
        timerIds.current.push(id30);
      }

      // ── Notification 2: Exactly at the session start time ──
      const msToStart = msUntil(sessionStart);

      if (msToStart !== null) {
        const idStart = setTimeout(() => {
          fireNotification(
            '📖 Time to start reading!',
            `Your ${schedule.course} session has started. Study pages ${task.pageStart}–${task.pageEnd} now.`
          );
        }, msToStart);
        timerIds.current.push(idStart);
      }
    });

    // Cleanup: cancel all scheduled timers when the component unmounts
    // or when the schedule changes.
    return () => {
      timerIds.current.forEach(clearTimeout);
      timerIds.current = [];
    };
  }, [schedule]);
}

export default useStudyNotifications;
