// frontend/src/components/DoctorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Stethoscope, Search, FileText, LogOut, PlusCircle, Clock, User, List, Activity, UserCheck, AlertCircle } from 'lucide-react';

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const doctorEmail = localStorage.getItem('email'); 
  const doctorName = doctorEmail ? doctorEmail.split('+')[1].split('@')[0].toUpperCase() : 'DOCTOR';

  // State Management
  const [activeTab, setActiveTab] = useState('queue'); // 'queue', 'consultation', 'search'
  const [doctorStatus, setDoctorStatus] = useState('Available');
  const [queue, setQueue] = useState([]);
  const [currentPatient, setCurrentPatient] = useState(null);
  const [patientHistory, setPatientHistory] = useState([]);
  const [searchId, setSearchId] = useState('');

  // Clinical Form State
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [labTest, setLabTest] = useState('');
  const [notes, setNotes] = useState('');
  const [needsAdmission, setNeedsAdmission] = useState(false);

  // 1. Fetch Live Queue
  const fetchQueue = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/live-queue');
      setQueue(res.data);
    } catch (err) { console.error("Queue fetch error", err); }
  };

  // Poll the queue every 5 seconds
  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  // Update Doctor Status in Database
  const updateStatus = async (newStatus) => {
    setDoctorStatus(newStatus);
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // 2. Call Next Patient & Fetch Vitals
  const handleCallPatient = async (patient) => {
    setActiveTab('consultation');
    updateStatus('Busy');
    
    try {
      const res = await axios.get(`http://127.0.0.1:8000/patient/${patient.patient_id}`);
      setCurrentPatient({
        ...patient,
        age: res.data.age,
        gender: res.data.gender,
        blood_group: res.data.blood_group,
        patient_phone: res.data.patient_phone
      });
      setPatientHistory(res.data.history || []);
    } catch (err) {
      setCurrentPatient(patient);
      setPatientHistory([]);
    }
  };

  // 3. Search Manual ID (Fallback)
  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const formattedId = searchId.toUpperCase().trim();
      const res = await axios.get(`http://127.0.0.1:8000/patient/${formattedId}`);
      setCurrentPatient({ 
        patient_id: formattedId, 
        patient_name: res.data.patient_name,
        age: res.data.age,
        gender: res.data.gender,
        blood_group: res.data.blood_group,
        patient_phone: res.data.patient_phone
      });
      setPatientHistory(res.data.history || []);
      setActiveTab('consultation');
      updateStatus('Busy');
    } catch (err) {
      alert("Patient ID not found in system.");
    }
  };

  // 4. Submit Consultation & Clear Patient
  const handleSubmitRecord = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        patient_id: currentPatient.patient_id,
        doctor_email: doctorEmail,
        diagnosis: diagnosis,
        prescription: prescription || "None",
        notes: notes,
        status: "Waiting Payment", 
        type: "Consultation/Pharmacy"
      };
      
      await axios.post('http://127.0.0.1:8000/add-medical-record', payload);

      if (labTest) {
        await axios.post('http://127.0.0.1:8000/add-medical-record', {
            ...payload,
            diagnosis: labTest, 
            prescription: "N/A",
            type: "Lab/Scan"
        });
      }

      alert(`✅ Consultation Finished for ${currentPatient.patient_name}.\nRecords sent to Pharmacy${labTest ? ' & Lab' : ''} waiting on Billing clearance.${needsAdmission ? '\n⚠️ Admission request sent to Reception.' : ''}`);
      
      setDiagnosis(''); setPrescription(''); setLabTest(''); setNotes(''); setNeedsAdmission(false);
      setCurrentPatient(null);
      setActiveTab('queue');
      updateStatus('Available');
      fetchQueue();

    } catch (err) {
      alert("❌ Error saving record.");
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#020617', color: 'white' }}>
      
      {/* SIDEBAR */}
      <aside style={{ width: '280px', borderRight: '1px solid #1e293b', backgroundColor: '#0f172a', padding: '30px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
          <Stethoscope size={36} color="#10b981" />
          <div>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Dr. {doctorName}</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>Clinical Portal</p>
          </div>
        </div>

        {/* STATUS TOGGLE */}
        <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#1e293b', borderRadius: '8px' }}>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '8px' }}>Current Status</p>
            <select 
                value={doctorStatus} 
                onChange={(e) => updateStatus(e.target.value)}
                style={{ width: '100%', padding: '8px', borderRadius: '5px', border: 'none', backgroundColor: '#0f172a', color: doctorStatus === 'Available' ? '#10b981' : doctorStatus === 'Busy' ? '#ef4444' : '#f59e0b', fontWeight: 'bold' }}
            >
                <option value="Available">🟢 Available</option>
                <option value="Busy">🔴 Busy / In Consult</option>
                <option value="Away">🟠 Away / Break</option>
            </select>
        </div>
        
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button 
            onClick={() => setActiveTab('queue')}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'queue' ? '#10b98120' : 'transparent', color: activeTab === 'queue' ? '#10b981' : '#94a3b8', cursor: 'pointer', textAlign: 'left', fontSize: '1rem' }}
          >
            <div style={{ display: 'flex', gap: '12px' }}><List size={20} /> Live Queue</div>
            <span style={{ backgroundColor: '#10b981', color: 'black', padding: '2px 8px', borderRadius: '10px', fontSize: '0.8rem', fontWeight: 'bold' }}>{queue.length}</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('search')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '15px', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'search' ? '#10b98120' : 'transparent', color: activeTab === 'search' ? '#10b981' : '#94a3b8', cursor: 'pointer', textAlign: 'left', fontSize: '1rem' }}
          >
            <Search size={20} /> Find Patient
          </button>
        </nav>
        
        <button onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: '1rem' }}>
          <LogOut size={20} /> Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, padding: '50px', overflowY: 'auto' }}>
        
        {/* TAB 1: LIVE QUEUE */}
        {activeTab === 'queue' && (
          <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Waiting Room</h1>
            <p style={{ color: '#94a3b8', marginBottom: '30px' }}>Patients sent from reception, sorted by emergency priority.</p>
            
            <div style={{ display: 'grid', gap: '15px' }}>
                {queue.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#0f172a', borderRadius: '16px', color: '#64748b' }}>
                        <Activity size={48} style={{ opacity: 0.5, marginBottom: '10px' }} />
                        <p>The queue is currently empty.</p>
                    </div>
                ) : (
                    queue.map((p, idx) => (
                        <div key={idx} style={{ backgroundColor: '#0f172a', borderLeft: `5px solid ${p.priority === 5 ? '#ef4444' : p.priority >= 3 ? '#f59e0b' : '#10b981'}`, borderRadius: '8px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{p.patient_name} <span style={{ color: '#94a3b8', fontSize: '0.9rem', marginLeft: '10px' }}>({p.patient_id})</span></h3>
                                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '5px 0 0 0' }}>Queued at: {p.timestamp} • Priority: {p.priority}</p>
                            </div>
                            <button onClick={() => handleCallPatient(p)} className="action-button" style={{ width: 'auto', padding: '10px 20px', backgroundColor: '#10b981' }}>
                                Call Next
                            </button>
                        </div>
                    ))
                )}
            </div>
          </div>
        )}

        {/* TAB 2: MANUAL SEARCH */}
        {activeTab === 'search' && (
            <div>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '30px' }}>EMR Database Lookup</h1>
                <div className="form-card" style={{ maxWidth: '600px' }}>
                    <form onSubmit={handleSearch} style={{ display: 'flex', gap: '15px' }}>
                        <input type="text" value={searchId} onChange={(e) => setSearchId(e.target.value)} placeholder="Enter PAT-XXXX" required style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #1e293b', backgroundColor: '#0f172a', color: 'white' }} />
                        <button type="submit" className="action-button" style={{ width: 'auto', padding: '0 20px' }}>Pull Chart</button>
                    </form>
                </div>
            </div>
        )}

        {/* TAB 3: ACTIVE CONSULTATION WORKSPACE */}
        {activeTab === 'consultation' && currentPatient && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div>
                    <h1 style={{ fontSize: '2.5rem', margin: 0, color: '#10b981' }}>Active Consultation</h1>
                    <p style={{ color: '#94a3b8', margin: '5px 0 0 0' }}>Currently seeing: <strong>{currentPatient.patient_name} ({currentPatient.patient_id})</strong></p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px' }}>
                
                {/* LEFT COLUMN: PROFILE & HISTORY */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '70vh' }}>
                    
                    {/* TOP LEFT: PATIENT PROFILE (NEW) */}
                    <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '20px' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, color: '#38bdf8', marginBottom: '15px' }}><User size={20} /> Patient Demographics</h3>
                        <p style={{ color: '#94a3b8', margin: '0 0 5px 0', fontSize: '0.9rem' }}><strong>Phone:</strong> <span style={{ color: '#e2e8f0' }}>{currentPatient.patient_phone || 'N/A'}</span></p>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #1e293b' }}>
                            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}><strong>Age:</strong> <span style={{ color: '#e2e8f0' }}>{currentPatient.age || '--'}</span></span>
                            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}><strong>Sex:</strong> <span style={{ color: '#e2e8f0' }}>{currentPatient.gender || '--'}</span></span>
                            <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}><strong>Blood:</strong> <span style={{ color: '#ef4444', fontWeight: 'bold' }}>{currentPatient.blood_group || '--'}</span></span>
                        </div>
                    </div>

                    {/* BOTTOM LEFT: MEDICAL HISTORY */}
                    <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '20px', flex: 1, overflowY: 'auto' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, color: '#38bdf8' }}><FileText size={20} /> Past Records</h3>
                        {patientHistory.length === 0 ? (
                            <p style={{ color: '#64748b' }}>No previous medical history found.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {[...patientHistory].reverse().map((rec, i) => (
                                    <div key={i} style={{ padding: '15px', backgroundColor: '#1e293b', borderRadius: '8px' }}>
                                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 5px 0' }}>{rec.date}</p>
                                        <p style={{ margin: '0 0 5px 0' }}><strong>Dx:</strong> {rec.diagnosis}</p>
                                        <p style={{ margin: '0 0 5px 0', color: '#cbd5e1' }}><strong>Rx:</strong> {rec.prescription}</p>
                                        {rec.lab_result && rec.lab_result !== "N/A" && <p style={{ margin: 0, color: '#a78bfa', fontSize: '0.9rem' }}><strong>Lab:</strong> {rec.lab_result}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: NEW ENTRY FORM */}
                <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '30px' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 0, color: '#10b981', marginBottom: '20px' }}><PlusCircle size={20} /> Create Clinical Note</h3>
                    
                    <form onSubmit={handleSubmitRecord} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>Primary Diagnosis</label>
                            <input type="text" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: 'white' }} placeholder="e.g., Viral Fever" />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>Prescription (Sends to Pharmacy)</label>
                            <input type="text" value={prescription} onChange={(e) => setPrescription(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: 'white' }} placeholder="e.g., Paracetamol 500mg" />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>Lab / Scan Order (Sends to Diagnostics)</label>
                            <input type="text" value={labTest} onChange={(e) => setLabTest(e.target.value)} style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: 'white' }} placeholder="e.g., Complete Blood Count (CBC)" />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', color: '#cbd5e1' }}>Clinical Notes</label>
                            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} required rows="3" style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#1e293b', color: 'white' }} placeholder="Patient presents with..." />
                        </div>

                        <div style={{ padding: '15px', backgroundColor: '#450a0a', border: '1px solid #ef4444', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input type="checkbox" id="admit" checked={needsAdmission} onChange={(e) => setNeedsAdmission(e.target.checked)} style={{ width: '20px', height: '20px' }} />
                            <label htmlFor="admit" style={{ color: '#fca5a5', cursor: 'pointer', fontWeight: 'bold' }}>Patient Requires Immediate Bed Admission</label>
                        </div>

                        <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                            <button type="submit" style={{ flex: 1, padding: '15px', borderRadius: '8px', backgroundColor: '#10b981', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
                                Finish Consult & Route Patient
                            </button>
                            <button type="button" onClick={() => { setCurrentPatient(null); setActiveTab('queue'); updateStatus('Available'); }} style={{ padding: '15px', borderRadius: '8px', backgroundColor: '#334155', color: 'white', border: 'none', cursor: 'pointer' }}>
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default DoctorDashboard;