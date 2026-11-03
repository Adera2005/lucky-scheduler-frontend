// ============================================================
// Schedule.jsx
// Three-column study page with:
//   • Draggable column dividers
//   • Overall + per-day progress bars
//   • AM/PM time formatting on all session times
//   • Week / month accordion grouping (11+ days → weeks,
//     28+ days → months → weeks)  — via GroupedTaskList
//   • Sessions column shows ALL content without hiding/clipping
//   • Per-user notification bell
//   • Dark / light mode via CSS custom properties
// ============================================================

import '../styling/Schedule.css';
import Sidebar          from '../components/Sidebar.jsx';
import Navigationbar    from '../components/Navigationbar.jsx';
import GroupedTaskList  from '../components/GroupedTaskList.jsx';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api              from '../services/api.js';
import video            from '../assets/clapperboard-play-svgrepo-com.svg';
import useStudyNotifications from '../hooks/useStudyNotifications.js';
import { groupTasksByPeriod } from '../utils/groupDays.js';
import { formatTimeRange }    from '../utils/timeFormat.js';
import { getUserId }          from '../utils/auth.js';

const API_BASE   = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const MIN_COL_PX = 180;

// ── Sessions dropdown chip ─────────────────────────────────
// Shows the first session time as a chip. If there are multiple
// sessions, clicking it opens a small dropdown listing all of them.
function SessionsChip({ sessions }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  if (!sessions || sessions.length === 0) return null;

  const first = sessions[0];
  const hasMore = sessions.length > 1;

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

function Schedule() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const userId = getUserId();

  // ── Layout state ───────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Percentage widths for the 3 data columns (handles sit between them)
  const [colWidths, setColWidths] = useState([26, 43, 31]);
  const layoutRef = useRef(null);
  const dragging  = useRef(null);

  // ── Schedule data ──────────────────────────────────────────
  const [schedule, setSchedule] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  // ── AI state (keyed by "day-sessionIndex") ─────────────────
  const [aiHelp,         setAiHelp]         = useState({});
  const [aiLoading,      setAiLoading]      = useState({});
  const [customQuestion, setCustomQuestion] = useState({});

  // ── YouTube state ──────────────────────────────────────────
  const [videos,       setVideos]       = useState([]);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError,   setVideoError]   = useState('');

  // Register browser + in-app notifications
  useStudyNotifications(schedule, userId);

  useEffect(() => { fetchSchedule(); }, [id]);

  // ── Draggable column logic ─────────────────────────────────

  const onDragStart = useCallback((e, handle) => {
    e.preventDefault();
    dragging.current = {
      handle,
      startX:      e.clientX,
      startWidths: [...colWidths],
    };
  }, [colWidths]);

  const onDragMove = useCallback((e) => {
    if (!dragging.current || !layoutRef.current) return;
    const { handle, startX, startWidths } = dragging.current;
    const containerW = layoutRef.current.offsetWidth;
    const deltaX     = e.clientX - startX;
    const deltaPct   = (deltaX / containerW) * 100;
    const minPct     = (MIN_COL_PX / containerW) * 100;

    const w = [...startWidths];

    if (handle === 0) {
      w[0] = Math.max(minPct, Math.min(startWidths[0] + deltaPct, 100 - minPct * 2));
      w[1] = startWidths[1] - (w[0] - startWidths[0]);
    } else {
      w[1] = Math.max(minPct, Math.min(startWidths[1] + deltaPct, 100 - minPct * 2));
      w[2] = startWidths[2] - (w[1] - startWidths[1]);
    }

    if (w.every((x) => x >= minPct)) setColWidths(w);
  }, []);

  const onDragEnd = useCallback(() => { dragging.current = null; }, []);

  useEffect(() => {
    window.addEventListener('mousemove', onDragMove);
    window.addEventListener('mouseup',   onDragEnd);
    return () => {
      window.removeEventListener('mousemove', onDragMove);
      window.removeEventListener('mouseup',   onDragEnd);
    };
  }, [onDragMove, onDragEnd]);

  // ── Data fetch ─────────────────────────────────────────────

  const fetchSchedule = async () => {
    try {
      const res = await api.get(`/api/schedules/${id}`);
      setSchedule(res.data.data.schedule);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/');
      } else {
        setError('Failed to load your schedule.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Task actions ───────────────────────────────────────────

  const completeTask = async (taskId) => {
    try {
      await api.patch(`/api/schedules/${id}/complete-session/${taskId}`);
      await fetchSchedule();
    } catch {
      alert('Failed to mark task complete.');
    }
  };

  const rescheduleSingleSession = async (taskId) => {
    try {
      await api.patch(`/api/schedules/${id}/reschedule-session/${taskId}`);
      await fetchSchedule();
    } catch {
      alert('Failed to reschedule session.');
    }
  };

  // ── AI helpers ─────────────────────────────────────────────

  const askSessionAI = async (task, aiKey, promptType) => {
    const pages   = `${task.pageStart}–${task.pageEnd}`;
    const prompts = {
      simplify:  `Simplify the key concepts from pages ${pages} of ${schedule.course} in very simple terms.`,
      summarise: `Give a concise summary of what is covered in pages ${pages} of ${schedule.course}.`,
      keypoints: `List the most important key points from pages ${pages} of ${schedule.course}.`,
      quiz:      `Generate 5 quiz questions based on pages ${pages} of ${schedule.course}.`,
      explain:   `Explain what is covered in pages ${pages} of ${schedule.course} as if I am a complete beginner.`,
    };
    await callAI(aiKey, prompts[promptType], pages);
  };

  const askCustomQuestion = async (task, aiKey) => {
    const question = (customQuestion[aiKey] || '').trim();
    if (!question) return;
    const pages = `${task.pageStart}–${task.pageEnd}`;
    await callAI(aiKey, `${question} (Context: pages ${pages} of ${schedule.course})`, pages);
  };

  const callAI = async (aiKey, prompt, pages) => {
    setAiLoading((p) => ({ ...p, [aiKey]: true  }));
    setAiHelp   ((p) => ({ ...p, [aiKey]: null  }));
    try {
      const res = await api.post('/api/schedules/assistant/ask-context', {
        question: prompt,
        course:   schedule.course,
        pdfText:  schedule.pdfText || null,
        pages,
      });
      setAiHelp((p) => ({ ...p, [aiKey]: res.data.data.answer }));
    } catch {
      setAiHelp((p) => ({
        ...p,
        [aiKey]: 'AI assistant is currently busy. Please wait a moment and try again.',
      }));
    } finally {
      setAiLoading((p) => ({ ...p, [aiKey]: false }));
    }
  };

  const handleCustomChange = (aiKey, value) => {
    setCustomQuestion((p) => ({ ...p, [aiKey]: value }));
  };

  // ── YouTube ────────────────────────────────────────────────

  const fetchVideos = async () => {
    setVideoLoading(true);
    setVideoError('');
    setVideos([]);
    try {
      const topic = schedule.pdfText
        ? `${schedule.pdfText.substring(0, 100).trim()} tutorial`
        : `${schedule.course} tutorial`;
      const res     = await api.get(`/api/schedules/youtube/search?topic=${encodeURIComponent(topic)}`);
      const fetched = res.data?.data?.videos || [];
      setVideos(fetched);
      if (!fetched.length) setVideoError('No videos found for this material.');
    } catch (err) {
      setVideoError(err.response?.data?.message || 'Failed to fetch videos.');
    } finally {
      setVideoLoading(false);
    }
  };

  // ── Progress calculation ───────────────────────────────────

  const getProgress = () => {
    if (!schedule?.tasks?.length) return { done: 0, total: 0, pct: 0 };
    const total = schedule.tasks.length;
    const done  = schedule.tasks.filter((t) => t.completed).length;
    return { done, total, pct: Math.round((done / total) * 100) };
  };

  // ── PDF URL ────────────────────────────────────────────────

  const pdfUrl = schedule?.fileUrl
    ? schedule.fileUrl.startsWith('http')
      ? schedule.fileUrl
      : `${API_BASE.replace(/\/$/, '')}/${schedule.fileUrl.replace(/^\//, '')}`
    : null;

  const progress = getProgress();

  // Group tasks by period (flat / weeks / months)
  const grouped = schedule?.tasks
    ? groupTasksByPeriod(schedule.tasks, schedule.totalDays)
    : null;

  // ── Render ─────────────────────────────────────────────────

  return (
    <>
      <Navigationbar
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        isOpen={sidebarOpen}
      />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="schedule-page">

        {loading && <p className="schedule-state-msg">Loading schedule…</p>}
        {error   && <p className="schedule-state-msg schedule-state-error">{error}</p>}

        {schedule && (
          <>
            {/* ── Header ── */}
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

            {/* ── THREE-COLUMN LAYOUT ── */}
            <div
              className="schedule-layout"
              ref={layoutRef}
              style={{
                gridTemplateColumns: `${colWidths[0]}% 8px ${colWidths[1]}% 8px ${colWidths[2]}%`,
              }}
            >

              {/* ── Column 1: YouTube ── */}
              <section className="col-panel youtube-section">
                <h2>🎬 Learning Videos</h2>
                <p className="col-subtitle">Find videos related to your study material.</p>

                <button
                  className="youtube-search-btn"
                  onClick={fetchVideos}
                  disabled={videoLoading}
                >
                  <img src={video} alt="" width="18" height="18" />
                  {videoLoading ? 'Finding…' : 'Find Learning Videos'}
                </button>

                {videoError && <p className="youtube-error">{videoError}</p>}

                <div className="youtube-list">
                  {videos.map((v) => (
                    <div className="youtube-card" key={v.videoId}>
                      <img src={v.thumbnail} alt={v.title} className="youtube-thumbnail" />
                      <h3>{v.title}</h3>
                      <p className="youtube-channel">{v.channel}</p>
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="youtube-watch-btn"
                      >
                        ▶ Watch on YouTube
                      </a>
                    </div>
                  ))}
                </div>
              </section>

              {/* ── Drag handle 1 ── */}
              <div
                className="col-drag-handle"
                onMouseDown={(e) => onDragStart(e, 0)}
                title="Drag to resize"
                role="separator"
                aria-orientation="vertical"
              >
                <span className="drag-handle-bar" />
              </div>

              {/* ── Column 2: Daily Tasks ── */}
              <section className="col-panel sessions-section">
                <h2>📋 Daily Tasks</h2>

                {grouped && (
                  <GroupedTaskList
                    grouped={grouped}
                    aiHelp={aiHelp}
                    aiLoading={aiLoading}
                    customQuestion={customQuestion}
                    onCustomChange={handleCustomChange}
                    onSmartBtn={askSessionAI}
                    onCustomAsk={askCustomQuestion}
                    onComplete={completeTask}
                    onReschedule={rescheduleSingleSession}
                  />
                )}
              </section>

              {/* ── Drag handle 2 ── */}
              <div
                className="col-drag-handle"
                onMouseDown={(e) => onDragStart(e, 1)}
                title="Drag to resize"
                role="separator"
                aria-orientation="vertical"
              >
                <span className="drag-handle-bar" />
              </div>

              {/* ── Column 3: PDF Viewer ── */}
              <section className="col-panel pdf-section">
                <h2>📄 Your PDF</h2>

                {pdfUrl ? (
                  <>
                    <p className="pdf-section-subtitle">Your uploaded study document is shown below.</p>
                    <iframe className="pdf-iframe" src={pdfUrl} title="Study PDF" />
                  </>
                ) : (
                  <div className="pdf-empty">
                    <span className="pdf-empty-icon">📭</span>
                    <p>No PDF was uploaded for this schedule.</p>
                    <p className="pdf-empty-hint">
                      When you create a schedule with a PDF, it will appear here
                      so you can read it alongside your study tasks.
                    </p>
                  </div>
                )}
              </section>

            </div>
          </>
        )}
      </div>
    </>
  );
}

export default Schedule;
