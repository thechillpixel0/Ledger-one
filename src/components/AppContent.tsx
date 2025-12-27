import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { OwnerLogin } from './auth/OwnerLogin';
import { EmployeeLogin } from './auth/EmployeeLogin';
import { Navbar } from './layout/Navbar';
import { Dashboard } from './dashboard/Dashboard';
import { POS } from './pos/POS';
import { Inventory } from './inventory/Inventory';
import { StaffManagement } from './staff/StaffManagement';
import { Settings } from './settings/Settings';
import { SalesHistory } from './sales/SalesHistory';
import { Analytics } from './analytics/Analytics';
import { PageLoader } from './ui/LoadingSpinner';

export function AppContent() {
  const { user, business, employee, loading, isOwner, isEmployee } = useAuth();
  const [loginType, setLoginType] = useState<'owner' | 'employee'>('owner');
  const [currentPage, setCurrentPage] = useState('dashboard');

  if (loading) {
    return <PageLoader />;
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
      case 'sales':
        return <SalesHistory />;
      case 'analytics':
        return <Analytics />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentPage={currentPage} onPageChange={setCurrentPage} />
      <main className="transition-all duration-300">{renderCurrentPage()}</main>
    </div>
  );
}