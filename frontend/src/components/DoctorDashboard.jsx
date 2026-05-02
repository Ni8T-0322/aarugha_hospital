// frontend/src/components/DoctorDashboard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Stethoscope, Search, FileText, LogOut, PlusCircle, Clock, User } from 'lucide-react';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  // Grab the doctor's email that we saved in localStorage during login!
  const doctorEmail = localStorage.getItem('email'); 

  // Search State
  const [searchId, setSearchId] = useState('');
  const [patientData, setPatientData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Medical Record Form State
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [notes, setNotes] = useState('');

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // 1. Search for Patient
  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPatientData(null);

    try {
      // Auto-format the ID just in case they type 'pat-1000'
      const formattedId = searchId.toUpperCase().trim();
      const response = await axios.get(`http://127.0.0.1:8000/patient/${formattedId}`);
      
      setPatientData({ id: formattedId, ...response.data });
    } catch (err) {
      setError(err.response?.data?.detail || "Patient ID not found in system.");
    } finally {
      setLoading(false);
    }
  };

  // 2. Submit New Medical Record
  const handleSubmitRecord = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        patient_id: patientData.id,
        doctor_email: doctorEmail,
        diagnosis: diagnosis,
        prescription: prescription,
        notes: notes
      };

      const response = await axios.post('http://127.0.0.1:8000/add-medical-record', payload);
      alert(`✅ ${response.data.message}`);
      
      // Clear the form
      setDiagnosis('');
      setPrescription('');
      setNotes('');
      
      // Silently refresh the patient data so the new record appears in the history instantly
      const refreshResponse = await axios.get(`http://127.0.0.1:8000/patient/${patientData.id}`);
      setPatientData({ id: patientData.id, ...refreshResponse.data });

    } catch (err) {
      alert("❌ Error saving record: " + (err.response?.data?.detail || "System error."));
    }
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <Stethoscope size={32} color="#10b981" />
          <h2>Clinical Portal</h2>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-item active" style={{ cursor: 'default' }}>
            <FileText size={20} /> EMR Access
          </div>
        </nav>
        
        <button onClick={handleLogout} className="logout-button">
          <LogOut size={20} /> Secure Logout
        </button>
      </aside>

      <main className="main-content">
        <header className="content-header">
          <h1>Electronic Medical Records</h1>
          <p>Search patient database and update clinical charts.</p>
        </header>

        {/* --- SEARCH BAR --- */}
        <div className="form-card" style={{ marginBottom: '20px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
            <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
              <label>Enter Patient ID</label>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input 
                  type="text" 
                  value={searchId} 
                  onChange={(e) => setSearchId(e.target.value)} 
                  placeholder="e.g., PAT-1000"
                  style={{ paddingLeft: '40px' }}
                  required 
                />
              </div>
            </div>
            <button type="submit" className="action-button" style={{ width: 'auto', padding: '12px 30px' }} disabled={loading}>
              {loading ? 'Searching...' : 'Pull Chart'}
            </button>
          </form>
          {error && <p style={{ color: '#ef4444', marginTop: '10px', fontSize: '14px' }}>{error}</p>}
        </div>

        {/* --- PATIENT DATA VIEW --- */}
        {patientData && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            
            {/* LEFT COLUMN: History & Info */}
            <div>
              <div className="form-card" style={{ marginBottom: '20px', backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
                <h3 style={{ color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                  <User size={20} color="#38bdf8" /> Patient Profile
                </h3>
                <p style={{ color: '#94a3b8', marginBottom: '5px' }}><strong>Name:</strong> <span style={{ color: '#e2e8f0' }}>{patientData.patient_name}</span></p>
                <p style={{ color: '#94a3b8', marginBottom: '5px' }}><strong>ID:</strong> <span style={{ color: '#e2e8f0' }}>{patientData.id}</span></p>
                <p style={{ color: '#94a3b8' }}><strong>Phone:</strong> <span style={{ color: '#e2e8f0' }}>{patientData.patient_phone}</span></p>
              </div>

              <div className="form-card" style={{ padding: '20px' }}>
                <h3 style={{ color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
                  <Clock size={20} color="#10b981" /> Clinical History
                </h3>
                
                {patientData.history.length === 0 ? (
                  <p style={{ color: '#64748b', fontStyle: 'italic' }}>No prior records found for this patient.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: '400px', overflowY: 'auto' }}>
                    {/* Maps through history in reverse to show newest first */}
                    {[...patientData.history].reverse().map((record, index) => (
                      <div key={index} style={{ padding: '15px', backgroundColor: '#1e293b', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                        <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>{record.date} • Dr. {record.doctor_email.split('@')[0]}</p>
                        <p style={{ color: '#f8fafc', marginBottom: '5px' }}><strong>Diagnosis:</strong> {record.diagnosis}</p>
                        <p style={{ color: '#f8fafc', marginBottom: '5px' }}><strong>Rx:</strong> {record.prescription}</p>
                        <p style={{ color: '#cbd5e1', fontSize: '14px', marginTop: '8px' }}><em>"{record.notes}"</em></p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Add New Record Form */}
            <div className="form-card">
              <h3 style={{ color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <PlusCircle size={20} color="#0ea5e9" /> Add Clinical Note
              </h3>
              
              <form onSubmit={handleSubmitRecord}>
                <div className="input-group">
                  <label>Primary Diagnosis</label>
                  <input type="text" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="e.g., Acute Bronchitis" required />
                </div>

                <div className="input-group">
                  <label>Prescription (Rx)</label>
                  <input type="text" value={prescription} onChange={(e) => setPrescription(e.target.value)} placeholder="e.g., Amoxicillin 500mg, 3x daily" required />
                </div>

                <div className="input-group">
                  <label>Clinical Notes</label>
                  <textarea 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    placeholder="Patient reports symptoms started 3 days ago..." 
                    rows="4" 
                    required 
                    style={{ width: '100%', padding: '12px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: 'white' }}
                  />
                </div>

                <button type="submit" className="action-button" style={{ backgroundColor: '#10b981', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                  <FileText size={18} /> Sign & Save Record
                </button>
              </form>
            </div>
            
          </div>
        )}
      </main>
    </div>
  );
};

export default DoctorDashboard;