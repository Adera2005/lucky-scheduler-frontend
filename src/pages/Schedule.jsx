// ============================================================
// Schedule.jsx
// Three-column study page.  Logic is split across:
//   ScheduleHeader.jsx  — course info, progress bar, sessions chip
//   YouTubePanel.jsx    — learning videos column
//   GroupedTaskList.jsx — daily tasks with week/month grouping
//   SessionCard.jsx     — individual session with AI buttons
//   utils/groupDays.js  — grouping algorithm
//   utils/timeFormat.js — AM/PM formatting
//   utils/auth.js       — userId helper
// ============================================================

import '../styling/Schedule.css';
import Sidebar          from '../components/Sidebar.jsx';
import Navigationbar    from '../components/Navigationbar.jsx';
import ScheduleHeader   from '../components/ScheduleHeader.jsx';
import YouTubePanel     from '../components/YouTubePanel.jsx';
import GroupedTaskList  from '../components/GroupedTaskList.jsx';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api              from '../services/api.js';
import useStudyNotifications from '../hooks/useStudyNotifications.js';
import { groupTasksByPeriod } from '../utils/groupDays.js';
import { getUserId }          from '../utils/auth.js';

const API_BASE   = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const MIN_COL_PX = 180;

function Schedule() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const userId   = getUserId();

  // ── Layout ─────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [colWidths,   setColWidths]   = useState([33, 38, 29]);
  const layoutRef = useRef(null);
  const dragging  = useRef(null);

  // ── Data ───────────────────────────────────────────────────
  const [schedule, setSchedule] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  // ── AI state (keyed "day-sessionIdx") ──────────────────────
  const [aiHelp,         setAiHelp]         = useState({});
  const [aiLoading,      setAiLoading]      = useState({});
  const [customQuestion, setCustomQuestion] = useState({});

  useStudyNotifications(schedule, userId);
  useEffect(() => { fetchSchedule(); }, [id]);

  // ── Draggable column logic ─────────────────────────────────

  const onDragStart = useCallback((e, handle) => {
    e.preventDefault();
    dragging.current = { handle, startX: e.clientX, startWidths: [...colWidths] };
  }, [colWidths]);

  const onDragMove = useCallback((e) => {
    if (!dragging.current || !layoutRef.current) return;
    const { handle, startX, startWidths } = dragging.current;
    const containerW = layoutRef.current.offsetWidth;
    const deltaPct   = ((e.clientX - startX) / containerW) * 100;
    const minPct     = (MIN_COL_PX / containerW) * 100;
    const w          = [...startWidths];

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
      simplify:  `Simplify and break down the core concepts from pages ${pages} of ${schedule.course}. Use intuitive real-world analogies, straightforward language, and clear step-by-step logic so complex ideas become crystal clear without losing depth.`,
      summarise: `Provide a high-yield, structured academic executive summary of pages ${pages} of ${schedule.course}. Highlight primary themes, essential definitions, core mechanics, and overarching takeaways concisely.`,
      keypoints: `Extract the most critical, high-impact key points and exam-worthy concepts from pages ${pages} of ${schedule.course}. Format them as distinct bullet points with brief contextual explanations of why each matters.`,
      quiz:      `Generate 5 challenging, high-quality test questions based on pages ${pages} of ${schedule.course} (mix of conceptual, application, and scenario-based). Include a detailed answer key with clear rationales explaining why the answer is correct.`,
      explain:   `Explain the concepts covered in pages ${pages} of ${schedule.course} using the Feynman technique. Start from first principles, avoid unnecessary jargon, use concrete code/practical examples where applicable, and guide the student smoothly from intuition to mastery.`,
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
    } catch (err) {
      const status = err.response?.status;
      const serverMsg = err.response?.data?.message || '';

      let userMsg;
      if (status === 503) {
        userMsg =
          '⏳ **AI is temporarily unavailable** — both providers are experiencing high demand right now.\n\n' +
          '**What you can do:**\n' +
          '• Wait 30–60 seconds and click the button again\n' +
          '• Try a different AI action (e.g. Key Points instead of Summarise)\n' +
          '• If the issue persists, the service usually recovers within a few minutes';
      } else {
        userMsg =
          '⚠️ Something went wrong while contacting the AI assistant.\n\n' +
          (serverMsg || 'Please check your connection and try again.');
      }

      setAiHelp((p) => ({
        ...p,
        [aiKey]: userMsg,
      }));
    } finally {
      setAiLoading((p) => ({ ...p, [aiKey]: false }));
    }
  };

  const handleCustomChange = (aiKey, value) => {
    setCustomQuestion((p) => ({ ...p, [aiKey]: value }));
  };

  // ── Derived values ──────────────────────────────────────────

  const pdfUrl = schedule?.fileUrl
    ? schedule.fileUrl.startsWith('http')
      ? schedule.fileUrl
      : `${API_BASE.replace(/\/$/, '')}/${schedule.fileUrl.replace(/^\//, '')}`
    : null;

  const progress = (() => {
    if (!schedule?.tasks?.length) return { done: 0, total: 0, pct: 0 };
    const total = schedule.tasks.length;
    const done  = schedule.tasks.filter((t) => t.completed).length;
    return { done, total, pct: Math.round((done / total) * 100) };
  })();

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
            <ScheduleHeader schedule={schedule} progress={progress} />

            <div
              className="schedule-layout"
              ref={layoutRef}
              style={{
                gridTemplateColumns: `${colWidths[0]}% 8px ${colWidths[1]}% 8px ${colWidths[2]}%`,
              }}
            >
              {/* Column 1: YouTube */}
              <YouTubePanel schedule={schedule} />

              {/* Drag handle 1 */}
              <div
                className="col-drag-handle"
                onMouseDown={(e) => onDragStart(e, 0)}
                title="Drag to resize"
                role="separator"
                aria-orientation="vertical"
              >
                <span className="drag-handle-bar" />
              </div>

              {/* Column 2: Daily tasks */}
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

              {/* Drag handle 2 */}
              <div
                className="col-drag-handle"
                onMouseDown={(e) => onDragStart(e, 1)}
                title="Drag to resize"
                role="separator"
                aria-orientation="vertical"
              >
                <span className="drag-handle-bar" />
              </div>

              {/* Column 3: PDF viewer */}
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
