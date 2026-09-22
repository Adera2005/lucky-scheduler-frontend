import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api.js';

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/api/auth/signup', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('name', response.data.data.student.name);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Arial, sans-serif', maxWidth: '430px', margin: '0 auto', position: 'relative', overflow: 'hidden' }}>

      {/* Yellow wave background */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '200px', background: 'linear-gradient(135deg, #FFB800 0%, #FFD700 100%)', borderBottomLeftRadius: '60% 40%', borderBottomRightRadius: '60% 40%', zIndex: 0 }} />
      <div style={{ position: 'absolute', top: 0, left: '-20px', right: '-20px', height: '160px', background: 'linear-gradient(135deg, #FFC300 0%, #FFE066 100%)', borderBottomLeftRadius: '50% 60%', borderBottomRightRadius: '80% 50%', zIndex: 1 }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, padding: '60px 32px 40px' }}>

        <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#111', marginTop: '100px', marginBottom: '30px' }}>Create an account</h1>

        {error && (
          <div style={{ background: '#fff0f0', border: '1px solid #ffcccc', color: '#cc0000', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Name */}
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1.5px solid #FFB800', marginBottom: '24px', paddingBottom: '8px' }}>
            <span style={{ marginRight: '12px', fontSize: '18px' }}>👤</span>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Name"
              required
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '16px', background: 'transparent', color: '#333' }}
            />
          </div>

          {/* Email */}
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1.5px solid #FFB800', marginBottom: '24px', paddingBottom: '8px' }}>
            <span style={{ marginRight: '12px', fontSize: '18px' }}>✉️</span>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Email"
              required
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '16px', background: 'transparent', color: '#333' }}
            />
          </div>

          {/* Password */}
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1.5px solid #FFB800', marginBottom: '24px', paddingBottom: '8px' }}>
            <span style={{ marginRight: '12px', fontSize: '18px' }}>🔒</span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Password"
              required
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '16px', background: 'transparent', color: '#333' }}
            />
            <span onClick={() => setShowPassword(!showPassword)} style={{ cursor: 'pointer', fontSize: '16px', color: '#888' }}>
              {showPassword ? '🙈' : '👁️'}
            </span>
          </div>

          {/* Confirm Password */}
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1.5px solid #FFB800', marginBottom: '24px', paddingBottom: '8px' }}>
            <span style={{ marginRight: '12px', fontSize: '18px' }}>🔒</span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="Confirm Password"
              required
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '16px', background: 'transparent', color: '#333' }}
            />
          </div>

          {/* Signup button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: loading ? '#FFD700' : '#FFB800',
              color: '#111',
              border: 'none',
              borderRadius: '30px',
              fontSize: '16px',
              fontWeight: '800',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '16px',
              letterSpacing: '1px',
              boxShadow: '0 4px 15px rgba(255, 184, 0, 0.4)',
            }}
          >
            {loading ? 'Creating account...' : 'SIGN UP'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#555' }}>
          Already have an account?{' '}
          <Link to="/" style={{ color: '#FFB800', fontWeight: '700', textDecoration: 'none' }}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;