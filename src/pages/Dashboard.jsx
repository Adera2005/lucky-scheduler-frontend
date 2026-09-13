import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api.js';

function Dashboard(){
const navigate = useNavigate();
const [schedules, setSchedules] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');


useEffect(() => {
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

  fetchSchedules();
}, []);
    return(
        <>
        <h1>Welcome to the lucky scheduler Dashboard</h1>
        <Link to="/create-schedule">
         <button>Create Schedule</button>
        </Link>
    {loading && <p>Loading your schedules...</p>}
    {error && <p style={{ color: 'red' }}>{error}</p>}

    {!loading && schedules.length === 0 && (
      <p>You have no schedules yet. Create one to get started.</p>
    )}

    {schedules.map((schedule) => (
      <div key={schedule.id}>
        <h3>{schedule.course}</h3>
        <p>{schedule.totalPages} pages — {schedule.totalDays} days</p>
        <p>Reading at: {schedule.preferredTime}</p>
        <Link to={`/schedule/${schedule.id}`}>
          <button>View Schedule</button>
        </Link>
      </div>
    ))}

        </>
    )
}
export default Dashboard