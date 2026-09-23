
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
  const [sessionVideos, setSessionVideos] = useState({});
  const [videoLoading, setVideoLoading] = useState({});

  useEffect(() => {
    fetchSchedule();
  }, [id]);

  const fetchSchedule = async () => {
    try {
      const response = await api.get(`/api/schedules/${id}`);
      setSchedule(response.data.data.schedule);
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

  const askSessionAI = async (task, index, promptType) => {
    const pages = `${task.pageStart}–${task.pageEnd}`;

    const prompts = {
      simplify: `Simplify the key concepts from pages ${pages} of ${schedule.course} in very simple terms.`,
      summarise: `Give a concise summary of what is covered in pages ${pages} of ${schedule.course}.`,
      keypoints: `List the most important key points from pages ${pages} of ${schedule.course}.`,
      quiz: `Generate 5 quiz questions based on pages ${pages} of ${schedule.course}.`,
      explain: `Explain what is covered in pages ${pages} of ${schedule.course} as if I am a complete beginner.`,
    };

    setAiLoading((prev) => ({ ...prev, [index]: true }));
    setAiHelp((prev) => ({ ...prev, [index]: null }));

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
      setAiHelp((prev) => ({
        ...prev,
        [index]: 'AI assistant is currently busy. Please wait a moment and try again.'
      }));
    } finally {
      setAiLoading((prev) => ({ ...prev, [index]: false }));
    }
  };

  const fetchSessionVideos = async (task, index) => {
    setVideoLoading((prev) => ({ ...prev, [index]: true }));

    try {
      const searchTopic = schedule.pdfText
        ? `${schedule.pdfText.substring(0, 50).trim()} tutorial explained`
        : `${schedule.course} tutorial explained`;

      const response = await api.get(
        `/api/schedules/youtube/search?topic=${encodeURIComponent(searchTopic)}`
      );

      setSessionVideos((prev) => ({
        ...prev,
        [index]: response.data.data.videos
      }));
    } catch (err) {
      alert('Failed to fetch videos.');
    } finally {
      setVideoLoading((prev) => ({ ...prev, [index]: false }));
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

      <div>
        {loading && <p>Loading schedule...</p>}
        {error && <p>{error}</p>}

        {schedule && (
          <>
            <h1>{schedule.course} — Study Schedule</h1>

            <p>Total Pages: {schedule.totalPages}</p>
            <p>Total Days: {schedule.totalDays}</p>
            <p>Pages per day: {schedule.pagesPerDay}</p>

            {schedule.pdfText && (
              <p>
                PDF content loaded — AI responses will be based on your document.
              </p>
            )}

            <h2>Daily Tasks</h2>

            {schedule.tasks &&schedule.tasks.map((task, index) => {
              const pages = `${task.pageStart}–${task.pageEnd}`;

              return (
                <div key={task.id}>
                  <p>
                    <strong>Day {task.day}</strong> — {task.startTime} to {task.endTime}
                  </p>

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
                    <>
                      <button onClick={() => completeTask(task.id)}>
                        Mark Complete
                      </button>

                      <button onClick={() => rescheduleSingleSession(task.id)}>
                        Reschedule This Session
                      </button>
                    </>
                  )}

                  <p>
                    AI Help for pages {pages}:
                  </p>

                  {smartButtons.map((btn) => (
                    <button
                      key={btn.key}
                      onClick={() => askSessionAI(task, index, btn.key)}
                      disabled={aiLoading[index]}
                    >
                      {btn.label}
                    </button>
                  ))}

                  {aiLoading[index] && <p>AI is thinking...</p>}

                  {aiHelp[index] && (
                    <ReactMarkdown>
                      {aiHelp[index]}
                    </ReactMarkdown>
                  )}

                  <button
                    onClick={() => fetchSessionVideos(task, index)}
                    disabled={videoLoading[index]}
                  >
                    {videoLoading[index]
                      ? 'Loading...'
                      : 'Find Videos for This Section'}
                  </button>

                  {sessionVideos[index] && (
                    <div>
                      {sessionVideos[index].map((video) => (
                        <div key={video.videoId}>
                          <img
                            src={video.thumbnail}
                            alt={video.title}
                            width="120"
                          />

                          <p>{video.title}</p>
                          <p>{video.channel}</p>

                          <a
                            href={video.url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Watch on YouTube
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </>
  );
}

export default Schedule;

