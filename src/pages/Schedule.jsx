import Sidebar from '../components/Sidebar.jsx';
import Navigationbar from '../components/Navigationbar.jsx';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.js';

function Schedule() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [videos, setVideos] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await api.get(`/api/schedules/${id}`);
        setSchedule(response.data.data.schedule);
        const videoResponse = await api.get(`/api/schedules/youtube/search?topic=${response.data.data.schedule.course}`);
        setVideos(videoResponse.data.data.videos);
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

  const completeTask = async (day) => {
    try {
      const response = await api.patch(`/api/schedules/${id}/complete/${day}`);
      setSchedule(response.data.data.schedule);
    } catch (err) {
      alert('Failed to mark task complete.');
    }
  };

  const reschedule = async () => {
    try {
      const response = await api.patch(`/api/schedules/${id}/reschedule`, { extraDays: 3 });
      setSchedule(response.data.data.schedule);
      alert('Schedule updated successfully!');
    } catch (err) {
      alert('Failed to reschedule.');
    }
  };

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
            <p>Total Pages: {schedule.totalPages}</p>
            <p>Total Days: {schedule.totalDays}</p>
            <p>Pages per day: {schedule.pagesPerDay}</p>

            <button onClick={reschedule}>Reschedule Missed Tasks</button>

            <h2>Daily Tasks</h2>
            {schedule.dailyTasks.map((task, index) => (
              <div key={index} style={{ border: '1px solid gray', margin: '10px', padding: '10px' }}>
                <p>Day {task.day} — {task.startTime} to {task.endTime}</p>
                <p>Pages: {task.pages}</p>
                <p>Status: {task.completed ? '✅ Completed' : '⏳ Pending'}</p>
                {task.rescheduled && <p>🔄 Rescheduled</p>}
                {!task.completed && (
                  <button onClick={() => completeTask(task.day)}>
                    Mark Complete
                  </button>
                )}
              </div>
            ))}

            <h2>Recommended Videos for {schedule.course}</h2>
            {videos.map((video) => (
              <div key={video.videoId} style={{ margin: '10px' }}>
                <img src={video.thumbnail} alt={video.title} width="200" />
                <p>{video.title}</p>
                <p>{video.channel}</p>
                <a href={video.url} target="_blank" rel="noreferrer">
                  Watch on YouTube
                </a>
              </div>
            ))}
          </>
        )}
      </div>
    </>
  );
}

export default Schedule;