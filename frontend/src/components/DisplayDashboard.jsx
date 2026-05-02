import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Monitor, Users, Bed, Clock, UserCheck, Timer } from 'lucide-react';

const DisplayDashboard = () => {
  const [stats, setStats] = useState(null);

  const fetchLiveStats = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/hospital-live-status');
      setStats(res.data);
    } catch (err) {
      console.error("Display sync error", err);
    }
  };

  // Auto-refresh every 10 seconds for real-time lobby updates
  useEffect(() => {
    fetchLiveStats();
    const interval = setInterval(fetchLiveStats, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!stats) return <div style={{ backgroundColor: '#020617', height: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Syncing with Hospital Core...</div>;

  return (
    <div style={{ height: '100vh', width: '100vw', backgroundColor: '#020617', color: 'white', padding: '40px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      
      {/* HEADER: DATE/TIME/HOSPITAL NAME */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1e293b', paddingBottom: '20px', marginBottom: '30px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Monitor size={48} color="#0ea5e9" />
          <h1 style={{ fontSize: '3rem', margin: 0, fontWeight: '800', letterSpacing: '-1px' }}>AARUGHA LIVE</h1>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '3.5rem', fontWeight: 'bold' }}>{stats.time}</div>
          <div style={{ color: '#94a3b8', fontSize: '1.2rem' }}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
        </div>
      </header>

      {/* MAIN GRID */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '30px' }}>
        
        {/* LEFT COLUMN: QUICK STATS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* QUEUE CARD */}
          <div style={{ backgroundColor: '#0ea5e9', padding: '40px', borderRadius: '24px', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={60} style={{ marginBottom: '10px' }} />
            <h2 style={{ margin: 0, fontSize: '2rem' }}>WAITING IN QUEUE</h2>
            <div style={{ fontSize: '8rem', fontWeight: '900', lineHeight: 1 }}>{stats.queue}</div>
          </div>

          {/* BEDS CARD */}
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '30px', borderRadius: '24px', flex: 1 }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.5rem', marginBottom: '20px', color: '#94a3b8' }}>
              <Bed size={32} /> BED AVAILABILITY
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, color: '#22c55e' }}>AVAILABLE</p>
                <p style={{ fontSize: '4rem', fontWeight: 'bold', margin: 0 }}>{stats.beds.available}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, color: '#ef4444' }}>OCCUPIED</p>
                <p style={{ fontSize: '4rem', fontWeight: 'bold', margin: 0 }}>{stats.beds.occupied}</p>
              </div>
            </div>
            <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#1e293b', borderRadius: '12px', textAlign: 'center' }}>
              <span style={{ color: '#f59e0b' }}>● {stats.beds.cleaning} BEDS BEING CLEANED</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DOCTOR STATUS TABLE */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '24px', padding: '40px' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '15px', fontSize: '2rem', marginBottom: '30px' }}>
            <UserCheck size={40} color="#0ea5e9" /> DOCTOR AVAILABILITY
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {stats.doctors.map((doc, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '25px', backgroundColor: '#1e293b', borderRadius: '16px' }}>
                <span style={{ fontSize: '2.2rem', fontWeight: '600' }}>Dr. {doc.name}</span>
                <span style={{ 
                  fontSize: '1.5rem', 
                  padding: '10px 30px', 
                  borderRadius: '50px', 
                  backgroundColor: doc.status === 'Available' ? '#14532d' : '#450a0a',
                  color: doc.status === 'Available' ? '#4ade80' : '#f87171',
                  border: `2px solid ${doc.status === 'Available' ? '#22c55e' : '#ef4444'}`
                }}>
                  {doc.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* TICKER FOOTER */}
      <footer style={{ marginTop: '30px', padding: '15px', backgroundColor: '#0ea5e910', border: '1px solid #0ea5e9', borderRadius: '12px', textAlign: 'center' }}>
        <p style={{ margin: 0, color: '#38bdf8', fontSize: '1.2rem', letterSpacing: '1px' }}>
          PLEASE MAINTAIN SILENCE • ALL PATIENTS MUST HAVE A VALID PATIENT ID • EMERGENCY CONTACT: 911
        </p>
      </footer>
    </div>
  );
};

export default DisplayDashboard;