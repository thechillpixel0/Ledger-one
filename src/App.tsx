import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { OwnerLogin } from './components/auth/OwnerLogin';
import { EmployeeLogin } from './components/auth/EmployeeLogin';
import { Navbar } from './components/layout/Navbar';
import { Dashboard } from './components/dashboard/Dashboard';
import { POS } from './components/pos/POS';
import { Inventory } from './components/inventory/Inventory';
import { StaffManagement } from './components/staff/StaffManagement';
import { Settings } from './components/settings/Settings';

function App() {
  const { user, business, employee, loading, isOwner, isEmployee } = useAuth();
  const [loginType, setLoginType] = useState<'owner' | 'employee'>('owner');
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!user && !isEmployee) {
    if (loginType === 'owner') {
      return <OwnerLogin onSwitchToEmployee={() => setLoginType('employee')} />;
    } else {
      return <EmployeeLogin onSwitchToOwner={() => setLoginType('owner')} />;
    }
  }

  // Show business setup if owner but no business
  if (isOwner && !business) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Setting up your business...
          </h2>
          <p className="text-gray-600">Please wait while we initialize your account.</p>
        </div>
      </div>
    );
  }

  // Main app interface
  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'pos':
        return <POS />;
      case 'inventory':
        return <Inventory />;
      case 'staff':
        return <StaffManagement />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main>{renderCurrentPage()}</main>
    </div>
  );
}

export default App;