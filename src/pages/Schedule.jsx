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
    const fetchSchedule = async () => {
      try {
        const response = await api.get(`/api/schedules/${id}`);
        setSchedule(response.data.data.schedule);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/');
        } else {
          setError('Failed to load your schedule.');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, [id]);

  const completeTask = async (sessionIndex) => {
    try {
      const response = await api.patch(`/api/schedules/${id}/complete-session/${sessionIndex}`);
      setSchedule(response.data.data.schedule);
    } catch (err) {
      alert('Failed to mark task complete.');
    }
  };

  const reschedule = async () => {
    try {
      const response = await api.patch(`/api/schedules/${id}/reschedule`, { extraDays: 3 });
      setSchedule(response.data.data.schedule);
      alert('All missed tasks rescheduled successfully!');
    } catch (err) {
      alert('Failed to reschedule.');
    }
  };

  const rescheduleSingleSession = async (sessionIndex) => {
    try {
      const response = await api.patch(`/api/schedules/${id}/reschedule-session/${sessionIndex}`);
      setSchedule(response.data.data.schedule);
    } catch (err) {
      alert('Failed to reschedule session.');
    }
  };

  const askSessionAI = async (task, sessionIndex, promptType) => {
    const prompts = {
      simplify:  `Simplify the key concepts from pages ${task.pages} of ${schedule.course} in very simple terms.`,
      summarise: `Give a concise summary of what is covered in pages ${task.pages} of ${schedule.course}.`,
      keypoints: `List the most important key points from pages ${task.pages} of ${schedule.course}.`,
      quiz:      `Generate 5 quiz questions based on pages ${task.pages} of ${schedule.course}.`,
      explain:   `Explain what is covered in pages ${task.pages} of ${schedule.course} as if I am a complete beginner.`,
    };

    setAiLoading((prev) => ({ ...prev, [sessionIndex]: true }));
    setAiHelp((prev) => ({ ...prev, [sessionIndex]: null }));

    try {
      const response = await api.post('/api/schedules/assistant/ask-context', {
        question: prompts[promptType],
        course:   schedule.course,
        pdfText:  schedule.pdfText || null,
        pages:    task.pages,
      });
      setAiHelp((prev) => ({
        ...prev,
        [sessionIndex]: response.data.data.answer,
      }));
    } catch (err) {
      setAiHelp((prev) => ({
        ...prev,
        [sessionIndex]: 'AI assistant is currently busy. Please wait a moment and try again.',
      }));
    } finally {
      setAiLoading((prev) => ({ ...prev, [sessionIndex]: false }));
    }
  };

  const fetchSessionVideos = async (task, index) => {
    setVideoLoading((prev) => ({ ...prev, [index]: true }));
    try {
      const searchTopic = schedule.pdfText 
  ? `${schedule.pdfText.substring(0, 50).trim()} tutorial explained`
  : `${schedule.course} tutorial explained`;
      const response = await api.get(`/api/schedules/youtube/search?topic=${encodeURIComponent(searchTopic)}`);
      setSessionVideos((prev) => ({
        ...prev,
        [index]: response.data.data.videos,
      }));
    } catch (err) {
      alert('Failed to fetch videos.');
    } finally {
      setVideoLoading((prev) => ({ ...prev, [index]: false }));
    }
  };

  const smartButtons = [
    { key: 'simplify',  label: '📝 Simplify',  color: '#2980b9' },
    { key: 'summarise', label: '📋 Summarise', color: '#27ae60' },
    { key: 'keypoints', label: '🔑 Key Points', color: '#8e44ad' },
    { key: 'quiz',      label: '❓ Quiz Me',   color: '#e67e22' },
    { key: 'explain',   label: '🔰 Explain',   color: '#16a085' },
  ];

  return (
    <>
      <Navigationbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} isOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ marginTop: '60px', padding: '20px' }}>
        {loading && <p>Loading schedule...</p>}
        {error && <p style={{ color: 'red' }}>{error}</p>}

        {schedule && (
          <>
            <h1>{schedule.course} — Study Schedule</h1>
            <p>📄 Total Pages: <strong>{schedule.totalPages}</strong></p>
            <p>📅 Total Days: <strong>{schedule.totalDays}</strong></p>
            <p>📖 Pages per day: <strong>{schedule.pagesPerDay}</strong></p>
            {schedule.pdfText && (
              <p style={{ color: '#27ae60', fontSize: '13px' }}>✅ PDF content loaded — AI responses will be based on your actual document</p>
            )}

            <button
              onClick={reschedule}
              style={{ background: '#e74c3c', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', margin: '16px 0' }}
            >
              🔄 Reschedule All Missed Tasks
            </button>

            <h2>Daily Tasks</h2>
            {schedule.dailyTasks.map((task, index) => (
              <div key={index} style={{
                border: task.rescheduled ? '2px solid #f39c12' : task.completed ? '2px solid #27ae60' : '1px solid #ddd',
                margin: '16px 0',
                padding: '16px',
                borderRadius: '10px',
                background: task.completed ? '#f0fff4' : task.rescheduled ? '#fffbf0' : 'white',
              }}>
                <p><strong>Day {task.day}</strong> — {task.startTime} to {task.endTime}</p>
                <p>📖 Pages: <strong>{task.pages}</strong></p>
                <p>Status: {task.completed ? '✅ Completed' : task.rescheduled ? '🔄 Rescheduled' : '⏳ Pending'}</p>

                {!task.completed && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                    <button onClick={() => completeTask(index)} style={{ background: '#27ae60', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer' }}>
                      ✅ Mark Complete
                    </button>
                    <button onClick={() => rescheduleSingleSession(index)} style={{ background: '#f39c12', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer' }}>
                      🔄 Reschedule This Session
                    </button>
                  </div>
                )}

                <div style={{ marginTop: '12px' }}>
                  <p style={{ fontSize: '13px', color: '#666', marginBottom: '6px' }}>
                    🤖 AI Help for pages {task.pages}
                    {schedule.pdfText ? ' (from your document)' : ' (based on course name)'}:
                  </p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {smartButtons.map((btn) => (
                      <button
                        key={btn.key}
                        onClick={() => askSessionAI(task, index, btn.key)}
                        disabled={aiLoading[index]}
                        style={{
                          background: btn.color,
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          opacity: aiLoading[index] ? 0.6 : 1,
                        }}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>

                {aiLoading[index] && (
                  <p style={{ color: '#8e44ad', marginTop: '10px' }}>🤖 AI is thinking...</p>
                )}

                {aiHelp[index] && (
                  <div style={{ marginTop: '14px', background: '#f8f0ff', padding: '14px', borderRadius: '6px', borderLeft: '3px solid #8e44ad' }}>
                    <ReactMarkdown>{aiHelp[index]}</ReactMarkdown>
                  </div>
                )}

                <div style={{ marginTop: '12px' }}>
                  <button
                    onClick={() => fetchSessionVideos(task, index)}
                    disabled={videoLoading[index]}
                    style={{ background: '#c0392b', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
                  >
                    {videoLoading[index] ? 'Loading...' : '📺 Find Videos for This Section'}
                  </button>

                  {sessionVideos[index] && (
                    <div style={{ marginTop: '10px' }}>
                      {sessionVideos[index].map((video) => (
                        <div key={video.videoId} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '10px', padding: '10px', background: '#fff5f5', borderRadius: '6px' }}>
                          <img src={video.thumbnail} alt={video.title} width="120" style={{ borderRadius: '4px', flexShrink: 0 }} />
                          <div>
                            <p style={{ fontWeight: 'bold', fontSize: '13px', marginBottom: '4px' }}>{video.title}</p>
                            <p style={{ color: '#666', fontSize: '12px', marginBottom: '6px' }}>{video.channel}</p>
                            <a href={video.url} target="_blank" rel="noreferrer" style={{ color: '#c0392b', fontSize: '13px' }}>▶ Watch on YouTube</a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}

export default Schedule;

