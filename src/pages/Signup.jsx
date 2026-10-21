// ============================================================
// Signup.jsx  (updated)
// Changes in this version:
//   • Imports PasswordStrengthMeter and the analysePassword helper
//     from the new PasswordStrengthMeter component.
//   • handleSubmit now blocks submission when the password does
//     NOT satisfy all strength rules (uses analysePassword).
//   • The PasswordStrengthMeter bar is rendered below the
//     password field so the user can see progress in real-time.
// ============================================================

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api.js';
import '../styling/Signup.css';
import eyeOpen from '../assets/eye-svgrepo-com.svg';
import eyeClose from '../assets/eye-closed-svgrepo-com.svg';
// NEW — password strength bar & analysis helper
import PasswordStrengthMeter, {
  analysePassword,
} from '../components/PasswordStrengthMeter.jsx';


function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError]                       = useState('');
  const [loading, setLoading]                   = useState(false);
  const [showPassword, setShowPassword]         = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ── NEW: Require a strong password before the form can be submitted ──
    const strength = analysePassword(formData.password);
    if (!strength.isStrong) {
      setError(
        'Please choose a stronger password. It must have at least 8 characters, ' +
        'an uppercase letter, a lowercase letter, a number, and a special character.'
      );
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/auth/signup', {
        name:     formData.name,
        email:    formData.email,
        password: formData.password,
      });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('name', response.data.data.student.name);
      navigate('/dashboard');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Signup failed. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">

      <div className="signup-blue">
        <h1>Create an account</h1>
        <p>Sign up to start managing your study schedule.</p>
      </div>

      <div className="signup-white">

        <h2>Sign Up</h2>

        {error && (
          <div className="signup-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Name */}
          <div className="signup-field">
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter your name"
              required
            />
          </div>

          {/* Email */}
          <div className="signup-field">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="Enter your email"
              required
            />
          </div>

          {/* Password */}
          <div className="signup-field">
            <label>Password</label>

            <div className="signup-password-box">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Enter your password"
                required
              />
              <span onClick={() => setShowPassword(!showPassword)}>
                {showPassword
                  ? <img src={eyeOpen}  alt="Hide Password" />
                  : <img src={eyeClose} alt="Show Password" />
                }
              </span>
            </div>

            {/* NEW — real-time password strength bar */}
            <PasswordStrengthMeter password={formData.password} />
          </div>

          {/* Confirm Password */}
          <div className="signup-field">
            <label>Confirm Password</label>

            <div className="signup-password-box">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
                }
                placeholder="Confirm your password"
                required
              />
              <span
                onClick={() =>
                  setShowConfirmPassword(!showConfirmPassword)
                }
              >
                {showConfirmPassword
                  ? <img src={eyeOpen}  alt="Hide Confirm Password" />
                  : <img src={eyeClose} alt="Show Confirm Password" />
                }
              </span>
            </div>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Creating account...' : 'SIGN UP'}
          </button>

        </form>

        <p className="login-text">
          Already have an account?{' '}
          <Link to="/">Login</Link>
        </p>

      </div>
    </div>
  );
}

export default Signup;