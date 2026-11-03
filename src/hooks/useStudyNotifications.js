// ============================================================
// useStudyNotifications.js
//
// What this hook does:
//
//  ON LOAD (immediately when the schedule is opened):
//    • Pushes an in-app "Today's sessions" summary notification
//      to the bell so the student sees something straight away.
//    • If a session is currently in progress right now, pushes
//      an "in progress" alert immediately.
//    • If a session already passed today, pushes a "missed" notice.
//
//  TIMED (setTimeout for future events today only):
//    • 30 min before a session that hasn't started yet → reminder
//    • Exactly at session start time → start alert
//    • Only schedules timers for TODAY's sessions (dayOffset === 0)
//      because timers for future days would never fire in practice
//      (user closes the tab).
//
//  BROWSER (OS popup):
//    • Fires alongside each timed in-app notification if the user
//      granted browser notification permission.
// ============================================================

import { useEffect, useRef } from 'react';
import { pushNotification }  from '../components/NotificationBell.jsx';
import { formatTime12h }     from '../utils/timeFormat.js';

// ── Pure helpers ──────────────────────────────────────────────

/** Converts "HH:MM" + a day offset to a Date for that day. */
function buildSessionDate(timeStr, dayOffset = 0) {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(h, m, 0, 0);
  return d;
}

/** ms until a future date, or null if already past. */
function msUntil(date) {
  const diff = date.getTime() - Date.now();
  return diff > 0 ? diff : null;
}

/** Fire an OS browser notification if permission is granted. */
function fireBrowser(title, body) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  try { new Notification(title, { body }); }
  catch (e) { console.warn('Browser notification error:', e); }
}

// ── Message builders ──────────────────────────────────────────

function msgReminder(course, startTime, pages) {
  return `Your "${course}" session (pages ${pages}) starts at ${formatTime12h(startTime)} — 30 minutes to go. Get ready! 💪`;
}

function msgStart(course, pages) {
  const opts = [
    `It's time to study! Open pages ${pages} of "${course}" and let's go. 🚀`,
    `Your "${course}" session is starting now — tackle pages ${pages}. You've got this! 📖`,
    `Focus mode ON. Work through pages ${pages} of "${course}" right now. 🎯`,
  ];
  return opts[Math.floor(Math.random() * opts.length)];
}

function msgInProgress(course, startTime, endTime, pages) {
  return `Your "${course}" session (pages ${pages}) is running right now: ${formatTime12h(startTime)} – ${formatTime12h(endTime)}. Don't miss it!`;
}

function msgMissed(course, startTime, pages) {
  return `You missed the "${course}" session at ${formatTime12h(startTime)} (pages ${pages}). Consider rescheduling it.`;
}

// ── Hook ──────────────────────────────────────────────────────

function useStudyNotifications(schedule, userId) {
  const timerIds    = useRef([]);
  const alreadyRan  = useRef(null); // track last scheduleId to avoid double-running

  useEffect(() => {
    // Clear any old timers
    timerIds.current.forEach(clearTimeout);
    timerIds.current = [];

    if (!schedule?.tasks?.length || !userId) return;
    // Don't re-run for the exact same schedule load
    if (alreadyRan.current === schedule.id) return;
    alreadyRan.current = schedule.id;

    // Request browser permission upfront
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const now          = new Date();
    const pendingTasks = schedule.tasks.filter((t) => !t.completed);

    // ── Separate today's tasks from future tasks ──────────────
    // "Today" = dayOffset 0, i.e. task.day === the earliest day
    // that hasn't been completed yet, treated as today.
    // More reliably: we treat task.day === 1 as today for a
    // fresh schedule; but for older schedules we find the min
    // incomplete day and treat that as today.
    const days         = pendingTasks.map((t) => t.day);
    if (days.length === 0) return;
    const todayDayNum  = Math.min(...days);
    const todayTasks   = pendingTasks.filter((t) => t.day === todayDayNum);
    const futureTasks  = pendingTasks.filter((t) => t.day >  todayDayNum);

    // ── Immediate summary: push "here's what's on today" ──────
    if (todayTasks.length > 0) {
      const sessionList = todayTasks
        .map((t) => `${formatTime12h(t.startTime)}–${formatTime12h(t.endTime)} (pp. ${t.pageStart}–${t.pageEnd})`)
        .join(',  ');

      pushNotification(userId, {
        title: `📅 Today's study plan — ${schedule.course}`,
        body:  `You have ${todayTasks.length} session${todayTasks.length > 1 ? 's' : ''} today: ${sessionList}`,
        type:  'info',
      });
    }

    // ── Per-task logic for TODAY's tasks ──────────────────────
    todayTasks.forEach((task) => {
      const pages        = `${task.pageStart}–${task.pageEnd}`;
      const sessionStart = buildSessionDate(task.startTime, 0);
      const sessionEnd   = buildSessionDate(task.endTime,   0);

      // Handle end-time crossing midnight (e.g. 23:30 – 00:30)
      if (sessionEnd <= sessionStart) sessionEnd.setDate(sessionEnd.getDate() + 1);

      const isInProgress = now >= sessionStart && now < sessionEnd;
      const isMissed     = now >= sessionEnd;
      const isUpcoming   = now < sessionStart;

      if (isInProgress) {
        // Session is happening right now — push immediately
        const title = `🟢 Session in progress — ${schedule.course}`;
        const body  = msgInProgress(schedule.course, task.startTime, task.endTime, pages);
        pushNotification(userId, { title, body, type: 'success' });
        fireBrowser(title, body);

      } else if (isMissed) {
        // Session passed without being completed
        const title = `⚠️ Missed session — ${schedule.course}`;
        const body  = msgMissed(schedule.course, task.startTime, pages);
        pushNotification(userId, { title, body, type: 'warning' });

      } else if (isUpcoming) {
        // ── 30-min reminder ──
        const thirtyBefore = new Date(sessionStart.getTime() - 30 * 60 * 1000);
        const ms30          = msUntil(thirtyBefore);

        if (ms30 !== null) {
          const title = `⏰ ${schedule.course} — session in 30 minutes`;
          const body  = msgReminder(schedule.course, task.startTime, pages);
          timerIds.current.push(setTimeout(() => {
            fireBrowser(title, body);
            pushNotification(userId, { title, body, type: 'reminder' });
          }, ms30));
        }

        // ── Start alert ──
        const msStart = msUntil(sessionStart);
        if (msStart !== null) {
          const title = `📖 Time to study — ${schedule.course}`;
          const body  = msgStart(schedule.course, pages);
          timerIds.current.push(setTimeout(() => {
            fireBrowser(title, body);
            pushNotification(userId, { title, body, type: 'success' });
          }, msStart));
        }
      }
    });

    // ── Future days: just push a brief heads-up once ──────────
    if (futureTasks.length > 0) {
      const futureDays = [...new Set(futureTasks.map((t) => t.day))].sort((a, b) => a - b);
      const nextDay    = futureDays[0];
      const nextTasks  = futureTasks.filter((t) => t.day === nextDay);
      const daysAway   = nextDay - todayDayNum;

      pushNotification(userId, {
        title: `📆 Coming up — Day ${nextDay} of ${schedule.course}`,
        body:  `${nextTasks.length} session${nextTasks.length > 1 ? 's' : ''} in ${daysAway} day${daysAway > 1 ? 's' : ''}. Keep up the great work!`,
        type:  'info',
      });
    }

    return () => {
      timerIds.current.forEach(clearTimeout);
      timerIds.current = [];
    };
  }, [schedule, userId]);
}

export default useStudyNotifications;
