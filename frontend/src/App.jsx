import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Import all your dashboards
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import ReceptionistDashboard from './components/ReceptionistDashboard';
import DoctorDashboard from './components/DoctorDashboard';
import PharmacistDashboard from './components/PharmacistDashboard';
import BillingDashboard from './components/BillingDashboard';
import LabDashboard from './components/LabDashboard';
import PatientDashboard from './components/PatientDashboard';
import DisplayDashboard from './components/DisplayDashboard';

// --- THE DIGITAL BOUNCER ---
// This wrapper checks if the user is logged in and if they have the right role
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('role');

  // 1. If they have no token, kick them to the login screen
  if (!token) return <Navigate to="/login" replace />;
  
  // 2. If they try to enter a room they don't have access to, kick them to their own dashboard
  if (allowedRoles && !allowedRoles.includes(userRole)) {
     if (userRole === 'Admin') return <Navigate to="/admin" replace />;
     if (userRole === 'Receptionist') return <Navigate to="/receptionist" replace />;
     if (userRole === 'Doctor') return <Navigate to="/doctor" replace />;
     if (userRole === 'Pharmacist') return <Navigate to="/pharmacy" replace />;
     if (userRole === 'Billing') return <Navigate to="/billing" replace />;
     if (userRole === 'Display') return <Navigate to="/display" replace />;
     if (userRole === 'Patient') return <Navigate to="/patient" replace />;
     return <Navigate to="/login" replace />;
  }

  // 3. If they pass all checks, let them in
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Default route sends everyone to login */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* Public Login Route */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Hospital Routes */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['Admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/receptionist" element={
          <ProtectedRoute allowedRoles={['Receptionist']}>
            <ReceptionistDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/doctor" element={
          <ProtectedRoute allowedRoles={['Doctor']}>
            <DoctorDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/pharmacy" element={
          <ProtectedRoute allowedRoles={['Pharmacist']}>
            <PharmacistDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/billing" element={
          <ProtectedRoute allowedRoles={['Billing']}>
            <BillingDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/lab" element={
          <ProtectedRoute allowedRoles={['Lab']}>
            <LabDashboard />
          </ProtectedRoute>
        } />
        
        <Route path="/patient" element={
          <ProtectedRoute allowedRoles={['Patient']}>
            <PatientDashboard />
          </ProtectedRoute>
        } />

        <Route path="/display" element={
          <ProtectedRoute allowedRoles={['Display']}>
            <DisplayDashboard />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;