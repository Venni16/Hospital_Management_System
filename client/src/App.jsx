import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import Login from './components/Login';
import Layout from './components/Layout';
import AdminDashboard from './pages/AdminDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import NurseDashboard from './pages/NurseDashboard';
import ReceptionistDashboard from './pages/ReceptionistDashboard';

function AppContent() {
  const { isAuthenticated, currentUser } = useApp();

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderDashboard = () => {
    switch (currentUser?.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'doctor':
        return <DoctorDashboard />;
      case 'nurse':
        return <NurseDashboard />;
      case 'receptionist':
        return <ReceptionistDashboard />;
      default:
        return <div>Invalid role</div>;
    }
  };

  return (
    <Layout>
      {renderDashboard()}
    </Layout>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;