import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Pill, Package, IndianRupee, Truck, LogOut, CheckCircle2 } from 'lucide-react';

const PharmacistDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('prescriptions');
  const [prescriptions, setPrescriptions] = useState([]);
  const [stockName, setStockName] = useState('');
  const [stockQty, setStockQty] = useState('');

  const fetchData = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/pending-prescriptions');
      setPrescriptions(res.data);
    } catch (err) { console.error("Fetch error", err); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleStockRequest = async (e) => {
    e.preventDefault();
    await axios.post('http://127.0.0.1:8000/request-stock', { medicine_name: stockName, quantity: parseInt(stockQty) });
    alert("Request sent to Admin!");
    setStockName(''); setStockQty('');
  };

  return (
    <div className="dashboard-container" style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#020617' }}>
      {/* Sidebar */}
      <aside className="sidebar" style={{ width: '260px', borderRight: '1px solid #1e293b' }}>
        <div className="sidebar-header">
          <Pill size={32} color="#ec4899" />
          <h2>Pharmacy</h2>
        </div>
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === 'prescriptions' ? 'active' : ''}`} onClick={() => setActiveTab('prescriptions')}>
            <CheckCircle2 size={20} /> Orders
          </button>
          <button className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
            <Package size={20} /> Inventory
          </button>
        </nav>
        <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="logout-button">
          <LogOut size={20} /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content" style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        {activeTab === 'prescriptions' ? (
          <>
            <h1>Patient Medication Needs</h1>
            <div className="grid-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
              {prescriptions.map((p) => (
                <div key={p.id} className="form-card" style={{ borderLeft: '4px solid #ec4899' }}>
                  <span style={{ color: '#ec4899', fontWeight: 'bold' }}>{p.patient_id}</span>
                  <p style={{ margin: '10px 0', color: '#cbd5e1' }}><strong>Rx:</strong> {p.prescription}</p>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    <input type="number" placeholder="Enter Total Price" style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #1e293b', backgroundColor: '#0f172a', color: 'white' }} />
                    <button className="action-button" style={{ width: 'auto', padding: '0 15px', backgroundColor: '#ec4899' }}>Set Price</button>
                  </div>
                  <p style={{ fontSize: '12px', color: '#64748b', marginTop: '10px' }}>Status: {p.status}</p>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ maxWidth: '600px' }}>
            <h1>Stock Management</h1>
            <div className="form-card" style={{ marginTop: '20px' }}>
              <h3>Request Refill from Admin</h3>
              <form onSubmit={handleStockRequest} style={{ marginTop: '15px' }}>
                <div className="input-group">
                  <label>Medicine Name</label>
                  <input type="text" value={stockName} onChange={(e) => setStockName(e.target.value)} required />
                </div>
                <div className="input-group">
                  <label>Quantity Needed</label>
                  <input type="number" value={stockQty} onChange={(e) => setStockQty(e.target.value)} required />
                </div>
                <button type="submit" className="action-button" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <Truck size={18} /> Send Request
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PharmacistDashboard;