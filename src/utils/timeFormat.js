// ============================================================
// timeFormat.js
// Utility functions for formatting time strings.
// Plain JS — no dependencies.
// ============================================================

/**
 * Converts a 24-hour "HH:MM" string to a 12-hour "h:MM AM/PM" string.
 *
 * @param {string} timeStr  e.g. "09:30" or "14:00"
 * @returns {string}        e.g. "9:30 AM" or "2:00 PM"
 */
export function formatTime12h(timeStr) {
  if (!timeStr) return timeStr;

  const [hourStr, minuteStr] = timeStr.split(':');
  let hour   = parseInt(hourStr, 10);
  const min  = minuteStr || '00';
  const ampm = hour >= 12 ? 'PM' : 'AM';

  // Convert 0 → 12 (midnight), 13–23 → 1–11
  hour = hour % 12;
  if (hour === 0) hour = 12;

  return `${hour}:${min} ${ampm}`;
}

/**
 * Formats a time range from two 24-hour strings.
 *
 * @param {string} startTime  e.g. "09:00"
 * @param {string} endTime    e.g. "11:00"
 * @returns {string}          e.g. "9:00 AM – 11:00 AM"
 */
export function formatTimeRange(startTime, endTime) {
  return `${formatTime12h(startTime)} – ${formatTime12h(endTime)}`;
}
