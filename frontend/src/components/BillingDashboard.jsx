// frontend/src/components/BillingDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Banknote, CreditCard, LogOut, ReceiptIndianRupee, ChevronDown } from 'lucide-react';

const BillingDashboard = () => {
  const navigate = useNavigate();
  const [pendingPatients, setPendingPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState('');
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Auto-fetch patients with dues
  const fetchPendingPatients = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/billing/pending-patients');
      setPendingPatients(res.data);
      // Auto-select the first patient if the list updates and nothing is selected
      if (res.data.length > 0 && !selectedPatient) {
          setSelectedPatient(res.data[0]);
      }
    } catch (err) { console.error("Error fetching pending patients"); }
  };

  useEffect(() => {
    fetchPendingPatients();
    const interval = setInterval(fetchPendingPatients, 5000);
    return () => clearInterval(interval);
  }, []);

  // 2. Fetch bills when a patient is selected
  useEffect(() => {
    if (!selectedPatient) {
        setBills([]);
        return;
    }
    const fetchBills = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`http://127.0.0.1:8000/patient-billing/${selectedPatient}`);
        setBills(res.data);
      } catch (err) { setBills([]); } finally { setLoading(false); }
    };
    fetchBills();
  }, [selectedPatient]);

  const handlePay = async (recordId) => {
    try {
      await axios.post('http://127.0.0.1:8000/confirm-payment', { record_id: recordId });
      alert("✅ Payment Confirmed! Department notified.");
      fetchPendingPatients(); 
      // If that was their last bill, clear the selection
      if (bills.length === 1) setSelectedPatient('');
    } catch (err) { alert("Error processing payment."); }
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#020617' }}>
      <aside className="sidebar" style={{ width: '260px', borderRight: '1px solid #1e293b' }}>
        <div className="sidebar-header">
          <Banknote size={32} color="#22c55e" />
          <h2>Billing Dept</h2>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-item active" style={{ cursor: 'default' }}><ReceiptIndianRupee size={20} /> Pending Payments</div>
        </nav>
        <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="logout-button">
          <LogOut size={20} /> Logout
        </button>
      </aside>

      <main className="main-content" style={{ flex: 1, padding: '40px' }}>
        <header className="content-header">
          <h1>Revenue & Billing Manager</h1>
          <p>Clear patient dues to trigger Pharmacy and Lab fulfillment.</p>
        </header>

        <div className="form-card" style={{ display: 'flex', gap: '15px', marginBottom: '30px', backgroundColor: '#0f172a', border: '1px solid #1e293b' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <label style={{ color: '#94a3b8', fontSize: '12px', display: 'block', marginBottom: '8px' }}>Select Patient with Pending Dues</label>
            <div style={{ position: 'relative' }}>
                <select 
                    value={selectedPatient}
                    onChange={(e) => setSelectedPatient(e.target.value)}
                    style={{ width: '100%', padding: '15px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: 'white', appearance: 'none', fontSize: '16px', fontWeight: 'bold' }}
                >
                    <option value="" disabled>{pendingPatients.length === 0 ? "No Pending Bills in Hospital" : "Select a Patient..."}</option>
                    {pendingPatients.map(id => <option key={id} value={id}>{id}</option>)}
                </select>
                <ChevronDown size={20} style={{ position: 'absolute', right: '15px', top: '15px', color: '#94a3b8', pointerEvents: 'none' }} />
            </div>
          </div>
        </div>

        <div className="grid-container" style={{ display: 'grid', gap: '20px' }}>
          {bills.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#64748b', backgroundColor: '#0f172a', borderRadius: '12px' }}>
              <CreditCard size={48} style={{ margin: '0 auto 10px auto', opacity: 0.5 }} />
              <p>{loading ? "Loading..." : "Select a patient above to clear their dues."}</p>
            </div>
          ) : (
            bills.map((bill) => (
              <div key={bill.record_id} className="form-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #22c55e', backgroundColor: '#0f172a' }}>
                <div>
                  <h4 style={{ color: 'white', margin: 0, fontSize: '18px' }}>{bill.item}</h4>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: '5px 0 0 0' }}>Category: {bill.type}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: '#22c55e', fontSize: '24px', fontWeight: 'bold', margin: '0 0 10px 0' }}>₹{bill.amount}</p>
                  <button onClick={() => handlePay(bill.record_id)} className="action-button" style={{ backgroundColor: '#22c55e', width: 'auto', padding: '10px 24px', fontWeight: 'bold' }}>
                    Confirm Payment
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default BillingDashboard;