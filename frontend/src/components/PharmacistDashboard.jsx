// frontend/src/components/PharmacistDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Pill, Package, IndianRupee, Truck, LogOut, CheckCircle2, AlertTriangle, Activity } from 'lucide-react';

const PharmacistDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('prescriptions');
  
  // Data States
  const [prescriptions, setPrescriptions] = useState([]);
  const [inventory, setInventory] = useState([]);
  
  // Form States
  const [stockName, setStockName] = useState('');
  const [stockQty, setStockQty] = useState('');
  const [prices, setPrices] = useState({});
  
  // NEW: Manual Deduction States
  const [deductItem, setDeductItem] = useState({});
  const [deductQty, setDeductQty] = useState({});

  // Fetch Logic
  const fetchPrescriptions = async () => {
    try { const res = await axios.get('http://127.0.0.1:8000/pending-prescriptions'); setPrescriptions(res.data); } catch (err) {}
  };

  const fetchInventory = async () => {
    try { const res = await axios.get('http://127.0.0.1:8000/inventory'); setInventory(res.data); } catch (err) {}
  };

  useEffect(() => { 
    fetchPrescriptions(); 
    fetchInventory();
    const interval = setInterval(() => {
        fetchPrescriptions();
        fetchInventory();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Actions
  const handlePriceChange = (id, value) => {
    setPrices(prev => ({ ...prev, [id]: value }));
  };

  const handleSetPrice = async (id) => {
    try {
      await axios.post('http://127.0.0.1:8000/set-medication-price', { record_id: id, price: prices[id] });
      fetchPrescriptions();
    } catch (err) { alert("Error setting price."); }
  };

  // NEW: Enhanced Dispense Logic
  const handleDispense = async (id) => {
    try {
      const itemToDeduct = deductItem[id];
      const qtyToDeduct = parseInt(deductQty[id]) || 0;

      await axios.post('http://127.0.0.1:8000/dispense-medication', { 
          record_id: id,
          medicine_name: itemToDeduct === 'none' ? null : itemToDeduct,
          quantity: qtyToDeduct
      });
      fetchPrescriptions();
      fetchInventory(); // Force refresh to see stock drop immediately
    } catch (err) { alert("Error dispensing medication."); }
  };

  const handleStockRequest = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://127.0.0.1:8000/request-stock', { medicine_name: stockName, quantity: parseInt(stockQty) });
      alert("✅ Restock request sent directly to Admin!");
      setStockName(''); setStockQty('');
    } catch (err) { alert("Error sending request."); }
  };

  const lowStockItems = inventory.filter(item => item.stock < 20);

  return (
    <div className="dashboard-container" style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#020617' }}>
      
      {/* SIDEBAR */}
      <aside className="sidebar" style={{ width: '280px', borderRight: '1px solid #1e293b' }}>
        <div className="sidebar-header">
          <Pill size={32} color="#ec4899" />
          <h2>Pharmacy</h2>
        </div>
        
        <nav className="sidebar-nav">
          <button className={`nav-item ${activeTab === 'prescriptions' ? 'active' : ''}`} onClick={() => setActiveTab('prescriptions')}>
            <Package size={20} /> Pending Orders
            {prescriptions.filter(p => p.status !== "Dispensed").length > 0 && (
                <span style={{ marginLeft: 'auto', backgroundColor: '#ec4899', color: 'white', padding: '2px 8px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold' }}>
                    {prescriptions.filter(p => p.status !== "Dispensed").length}
                </span>
            )}
          </button>
          <button className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`} onClick={() => setActiveTab('inventory')}>
            <Activity size={20} /> Live Inventory
            {lowStockItems.length > 0 && (
                <span style={{ marginLeft: 'auto', color: '#ef4444' }}><AlertTriangle size={16} /></span>
            )}
          </button>
        </nav>
        
        <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="logout-button">
          <LogOut size={20} /> Logout
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="main-content" style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
        
        {/* TAB 1: PRESCRIPTIONS */}
        {activeTab === 'prescriptions' && (
            <div>
                <header className="content-header">
                    <h1>Prescription Fulfillment</h1>
                    <p>Price medications and hand over when cleared by billing.</p>
                </header>
                
                <div style={{ display: 'grid', gap: '20px' }}>
                    {prescriptions.filter(p => p.status !== "Dispensed").length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '50px', backgroundColor: '#0f172a', borderRadius: '8px', color: '#64748b' }}>
                            <CheckCircle2 size={48} style={{ marginBottom: '10px', opacity: 0.5 }} />
                            <p>All prescriptions are fulfilled.</p>
                        </div>
                    ) : (
                        prescriptions.filter(p => p.status !== "Dispensed").map((req) => (
                            <div key={req.id} style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#0f172a', padding: '20px', borderRadius: '12px', borderLeft: req.status === "Paid" ? '4px solid #10b981' : req.status === "Waiting Payment" ? '4px solid #f59e0b' : '4px solid #38bdf8' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ margin: 0, color: 'white' }}>{req.patient_id}</h3>
                                        <p style={{ margin: '5px 0 10px 0', fontSize: '18px', color: '#ec4899', fontWeight: 'bold' }}>Rx: {req.prescription}</p>
                                        <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', backgroundColor: req.status === "Paid" ? '#10b98120' : '#f59e0b20', color: req.status === "Paid" ? '#10b981' : '#f59e0b' }}>
                                            Status: {req.status}
                                        </span>
                                    </div>

                                    {req.status === "Pending Price" && (
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <div style={{ position: 'relative' }}>
                                                <IndianRupee size={16} style={{ position: 'absolute', left: '10px', top: '12px', color: '#94a3b8' }} />
                                                <input type="number" placeholder="Enter Price" value={prices[req.id] || ''} onChange={(e) => handlePriceChange(req.id, e.target.value)} style={{ padding: '10px 10px 10px 30px', borderRadius: '8px', border: '1px solid #1e293b', backgroundColor: '#1e293b', color: 'white', width: '120px' }} />
                                            </div>
                                            <button onClick={() => handleSetPrice(req.id)} className="action-button" style={{ width: 'auto', backgroundColor: '#38bdf8' }}>Send to Billing</button>
                                        </div>
                                    )}
                                </div>

                                {/* NEW: INLINE INVENTORY DEDUCTION TOOL */}
                                {req.status === "Paid" && (
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginTop: '15px', paddingTop: '15px', borderTop: '1px dashed #1e293b' }}>
                                        <div style={{ padding: '10px', backgroundColor: '#1e293b', borderRadius: '8px', display: 'flex', gap: '10px', alignItems: 'center', flex: 1 }}>
                                            <span style={{ color: '#94a3b8', fontSize: '14px' }}>Deduct Stock:</span>
                                            <select 
                                                value={deductItem[req.id] || ''} 
                                                onChange={(e) => setDeductItem(prev => ({ ...prev, [req.id]: e.target.value }))}
                                                style={{ flex: 1, padding: '8px', borderRadius: '6px', backgroundColor: '#0f172a', color: 'white', border: '1px solid #334155' }}
                                            >
                                                <option value="">Select Medicine...</option>
                                                <option value="none">No Inventory Deduction</option>
                                                {inventory.map(inv => <option key={inv.item_id} value={inv.medicine_name}>{inv.medicine_name} (Stock: {inv.stock})</option>)}
                                            </select>
                                            
                                            {deductItem[req.id] && deductItem[req.id] !== 'none' && (
                                                <input 
                                                    type="number" 
                                                    min="1" 
                                                    placeholder="Qty" 
                                                    value={deductQty[req.id] || ''} 
                                                    onChange={(e) => setDeductQty(prev => ({ ...prev, [req.id]: e.target.value }))}
                                                    style={{ padding: '8px', borderRadius: '6px', backgroundColor: '#0f172a', color: 'white', border: '1px solid #334155', width: '70px' }}
                                                />
                                            )}
                                        </div>
                                        <button onClick={() => handleDispense(req.id)} className="action-button" style={{ width: 'auto', backgroundColor: '#10b981', padding: '10px 20px', fontSize: '14px', margin: 0 }}>
                                            <CheckCircle2 size={18} style={{ marginRight: '8px', display: 'inline' }} /> Hand Over Medicine
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        )}

        {/* TAB 2: INVENTORY & RESTOCK */}
        {activeTab === 'inventory' && (
            <div>
                <header className="content-header">
                    <h1>Live Inventory Tracker</h1>
                    <p>Monitor stock levels and request supplies from Admin.</p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                    
                    {/* LEFT: RESTOCK REQUEST FORM */}
                    <div className="form-card">
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 20px 0', color: '#ec4899' }}><Truck size={20}/> Request Restock</h3>
                        <form onSubmit={handleStockRequest} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div className="input-group">
                                <label>Medicine Name</label>
                                <input type="text" value={stockName} onChange={(e) => setStockName(e.target.value)} required placeholder="e.g., Paracetamol 500mg" />
                            </div>
                            <div className="input-group">
                                <label>Quantity Required</label>
                                <input type="number" value={stockQty} onChange={(e) => setStockQty(e.target.value)} required min="1" placeholder="e.g., 100" />
                            </div>
                            <button type="submit" className="action-button" style={{ backgroundColor: '#ec4899' }}>Submit Request to Admin</button>
                        </form>
                    </div>

                    {/* RIGHT: LOW STOCK ALERTS */}
                    <div className="form-card" style={{ border: lowStockItems.length > 0 ? '1px solid #ef4444' : '1px solid #1e293b' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '0 0 20px 0', color: lowStockItems.length > 0 ? '#ef4444' : '#10b981' }}>
                            {lowStockItems.length > 0 ? <AlertTriangle size={20}/> : <CheckCircle2 size={20}/>}
                            {lowStockItems.length > 0 ? 'Critical Low Stock' : 'Stock Levels Healthy'}
                        </h3>
                        
                        {lowStockItems.length === 0 ? (
                            <p style={{ color: '#94a3b8' }}>All medications are currently above the 20-unit safe threshold.</p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {lowStockItems.map((item, idx) => (
                                    <div key={idx} style={{ padding: '10px 15px', backgroundColor: '#450a0a', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', color: '#fca5a5', fontWeight: 'bold' }}>
                                        <span>{item.medicine_name}</span>
                                        <span>{item.stock} Units Left</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* FULL INVENTORY GRID */}
                <h3 style={{ marginTop: '40px', color: 'white', marginBottom: '15px' }}>All Pharmaceuticals</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                    {inventory.length === 0 ? (
                        <p style={{ color: '#64748b', gridColumn: '1 / -1' }}>No inventory records found. Submit a request to begin stocking.</p>
                    ) : (
                        inventory.map((item) => (
                            <div key={item.item_id} style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '8px', borderTop: `4px solid ${item.stock < 20 ? '#ef4444' : '#10b981'}` }}>
                                <h4 style={{ margin: 0, color: 'white', fontSize: '18px' }}>{item.medicine_name}</h4>
                                <p style={{ margin: '10px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>Current Stock:</p>
                                <p style={{ margin: '5px 0 0 0', color: item.stock < 20 ? '#ef4444' : '#10b981', fontSize: '24px', fontWeight: 'bold' }}>{item.stock}</p>
                            </div>
                        ))
                    )}
                </div>

            </div>
        )}

      </main>
    </div>
  );
};

export default PharmacistDashboard;