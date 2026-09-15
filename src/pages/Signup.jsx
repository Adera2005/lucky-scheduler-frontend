import { useState } from "react";
import { useNavigate,Link } from "react-router-dom";
import api from "../services/api.js";

function Signup(){

const navigate = useNavigate();
const [formData,setFormData] = useState({
    name: '',
    email: '',
    password: '',
})

const [error,setError] = useState('')
const [loading,setLoading] = useState(false);

const handleSubmit = async (e) =>{
    e.preventDefault();
    setLoading(true);
    setError('');

    try{
        const response = await api.post('/api/auth/signup',formData);
        localStorage.setItem('token', response.data.token);
    navigate('/dashboard');
    }
    catch (err) {
    setError(err.response?.data?.message || 'Signup failed. Please try again.');
  } finally {
    setLoading(false);
  }
}

    return (
  <>
    <h1>Sign Up</h1>

    {error && <p style={{ color: 'red' }}>{error}</p>}

    <form onSubmit={handleSubmit}>
      <div>
        <label>Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter your name"
          required
        />
      </div>

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
        {loading ? 'Creating account...' : 'Sign Up'}
      </button>
    </form>

    <p>Already have an account? <Link to="/">Login</Link></p>
  </>
);
}
export default Signup