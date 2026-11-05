// ============================================================
// SessionCard.jsx
// Renders a single study session card including:
//   • Time, pages, status badge
//   • Mark complete / reschedule buttons
//   • AI preset buttons + custom question textarea
//   • AI loading animation and response area
// Split from GroupedTaskList.jsx to keep file sizes manageable.
// ============================================================

import ReactMarkdown       from 'react-markdown';
import { formatTimeRange } from '../utils/timeFormat.js';
import '../styling/GroupedTaskList.css';

const SMART_BUTTONS = [
  { key: 'simplify',  label: '✂️ Simplify'   },
  { key: 'summarise', label: '📝 Summarise'  },
  { key: 'keypoints', label: '🔑 Key Points' },
  { key: 'quiz',      label: '❓ Quiz Me'    },
  { key: 'explain',   label: '💡 Explain'    },
];

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

      {/* Time + session number */}
      <div className="gtl-session-header">
        <span className="gtl-session-label">Session {sessionIdx + 1}</span>
        <span className="gtl-session-time">{formatTimeRange(task.startTime, task.endTime)}</span>
      </div>

      {/* Pages */}
      <p className="gtl-session-pages">Pages: <strong>{pages}</strong></p>

      {/* Status badge */}
      <div className="gtl-session-status">
        {task.completed
          ? <span className="gtl-badge gtl-badge--done">✅ Completed</span>
          : task.rescheduled
            ? <span className="gtl-badge gtl-badge--rescheduled">🔄 Rescheduled</span>
            : <span className="gtl-badge gtl-badge--pending">⏳ Pending</span>
        }
      </div>

      {/* Action buttons */}
      {!task.completed && (
        <div className="gtl-session-actions">
          <button className="gtl-btn-complete"   onClick={() => onComplete(task.id)}>
            ✓ Mark Complete
          </button>
          <button className="gtl-btn-reschedule" onClick={() => onReschedule(task.id)}>
            🔄 Reschedule
          </button>
        </div>
      )}

      {/* AI preset buttons */}
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

      {/* Custom question */}
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

      {/* Loading dots */}
      {aiLoading[aiKey] && (
        <div className="gtl-ai-loading">
          <span className="gtl-dot" />
          <span className="gtl-dot" />
          <span className="gtl-dot" />
          <span className="gtl-loading-text">AI is thinking…</span>
        </div>
      )}

      {/* AI response */}
      {aiHelp[aiKey] && (
        <div className="gtl-ai-response">
          <ReactMarkdown>{aiHelp[aiKey]}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

export default SessionCard;
