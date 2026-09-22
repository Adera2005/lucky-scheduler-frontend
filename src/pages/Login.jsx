import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api.js';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/api/auth/login', formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('name', response.data.data.student.name);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fff', fontFamily: 'Arial, sans-serif', maxWidth: '430px', margin: '0 auto', position: 'relative', overflow: 'hidden' }}>
      
      {/* Yellow wave background */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '280px', background: 'linear-gradient(135deg, #FFB800 0%, #FFD700 100%)', borderBottomLeftRadius: '60% 40%', borderBottomRightRadius: '60% 40%', zIndex: 0 }} />
      
      {/* Inner wave */}
      <div style={{ position: 'absolute', top: 0, left: '-20px', right: '-20px', height: '220px', background: 'linear-gradient(135deg, #FFC300 0%, #FFE066 100%)', borderBottomLeftRadius: '50% 60%', borderBottomRightRadius: '80% 50%', zIndex: 1 }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2, padding: '60px 32px 40px' }}>
        
        {/* Title */}
        <h1 style={{ fontSize: '42px', fontWeight: '800', color: '#111', marginTop: '140px', marginBottom: '40px' }}>Login</h1>

        {error && (
          <div style={{ background: '#fff0f0', border: '1px solid #ffcccc', color: '#cc0000', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          {/* Email input */}
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1.5px solid #FFB800', marginBottom: '28px', paddingBottom: '8px' }}>
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

          {/* Password input */}
          <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1.5px solid #FFB800', marginBottom: '16px', paddingBottom: '8px' }}>
            <span style={{ marginRight: '12px', fontSize: '18px' }}>🔒</span>
            <input
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Password"
              required
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: '16px', background: 'transparent', color: '#333' }}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{ cursor: 'pointer', fontSize: '16px', color: '#888' }}
            >
              {showPassword ? '🙈' : '👁️'}
            </span>
          </div>

          {/* Login button */}
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
              marginTop: '32px',
              letterSpacing: '1px',
              boxShadow: '0 4px 15px rgba(255, 184, 0, 0.4)',
              transition: 'all 0.2s ease',
            }}
          >
            {loading ? 'Logging in...' : 'LOGIN'}
          </button>
        </form>

        {/* Sign up link */}
        <p style={{ textAlign: 'center', marginTop: '28px', fontSize: '14px', color: '#555' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: '#FFB800', fontWeight: '700', textDecoration: 'none' }}>
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;