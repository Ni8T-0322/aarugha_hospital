// frontend/src/components/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Activity, User, Lock } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); 
    setError('');

    try {
      // Talk to the Python server
      const response = await axios.post('http://127.0.0.1:8000/login', {
        username: username,
        password: password
      });

      // Securely store the token and role in the browser
      localStorage.setItem('access_token', response.data.access_token); 
      localStorage.setItem('role', response.data.role);
      localStorage.setItem('email', username);

      // Redirect them based on their role
      const userRole = response.data.role;
      if (userRole === 'Admin') navigate('/admin');
      else if (userRole === 'Receptionist') navigate('/receptionist'); 
      else if (userRole === 'Doctor') navigate('/doctor');
      else if (userRole === 'Pharmacist') navigate('/pharmacy');
      else if (userRole === 'Billing') navigate('/billing'); // Fixed!
      else if (userRole === 'Display') navigate('/display'); // Fixed!
      else if (userRole === 'Patient') navigate('/patient');
      
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to connect to the hospital server.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="logo-section">
          <Activity size={48} color="#0ea5e9" />
          <h1>HOSPITRAX</h1>
          <p style={{ letterSpacing: '2px', fontWeight: 'bold', color: '#94a3b8' }}>BY AARUGHA</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <User className="input-icon" size={20} />
            <input 
              type="text" 
              placeholder="Email or Patient ID" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>

          <div className="input-group">
            <Lock className="input-icon" size={20} />
            <input 
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>

          <button type="submit" className="login-button">
            Secure Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;