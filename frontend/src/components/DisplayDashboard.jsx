// frontend/src/components/DisplayDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Activity, Clock, Users, Bed, Stethoscope, LogOut } from 'lucide-react';

const DisplayDashboard = () => {
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [queue, setQueue] = useState([]);
  const [hospitalStats, setHospitalStats] = useState(null);

  // Update Clock Every Second
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Live Data Every 5 Seconds
  const fetchLiveData = async () => {
    try {
      const qRes = await axios.get('http://127.0.0.1:8000/live-queue');
      setQueue(qRes.data);
      
      const statRes = await axios.get('http://127.0.0.1:8000/hospital-live-status');
      setHospitalStats(statRes.data);
    } catch (err) { console.error("Error fetching live display data"); }
  };

  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Format Date & Time
  const dateString = time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const timeString = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div style={{ height: '100vh', width: '100vw', backgroundColor: '#020617', color: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* HEADER BAR */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px', backgroundColor: '#0f172a', borderBottom: '2px solid #1e293b' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Activity size={40} color="#0ea5e9" />
          <div>
            <h1 style={{ margin: 0, fontSize: '28px', letterSpacing: '2px' }}>HOSPITRAX</h1>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px', letterSpacing: '1px' }}>BY AARUGHA • LIVE OPERATIONS CENTER</p>
          </div>
        </div>
        
        <div style={{ textAlign: 'right' }}>
          <h2 style={{ margin: 0, fontSize: '36px', color: '#f8fafc', fontWeight: 'bold', fontFamily: 'monospace' }}>{timeString}</h2>
          <p style={{ margin: 0, color: '#0ea5e9', fontSize: '16px', fontWeight: 'bold' }}>{dateString}</p>
        </div>
      </header>

      {/* MAIN CONTENT GRID */}
      <main style={{ flex: 1, padding: '30px 40px', display: 'grid', gridTemplateColumns: '1fr 350px', gap: '30px' }}>
        
        {/* LEFT COLUMN: LIVE QUEUE */}
        <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b', overflow: 'hidden' }}>
            <div style={{ padding: '20px 30px', backgroundColor: '#1e293b', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Users size={28} color="#10b981" />
                <h2 style={{ margin: 0, fontSize: '24px' }}>Patient Queue</h2>
                <span style={{ marginLeft: 'auto', backgroundColor: '#10b981', color: 'black', padding: '4px 12px', borderRadius: '20px', fontWeight: 'bold', fontSize: '18px' }}>
                    {queue.length} Waiting
                </span>
            </div>
            
            <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {queue.length === 0 ? (
                    <div style={{ margin: 'auto', textAlign: 'center', color: '#64748b' }}>
                        <Clock size={64} style={{ opacity: 0.2, marginBottom: '15px' }} />
                        <h3 style={{ margin: 0 }}>Queue is currently empty.</h3>
                    </div>
                ) : (
                    queue.map((p, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', backgroundColor: '#1e293b', padding: '20px 30px', borderRadius: '12px', borderLeft: p.priority === 5 ? '8px solid #ef4444' : p.priority >= 3 ? '8px solid #f59e0b' : '8px solid #10b981' }}>
                            <div style={{ flex: 1 }}>
                                <h1 style={{ margin: 0, fontSize: '32px', color: 'white', letterSpacing: '1px' }}>{p.patient_id}</h1>
                                <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '16px' }}>{p.patient_name}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ display: 'inline-block', backgroundColor: '#0f172a', padding: '8px 16px', borderRadius: '8px', color: '#cbd5e1', fontSize: '18px', fontWeight: 'bold' }}>
                                    Priority {p.priority}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* RIGHT COLUMN: HOSPITAL STATS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            
            {/* DOCTOR STATUS CARD */}
            <div style={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b', padding: '25px' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 20px 0', color: '#0ea5e9', fontSize: '20px' }}>
                    <Stethoscope size={24} /> Active Doctors
                </h3>
                {hospitalStats?.doctor_list?.map((doc, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', backgroundColor: '#1e293b', borderRadius: '8px', marginBottom: '10px' }}>
                        <span style={{ fontSize: '18px', fontWeight: 'bold' }}>DR. {doc.name}</span>
                        <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '14px', fontWeight: 'bold', backgroundColor: doc.status === 'Available' ? '#10b98120' : '#ef444420', color: doc.status === 'Available' ? '#10b981' : '#ef4444' }}>
                            {doc.status.toUpperCase()}
                        </span>
                    </div>
                ))}
            </div>

            {/* BED STATUS CARD */}
            <div style={{ backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #1e293b', padding: '25px', flex: 1 }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 20px 0', color: '#a855f7', fontSize: '20px' }}>
                    <Bed size={24} /> Ward Status
                </h3>
                
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <p style={{ color: '#94a3b8', margin: '0 0 5px 0', fontSize: '14px' }}>TOTAL BEDS</p>
                    <h1 style={{ margin: 0, fontSize: '48px', color: 'white' }}>{hospitalStats?.beds?.total || 0}</h1>
                </div>

                <div style={{ display: 'flex', gap: '15px' }}>
                    <div style={{ flex: 1, backgroundColor: '#1e293b', padding: '15px', borderRadius: '12px', textAlign: 'center', borderTop: '4px solid #ef4444' }}>
                        <p style={{ color: '#94a3b8', margin: '0 0 5px 0', fontSize: '12px' }}>OCCUPIED</p>
                        <h2 style={{ margin: 0, color: '#ef4444', fontSize: '28px' }}>{hospitalStats?.beds?.occupied || 0}</h2>
                    </div>
                    <div style={{ flex: 1, backgroundColor: '#1e293b', padding: '15px', borderRadius: '12px', textAlign: 'center', borderTop: '4px solid #f59e0b' }}>
                        <p style={{ color: '#94a3b8', margin: '0 0 5px 0', fontSize: '12px' }}>CLEANING</p>
                        <h2 style={{ margin: 0, color: '#f59e0b', fontSize: '28px' }}>{hospitalStats?.beds?.cleaning || 0}</h2>
                    </div>
                </div>
            </div>

        </div>
      </main>

      {/* HIDDEN LOGOUT (Bottom Right Corner) */}
      <div style={{ position: 'absolute', bottom: '10px', right: '10px', opacity: 0.1, cursor: 'pointer' }} onClick={() => { localStorage.clear(); navigate('/login'); }}>
          <LogOut size={24} color="white" />
      </div>

    </div>
  );
};

export default DisplayDashboard;