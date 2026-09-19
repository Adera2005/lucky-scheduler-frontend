import Sidebar from '../components/Sidebar.jsx';
import Navigationbar from '../components/Navigationbar.jsx';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';

function CreateSchedule() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
 const [sidebarOpen, setSidebarOpen] = useState(false);
  const [formData, setFormData] = useState({
    course: '',
    totalPages: '',
    totalDays: '',
    studySessions: [{ startTime: '', endTime: '' }],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/api/schedules/generate', formData);
      const scheduleId = response.data.data.schedule.id;
      navigate(`/schedule/${scheduleId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create schedule.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    
     <Navigationbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} isOpen={sidebarOpen} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    

      <div style={{ marginTop: '60px', padding: '20px' }}>
        <h1>Create Schedule Plan</h1>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <div>
            <label>Course Name</label>
            <input
              type="text"
              value={formData.course}
              onChange={(e) => setFormData({ ...formData, course: e.target.value })}
              placeholder="e.g. Biology"
              required
            />
          </div>

          <div>
            <label>Total Pages</label>
            <input
              type="number"
              value={formData.totalPages}
              onChange={(e) => setFormData({ ...formData, totalPages: e.target.value })}
              placeholder="e.g. 200"
              required
            />
          </div>

          <div>
            <label>Total Days</label>
            <input
              type="number"
              value={formData.totalDays}
              onChange={(e) => setFormData({ ...formData, totalDays: e.target.value })}
              placeholder="e.g. 10"
              required
            />
          </div>

          <div>
            <label>Study Session</label>
            <input
              type="time"
              value={formData.studySessions[0].startTime}
              onChange={(e) => setFormData({
                ...formData,
                studySessions: [{ ...formData.studySessions[0], startTime: e.target.value }]
              })}
              required
            />
            <span> to </span>
            <input
              type="time"
              value={formData.studySessions[0].endTime}
              onChange={(e) => setFormData({
                ...formData,
                studySessions: [{ ...formData.studySessions[0], endTime: e.target.value }]
              })}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Schedule'}
          </button>
        </form>
      </div>
    </>
  );
}

export default CreateSchedule;