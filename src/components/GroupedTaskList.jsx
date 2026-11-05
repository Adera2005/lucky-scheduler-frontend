// ============================================================
// GroupedTaskList.jsx
// Renders the study task list with collapsible week / month
// grouping when the schedule has 7+ days.
//
//  < 7 days   → flat Day cards (always visible)
//  7–27 days  → collapsible Week accordions
//               → each week expands into collapsible Day accordions
//               → each day expands into individual sessions
//  28+ days   → Month accordions → Week accordions → Day accordions
//
// Individual session cards are rendered by SessionCard.jsx.
// Grouping logic lives in utils/groupDays.js.
// ============================================================

import { useState }  from 'react';
import SessionCard   from './SessionCard.jsx';
import '../styling/GroupedTaskList.css';
import { calcProgress } from '../utils/groupDays.js';

// ── Mini progress bar ─────────────────────────────────────
function MiniProgress({ pct }) {
  return (
    <div className="gtl-mini-track">
      <div className="gtl-mini-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── Day card (flat, used only when mode='days') ───────────
function DayGroup({ dayGroup, ...props }) {
  const { day, tasks } = dayGroup;
  const done  = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const pct   = Math.round((done / total) * 100);

  return (
    <div className="gtl-day-card">
      <div className="gtl-day-header">
        <h4>Day {day}</h4>
        <span className="gtl-day-progress-text">{done}/{total} done</span>
      </div>
      <MiniProgress pct={pct} />
      {tasks.map((task, idx) => (
        <SessionCard key={task.id} task={task} sessionIdx={idx} day={day} {...props} />
      ))}
    </div>
  );
}

// ── Collapsible Day accordion (used inside weeks/months) ───
function DayAccordion({ dayGroup, ...props }) {
  const [open, setOpen] = useState(false);
  const { day, tasks } = dayGroup;
  const done  = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const pct   = Math.round((done / total) * 100);

  return (
    <div className="gtl-day-accordion">
      <button
        className={`gtl-day-acc-header ${open ? 'gtl-day-acc-header--open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="gtl-day-chevron">{open ? '▼' : '▶'}</span>
        <span className="gtl-day-acc-label">Day {day}</span>
        <span className="gtl-day-acc-progress">{done}/{total} done</span>
        <div className="gtl-day-acc-pill">
          <div className="gtl-day-acc-fill" style={{ width: `${pct}%` }} />
        </div>
      </button>
      {open && (
        <div className="gtl-day-acc-body">
          {tasks.map((task, idx) => (
            <SessionCard key={task.id} task={task} sessionIdx={idx} day={day} {...props} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Week accordion ─────────────────────────────────────────
function WeekAccordion({ weekGroup, defaultOpen, ...props }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const { done, total, pct } = calcProgress(weekGroup.days);
  const lastDay = weekGroup.days[weekGroup.days.length - 1]?.day ?? weekGroup.endDay;

  return (
    <div className="gtl-week-accordion">
      <button
        className={`gtl-week-header ${open ? 'gtl-week-header--open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="gtl-week-chevron">{open ? '▼' : '▶'}</span>
        <span className="gtl-week-label">{weekGroup.label}</span>
        <span className="gtl-week-days-range">Days {weekGroup.startDay}–{Math.min(weekGroup.endDay, lastDay)}</span>
        <span className="gtl-week-progress-text">{done}/{total} done</span>
        <div className="gtl-week-progress-pill">
          <div className="gtl-week-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </button>

      {open && (
        <div className="gtl-week-body">
          {weekGroup.days.map((dayGroup) => (
            <DayAccordion key={dayGroup.day} dayGroup={dayGroup} {...props} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Month accordion ────────────────────────────────────────
function MonthAccordion({ monthGroup, defaultOpen, ...props }) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const allDays = monthGroup.weeks.flatMap((w) => w.days);
  const { done, total, pct } = calcProgress(allDays);

  return (
    <div className="gtl-month-accordion">
      <button
        className={`gtl-month-header ${open ? 'gtl-month-header--open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="gtl-month-chevron">{open ? '▼' : '▶'}</span>
        <span className="gtl-month-label">{monthGroup.label}</span>
        <span className="gtl-month-weeks">
          {monthGroup.weeks.length} week{monthGroup.weeks.length !== 1 ? 's' : ''}
        </span>
        <span className="gtl-month-progress-text">{pct}% done</span>
        <div className="gtl-month-progress-pill">
          <div className="gtl-month-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </button>

      {open && (
        <div className="gtl-month-body">
          {monthGroup.weeks.map((weekGroup) => (
            <WeekAccordion key={weekGroup.weekNum} weekGroup={weekGroup} defaultOpen={false} {...props} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Root component ─────────────────────────────────────────
function GroupedTaskList({ grouped, ...props }) {
  if (!grouped) return null;
  const { mode, groups } = grouped;

  if (mode === 'days') {
    return (
      <div className="gtl-root">
        {groups.map((dg) => <DayGroup key={dg.day} dayGroup={dg} {...props} />)}
      </div>
    );
  }

  if (mode === 'weeks') {
    return (
      <div className="gtl-root">
        {groups.map((wg, i) => (
          <WeekAccordion key={wg.weekNum} weekGroup={wg} defaultOpen={i === 0} {...props} />
        ))}
      </div>
    );
  }

  return (
    <div className="gtl-root">
      {groups.map((mg, i) => (
        <MonthAccordion key={mg.monthNum} monthGroup={mg} defaultOpen={i === 0} {...props} />
      ))}
    </div>
  );
}

export default GroupedTaskList;
