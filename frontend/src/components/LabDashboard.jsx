import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Microscope, Upload, FileCheck, Search, LogOut, Activity } from 'lucide-react';

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

  useEffect(() => { fetchTests(); }, []);

  const handleUpload = async (recordId) => {
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
    <div className="dashboard-container" style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#020617' }}>
      {/* Sidebar */}
      <aside className="sidebar" style={{ width: '260px', borderRight: '1px solid #1e293b' }}>
        <div className="sidebar-header">
          <Microscope size={32} color="#8b5cf6" />
          <h2>Lab & Scans</h2>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-item active"><Activity size={20} /> Test Queue</div>
        </nav>
        <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="logout-button">
          <LogOut size={20} /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content" style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        <header className="content-header">
          <h1>Diagnostic Worklist</h1>
          <p>Processing scans and tests for cleared payments.</p>
        </header>

        <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {tests.length === 0 ? (
            <p style={{ color: '#64748b' }}>No pending tests waiting for procedure.</p>
          ) : (
            tests.map((test) => (
              <div key={test.record_id} className="form-card" style={{ borderLeft: '4px solid #8b5cf6' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#8b5cf6', fontWeight: 'bold' }}>{test.patient_id}</span>
                  <span style={{ color: '#22c55e', fontSize: '12px' }}>● Bill Paid</span>
                </div>
                <h3 style={{ color: 'white', margin: '10px 0' }}>{test.test_required}</h3>
                <p style={{ color: '#94a3b8', fontSize: '13px' }}>Ordered by: {test.doctor}</p>

                {uploadingId === test.record_id ? (
                  <div style={{ marginTop: '15px' }}>
                    <textarea 
                      placeholder="Enter lab findings or paste document link..."
                      value={resultText}
                      onChange={(e) => setResultText(e.target.value)}
                      style={{ width: '100%', padding: '10px', backgroundColor: '#0f172a', border: '1px solid #1e293b', color: 'white', borderRadius: '8px' }}
                    />
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                      <button onClick={() => handleUpload(test.record_id)} className="action-button" style={{ backgroundColor: '#8b5cf6' }}>Submit</button>
                      <button onClick={() => setUploadingId(null)} className="action-button" style={{ backgroundColor: '#334155' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setUploadingId(test.record_id)} 
                    className="action-button" 
                    style={{ marginTop: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
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