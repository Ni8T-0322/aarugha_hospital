// frontend/src/components/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, UserPlus, LogOut, ShieldAlert, Eye, EyeOff, Trash2, UserCircle } from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  // Tab State: 'add-staff', 'view-staff', or 'add-patient'
  const [activeView, setActiveView] = useState('add-staff'); 
  
  // Staff Form States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Doctor');
  const [showPassword, setShowPassword] = useState(false);

  // Patient Form States
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');

  // Roster State
  const [staffList, setStaffList] = useState([]);

  // Email Generator logic for Staff
  let aliasName = '';
  if (firstName && lastName) aliasName = `${firstName}.${lastName}`;
  else if (firstName) aliasName = firstName;
  else if (lastName) aliasName = lastName;

  const cleanAlias = aliasName.toLowerCase().replace(/\s+/g, '');
  const generatedEmail = cleanAlias ? `unagasairao+${cleanAlias}@gmail.com` : '';

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // --- API CALLS ---

  // 1. Fetch Staff List
  const fetchStaff = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/staff');
      setStaffList(response.data);
    } catch (err) {
      console.error("Failed to fetch staff list");
    }
  };

  // 2. Add New Staff
  const handleAddStaff = async (e) => {
    e.preventDefault();
    const payload = {
      email: generatedEmail,
      password: password,
      role: role,
      age: parseInt(age), 
      gender: gender
    };

    try {
      const response = await axios.post('http://127.0.0.1:8000/register-staff', payload);
      alert("✅ " + response.data.message);
      setFirstName(''); setLastName(''); setAge(''); setGender(''); setPassword('');
      setShowPassword(false);
      fetchStaff();
    } catch (err) {
      alert("❌ Error: " + (err.response?.data?.detail || "Registration failed."));
    }
  };

  // 3. Delete Staff
  const handleDeleteStaff = async (emailToDelete) => {
    if (emailToDelete === 'unagasairao+admin@gmail.com') {
      alert("⚠️ You cannot delete the Master Admin account!");
      return;
    }
    const confirmDelete = window.confirm(`Are you absolutely sure you want to terminate access for ${emailToDelete}?`);
    if (!confirmDelete) return;

    try {
      await axios.delete(`http://127.0.0.1:8000/delete-staff/${emailToDelete}`);
      fetchStaff();
    } catch (err) {
      alert("❌ Error deleting staff member.");
    }
  };

  // 4. Add New Patient
  const handleAddPatient = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://127.0.0.1:8000/register-patient', {
        name: patientName,
        phone: patientPhone
      });
      
      // Critical Alert for the Receptionist/Admin to give to the patient
      alert(`✅ ${response.data.message}\n\nPatient ID: ${response.data.patient_id}\nDefault Password: ${response.data.password}`);
      
      setPatientName('');
      setPatientPhone('');
    } catch (err) {
      alert("❌ Error: " + (err.response?.data?.detail || "Patient registration failed."));
    }
  };

  useEffect(() => {
    if (activeView === 'view-staff') {
      fetchStaff();
    }
  }, [activeView]);

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <ShieldAlert size={32} color="#0ea5e9" />
          <h2>Admin Control</h2>
        </div>
        
        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${activeView === 'add-staff' ? 'active' : ''}`}
            onClick={() => setActiveView('add-staff')}
          >
            <UserPlus size={20} /> Add New Staff
          </button>
          
          <button 
            className={`nav-item ${activeView === 'view-staff' ? 'active' : ''}`}
            onClick={() => setActiveView('view-staff')}
          >
            <Users size={20} /> View All Staff
          </button>

          {/* NEW TAB FOR PATIENT REGISTRATION */}
          <button 
            className={`nav-item ${activeView === 'add-patient' ? 'active' : ''}`}
            onClick={() => setActiveView('add-patient')}
          >
            <UserCircle size={20} /> Register Patient
          </button>
        </nav>
        
        <button onClick={handleLogout} className="logout-button">
          <LogOut size={20} /> Secure Logout
        </button>
      </aside>

      <main className="main-content">
        
        {/* --- VIEW 1: ADD STAFF --- */}
        {activeView === 'add-staff' && (
          <>
            <header className="content-header">
              <h1>Staff Registration Portal</h1>
              <p>Create secure access credentials with full profile details.</p>
            </header>
            <div className="form-card">
              <form onSubmit={handleAddStaff}>
                <div style={{ display: 'flex', gap: '15px', marginBottom: '15px' }}>
                  <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>First Name</label>
                    <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                  </div>
                  <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Last Name</label>
                    <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                  <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Age</label>
                    <input type="number" value={age} onChange={(e) => setAge(e.target.value)} required min="18" max="100" />
                  </div>
                  <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                    <label>Gender</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)} className="role-select" required>
                      <option value="" disabled>Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ backgroundColor: '#0f172a', padding: '15px', borderRadius: '8px', border: '1px dashed #334155', marginBottom: '20px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '5px' }}>Auto-Generated Login Email:</span>
                  <span style={{ color: '#0ea5e9', fontSize: '16px', fontWeight: 'bold' }}>{generatedEmail || 'Type a name...'}</span>
                </div>

                <div className="input-group">
                  <label>Temporary Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required style={{ paddingRight: '45px' }} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div className="input-group" style={{ marginTop: '20px' }}>
                  <label>Assign Role</label>
                  <select value={role} onChange={(e) => setRole(e.target.value)} className="role-select">
                    <option value="Doctor">Doctor</option>
                    <option value="Receptionist">Receptionist</option>
                    <option value="Pharmacist">Pharmacist</option>
                  </select>
                </div>
                <button type="submit" className="action-button">Register Staff Member</button>
              </form>
            </div>
          </>
        )}

        {/* --- VIEW 2: STAFF ROSTER --- */}
        {activeView === 'view-staff' && (
          <>
            <header className="content-header">
              <h1>Hospital Master Roster</h1>
              <p>Manage active employee access and privileges.</p>
            </header>
            <div className="form-card" style={{ maxWidth: '1000px', padding: '0' }}>
              {staffList.length === 0 ? (
                <p style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>Loading staff roster...</p>
              ) : (
                <div style={{ width: '100%', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#0f172a', borderBottom: '2px solid #1e293b' }}>
                        <th style={{ padding: '15px 20px', color: '#94a3b8', fontWeight: '500' }}>Login Email</th>
                        <th style={{ padding: '15px 20px', color: '#94a3b8', fontWeight: '500' }}>Age</th>
                        <th style={{ padding: '15px 20px', color: '#94a3b8', fontWeight: '500' }}>Gender</th>
                        <th style={{ padding: '15px 20px', color: '#94a3b8', fontWeight: '500' }}>System Role</th>
                        <th style={{ padding: '15px 20px', color: '#94a3b8', fontWeight: '500', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffList.map((staff, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid #1e293b' }}>
                          <td style={{ padding: '15px 20px', fontWeight: '500', color: '#f8fafc' }}>{staff.email}</td>
                          <td style={{ padding: '15px 20px', color: '#cbd5e1' }}>{staff.age || '--'}</td>
                          <td style={{ padding: '15px 20px', color: '#cbd5e1' }}>{staff.gender || '--'}</td>
                          <td style={{ padding: '15px 20px' }}>
                            <span style={{ 
                              backgroundColor: staff.role === 'Admin' ? '#f43f5e20' : '#0ea5e920', 
                              color: staff.role === 'Admin' ? '#f43f5e' : '#0ea5e9', 
                              padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' 
                            }}>
                              {staff.role}
                            </span>
                          </td>
                          <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                            {staff.role !== 'Admin' ? (
                              <button 
                                onClick={() => handleDeleteStaff(staff.email)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '5px' }}
                                title="Terminate Access"
                              >
                                <Trash2 size={18} />
                              </button>
                            ) : (
                              <span style={{ color: '#64748b', fontSize: '12px' }}>Protected</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* --- VIEW 3: ADD PATIENT --- */}
        {activeView === 'add-patient' && (
          <>
            <header className="content-header">
              <h1>Patient Registration</h1>
              <p>Generate a new Patient ID and initialize medical records.</p>
            </header>
            <div className="form-card">
              <form onSubmit={handleAddPatient}>
                <div className="input-group">
                  <label>Patient Full Name</label>
                  <input 
                    type="text" 
                    value={patientName} 
                    onChange={(e) => setPatientName(e.target.value)} 
                    placeholder="e.g., John Doe"
                    required 
                  />
                </div>

                <div className="input-group">
                  <label>Primary Phone Number (Used as default password)</label>
                  <input 
                    type="tel" 
                    value={patientPhone} 
                    onChange={(e) => setPatientPhone(e.target.value)} 
                    placeholder="e.g., 9876543210"
                    required 
                  />
                </div>

                <button type="submit" className="action-button">Generate Patient ID</button>
              </form>
            </div>
          </>
        )}

      </main>
    </div>
  );
};

export default AdminDashboard;