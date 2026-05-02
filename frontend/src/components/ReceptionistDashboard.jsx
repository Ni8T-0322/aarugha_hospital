import React from 'react';
import { useNavigate } from 'react-router-dom';

const ReceptionistDashboard = () => {
  const navigate = useNavigate();
  return (
    <div style={{ padding: '50px', textAlign: 'center', color: 'white' }}>
      <h1>Front Desk Portal</h1>
      <p>Welcome, Receptionist. (We will build this out next!)</p>
      <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="action-button">
        Logout
      </button>
    </div>
  );
};
export default ReceptionistDashboard;