import '../styling/Dashboard.css'
import Sidebar from '../components/Sidebar.jsx';
import Navigationbar from '../components/Navigationbar.jsx';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api.js';

function Dashboard() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const studentName = localStorage.getItem('name') || 'Student';

  const fetchSchedules = async () => {
    try {
      const response = await api.get('/api/schedules');
      setSchedules(response.data.data.schedules);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate('/');
      } else {
        setError('Failed to load schedules.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleDeleteSchedule = async (scheduleId, courseName) => {
    const confirmed = window.confirm(
      `Delete "${courseName}"? This cannot be undone.`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/api/schedules/${scheduleId}`);
      setSchedules((prev) => prev.filter((s) => s.id !== scheduleId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete schedule.');
    }
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

    <main className="dashboard-content">

      <div className="dashboard-header">
        <div>
          <h1>Welcome, {studentName}</h1>
          <p>Manage your study schedules and keep track of your progress.</p>
        </div>

        <Link to="/create-schedule">
          <button className="create-schedule-btn">
            Create Schedule
          </button>
        </Link>
      </div>

      {loading && (
        <p className="dashboard-message">
          Loading your schedules...
        </p>
      )}

      {error && (
        <p className="dashboard-error">
          {error}
        </p>
      )}

      {!loading && schedules.length === 0 && (
        <div className="empty-schedules">
          <h2>No schedules yet</h2>
          <p>
            You have no schedules yet. Create one to get started.
          </p>
        </div>
      )}

      {!loading && schedules.length > 0 && (
        <div className="schedules-section">

          <h2>Your Study Schedules</h2>

          <div className="schedule-list">

            {schedules.map((schedule) => (

              <div className="schedule-card" key={schedule.id}>

                <div className="schedule-card-header">
                  <h3>{schedule.course}</h3>
                </div>

                <p className="schedule-info">
                  {schedule.totalPages} pages
                  <span>•</span>
                  {schedule.totalDays} days
                </p>

                <p className="sessions-title">
                  Study sessions
                </p>

                <div className="sessions-list">
                  <p>Number of sessions: {schedule.sessions.length}</p>
                  {schedule.sessions.map((session) => (
                    <p key={session.id}>
                      {session.startTime} - {session.endTime}
                    </p>
                  ))}
                  
                </div>

                <div className="schedule-card-actions">
                  <Link to={`/schedule/${schedule.id}`}>
                    <button type="button" className="view-schedule-btn">
                      Go to Schedule
                    </button>
                  </Link>

                  <Link to={`/edit-schedule/${schedule.id}`}>
                    <button type="button" className="edit-schedule-btn">
                      Edit
                    </button>
                  </Link>

                  <button
                    type="button"
                    className="delete-schedule-btn"
                    onClick={() =>
                      handleDeleteSchedule(schedule.id, schedule.course)
                    }
                  >
                    Delete
                  </button>
                </div>

              </div>

            ))}

          </div>

        </div>
      )}

    </main>
  </>
);
}
export default Dashboard;