// frontend/src/components/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, UserPlus, LogOut, ShieldAlert, Eye, EyeOff, Trash2, UserCircle, Bed, Pill, Receipt, ListOrdered, CheckCircle, FileCheck, Printer, AlertTriangle, ClipboardList } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('add-staff'); 
  
  // States
  const [staffList, setStaffList] = useState([]);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Doctor');
  const [showPassword, setShowPassword] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');

  // V2 Dashboard States
  const [beds, setBeds] = useState([]);
  const [wardName, setWardName] = useState('');
  const [bedNum, setBedNum] = useState('');
  const [stockRequests, setStockRequests] = useState([]);
  const [billingSearchId, setBillingSearchId] = useState('');
  const [billingStatus, setBillingStatus] = useState(null);
  const [liveQueue, setLiveQueue] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);

  // Discharge States
  const [dischargeId, setDischargeId] = useState('');
  const [dischargePatient, setDischargePatient] = useState(null);
  const [bedDesc, setBedDesc] = useState('Standard Ward - 1 Day');
  const [bedCost, setBedCost] = useState('');
  const [receiptData, setReceiptData] = useState(null);

  // Alias Gen
  const cleanAlias = `${firstName}${lastName}`.toLowerCase().replace(/\s+/g, '');
  const generatedEmail = cleanAlias ? `unagasairao+${cleanAlias}@gmail.com` : '';

  // --- FETCH FUNCTIONS ---
  const fetchStaff = async () => {
    try { const res = await axios.get('http://127.0.0.1:8000/staff'); setStaffList(res.data); } catch (err) {}
  };
  
  const fetchBeds = async () => {
    try { const res = await axios.get('http://127.0.0.1:8000/admin/beds'); setBeds(res.data); } catch (err) {}
  };

  const fetchStockRequests = async () => {
    try { const res = await axios.get('http://127.0.0.1:8000/admin/stock-requests'); setStockRequests(res.data); } catch (err) {}
  };

  const fetchQueue = async () => {
    try { const res = await axios.get('http://127.0.0.1:8000/live-queue'); setLiveQueue(res.data); } catch (err) {}
  };

  const fetchAuditLogs = async () => {
    try { const res = await axios.get('http://127.0.0.1:8000/admin/audit-logs'); setAuditLogs(res.data); } catch (err) {}
  };

  useEffect(() => {
    if (activeView === 'view-staff') fetchStaff();
    if (activeView === 'beds') fetchBeds();
    if (activeView === 'pharmacy') fetchStockRequests();
    if (activeView === 'audit') fetchAuditLogs();
    if (activeView === 'queue') {
        fetchQueue();
        const interval = setInterval(fetchQueue, 5000);
        return () => clearInterval(interval);
    }
  }, [activeView]);

  // --- ACTIONS ---
  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://127.0.0.1:8000/register-staff', { email: generatedEmail, password, role, age: parseInt(age), gender });
      
      // FIRE AUDIT LOG
      await axios.post('http://127.0.0.1:8000/admin/log-action', { action: 'Created Staff Account', user: 'Master Admin', details: `Registered ${generatedEmail} as ${role}` });

      alert("✅ " + res.data.message);
      setFirstName(''); setLastName(''); setAge(''); setGender(''); setPassword('');
    } catch (err) { alert("❌ Registration failed."); }
  };

  const handleDeleteStaff = async (emailToDelete) => {
    if (emailToDelete === 'unagasairao+admin@gmail.com') return alert("⚠️ Cannot delete Master Admin!");
    if (!window.confirm(`Terminate ${emailToDelete}?`)) return;
    try { 
        await axios.delete(`http://127.0.0.1:8000/delete-staff/${emailToDelete}`); 
        // FIRE AUDIT LOG
        await axios.post('http://127.0.0.1:8000/admin/log-action', { action: 'Terminated Staff', user: 'Master Admin', details: `Deleted account for ${emailToDelete}` });
        fetchStaff(); 
    } catch (err) {}
  };

  const handleAddPatient = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://127.0.0.1:8000/register-patient', { name: patientName, phone: patientPhone, age: 0, gender: "N/A", blood_group: "N/A" });
      
      // FIRE AUDIT LOG
      await axios.post('http://127.0.0.1:8000/admin/log-action', { action: 'Emergency Patient Registration', user: 'Master Admin', details: `Registered ${patientName} with ID ${res.data.patient_id}` });

      alert(`✅ Patient Registered! ID: ${res.data.patient_id}`);
      setPatientName(''); setPatientPhone('');
    } catch (err) {}
  };

  const handleAddBed = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:8000/admin/add-bed', { bed_number: bedNum, ward: wardName });
      
      // FIRE AUDIT LOG
      await axios.post('http://127.0.0.1:8000/admin/log-action', { action: 'Added Bed', user: 'Master Admin', details: `Added bed ${bedNum} to ${wardName}` });

      setBedNum(''); fetchBeds();
    } catch (err) {}
  };

  const handleUpdateBed = async (id, status) => {
    try { await axios.post('http://127.0.0.1:8000/admin/update-bed', { bed_id: id, status }); fetchBeds(); } catch (err) {}
  };

  const handleApproveStock = async (req) => {
    try {
      await axios.post('http://127.0.0.1:8000/admin/approve-stock', req);
      
      // FIRE AUDIT LOG
      await axios.post('http://127.0.0.1:8000/admin/log-action', { action: 'Approved Stock', user: 'Master Admin', details: `Approved ${req.quantity} units of ${req.medicine_name}` });

      fetchStockRequests();
    } catch (err) { alert("Error approving stock"); }
  };

  const handleSearchBilling = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.get(`http://127.0.0.1:8000/patient-portal-full/${billingSearchId.toUpperCase()}`);
      setBillingStatus(res.data);
    } catch (err) { alert("Patient not found."); setBillingStatus(null); }
  };

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
        alert("✅ Facility bill sent to Billing!");
        handleSearchDischarge(e); 
    } catch (err) { alert("Error adding bill."); }
  };

  const handleFinalizeDischarge = async () => {
      try {
          const res = await axios.post('http://127.0.0.1:8000/discharge/finalize', { patient_id: dischargeId });
          
          // FIRE AUDIT LOG
          await axios.post('http://127.0.0.1:8000/admin/log-action', { action: 'Finalized Discharge', user: 'Master Admin', details: `Discharged patient ${dischargeId}` });

          setReceiptData(res.data);
      } catch (err) { alert("Error finalizing discharge."); }
  };

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

      <aside className="sidebar no-print" style={{ width: '280px', overflowY: 'auto' }}>
        <div className="sidebar-header">
          <ShieldAlert size={32} color="#0ea5e9" />
          <h2>Master Admin</h2>
        </div>
        
        <nav className="sidebar-nav">
          <p style={{ color: '#64748b', fontSize: '12px', padding: '0 15px', marginTop: '10px' }}>HR & INTEL</p>
          <button className={`nav-item ${activeView === 'add-staff' ? 'active' : ''}`} onClick={() => setActiveView('add-staff')}><UserPlus size={18} /> Add Staff</button>
          <button className={`nav-item ${activeView === 'view-staff' ? 'active' : ''}`} onClick={() => setActiveView('view-staff')}><Users size={18} /> View Staff</button>
          <button className={`nav-item ${activeView === 'add-patient' ? 'active' : ''}`} onClick={() => setActiveView('add-patient')}><UserCircle size={18} /> Register Patient</button>
          <button className={`nav-item ${activeView === 'audit' ? 'active' : ''}`} onClick={() => setActiveView('audit')}><ClipboardList size={18} /> Audit Logs</button>
          
          <p style={{ color: '#64748b', fontSize: '12px', padding: '0 15px', marginTop: '20px' }}>HOSPITAL OPS</p>
          <button className={`nav-item ${activeView === 'beds' ? 'active' : ''}`} onClick={() => setActiveView('beds')}><Bed size={18} /> Ward & Beds</button>
          <button className={`nav-item ${activeView === 'pharmacy' ? 'active' : ''}`} onClick={() => setActiveView('pharmacy')}><Pill size={18} /> Pharmacy Approvals</button>
          <button className={`nav-item ${activeView === 'billing' ? 'active' : ''}`} onClick={() => setActiveView('billing')}><Receipt size={18} /> Patient Billing</button>
          <button className={`nav-item ${activeView === 'queue' ? 'active' : ''}`} onClick={() => setActiveView('queue')}><ListOrdered size={18} /> Live Queue</button>
          <button className={`nav-item ${activeView === 'discharge' ? 'active' : ''}`} onClick={() => setActiveView('discharge')}><FileCheck size={18} /> Discharge & Invoice</button>
        </nav>
        
        <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="logout-button"><LogOut size={20} /> Logout</button>
      </aside>

      <main className="main-content">
        
        {/* --- HR TABS --- */}
        {activeView === 'add-staff' && (
           <div className="form-card no-print">
           <header className="content-header"><h2>Register Staff</h2></header>
             <form onSubmit={handleAddStaff}>
               <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                 <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First Name" required style={{ flex: 1, padding: '12px' }} />
                 <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last Name" required style={{ flex: 1, padding: '12px' }} />
               </div>
               <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                 <input type="number" value={age} onChange={(e) => setAge(e.target.value)} placeholder="Age" required style={{ flex: 1, padding: '12px' }} />
                 <select value={gender} onChange={(e) => setGender(e.target.value)} required style={{ flex: 1, padding: '12px' }}>
                    <option value="" disabled>Gender</option><option>Male</option><option>Female</option>
                 </select>
               </div>
               <p style={{ color: '#0ea5e9', marginBottom: '15px' }}>Email: {generatedEmail}</p>
               <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required style={{ width: '100%', padding: '12px', marginBottom: '15px' }} />
               <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: '100%', padding: '12px', marginBottom: '15px' }}>
                 <option value="Doctor">Doctor</option><option value="Receptionist">Receptionist</option>
                 <option value="Pharmacist">Pharmacist</option><option value="Billing">Billing</option><option value="Display">Display Monitor</option>
               </select>
               <button type="submit" className="action-button">Register Staff</button>
             </form>
           </div>
        )}

        {activeView === 'view-staff' && (
           <div className="form-card no-print" style={{ maxWidth: '1000px', padding: '20px' }}>
             <h2>Hospital Roster</h2>
             <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', marginTop: '20px' }}>
               <thead><tr style={{ color: '#94a3b8', borderBottom: '1px solid #334155' }}><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
               <tbody>
                 {staffList.map((s, i) => (
                   <tr key={i} style={{ borderBottom: '1px solid #1e293b' }}>
                     <td style={{ padding: '15px 0' }}>{s.email}</td><td style={{ color: '#0ea5e9' }}>{s.role}</td>
                     <td>{s.role !== 'Admin' && <button onClick={() => handleDeleteStaff(s.email)} style={{ background: 'none', color: '#ef4444', border: 'none', cursor: 'pointer' }}><Trash2 size={18} /></button>}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        )}

        {activeView === 'add-patient' && (
            <div className="form-card no-print">
              <h2>Emergency / Admin Patient Registration</h2>
              <form onSubmit={handleAddPatient} style={{ marginTop: '20px' }}>
                  <input type="text" value={patientName} onChange={(e) => setPatientName(e.target.value)} placeholder="Patient Name" required style={{ width: '100%', padding: '12px', marginBottom: '15px' }} />
                  <input type="tel" value={patientPhone} onChange={(e) => setPatientPhone(e.target.value)} placeholder="Phone Number" required style={{ width: '100%', padding: '12px', marginBottom: '15px' }} />
                  <button type="submit" className="action-button">Generate ID</button>
              </form>
            </div>
        )}

        {activeView === 'audit' && (
            <div className="no-print">
                <h2>System Audit Logs</h2>
                <div className="form-card" style={{ padding: '20px' }}>
                    {auditLogs.length === 0 ? <p style={{ color: '#94a3b8' }}>No logs recorded yet. System events will appear here.</p> : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ color: '#94a3b8', borderBottom: '1px solid #334155' }}>
                                    <th style={{ padding: '10px 0' }}>Timestamp</th>
                                    <th style={{ padding: '10px 0' }}>User</th>
                                    <th style={{ padding: '10px 0' }}>Action</th>
                                    <th style={{ padding: '10px 0' }}>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {auditLogs.map((log) => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid #1e293b' }}>
                                        <td style={{ padding: '15px 0', color: '#94a3b8', fontSize: '13px' }}>{log.timestamp}</td>
                                        <td style={{ padding: '15px 0', color: '#0ea5e9', fontWeight: 'bold' }}>{log.user}</td>
                                        <td style={{ padding: '15px 0', color: 'white' }}>{log.action}</td>
                                        <td style={{ padding: '15px 0', color: '#cbd5e1', fontSize: '14px' }}>{log.details}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        )}

        {/* --- OPS TABS --- */}
        {activeView === 'beds' && (
            <div className="no-print">
                <h2>Ward & Bed Management</h2>
                <form onSubmit={handleAddBed} style={{ display: 'flex', gap: '15px', marginBottom: '30px', backgroundColor: '#0f172a', padding: '20px', borderRadius: '8px' }}>
                    <input type="text" value={wardName} onChange={(e) => setWardName(e.target.value)} placeholder="Ward Name (e.g. ICU, General)" required style={{ flex: 1, padding: '12px' }} />
                    <input type="text" value={bedNum} onChange={(e) => setBedNum(e.target.value)} placeholder="Bed Number (e.g. B-101)" required style={{ flex: 1, padding: '12px' }} />
                    <button type="submit" className="action-button" style={{ width: 'auto' }}>Add Bed</button>
                </form>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                    {beds.map((b) => (
                        <div key={b.bed_id} style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', borderTop: `4px solid ${b.status === 'Available' ? '#10b981' : b.status === 'Cleaning' ? '#f59e0b' : '#ef4444'}` }}>
                            <h3 style={{ margin: 0 }}>{b.ward} - {b.bed_number}</h3>
                            <p style={{ color: '#94a3b8', margin: '5px 0 15px 0' }}>Status: <strong>{b.status}</strong></p>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => handleUpdateBed(b.bed_id, 'Available')} style={{ flex: 1, padding: '8px', backgroundColor: '#064e3b', color: '#10b981', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Set Free</button>
                                <button onClick={() => handleUpdateBed(b.bed_id, 'Cleaning')} style={{ flex: 1, padding: '8px', backgroundColor: '#78350f', color: '#f59e0b', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Clean</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeView === 'pharmacy' && (
            <div className="no-print">
                <h2>Pharmacy Restock Approvals</h2>
                <div className="form-card">
                    {stockRequests.length === 0 ? <p style={{ color: '#94a3b8' }}>No pending requests.</p> : (
                        stockRequests.map((req, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '15px', borderRadius: '8px', marginBottom: '10px', borderLeft: '4px solid #0ea5e9' }}>
                                <div>
                                    <h4 style={{ margin: 0 }}>{req.medicine_name}</h4>
                                    <p style={{ margin: '5px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>Requested Qty: {req.quantity} • Date: {req.date}</p>
                                </div>
                                <button onClick={() => handleApproveStock(req)} className="action-button" style={{ width: 'auto', backgroundColor: '#10b981' }}><CheckCircle size={18} style={{ marginRight: '8px' }}/> Approve & Restock</button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}

        {activeView === 'billing' && (
            <div className="no-print">
                <h2>Patient Billing Lookup</h2>
                <form onSubmit={handleSearchBilling} style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
                    <input type="text" value={billingSearchId} onChange={(e) => setBillingSearchId(e.target.value)} placeholder="PAT-1000" required style={{ flex: 1, padding: '12px' }} />
                    <button type="submit" className="action-button" style={{ width: 'auto' }}>Search Status</button>
                </form>

                {billingStatus && (
                    <div className="form-card">
                        <h3>{billingStatus.profile.name}'s History</h3>
                        {billingStatus.history.map((h, i) => (
                            <div key={i} style={{ padding: '15px', backgroundColor: '#0f172a', borderLeft: `4px solid ${h.status === 'Paid' ? '#10b981' : h.status === 'Waiting Payment' ? '#f59e0b' : '#3b82f6'}`, marginBottom: '10px' }}>
                                <p style={{ margin: 0, fontWeight: 'bold' }}>{h.diagnosis} (Rx: {h.prescription})</p>
                                <p style={{ margin: '5px 0 0 0', color: '#94a3b8' }}>Status: {h.status} • Price: ₹{h.price}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {activeView === 'queue' && (
            <div className="no-print">
                <h2>Live Hospital Queue Overview</h2>
                <div className="form-card">
                    {liveQueue.length === 0 ? <p style={{ color: '#94a3b8' }}>Queue is empty.</p> : (
                        liveQueue.map((p, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '15px', backgroundColor: '#0f172a', borderLeft: p.priority === 5 ? '4px solid #ef4444' : p.priority >= 3 ? '4px solid #f59e0b' : '4px solid #10b981', marginBottom: '10px' }}>
                            <span style={{ color: 'white', fontWeight: 'bold' }}>{p.patient_id} - {p.patient_name}</span>
                            <span style={{ color: '#94a3b8' }}>Priority: {p.priority}</span>
                        </div>
                        ))
                    )}
                </div>
            </div>
        )}

        {/* --- NEW DISCHARGE & BILLING TAB --- */}
        {activeView === 'discharge' && (
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

export default AdminDashboard;