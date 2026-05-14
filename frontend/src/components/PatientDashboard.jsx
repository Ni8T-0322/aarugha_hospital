import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  HeartPulse, FileText, IndianRupee, Pill, 
  Microscope, LogOut, PhoneCall, History, 
  UserCircle, Calendar, CheckCircle2, Bed 
} from 'lucide-react';

const PatientDashboard = () => {
  const navigate = useNavigate();
  const patientId = localStorage.getItem('email'); 
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPortal = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:8000/patient-portal-full/${patientId}`);
        setData(res.data);
      } catch (err) {
        console.error("Portal access error", err);
      } finally {
        setLoading(false);
      }
    };
    loadPortal();
  }, [patientId]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617', color: 'white' }}>
      <HeartPulse className="animate-pulse" size={48} color="#0ea5e9" />
    </div>
  );

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#020617', color: '#f8fafc', overflow: 'hidden' }}>
      
      {/* SIDE NAVIGATION */}
      <aside style={{ width: '300px', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column', padding: '30px', backgroundColor: '#0f172a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '40px' }}>
          <HeartPulse size={36} color="#0ea5e9" />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '-0.5px' }}>AARUGHA</h2>
        </div>

        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', marginBottom: '30px' }}>
          <UserCircle size={40} color="#38bdf8" style={{ marginBottom: '10px' }} />
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{data.profile.name}</h3>
          {/* FIXED: ID Lookup */}
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '4px' }}>ID: {data.profile.patient_id}</p>
        </div>

        <nav style={{ flex: 1 }}>
          <div style={{ color: '#38bdf8', backgroundColor: '#0ea5e915', padding: '12px', borderRadius: '8px', display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <History size={20} /> My Records
          </div>
        </nav>

        <button onClick={handleLogout} className="logout-button" style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
          <LogOut size={20} /> Secure Logout
        </button>
      </aside>

      {/* MAIN HEALTH FEED */}
      <main style={{ flex: 1, padding: '50px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', margin: 0 }}>Health Timeline</h1>
            <p style={{ color: '#94a3b8' }}>Your digital medical journey and clinical updates.</p>
          </div>
          <button className="action-button" style={{ width: 'auto', padding: '12px 24px', backgroundColor: '#f59e0b', color: 'black', fontWeight: '600', display: 'flex', gap: '8px', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
            <PhoneCall size={20} /> Emergency Assistance
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '30px' }}>
          
          {/* COLUMN 1: CLINICAL NOTES */}
          <section>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', color: '#38bdf8' }}>Medical History</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {data.history.map((record, i) => {
                const isFacility = record.type === 'Discharge/Facility';
                // Clean up the doctor's name format
                const docName = record.doctor.includes('+') ? record.doctor.split('+')[1].split('@')[0].toUpperCase() : 'HOSPITAL STAFF';

                return (
                  <div key={i} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '0.9rem' }}>
                        <Calendar size={16} /> {record.date}
                      </div>
                      <span style={{ color: '#0ea5e9', fontSize: '0.85rem', fontWeight: '600' }}>Dr. {docName}</span>
                    </div>
                    
                    <h4 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>{record.diagnosis}</h4>
                    <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                      <div style={{ flex: 1, backgroundColor: '#1e293b', padding: '12px', borderRadius: '8px' }}>
                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 4px 0' }}>
                          {isFacility ? 'FACILITY DETAILS' : 'PRESCRIPTION'}
                        </p>
                        <p style={{ margin: 0, color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                           {isFacility ? <Bed size={16} color="#a855f7" /> : <Pill size={16} color="#10b981" />} 
                           {record.prescription}
                        </p>
                      </div>
                    </div>

                    {record.lab_result && record.lab_result !== "N/A" && (
                      <div style={{ borderTop: '1px dashed #334155', paddingTop: '15px', marginTop: '10px' }}>
                        <p style={{ fontSize: '0.75rem', color: '#8b5cf6', margin: '0 0 5px 0' }}>LAB FINDINGS</p>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                          <Microscope size={18} color="#8b5cf6" />
                          <p style={{ margin: 0, fontSize: '0.95rem' }}>{record.lab_result}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* COLUMN 2: BILLING & CLEARANCE */}
          <section>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', color: '#22c55e' }}>Financial Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {data.history.filter(r => r.price > 0).map((bill, i) => (
                <div key={i} style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: '500' }}>{bill.diagnosis}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                      {bill.status === 'Paid' ? (
                        <><CheckCircle2 size={14} color="#22c55e" /> <span style={{ color: '#22c55e', fontSize: '0.8rem' }}>Payment Confirmed</span></>
                      ) : (
                        <><IndianRupee size={14} color="#f59e0b" /> <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}>Waiting at Billing Desk</span></>
                      )}
                    </div>
                  </div>
                  <p style={{ fontSize: '1.4rem', fontWeight: 'bold', margin: 0 }}>₹{bill.price}</p>
                </div>
              ))}
              {data.history.filter(r => r.price > 0).length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', border: '2px dashed #1e293b', borderRadius: '16px', color: '#64748b' }}>
                  No active bills or outstanding dues.
                </div>
              )}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;