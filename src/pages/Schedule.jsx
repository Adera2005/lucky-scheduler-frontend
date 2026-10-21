// ============================================================
// Schedule.jsx  (updated)
// Changes in this version:
//   1. Imports useStudyNotifications hook — schedules a 30-minute
//      reminder and a "start reading" alert for each pending task.
//   2. Groups tasks by day number so all sessions for the same day
//      appear inside ONE white card (instead of separate cards).
//   3. Hover / shadow effect on day cards (via CSS class
//      "day-group-card" added in Schedule.css).
//   4. Adds a custom AI text-box below the smart AI buttons so the
//      user can type their own question for a specific page range.
// ============================================================

import '../styling/Schedule.css';
import Sidebar from '../components/Sidebar.jsx';
import Navigationbar from '../components/Navigationbar.jsx';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import ReactMarkdown from 'react-markdown';
import video from '../assets/clapperboard-play-svgrepo-com.svg';
// NEW — study session notifications hook
import useStudyNotifications from '../hooks/useStudyNotifications.js';

function Schedule() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [aiHelp, setAiHelp]       = useState({});
  const [aiLoading, setAiLoading] = useState({});

  // NEW — custom question per task index
  const [customQuestion, setCustomQuestion] = useState({});

  // YouTube
  const [videos, setVideos]           = useState([]);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError]   = useState('');

  // NEW — register study notifications whenever the schedule loads
  useStudyNotifications(schedule);

  useEffect(() => {
    fetchSchedule();
  }, [id]);

  const fetchSchedule = async () => {
    try {
      const response = await api.get(`/api/schedules/${id}`);
      console.log('Schedule response:', response.data);
      setSchedule(response.data.data.schedule);
    } catch (err) {
      console.error('Schedule error:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate('/');
      } else {
        setError('Failed to load your schedule.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Mark task as complete
  const completeTask = async (taskId) => {
    try {
      await api.patch(`/api/schedules/${id}/complete-session/${taskId}`);
      await fetchSchedule();
    } catch (err) {
      alert('Failed to mark task complete.');
    }
  };

  // Reschedule one task
  const rescheduleSingleSession = async (taskId) => {
    try {
      await api.patch(`/api/schedules/${id}/reschedule-session/${taskId}`);
      await fetchSchedule();
    } catch (err) {
      alert('Failed to reschedule session.');
    }
  };

  // AI helper — preset buttons
  const askSessionAI = async (task, index, promptType) => {
    const pages = `${task.pageStart}–${task.pageEnd}`;

    const prompts = {
      simplify:  `Simplify the key concepts from pages ${pages} of ${schedule.course} in very simple terms.`,
      summarise: `Give a concise summary of what is covered in pages ${pages} of ${schedule.course}.`,
      keypoints: `List the most important key points from pages ${pages} of ${schedule.course}.`,
      quiz:      `Generate 5 quiz questions based on pages ${pages} of ${schedule.course}.`,
      explain:   `Explain what is covered in pages ${pages} of ${schedule.course} as if I am a complete beginner.`,
    };

    await callAI(index, prompts[promptType], pages);
  };

  // NEW — AI helper — custom question typed by the user
  const askCustomQuestion = async (task, index) => {
    const question = (customQuestion[index] || '').trim();
    if (!question) return;

    const pages = `${task.pageStart}–${task.pageEnd}`;
    const prompt = `${question} (Context: pages ${pages} of ${schedule.course})`;
    await callAI(index, prompt, pages);
  };

  // Shared AI call logic used by both preset and custom paths
  const callAI = async (index, prompt, pages) => {
    setAiLoading((prev) => ({ ...prev, [index]: true }));
    setAiHelp((prev)   => ({ ...prev, [index]: null }));

    try {
      const response = await api.post(
        '/api/schedules/assistant/ask-context',
        {
          question: prompt,
          course:   schedule.course,
          pdfText:  schedule.pdfText || null,
          pages,
        }
      );

      setAiHelp((prev) => ({
        ...prev,
        [index]: response.data.data.answer,
      }));
    } catch (err) {
      console.error('AI error:', err);
      setAiHelp((prev) => ({
        ...prev,
        [index]: 'AI assistant is currently busy. Please wait a moment and try again.',
      }));
    } finally {
      setAiLoading((prev) => ({ ...prev, [index]: false }));
    }
  };

  // YouTube
  const fetchVideos = async () => {
    setVideoLoading(true);
    setVideoError('');
    setVideos([]);

    try {
      let searchTopic;
      if (schedule.pdfText) {
        searchTopic = `${schedule.pdfText.substring(0, 100).trim()} tutorial`;
      } else {
        searchTopic = `${schedule.course} tutorial`;
      }

      console.log('YouTube search topic:', searchTopic);
      const response = await api.get(
        `/api/schedules/youtube/search?topic=${encodeURIComponent(searchTopic)}`
      );
      console.log('YouTube response:', response.data);

      const fetchedVideos = response.data?.data?.videos || [];
      console.log('Videos found:', fetchedVideos);
      setVideos(fetchedVideos);

      if (fetchedVideos.length === 0) {
        setVideoError('No videos were found for this study material.');
      }
    } catch (err) {
      console.error('YouTube error:', err);
      setVideoError(
        err.response?.data?.message || 'Failed to fetch YouTube videos.'
      );
    } finally {
      setVideoLoading(false);
    }
  };

  const smartButtons = [
    { key: 'simplify',  label: '📝 Simplify'   },
    { key: 'summarise', label: '📋 Summarise'  },
    { key: 'keypoints', label: '🔑 Key Points' },
    { key: 'quiz',      label: '❓ Quiz Me'    },
    { key: 'explain',   label: '🔰 Explain'    },
  ];

  // ── NEW: Group tasks by day number ──
  /**
   * Takes a flat array of task objects and returns an ordered array
   * of { day, tasks[] } groups.
   *
   * @param {Array} tasks - flat list of task objects from the API
   * @returns {Array<{ day: number, tasks: Array }>}
   */
  const groupByDay = (tasks) => {
    const map = new Map();
    tasks.forEach((task) => {
      if (!map.has(task.day)) map.set(task.day, []);
      map.get(task.day).push(task);
    });
    // Sort by day number ascending
    return Array.from(map.entries())
      .sort(([a], [b]) => a - b)
      .map(([day, tasks]) => ({ day, tasks }));
  };

  return (
    <>
      <Navigationbar
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        isOpen={sidebarOpen}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="schedule-page">

        {loading && <p>Loading schedule...</p>}
        {error   && <p>{error}</p>}

        {schedule && (
          <>
            {/* HEADER */}
            <div className="schedule-header">

              <h1>{schedule.course} — Study Schedule</h1>

              <div className="schedule-summary">
                <p>Total Pages: {schedule.totalPages}</p>
                <p>Total Days:  {schedule.totalDays}</p>
                <p>Pages per day: {schedule.pagesPerDay}</p>
              </div>

              {schedule.pdfText && (
                <p className="pdf-status">
                  PDF content loaded — AI responses will be based on your document.
                </p>
              )}

            </div>

            {/* TWO COLUMNS */}
            <div className="schedule-layout">

              {/* LEFT: YOUTUBE */}
              <section className="youtube-section">

                <h2>Learning Videos</h2>
                <p>Find videos related to your study document.</p>

                <button
                  className="youtube-search-btn"
                  onClick={fetchVideos}
                  disabled={videoLoading}
                >
                  <img src={video} alt="Play video" width="20px" height="20px" />
                  {videoLoading ? 'Finding Videos...' : 'Find Learning Videos'}
                </button>

                {videoError && (
                  <p className="youtube-error">{videoError}</p>
                )}

                <div className="youtube-list">
                  {videos.map((v) => (
                    <div className="youtube-card" key={v.videoId}>
                      <img
                        src={v.thumbnail}
                        alt={v.title}
                        className="youtube-thumbnail"
                      />
                      <h3>{v.title}</h3>
                      <p className="youtube-channel">{v.channel}</p>
                      <a
                        href={v.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="youtube-watch-btn"
                      >
                        Watch on YouTube
                      </a>
                    </div>
                  ))}
                </div>

              </section>

              {/* RIGHT: STUDY SESSIONS — grouped by day */}
              <section className="sessions-section">

                <h2>Daily Tasks</h2>

                {schedule.tasks &&
                  groupByDay(schedule.tasks).map(({ day, tasks: dayTasks }) => (

                    // ── NEW: One white card per day ──
                    // The "day-group-card" class adds the hover/shadow effect
                    // defined in Schedule.css.
                    <div className="day-group-card" key={day}>

                      {/* Day heading */}
                      <div className="day-group-header">
                        <h3>Day {day}</h3>
                      </div>

                      {/* All sessions within this day */}
                      {dayTasks.map((task, sessionIdx) => {
                        // Use a composite key for AI state so each
                        // task still has its own independent AI output.
                        const aiKey = `${day}-${sessionIdx}`;
                        const pages = `${task.pageStart}–${task.pageEnd}`;

                        return (
                          <div className="session-card" key={task.id}>

                            <div className="session-header">
                              <span className="session-time-label">
                                Session {sessionIdx + 1}
                              </span>
                              <span>
                                {task.startTime} – {task.endTime}
                              </span>
                            </div>

                            <p>Pages: <strong>{pages}</strong></p>

                            <p>
                              Status:{' '}
                              {task.completed
                                ? 'Completed'
                                : task.rescheduled
                                  ? 'Rescheduled'
                                  : 'Pending'}
                            </p>

                            {!task.completed && (
                              <div className="session-actions">
                                <button onClick={() => completeTask(task.id)}>
                                  Mark Complete
                                </button>
                                <button
                                  onClick={() =>
                                    rescheduleSingleSession(task.id)
                                  }
                                >
                                  Reschedule This Session
                                </button>
                              </div>
                            )}

                            <p className="ai-title">
                              AI Help for pages {pages}:
                            </p>

                            {/* Preset AI buttons */}
                            <div className="ai-buttons">
                              {smartButtons.map((btn) => (
                                <button
                                  key={btn.key}
                                  onClick={() =>
                                    askSessionAI(task, aiKey, btn.key)
                                  }
                                  disabled={aiLoading[aiKey]}
                                >
                                  {btn.label}
                                </button>
                              ))}
                            </div>

                            {/* NEW — custom question text box */}
                            <div className="ai-custom-box">
                              <textarea
                                className="ai-custom-input"
                                placeholder="Ask your own question about these pages…"
                                value={customQuestion[aiKey] || ''}
                                onChange={(e) =>
                                  setCustomQuestion((prev) => ({
                                    ...prev,
                                    [aiKey]: e.target.value,
                                  }))
                                }
                                rows={2}
                                disabled={aiLoading[aiKey]}
                              />
                              <button
                                className="ai-custom-ask-btn"
                                onClick={() =>
                                  askCustomQuestion(task, aiKey)
                                }
                                disabled={
                                  aiLoading[aiKey] ||
                                  !(customQuestion[aiKey] || '').trim()
                                }
                              >
                                Ask AI
                              </button>
                            </div>

                            {aiLoading[aiKey] && (
                              <p className="ai-loading">AI is thinking...</p>
                            )}

                            {aiHelp[aiKey] && (
                              <div className="ai-response">
                                <ReactMarkdown>{aiHelp[aiKey]}</ReactMarkdown>
                              </div>
                            )}

                          </div>
                        );
                      })}

                    </div>
                  ))}

              </section>

            </div>
          </>
        )}

      </div>
    </>
  );
}

export default Schedule;