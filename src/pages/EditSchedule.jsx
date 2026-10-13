import '../styling/CreateSchedule.css';
import Sidebar from '../components/Sidebar.jsx';
import Navigationbar from '../components/Navigationbar.jsx';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api.js';

function EditSchedule() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [removePdf, setRemovePdf] = useState(false);
  const [existingFileUrl, setExistingFileUrl] = useState(null);
  const [formData, setFormData] = useState({
    course: '',
    totalPages: '',
    totalDays: '',
    studySessions: [{ startTime: '', endTime: '' }],
  });

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        const response = await api.get(`/api/schedules/${id}`);
        const schedule = response.data.data.schedule;

        setFormData({
          course: schedule.course,
          totalPages: schedule.fileUrl ? '' : String(schedule.totalPages),
          totalDays: String(schedule.totalDays),
          studySessions: schedule.sessions.map((s) => ({
            startTime: s.startTime,
            endTime: s.endTime,
          })),
        });
        setExistingFileUrl(schedule.fileUrl);
      } catch (err) {
        if (err.response?.status === 401) {
          navigate('/');
        } else {
          setError(err.response?.data?.message || 'Failed to load schedule.');
        }
      } finally {
        setFetching(false);
      }
    };

    loadSchedule();
  }, [id, navigate]);

  const hasPdf = Boolean(existingFileUrl) && !removePdf && !pdfFile;
  const showManualPages = !pdfFile && (!existingFileUrl || removePdf);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = new FormData();
      data.append('course', formData.course);
      data.append('totalDays', formData.totalDays);
      data.append('studySessions', JSON.stringify(formData.studySessions));

      if (removePdf) {
        data.append('removePdf', 'true');
      }

      if (showManualPages && formData.totalPages) {
        data.append('totalPages', formData.totalPages);
      }

      if (pdfFile) {
        data.append('file', pdfFile);
      }

      await api.patch(`/api/schedules/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      navigate(`/schedule/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update schedule.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <>
        <Navigationbar
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          isOpen={sidebarOpen}
        />
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="create-schedule-page">
          <div className="create-schedule-container">
            <p className="schedule-loading">Loading schedule...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigationbar
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        isOpen={sidebarOpen}
      />

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="create-schedule-page">
        <div className="create-schedule-container">
          <h1>Edit Schedule Plan</h1>
          <p className="edit-schedule-note">
            Changing days, sessions, pages, or PDF will regenerate your daily tasks
            (progress on individual sessions will reset).
          </p>

          {error && <p className="schedule-error">{error}</p>}

          <form onSubmit={handleSubmit}>
            <div className="schedule-form-group">
              <label>Course Name</label>
              <input
                type="text"
                value={formData.course}
                onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                placeholder="e.g. Biology"
                required
              />
            </div>

            <div className="schedule-form-group">
              <label>Total Days</label>
              <input
                type="number"
                min="1"
                value={formData.totalDays}
                onChange={(e) => setFormData({ ...formData, totalDays: e.target.value })}
                placeholder="e.g. 10"
                required
              />
            </div>

            <div className="schedule-form-group">
              <label className="pdf-upload">
                <span>Upload a new PDF (optional)</span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => {
                    setPdfFile(e.target.files[0] || null);
                    if (e.target.files[0]) {
                      setRemovePdf(false);
                    }
                  }}
                />
              </label>

              {pdfFile && (
                <p className="pdf-selected">New file: {pdfFile.name}</p>
              )}

              {hasPdf && (
                <div className="current-pdf-row">
                  <p className="pdf-selected">
                    Current PDF attached ({existingFileUrl.split('/').pop()})
                  </p>
                  <label className="remove-pdf-label">
                    <input
                      type="checkbox"
                      checked={removePdf}
                      onChange={(e) => {
                        setRemovePdf(e.target.checked);
                        if (e.target.checked) {
                          setPdfFile(null);
                        }
                      }}
                    />
                    Remove PDF and use manual page count
                  </label>
                </div>
              )}
            </div>

            {showManualPages && (
              <div className="schedule-form-group">
                <label>Total Pages — required if no PDF</label>
                <input
                  type="number"
                  min="1"
                  value={formData.totalPages}
                  onChange={(e) =>
                    setFormData({ ...formData, totalPages: e.target.value })
                  }
                  placeholder="e.g. 200"
                  required={showManualPages}
                />
              </div>
            )}

            <div className="schedule-form-group">
              <label>Study Sessions per day</label>

              {formData.studySessions.map((session, index) => (
                <div key={index} className="session-row">
                  <span className="session-label">Session {index + 1}:</span>

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

                  <span className="session-to">to</span>

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
                      className="remove-session-btn"
                      onClick={() => {
                        const updated = formData.studySessions.filter(
                          (_, i) => i !== index
                        );
                        setFormData({ ...formData, studySessions: updated });
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}

              <button
                type="button"
                className="add-session-btn"
                onClick={() =>
                  setFormData({
                    ...formData,
                    studySessions: [
                      ...formData.studySessions,
                      { startTime: '', endTime: '' },
                    ],
                  })
                }
              >
                + Add Another Session
              </button>
            </div>

            <button
              type="submit"
              className="create-schedule-btn"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

export default EditSchedule;
