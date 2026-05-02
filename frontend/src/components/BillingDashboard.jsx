import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Banknote, Search, CreditCard, CheckCircle, LogOut, ReceiptIndianRupee } from 'lucide-react';

const BillingDashboard = () => {
  const navigate = useNavigate();
  const [patientId, setPatientId] = useState('');
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchBills = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`http://127.0.0.1:8000/patient-billing/${patientId.toUpperCase()}`);
      setBills(res.data);
    } catch (err) {
      alert("No pending bills found for this ID.");
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (recordId) => {
    try {
      await axios.post('http://127.0.0.1:8000/confirm-payment', { record_id: recordId });
      alert("✅ Payment Confirmed! Department notified.");
      fetchBills(); // Refresh list
    } catch (err) {
      alert("Error processing payment.");
    }
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#020617' }}>
      {/* Sidebar */}
      <aside className="sidebar" style={{ width: '260px', borderRight: '1px solid #1e293b' }}>
        <div className="sidebar-header">
          <Banknote size={32} color="#22c55e" />
          <h2>Billing Dept</h2>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-item active"><ReceiptIndianRupee size={20} /> Pending Payments</div>
        </nav>
        <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="logout-button">
          <LogOut size={20} /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content" style={{ flex: 1, padding: '40px' }}>
        <header className="content-header">
          <h1>Revenue & Billing Manager</h1>
          <p>Confirm payments to release medications and lab results.</p>
        </header>

        {/* Search Patient */}
        <div className="form-card" style={{ display: 'flex', gap: '15px', marginBottom: '30px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ color: '#94a3b8', fontSize: '12px' }}>Search Patient ID</label>
            <input 
              type="text" 
              placeholder="PAT-1000" 
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              style={{ width: '100%', padding: '12px', backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: 'white' }}
            />
          </div>
          <button onClick={fetchBills} className="action-button" style={{ width: 'auto', alignSelf: 'flex-end', padding: '12px 30px' }}>
            {loading ? 'Fetching...' : 'View Bills'}
          </button>
        </div>

        {/* Bills List */}
        <div className="grid-container" style={{ display: 'grid', gap: '20px' }}>
          {bills.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px', color: '#64748b' }}>
              <CreditCard size={48} style={{ marginBottom: '10px', opacity: 0.5 }} />
              <p>Enter a Patient ID to see outstanding dues.</p>
            </div>
          ) : (
            bills.map((bill) => (
              <div key={bill.record_id} className="form-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderLeft: '4px solid #22c55e' }}>
                <div>
                  <h4 style={{ color: 'white', margin: 0 }}>{bill.item}</h4>
                  <p style={{ color: '#64748b', fontSize: '13px' }}>Category: {bill.type}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color: '#22c55e', fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>₹{bill.amount}</p>
                  <button onClick={() => handlePay(bill.record_id)} className="action-button" style={{ backgroundColor: '#22c55e', width: 'auto', padding: '8px 20px' }}>
                    Confirm Cash/UPI
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