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
  const [pdfFile, setPdfFile] = useState(null);
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
      const data = new FormData();
      data.append('course', formData.course);
      data.append('totalDays', formData.totalDays);
      data.append('studySessions', JSON.stringify(formData.studySessions));

      if (!pdfFile && formData.totalPages) {
        data.append('totalPages', formData.totalPages);
      }

      if (pdfFile) {
        data.append('file', pdfFile);
      }

      const response = await api.post('/api/schedules/generate', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

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

          <div style={{ marginBottom: '16px' }}>
            <label>Course Name</label>
            <input
              type="text"
              value={formData.course}
              onChange={(e) => setFormData({ ...formData, course: e.target.value })}
              placeholder="e.g. Biology"
              required
              style={{ display: 'block', marginTop: '6px', padding: '8px', width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label>Total Days</label>
            <input
              type="number"
              value={formData.totalDays}
              onChange={(e) => setFormData({ ...formData, totalDays: e.target.value })}
              placeholder="e.g. 10"
              required
              style={{ display: 'block', marginTop: '6px', padding: '8px', width: '100%' }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label>Upload PDF — pages counted automatically</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setPdfFile(e.target.files[0])}
              style={{ display: 'block', marginTop: '6px' }}
            />
            {pdfFile && <p style={{ color: 'green', marginTop: '6px' }}>✅ {pdfFile.name} selected</p>}
          </div>

          {!pdfFile && (
            <div style={{ marginBottom: '16px' }}>
              <label>Total Pages — required if no PDF uploaded</label>
              <input
                type="number"
                value={formData.totalPages}
                onChange={(e) => setFormData({ ...formData, totalPages: e.target.value })}
                placeholder="e.g. 200"
                style={{ display: 'block', marginTop: '6px', padding: '8px', width: '100%' }}
              />
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label>Study Sessions per day</label>

            {formData.studySessions.map((session, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                <span>Session {index + 1}:</span>
                <input
                  type="time"
                  value={session.startTime}
                  onChange={(e) => {
                    const updated = [...formData.studySessions];
                    updated[index].startTime = e.target.value;
                    setFormData({ ...formData, studySessions: updated });
                  }}
                  required
                />
                <span>to</span>
                <input
                  type="time"
                  value={session.endTime}
                  onChange={(e) => {
                    const updated = [...formData.studySessions];
                    updated[index].endTime = e.target.value;
                    setFormData({ ...formData, studySessions: updated });
                  }}
                  required
                />
                {formData.studySessions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = formData.studySessions.filter((_, i) => i !== index);
                      setFormData({ ...formData, studySessions: updated });
                    }}
                    style={{ background: 'red', color: 'white', border: 'none', padding: '4px 10px', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={() => setFormData({
                ...formData,
                studySessions: [...formData.studySessions, { startTime: '', endTime: '' }],
              })}
              style={{ background: '#333', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', marginTop: '12px' }}
            >
              + Add Another Session
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ background: '#1a1a2e', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '6px', cursor: 'pointer', marginTop: '10px', fontSize: '15px' }}
          >
            {loading ? 'Creating...' : 'Create Schedule'}
          </button>

        </form>
      </div>
    </>
  );
}

export default CreateSchedule;