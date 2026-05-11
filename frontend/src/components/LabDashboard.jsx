// frontend/src/components/LabDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Microscope, Upload, FileCheck, LogOut, Activity, CheckCircle2 } from 'lucide-react';

const LabDashboard = () => {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [uploadingId, setUploadingId] = useState(null);
  const [resultText, setResultText] = useState('');

  const fetchTests = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/pending-lab-tests');
      setTests(res.data);
    } catch (err) { console.error("Lab fetch error", err); }
  };

  // Poll every 5 seconds to catch the "Green Signal" from Billing instantly
  useEffect(() => { 
    fetchTests(); 
    const interval = setInterval(fetchTests, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const handleUpload = async (recordId) => {
    if (!resultText.trim()) return alert("Please enter the diagnostic findings.");
    try {
      await axios.post('http://127.0.0.1:8000/upload-lab-result', {
        record_id: recordId,
        result_data: resultText
      });
      alert("✅ Document digitally attached to Patient Database.");
      setUploadingId(null);
      setResultText('');
      fetchTests();
    } catch (err) { alert("Upload failed."); }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#020617', color: 'white' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '280px', borderRight: '1px solid #1e293b', backgroundColor: '#0f172a', padding: '30px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '40px' }}>
          <Microscope size={36} color="#8b5cf6" />
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Diagnostics</h2>
        </div>
        
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', borderRadius: '8px', backgroundColor: '#8b5cf620', color: '#8b5cf6', fontWeight: 'bold' }}>
            <Activity size={20} /> Active Worklist
          </div>
        </nav>
        
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '1rem' }}>
          <LogOut size={20} /> Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: '50px', overflowY: 'auto' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Laboratory & Imaging Queue</h1>
        <p style={{ color: '#94a3b8', marginBottom: '30px' }}>Processing scans and tests for patients with cleared payments.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {tests.length === 0 ? (
            <div style={{ padding: '40px', backgroundColor: '#0f172a', borderRadius: '16px', color: '#64748b', gridColumn: '1 / -1', textAlign: 'center' }}>
              <FileCheck size={48} style={{ opacity: 0.5, marginBottom: '10px' }} />
              <p>No pending tests waiting for procedure.</p>
            </div>
          ) : (
            tests.map((test) => (
              <div key={test.record_id} style={{ backgroundColor: '#0f172a', borderLeft: '4px solid #8b5cf6', borderRadius: '12px', padding: '25px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <span style={{ color: '#8b5cf6', fontWeight: 'bold', fontSize: '1.2rem' }}>{test.patient_id}</span>
                  <div style={{ padding: '4px 10px', backgroundColor: '#14532d', borderRadius: '50px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <CheckCircle2 size={12} color="#4ade80" />
                    <span style={{ color: '#86efac', fontSize: '0.8rem', fontWeight: 'bold' }}>Bill Paid</span>
                  </div>
                </div>
                
                <h3 style={{ color: 'white', margin: '0 0 5px 0', fontSize: '1.3rem' }}>{test.test_required}</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', margin: '0 0 20px 0' }}>Ordered by: Dr. {test.doctor}</p>

                {uploadingId === test.record_id ? (
                  <div style={{ marginTop: 'auto' }}>
                    <textarea 
                      placeholder="Enter lab findings or paste secure document link..."
                      value={resultText}
                      onChange={(e) => setResultText(e.target.value)}
                      rows="4"
                      style={{ width: '100%', padding: '12px', backgroundColor: '#1e293b', border: '1px solid #334155', color: 'white', borderRadius: '8px', marginBottom: '10px', resize: 'vertical' }}
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => handleUpload(test.record_id)} style={{ flex: 1, padding: '10px', backgroundColor: '#8b5cf6', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                        Submit to EMR
                      </button>
                      <button onClick={() => { setUploadingId(null); setResultText(''); }} style={{ padding: '10px 20px', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setUploadingId(test.record_id)} 
                    style={{ marginTop: 'auto', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', backgroundColor: '#8b5cf620', border: '1px solid #8b5cf6', color: '#a78bfa', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                  >
                    <Upload size={18} /> Upload Results
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default LabDashboard;