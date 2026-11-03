// ============================================================
// GroupedTaskList.jsx
// Renders the study task list with collapsible week / month
// grouping when the schedule has more than 10 days.
//
//  ≤ 10 days  → flat list of Day cards (original look)
//  11–27 days → collapsible Week accordions containing Day cards
//  28+ days   → collapsible Month accordions → Week accordions → Day cards
//
// Props:
//   grouped          — result of groupTasksByPeriod()
//   aiHelp           — { [aiKey]: string }
//   aiLoading        — { [aiKey]: bool }
//   customQuestion   — { [aiKey]: string }
//   onCustomChange   — (aiKey, value) => void
//   onSmartBtn       — (task, aiKey, promptType) => void
//   onCustomAsk      — (task, aiKey) => void
//   onComplete       — (taskId) => void
//   onReschedule     — (taskId) => void
// ============================================================

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import '../styling/GroupedTaskList.css';
import { formatTimeRange } from '../utils/timeFormat.js';
import { calcProgress } from '../utils/groupDays.js';

// Smart AI preset button definitions
const SMART_BUTTONS = [
  { key: 'simplify',  label: '✂️ Simplify'   },
  { key: 'summarise', label: '📝 Summarise'  },
  { key: 'keypoints', label: '🔑 Key Points' },
  { key: 'quiz',      label: '❓ Quiz Me'    },
  { key: 'explain',   label: '💡 Explain'    },
];

// ── Mini progress bar ──────────────────────────────────────
function MiniProgress({ pct }) {
  return (
    <div className="gtl-mini-track">
      <div className="gtl-mini-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ── Single session card ────────────────────────────────────
function SessionCard({
  task,
  sessionIdx,
  day,
  aiHelp,
  aiLoading,
  customQuestion,
  onCustomChange,
  onSmartBtn,
  onCustomAsk,
  onComplete,
  onReschedule,
}) {
  const aiKey = `${day}-${sessionIdx}`;
  const pages = `${task.pageStart}–${task.pageEnd}`;

  return (
    <div className={`gtl-session-card ${task.completed ? 'gtl-session-card--done' : ''}`}>

      <div className="gtl-session-header">
        <span className="gtl-session-label">Session {sessionIdx + 1}</span>
        <span className="gtl-session-time">{formatTimeRange(task.startTime, task.endTime)}</span>
      </div>

      <p className="gtl-session-pages">Pages: <strong>{pages}</strong></p>

      <div className="gtl-session-status">
        {task.completed
          ? <span className="gtl-badge gtl-badge--done">✅ Completed</span>
          : task.rescheduled
            ? <span className="gtl-badge gtl-badge--rescheduled">🔄 Rescheduled</span>
            : <span className="gtl-badge gtl-badge--pending">⏳ Pending</span>
        }
      </div>

      {!task.completed && (
        <div className="gtl-session-actions">
          <button className="gtl-btn-complete"   onClick={() => onComplete(task.id)}>✓ Mark Complete</button>
          <button className="gtl-btn-reschedule" onClick={() => onReschedule(task.id)}>🔄 Reschedule</button>
        </div>
      )}

      <p className="gtl-ai-title">🤖 AI Help for pages {pages}:</p>

      <div className="gtl-ai-buttons">
        {SMART_BUTTONS.map((btn) => (
          <button
            key={btn.key}
            onClick={() => onSmartBtn(task, aiKey, btn.key)}
            disabled={aiLoading[aiKey]}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <div className="gtl-custom-box">
        <textarea
          className="gtl-custom-input"
          placeholder="Ask your own question about these pages…"
          value={customQuestion[aiKey] || ''}
          onChange={(e) => onCustomChange(aiKey, e.target.value)}
          rows={2}
          disabled={aiLoading[aiKey]}
        />
        <button
          className="gtl-custom-ask-btn"
          onClick={() => onCustomAsk(task, aiKey)}
          disabled={aiLoading[aiKey] || !(customQuestion[aiKey] || '').trim()}
        >
          Ask AI
        </button>
      </div>

      {aiLoading[aiKey] && (
        <div className="gtl-ai-loading">
          <span className="gtl-dot" />
          <span className="gtl-dot" />
          <span className="gtl-dot" />
          <span className="gtl-loading-text">AI is thinking…</span>
        </div>
      )}

      {aiHelp[aiKey] && (
        <div className="gtl-ai-response">
          <ReactMarkdown>{aiHelp[aiKey]}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

// ── Day group card ────────────────────────────────────────
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

// ── Week accordion ────────────────────────────────────────
function WeekAccordion({ weekGroup, defaultOpen, ...props }) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  // Collect all days for progress calc
  const allDays = weekGroup.days;
  const { done, total, pct } = calcProgress(allDays);

  return (
    <div className="gtl-week-accordion">
      <button
        className={`gtl-week-header ${open ? 'gtl-week-header--open' : ''}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="gtl-week-chevron">{open ? '▼' : '▶'}</span>
        <span className="gtl-week-label">{weekGroup.label}</span>
        <span className="gtl-week-days-range">
          Days {weekGroup.startDay}–{Math.min(weekGroup.endDay, weekGroup.days[weekGroup.days.length - 1]?.day ?? weekGroup.endDay)}
        </span>
        <span className="gtl-week-progress-text">{done}/{total} done</span>
        <div className="gtl-week-progress-pill">
          <div className="gtl-week-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </button>

      {open && (
        <div className="gtl-week-body">
          {weekGroup.days.map((dayGroup) => (
            <DayGroup key={dayGroup.day} dayGroup={dayGroup} {...props} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Month accordion ───────────────────────────────────────
function MonthAccordion({ monthGroup, defaultOpen, ...props }) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  // Flatten all days across all weeks in this month for progress
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
        <span className="gtl-month-weeks">{monthGroup.weeks.length} week{monthGroup.weeks.length !== 1 ? 's' : ''}</span>
        <span className="gtl-month-progress-text">{pct}% done</span>
        <div className="gtl-month-progress-pill">
          <div className="gtl-month-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </button>

      {open && (
        <div className="gtl-month-body">
          {monthGroup.weeks.map((weekGroup) => (
            <WeekAccordion
              key={weekGroup.weekNum}
              weekGroup={weekGroup}
              defaultOpen={false}
              {...props}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main exported component ───────────────────────────────
function GroupedTaskList({ grouped, ...props }) {
  if (!grouped) return null;
  const { mode, groups } = grouped;

  if (mode === 'days') {
    return (
      <div className="gtl-root">
        {groups.map((dayGroup) => (
          <DayGroup key={dayGroup.day} dayGroup={dayGroup} {...props} />
        ))}
      </div>
    );
  }

  if (mode === 'weeks') {
    return (
      <div className="gtl-root">
        {groups.map((weekGroup, i) => (
          <WeekAccordion
            key={weekGroup.weekNum}
            weekGroup={weekGroup}
            defaultOpen={i === 0}
            {...props}
          />
        ))}
      </div>
    );
  }

  // months
  return (
    <div className="gtl-root">
      {groups.map((monthGroup, i) => (
        <MonthAccordion
          key={monthGroup.monthNum}
          monthGroup={monthGroup}
          defaultOpen={i === 0}
          {...props}
        />
      ))}
    </div>
  );
}

export default GroupedTaskList;
