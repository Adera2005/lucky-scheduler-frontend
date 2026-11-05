// ============================================================
// useStudyNotifications.js
//
// Fires ONE summary notification per schedule per calendar day.
// A localStorage flag "notif_seen_<scheduleId>_<YYYY-MM-DD>"
// prevents re-firing when the user navigates back to the same
// schedule page later that day.
//
// What the single daily notification contains:
//   • Summary of today's pending sessions (count + times)
//   • If a session is already in progress → flags that too
//   • If a session was missed → flags that too
//
// Timed alerts for upcoming sessions:
//   ⏰ 30-minute in-app bell + OS popup (guarded by localStorage flag)
//   📖 Session-start in-app bell + OS popup (guarded by localStorage flag)
// ============================================================

import { useEffect, useRef } from 'react';
import { pushNotification }  from '../components/NotificationBell.jsx';
import { formatTime12h }     from '../utils/timeFormat.js';

// ── Helpers ───────────────────────────────────────────────────

function buildSessionDate(timeStr, dayOffset = 0) {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return d;
}

function msUntil(date) {
  const diff = date.getTime() - Date.now();
  return diff > 0 ? diff : null;
}

function fireBrowser(title, body) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try { new Notification(title, { body }); } catch { /* silent */ }
}

// Returns "YYYY-MM-DD" for today — used as part of the seen-flag key
function todayDateString() {
  return new Date().toISOString().slice(0, 10);
}

// ── Hook ──────────────────────────────────────────────────────

function useStudyNotifications(schedule, userId) {
  const timerIds = useRef([]);

  useEffect(() => {
    // Clear old timers from a previous schedule load
    timerIds.current.forEach(clearTimeout);
    timerIds.current = [];

    if (!schedule?.tasks?.length) return;

    // ── Guard: only fire once per schedule per calendar day ──
    const today      = todayDateString();
    const seenKey    = `notif_seen_${schedule.id}_${today}`;
    const alreadySeen = localStorage.getItem(seenKey) === '1';

    // Request browser permission regardless of the seen flag
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // ── Find today's tasks ─────────────────────────────────────
    // "Today" = the earliest incomplete day number in this schedule.
    const pendingTasks = schedule.tasks.filter((t) => !t.completed);
    if (pendingTasks.length === 0) return;

    const todayDayNum = Math.min(...pendingTasks.map((t) => t.day));
    const todayTasks  = pendingTasks.filter((t) => t.day === todayDayNum);
    if (todayTasks.length === 0) return;

    const now = new Date();

    // Categorise each of today's tasks
    const upcoming   = [];
    const inProgress = [];
    const missed     = [];

    todayTasks.forEach((task) => {
      const start = buildSessionDate(task.startTime, 0);
      const end   = buildSessionDate(task.endTime,   0);
      if (end <= start) end.setDate(end.getDate() + 1); // past midnight

      if (now < start)                 upcoming.push(task);
      else if (now >= start && now < end) inProgress.push(task);
      else                             missed.push(task);
    });

    // ── ONE summary notification (only if not seen today) ─────
    if (!alreadySeen) {
      localStorage.setItem(seenKey, '1');

      const lines = [];

      if (upcoming.length > 0) {
        const timeList = upcoming
          .map((t) => `${formatTime12h(t.startTime)}–${formatTime12h(t.endTime)}`)
          .join(', ');
        lines.push(`📅 ${upcoming.length} upcoming: ${timeList}`);
      }

      if (inProgress.length > 0) {
        const t = inProgress[0];
        lines.push(`🟢 In progress now: ${formatTime12h(t.startTime)}–${formatTime12h(t.endTime)} (pp. ${t.pageStart}–${t.pageEnd})`);
      }

      if (missed.length > 0) {
        const timeList = missed
          .map((t) => formatTime12h(t.startTime))
          .join(', ');
        lines.push(`⚠️ Missed: ${timeList} — consider rescheduling`);
      }

      const body = lines.join('\n');

      pushNotification(userId, {
        title: `📋 Today's plan — ${schedule.course}`,
        body,
        type: inProgress.length > 0 ? 'success' : missed.length > 0 ? 'warning' : 'info',
      });

      // Also fire a browser popup for the summary
      fireBrowser(`Today's study plan — ${schedule.course}`, body);
    }

    // ── Timed alerts for upcoming sessions ───────────────────
    // Both the 30-minute reminder AND the session-start alert are
    // pushed into the in-app bell AND fired as browser popups.
    // localStorage flags stop duplicate pushes if the page is
    // reloaded while the tab is still open.
    upcoming.forEach((task) => {
      const pages     = `${task.pageStart}–${task.pageEnd}`;
      const start     = buildSessionDate(task.startTime, 0);
      const taskKey   = `${schedule.id}_${task.id}_${today}`;

      // ── 30-minute in-app + OS reminder ──────────────────────
      const reminderKey = `notif_30min_${taskKey}`;
      const thirtyBefore = new Date(start.getTime() - 30 * 60 * 1000);
      const ms30 = msUntil(thirtyBefore);

      if (ms30 !== null && !localStorage.getItem(reminderKey)) {
        timerIds.current.push(setTimeout(() => {
          // Guard: don't fire if the user refreshed and the timer
          // already fired in a previous page-load session.
          if (localStorage.getItem(reminderKey)) return;
          localStorage.setItem(reminderKey, '1');

          const title30 = `⏰ ${schedule.course} — starts in 30 minutes`;
          const body30  = `Session at ${formatTime12h(task.startTime)}–${formatTime12h(task.endTime)}, pages ${pages}`;

          // Push to in-app notification bell
          pushNotification(userId, {
            title: title30,
            body:  body30,
            type:  'reminder',
          });

          // OS browser popup
          fireBrowser(title30, body30);
        }, ms30));
      }

      // ── Session-start in-app + OS alert ─────────────────────
      const startKey = `notif_start_${taskKey}`;
      const msStart  = msUntil(start);

      if (msStart !== null && !localStorage.getItem(startKey)) {
        timerIds.current.push(setTimeout(() => {
          if (localStorage.getItem(startKey)) return;
          localStorage.setItem(startKey, '1');

          const titleStart = `📖 Study time — ${schedule.course}`;
          const bodyStart  = `Your session has started! Pages ${pages} · ${formatTime12h(task.startTime)}–${formatTime12h(task.endTime)}`;

          // Push to in-app notification bell
          pushNotification(userId, {
            title: titleStart,
            body:  bodyStart,
            type:  'success',
          });

          // OS browser popup
          fireBrowser(titleStart, bodyStart);
        }, msStart));
      }
    });

    return () => {
      timerIds.current.forEach(clearTimeout);
      timerIds.current = [];
    };
  }, [schedule?.id]); // only re-run when a different schedule is loaded
}

export default useStudyNotifications;
