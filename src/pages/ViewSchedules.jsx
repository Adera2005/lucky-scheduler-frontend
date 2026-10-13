// Styling: ViewSchedules.css
import '../styling/ViewSchedules.css';
import Sidebar from '../components/Sidebar.jsx';
import Navigationbar from '../components/Navigationbar.jsx';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api.js';

function ViewSchedules() {
  const navigate = useNavigate();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const handleDelete = async (scheduleId, courseName) => {
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

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="view-schedules-page">

        {/* Page header */}
        <div className="view-schedules-header">
          <div>
            <h1>Your Schedules</h1>
            <p>View, manage, and track all your study schedules.</p>
          </div>

          <Link to="/create-schedule" className="vs-create-btn">
            + Create New
          </Link>
        </div>

        {/* Loading */}
        {loading && (
          <p className="vs-message">Loading your schedules...</p>
        )}

        {/* Error */}
        {error && (
          <p className="vs-error">{error}</p>
        )}

        {/* Schedule count badge */}
        {!loading && schedules.length > 0 && (
          <div className="vs-count">
             {schedules.length} {schedules.length === 1 ? 'Schedule' : 'Schedules'}
          </div>
        )}

        {/* Empty state */}
        {!loading && schedules.length === 0 && !error && (
          <div className="vs-empty">
            <h2>No schedules yet</h2>
            <p>You haven't created any study schedules yet. Start one to get organised!</p>
            <Link to="/create-schedule" className="vs-create-btn">
              + Create Your First Schedule
            </Link>
          </div>
        )}

        {/* Schedule cards grid */}
        {!loading && schedules.length > 0 && (
          <div className="vs-grid">
            {schedules.map((schedule) => (
              <div className="vs-card" key={schedule.id}>

                {/* Course title */}
                <h3 className="vs-card-title">{schedule.course}</h3>

                {/* Meta info */}
                <div className="vs-card-meta">
                  <span> {schedule.totalPages} pages</span>
                  <span className="dot">•</span>
                  <span> {schedule.totalDays} days</span>
                </div>

                {/* Study sessions */}
                <p className="vs-sessions-label">Study Sessions</p>
                <div className="vs-sessions-list">
                  {schedule.sessions.length === 0 ? (
                    <p className="vs-session-chip">No sessions set</p>
                  ) : (
                    schedule.sessions.map((session) => (
                      <div className="vs-session-chip" key={session.id}>
                         {session.startTime} – {session.endTime}
                      </div>
                    ))
                  )}
                </div>

                {/* Actions */}
                <div className="vs-card-actions">
                  <Link to={`/schedule/${schedule.id}`}>
                    <button type="button" className="vs-view-btn">
                      View Schedule
                    </button>
                  </Link>

                  <Link to={`/edit-schedule/${schedule.id}`}>
                    <button type="button" className="vs-edit-btn">
                      Edit
                    </button>
                  </Link>

                  <button
                    type="button"
                    className="vs-delete-btn"
                    onClick={() => handleDelete(schedule.id, schedule.course)}
                  >
                    Delete
                  </button>
                </div>

              </div>
            ))}
          </div>
        )}

      </main>
    </>
  );
}

export default ViewSchedules;
