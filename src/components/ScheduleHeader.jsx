// ============================================================
// ScheduleHeader.jsx
// The info/summary card at the top of the Schedule page.
// Shows course name, summary chips, PDF status, overall
// progress bar, and the sessions dropdown chip.
// Split from Schedule.jsx to keep file sizes manageable.
// ============================================================

import { useState, useEffect, useRef } from 'react';
import '../styling/Schedule.css';
import { formatTimeRange } from '../utils/timeFormat.js';

// ── Sessions dropdown chip ────────────────────────────────
// Shows the first session as a chip; if there are multiple,
// clicking it opens a dropdown listing all sessions.
function SessionsChip({ sessions }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!sessions || sessions.length === 0) return null;

  const first    = sessions[0];
  const hasMore  = sessions.length > 1;

  return (
    <div className="sessions-chip-wrapper" ref={ref}>
      <button
        className={`summary-chip sessions-chip-btn ${open ? 'sessions-chip-btn--open' : ''}`}
        onClick={() => hasMore && setOpen((v) => !v)}
        aria-expanded={hasMore ? open : undefined}
        style={{ cursor: hasMore ? 'pointer' : 'default' }}
      >
        🕐 {formatTimeRange(first.startTime, first.endTime)}
        {hasMore && (
          <span className="sessions-chip-more">
            +{sessions.length - 1} more {open ? '▲' : '▼'}
          </span>
        )}
      </button>

      {open && hasMore && (
        <div className="sessions-chip-dropdown">
          <p className="sessions-chip-dropdown-label">All study sessions</p>
          {sessions.map((s, i) => (
            <div className="sessions-chip-dropdown-item" key={s.id ?? i}>
              <span className="sessions-chip-dropdown-num">Session {i + 1}</span>
              <span>{formatTimeRange(s.startTime, s.endTime)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main exported component ───────────────────────────────
function ScheduleHeader({ schedule, progress }) {
  return (
    <div className="schedule-header">
      <h1>{schedule.course} — Study Schedule</h1>

      <div className="schedule-summary">
        <span className="summary-chip">📄 {schedule.totalPages} pages</span>
        <span className="summary-chip">📅 {schedule.totalDays} days</span>
        <span className="summary-chip">📖 {schedule.pagesPerDay} pages/day</span>
        <SessionsChip sessions={schedule.sessions} />
      </div>

      {schedule.pdfText && (
        <p className="pdf-status">✅ PDF loaded — AI answers are based on your document.</p>
      )}

      {/* Overall progress bar */}
      <div className="progress-wrapper">
        <div className="progress-label-row">
          <span className="progress-label">Overall Progress</span>
          <span className="progress-pct">{progress.pct}%</span>
        </div>
        <div
          className="progress-track"
          role="progressbar"
          aria-valuenow={progress.pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${progress.pct}% complete`}
        >
          <div className="progress-fill" style={{ width: `${progress.pct}%` }} />
        </div>
        <p className="progress-sublabel">
          {progress.done} of {progress.total} sessions completed
          {progress.pct === 100 ? ' 🎉 All done!' : ''}
        </p>
      </div>
    </div>
  );
}

export default ScheduleHeader;
