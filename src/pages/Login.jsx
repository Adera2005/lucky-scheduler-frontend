import { useState } from 'react';
import { useNavigate,Link } from 'react-router-dom';
import api from '../services/api.js'



function Login(){

const navigate = useNavigate();
const [formData,setFormData] = useState({
email: '',
password: '',
});
const [error,setError] = useState('');
const [loading,setLoading] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    const response = await api.post('/api/auth/login', formData);
    localStorage.setItem('token', response.data.token);
    navigate('/dashboard');
  } catch (err) {
    setError(err.response?.data?.message || 'Login failed. Please try again.');
  } finally {
    setLoading(false);
  }
};



    return(
        <>
        <h1>Login</h1>

    {error && <p style={{ color: 'red' }}>{error}</p>}

    <form onSubmit={handleSubmit}>
      <div>
        <label>Email</label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Enter your email"
          required
        />
      </div>

      <div>
        <label>Password</label>
        <input
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          placeholder="Enter your password"
          required
        />
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>

    <p>Don't have an account? <Link to="/signup">Sign up</Link></p>
        </>
    )
}
export default Login