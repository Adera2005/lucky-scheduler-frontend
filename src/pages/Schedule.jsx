import '../styling/Schedule.css';
import Sidebar from '../components/Sidebar.jsx';
import Navigationbar from '../components/Navigationbar.jsx';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import ReactMarkdown from 'react-markdown';

function Schedule() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [aiHelp, setAiHelp] = useState({});
  const [aiLoading, setAiLoading] = useState({});

  // YouTube
  const [videos, setVideos] = useState([]);
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState('');

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
      await api.patch(
        `/api/schedules/${id}/complete-session/${taskId}`
      );

      await fetchSchedule();
    } catch (err) {
      alert('Failed to mark task complete.');
    }
  };

  // Reschedule one task
  const rescheduleSingleSession = async (taskId) => {
    try {
      await api.patch(
        `/api/schedules/${id}/reschedule-session/${taskId}`
      );

      await fetchSchedule();
    } catch (err) {
      alert('Failed to reschedule session.');
    }
  };

  // AI helper
  const askSessionAI = async (task, index, promptType) => {
    const pages = `${task.pageStart}–${task.pageEnd}`;

    const prompts = {
      simplify: `Simplify the key concepts from pages ${pages} of ${schedule.course} in very simple terms.`,

      summarise: `Give a concise summary of what is covered in pages ${pages} of ${schedule.course}.`,

      keypoints: `List the most important key points from pages ${pages} of ${schedule.course}.`,

      quiz: `Generate 5 quiz questions based on pages ${pages} of ${schedule.course}.`,

      explain: `Explain what is covered in pages ${pages} of ${schedule.course} as if I am a complete beginner.`,
    };

    setAiLoading((prev) => ({
      ...prev,
      [index]: true
    }));

    setAiHelp((prev) => ({
      ...prev,
      [index]: null
    }));

    try {
      const response = await api.post(
        '/api/schedules/assistant/ask-context',
        {
          question: prompts[promptType],
          course: schedule.course,
          pdfText: schedule.pdfText || null,
          pages
        }
      );

      setAiHelp((prev) => ({
        ...prev,
        [index]: response.data.data.answer
      }));

    } catch (err) {
      console.error('AI error:', err);

      setAiHelp((prev) => ({
        ...prev,
        [index]:
          'AI assistant is currently busy. Please wait a moment and try again.'
      }));

    } finally {
      setAiLoading((prev) => ({
        ...prev,
        [index]: false
      }));
    }
  };

  // Get 5 YouTube videos for the whole document
  const fetchVideos = async () => {
    setVideoLoading(true);
    setVideoError('');
    setVideos([]);

    try {
      let searchTopic;

      if (schedule.pdfText) {
        // Use the beginning of the uploaded PDF as the search topic
        searchTopic =
          `${schedule.pdfText.substring(0, 100).trim()} tutorial`;
      } else {
        // If there is no PDF, use the course name
        searchTopic =
          `${schedule.course} tutorial`;
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

      console.error(
        'YouTube response error:',
        err.response?.data
      );

      setVideoError(
        err.response?.data?.message ||
        'Failed to fetch YouTube videos.'
      );

    } finally {
      setVideoLoading(false);
    }
  };

  const smartButtons = [
    { key: 'simplify', label: '📝 Simplify' },
    { key: 'summarise', label: '📋 Summarise' },
    { key: 'keypoints', label: '🔑 Key Points' },
    { key: 'quiz', label: '❓ Quiz Me' },
    { key: 'explain', label: '🔰 Explain' }
  ];

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

        {error && <p>{error}</p>}

        {schedule && (
          <>
            {/* HEADER */}
            <div className="schedule-header">

              <h1>
                {schedule.course} — Study Schedule
              </h1>

              <div className="schedule-summary">

                <p>
                  Total Pages: {schedule.totalPages}
                </p>

                <p>
                  Total Days: {schedule.totalDays}
                </p>

                <p>
                  Pages per day: {schedule.pagesPerDay}
                </p>

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

                <p>
                  Find videos related to your study document.
                </p>

                <button
                  className="youtube-search-btn"
                  onClick={fetchVideos}
                  disabled={videoLoading}
                >
                  {videoLoading
                    ? 'Finding Videos...'
                    : 'Find Learning Videos'}
                </button>

                {videoError && (
                  <p className="youtube-error">
                    {videoError}
                  </p>
                )}

                <div className="youtube-list">

                  {videos.map((video) => (

                    <div
                      className="youtube-card"
                      key={video.videoId}
                    >

                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="youtube-thumbnail"
                      />

                      <h3>
                        {video.title}
                      </h3>

                      <p className="youtube-channel">
                        {video.channel}
                      </p>

                      <a
                        href={video.url}
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


              {/* RIGHT: STUDY SESSIONS */}
              <section className="sessions-section">

                <h2>Daily Tasks</h2>

                {schedule.tasks &&
                  schedule.tasks.map((task, index) => {

                    const pages =
                      `${task.pageStart}–${task.pageEnd}`;

                    return (

                      <div
                        className="session-card"
                        key={task.id}
                      >

                        <div className="session-header">

                          <h3>
                            Day {task.day}
                          </h3>

                          <span>
                            {task.startTime} - {task.endTime}
                          </span>

                        </div>

                        <p>
                          Pages: <strong>{pages}</strong>
                        </p>

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

                            <button
                              onClick={() =>
                                completeTask(task.id)
                              }
                            >
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

                        <div className="ai-buttons">

                          {smartButtons.map((btn) => (

                            <button
                              key={btn.key}
                              onClick={() =>
                                askSessionAI(
                                  task,
                                  index,
                                  btn.key
                                )
                              }
                              disabled={aiLoading[index]}
                            >
                              {btn.label}
                            </button>

                          ))}

                        </div>

                        {aiLoading[index] && (
                          <p className="ai-loading">
                            AI is thinking...
                          </p>
                        )}

                        {aiHelp[index] && (
                          <div className="ai-response">
                            <ReactMarkdown>
                              {aiHelp[index]}
                            </ReactMarkdown>
                          </div>
                        )}

                      </div>

                    );
                  })}

              </section>

            </div>
          </>
        )}

      </div>
    </>
  );
}

export default Schedule;