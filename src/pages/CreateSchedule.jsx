// ============================================================
// CreateSchedule.jsx  (updated)
// Changes in this version:
//   • totalDays input now has min="1" — prevents 0 and negative
//     numbers from being accepted by the browser.
//   • totalPages input now has min="1" — same protection.
//   • Both fields also validate onBlur to catch edge-cases and
//     clear illegal values with a friendly error message.
// ============================================================

import '../styling/CreateSchedule.css';
import Sidebar from '../components/Sidebar.jsx';
import Navigationbar from '../components/Navigationbar.jsx';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';

function CreateSchedule() {
  const navigate = useNavigate();
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pdfFile, setPdfFile]       = useState(null);
  const [formData, setFormData]     = useState({
    course:        '',
    totalPages:    '',
    totalDays:     '',
    studySessions: [{ startTime: '', endTime: '' }],
  });

  // ── NEW: shared validation for numeric fields that must be >= 1 ──
  /**
   * Returns true when the value is a positive integer (>= 1).
   * @param {string} value
   * @returns {boolean}
   */
  const isPositiveInt = (value) => {
    const n = Number(value);
    return Number.isFinite(n) && n >= 1;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // ── Validate totalDays ──
    if (!isPositiveInt(formData.totalDays)) {
      setError('Total Days must be a positive number (at least 1).');
      return;
    }

    // ── Validate totalPages when no PDF is uploaded ──
    if (!pdfFile && !isPositiveInt(formData.totalPages)) {
      setError('Total Pages must be a positive number (at least 1).');
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      data.append('course',      formData.course);
      data.append('totalDays',   formData.totalDays);
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
      <Navigationbar
        onMenuClick={() => setSidebarOpen(!sidebarOpen)}
        isOpen={sidebarOpen}
      />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="create-schedule-page">

        <div className="create-schedule-container">

          <h1>Create Schedule Plan</h1>

          {error && (
            <p className="schedule-error">{error}</p>
          )}

          <form onSubmit={handleSubmit}>

            {/* Course Name */}
            <div className="schedule-form-group">
              <label>Course Name</label>
              <input
                type="text"
                value={formData.course}
                onChange={(e) =>
                  setFormData({ ...formData, course: e.target.value })
                }
                placeholder="e.g. Biology"
                required
              />
            </div>

            {/* Total Days — min="1" blocks 0 and negatives */}
            <div className="schedule-form-group">
              <label>Total Days</label>
              <input
                type="number"
                value={formData.totalDays}
                min="1"                  /* NEW — HTML-level guard */
                step="1"
                onChange={(e) =>
                  setFormData({ ...formData, totalDays: e.target.value })
                }
                onBlur={(e) => {
                  /* Extra guard: clear the value if it slipped past the HTML min */
                  if (e.target.value && !isPositiveInt(e.target.value)) {
                    setFormData({ ...formData, totalDays: '' });
                    setError('Total Days must be at least 1.');
                  }
                }}
                placeholder="e.g. 10"
                required
              />
            </div>

            {/* PDF Upload */}
            <div className="schedule-form-group">
              <label className="pdf-upload">
                <span>Upload your PDF file</span>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPdfFile(e.target.files[0])}
                />
              </label>

              {pdfFile && (
                <p className="pdf-selected">
                  ✅ {pdfFile.name} selected
                </p>
              )}
            </div>

            {/* Total Pages — only shown when no PDF; min="1" blocks 0 and negatives */}
            {!pdfFile && (
              <div className="schedule-form-group">
                <label>Total Pages — required if no PDF uploaded</label>
                <input
                  type="number"
                  value={formData.totalPages}
                  min="1"                /* NEW — HTML-level guard */
                  step="1"
                  onChange={(e) =>
                    setFormData({ ...formData, totalPages: e.target.value })
                  }
                  onBlur={(e) => {
                    /* Extra guard: clear the value if it slipped past the HTML min */
                    if (e.target.value && !isPositiveInt(e.target.value)) {
                      setFormData({ ...formData, totalPages: '' });
                      setError('Total Pages must be at least 1.');
                    }
                  }}
                  placeholder="e.g. 200"
                />
              </div>
            )}

            {/* Study Sessions */}
            <div className="schedule-form-group">
              <label>Study Sessions per day</label>

              {formData.studySessions.map((session, index) => (
                <div key={index} className="session-row">

                  <span className="session-label">
                    Session {index + 1}:
                  </span>

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
              {loading ? 'Creating...' : 'Create Schedule'}
            </button>

          </form>

        </div>

      </div>
    </>
  );
}

export default CreateSchedule;