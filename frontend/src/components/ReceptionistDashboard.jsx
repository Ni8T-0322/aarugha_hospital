// frontend/src/components/ReceptionistDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserPlus, ListOrdered, LogOut, HeartPulse, FileCheck, Printer, AlertTriangle } from 'lucide-react';

const ReceptionistDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('register');
  
  // Registration States
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');

  // Queue States
  const [queueId, setQueueId] = useState('');
  const [priority, setPriority] = useState(1);
  const [liveQueue, setLiveQueue] = useState([]);

  // Discharge States
  const [dischargeId, setDischargeId] = useState('');
  const [dischargePatient, setDischargePatient] = useState(null);
  const [bedDesc, setBedDesc] = useState('Standard Ward - 1 Day');
  const [bedCost, setBedCost] = useState('');
  const [receiptData, setReceiptData] = useState(null);

  const fetchQueue = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/live-queue');
      setLiveQueue(res.data);
    } catch (err) { console.error("Error fetching queue"); }
  };

  useEffect(() => {
    fetchQueue();
    const interval = setInterval(fetchQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://127.0.0.1:8000/register-patient', { name, phone, age: parseInt(age), gender, blood_group: bloodGroup });
      alert(`✅ ${res.data.message}\n\nPatient ID: ${res.data.patient_id}\nDefault Password: ${res.data.password}`);
      setName(''); setPhone(''); setAge(''); setGender(''); setBloodGroup('');
    } catch (err) { alert("❌ Registration Error"); }
  };

  const handleAddToQueue = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:8000/add-to-queue', { patient_id: queueId, priority: parseInt(priority) });
      alert("✅ Added to Live Queue"); setQueueId(''); fetchQueue();
    } catch (err) { alert("❌ Patient ID not found"); }
  };

  // --- DISCHARGE LOGIC ---
  const handleSearchDischarge = async (e) => {
    e.preventDefault();
    setReceiptData(null);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/patient-portal-full/${dischargeId.toUpperCase()}`);
      setDischargePatient(res.data);
    } catch (err) { alert("Patient not found."); setDischargePatient(null); }
  };

  const handleAddFacilityBill = async (e) => {
    e.preventDefault();
    try {
        await axios.post('http://127.0.0.1:8000/discharge/add-bill', { patient_id: dischargeId, amount: parseInt(bedCost), description: bedDesc });
        alert("✅ Facility bill sent to Billing! Wait for them to clear it.");
        handleSearchDischarge(e); // Refresh data
    } catch (err) { alert("Error adding bill."); }
  };

  const handleFinalizeDischarge = async () => {
      try {
          const res = await axios.post('http://127.0.0.1:8000/discharge/finalize', { patient_id: dischargeId });
          setReceiptData(res.data);
      } catch (err) { alert("Error finalizing discharge."); }
  };

  // Discharge Status Checks
  const history = dischargePatient?.history || [];
  const pendingMedical = history.some(h => (h.status === 'Waiting Payment' || h.status === 'Pending Price') && h.type !== 'Discharge/Facility');
  const facilityBill = history.find(h => h.type === 'Discharge/Facility');

  return (
    <div className="dashboard-container">
      {/* Hidden Print Stylesheet */}
      <style>{`
        @media print {
          .sidebar, .content-header, .no-print { display: none !important; }
          .main-content { padding: 0 !important; background: white !important; }
          .dashboard-container { background: white !important; color: black !important; }
          .receipt-paper { border: none !important; box-shadow: none !important; color: black !important; }
          * { color: black !important; }
        }
      `}</style>

      <aside className="sidebar no-print">
        <div className="sidebar-header">
          <HeartPulse size={32} color="#ec4899" />
          <h2>Front Desk</h2>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === 'register' ? 'active' : ''}`} onClick={() => setActiveTab('register')}><UserPlus size={20} /> Patient Intake</button>
          <button className={`nav-item ${activeTab === 'queue' ? 'active' : ''}`} onClick={() => setActiveTab('queue')}><ListOrdered size={20} /> Live Queue</button>
          <button className={`nav-item ${activeTab === 'discharge' ? 'active' : ''}`} onClick={() => setActiveTab('discharge')}><FileCheck size={20} /> Discharge</button>
        </nav>
        <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="logout-button"><LogOut size={20} /> Logout</button>
      </aside>

      <main className="main-content">
        {activeTab === 'register' && (
          <div className="no-print">
            <header className="content-header"><h1>Patient Registration</h1></header>
            <div className="form-card">
              <form onSubmit={handleRegister}>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <div className="input-group" style={{ flex: 2 }}><label>Full Name</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} required /></div>
                  <div className="input-group" style={{ flex: 1 }}><label>Phone Number</label><input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} required /></div>
                </div>
                <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
                  <div className="input-group" style={{ flex: 1 }}><label>Age</label><input type="number" value={age} onChange={(e) => setAge(e.target.value)} required /></div>
                  <div className="input-group" style={{ flex: 1 }}><label>Gender</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)} className="role-select" required>
                      <option value="" disabled>Select...</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="input-group" style={{ flex: 1 }}><label>Blood Group</label>
                    <select value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} className="role-select" required>
                      <option value="" disabled>Select...</option><option value="A+">A+</option><option value="O+">O+</option><option value="B+">B+</option><option value="AB+">AB+</option>
                    </select>
                  </div>
                </div>
                <button type="submit" className="action-button" style={{ marginTop: '20px' }}>Register Patient</button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'queue' && (
          <div className="no-print">
            <header className="content-header"><h1>Waitlist Management</h1></header>
            <div className="form-card" style={{ marginBottom: '20px' }}>
              <form onSubmit={handleAddToQueue} style={{ display: 'flex', gap: '15px', alignItems: 'flex-end' }}>
                <div className="input-group" style={{ flex: 2, marginBottom: 0 }}><label>Patient ID</label><input type="text" value={queueId} onChange={(e) => setQueueId(e.target.value.toUpperCase())} required /></div>
                <div className="input-group" style={{ flex: 1, marginBottom: 0 }}><label>Priority</label>
                  <select value={priority} onChange={(e) => setPriority(e.target.value)} className="role-select">
                    <option value="1">1 - Standard</option><option value="3">3 - Emergency</option><option value="5">5 - Code Red</option>
                  </select>
                </div>
                <button type="submit" className="action-button" style={{ width: 'auto', padding: '12px 30px' }}>Queue Patient</button>
              </form>
            </div>
            <div className="form-card">
              <h3 style={{ color: 'white', marginBottom: '15px' }}>Current Lobby</h3>
              {liveQueue.map((p, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', backgroundColor: '#0f172a', borderLeft: p.priority > 3 ? '4px solid #ef4444' : '4px solid #10b981', marginBottom: '10px', borderRadius: '8px' }}>
                    <span style={{ color: 'white', fontWeight: 'bold' }}>{p.patient_id} - {p.patient_name}</span>
                    <span style={{ color: '#94a3b8' }}>Priority: {p.priority}</span>
                  </div>
              ))}
            </div>
          </div>
        )}

        {/* --- NEW DISCHARGE & BILLING TAB --- */}
        {activeTab === 'discharge' && (
            <div>
                {!receiptData && (
                    <div className="no-print">
                        <header className="content-header">
                            <h1>Discharge & Final Billing</h1>
                            <p>Verify medical dues, apply bed charges, and generate receipts.</p>
                        </header>
                        
                        <div className="form-card" style={{ marginBottom: '20px' }}>
                            <form onSubmit={handleSearchDischarge} style={{ display: 'flex', gap: '15px' }}>
                                <input type="text" value={dischargeId} onChange={(e) => setDischargeId(e.target.value.toUpperCase())} placeholder="Enter PAT-XXXX" required style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #1e293b', backgroundColor: '#0f172a', color: 'white' }} />
                                <button type="submit" className="action-button" style={{ width: 'auto', padding: '0 20px' }}>Pull File</button>
                            </form>
                        </div>

                        {dischargePatient && (
                            <div className="form-card" style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
                                <h2 style={{ color: 'white', marginTop: 0 }}>{dischargePatient.profile.name} ({dischargeId})</h2>
                                
                                {pendingMedical ? (
                                    <div style={{ padding: '20px', backgroundColor: '#450a0a', borderLeft: '4px solid #ef4444', borderRadius: '8px', marginTop: '20px' }}>
                                        <h3 style={{ color: '#fca5a5', display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 10px 0' }}><AlertTriangle size={20}/> Medical Dues Pending</h3>
                                        <p style={{ color: '#f87171', margin: 0 }}>Patient cannot be discharged. There are unpaid Pharmacy, Consult, or Lab bills in the system. Send patient to Billing.</p>
                                    </div>
                                ) : !facilityBill ? (
                                    <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#1e293b', borderRadius: '8px' }}>
                                        <h3 style={{ color: '#38bdf8', margin: '0 0 15px 0' }}>Step 1: Add Facility & Bed Charges</h3>
                                        <form onSubmit={handleAddFacilityBill} style={{ display: 'flex', gap: '15px' }}>
                                            <input type="text" value={bedDesc} onChange={(e) => setBedDesc(e.target.value)} placeholder="e.g. Standard Ward - 3 Days" required style={{ flex: 2, padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white' }} />
                                            <input type="number" value={bedCost} onChange={(e) => setBedCost(e.target.value)} placeholder="Total Amount (₹)" required style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white' }} />
                                            <button type="submit" className="action-button" style={{ width: 'auto' }}>Generate Bill</button>
                                        </form>
                                    </div>
                                ) : facilityBill.status === 'Waiting Payment' ? (
                                    <div style={{ padding: '20px', backgroundColor: '#422006', borderLeft: '4px solid #f59e0b', borderRadius: '8px', marginTop: '20px' }}>
                                        <h3 style={{ color: '#fcd34d', margin: '0 0 5px 0' }}>Step 2: Waiting for Payment</h3>
                                        <p style={{ color: '#fbbf24', margin: 0 }}>Facility bill generated (₹{facilityBill.price}). Patient must clear this at the Billing Desk before final discharge.</p>
                                    </div>
                                ) : (
                                    <div style={{ padding: '20px', backgroundColor: '#064e3b', borderLeft: '4px solid #10b981', borderRadius: '8px', marginTop: '20px' }}>
                                        <h3 style={{ color: '#6ee7b7', margin: '0 0 10px 0' }}>Step 3: All Dues Cleared</h3>
                                        <p style={{ color: '#a7f3d0', margin: '0 0 15px 0' }}>Patient is fully paid. You may now complete the discharge and generate the final receipt.</p>
                                        <button onClick={handleFinalizeDischarge} className="action-button" style={{ backgroundColor: '#10b981' }}>Finalize Discharge & Generate Invoice</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* --- PRINTABLE RECEIPT VIEW --- */}
                {receiptData && (
                    <div className="receipt-paper" style={{ backgroundColor: '#f8fafc', padding: '40px', borderRadius: '12px', color: '#0f172a', maxWidth: '800px', margin: '0 auto' }}>
                        <div style={{ textAlign: 'center', borderBottom: '2px solid #cbd5e1', paddingBottom: '20px', marginBottom: '20px' }}>
                         <h1 style={{ margin: '0 0 5px 0', fontSize: '28px', color: '#0f172a' }}>HOSPITRAX</h1>
                          <p style={{ margin: '0 0 5px 0', color: '#0ea5e9', fontWeight: 'bold', letterSpacing: '1px' }}>BY AARUGHA</p>
                          <p style={{ margin: 0, color: '#64748b' }}>Final Patient Invoice & Discharge Summary</p>
                    </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px' }}>
                            <div>
                                <p style={{ margin: '0 0 5px 0' }}><strong>Patient ID:</strong> {dischargeId}</p>
                                <p style={{ margin: 0 }}><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <span style={{ padding: '5px 12px', border: '2px solid #10b981', color: '#10b981', fontWeight: 'bold', borderRadius: '4px', letterSpacing: '2px' }}>PAID IN FULL</span>
                            </div>
                        </div>

                        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #0f172a', textAlign: 'left' }}>
                                    <th style={{ padding: '10px 0' }}>Description</th>
                                    <th style={{ padding: '10px 0' }}>Category</th>
                                    <th style={{ padding: '10px 0', textAlign: 'right' }}>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                {receiptData.receipt.map((item, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #cbd5e1' }}>
                                        <td style={{ padding: '15px 0' }}><strong>{item.item}</strong><br/><span style={{ fontSize: '12px', color: '#64748b' }}>{item.desc}</span></td>
                                        <td style={{ padding: '15px 0', color: '#64748b' }}>{item.type}</td>
                                        <td style={{ padding: '15px 0', textAlign: 'right', fontWeight: 'bold' }}>₹{item.amount}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div style={{ textAlign: 'right', borderTop: '2px solid #0f172a', paddingTop: '20px' }}>
                            <h2 style={{ margin: 0, color: '#0f172a' }}>Total Paid: ₹{receiptData.total}</h2>
                        </div>

                        <div className="no-print" style={{ display: 'flex', gap: '15px', marginTop: '40px' }}>
                            <button onClick={() => window.print()} className="action-button" style={{ backgroundColor: '#0ea5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}><Printer size={20} /> Print Invoice</button>
                            <button onClick={() => { setReceiptData(null); setDischargeId(''); setDischargePatient(null); }} className="action-button" style={{ backgroundColor: '#64748b' }}>Close & Return to Dashboard</button>
                        </div>
                    </div>
                )}
            </div>
        )}

      </main>
    </div>
  );
};

export default ReceptionistDashboard;