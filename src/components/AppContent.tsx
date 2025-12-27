import React, { useState } from 'react';
import { Sidebar } from './layout/Sidebar';
import { LoadingScreen } from './layout/LoadingScreen';
import { useAuth } from '../contexts/AuthContext';
import { OwnerLogin } from './auth/OwnerLogin';
import { EmployeeLogin } from './auth/EmployeeLogin';
import { Dashboard } from './dashboard/Dashboard';
import { POS } from './pos/POS';
import { Inventory } from './inventory/Inventory';
import { StaffManagement } from './staff/StaffManagement';
import { Settings } from './settings/Settings';
import { SalesHistory } from './sales/SalesHistory';
import { Analytics } from './analytics/Analytics';
import { useNotification } from '../contexts/NotificationContext';

export function AppContent() {
  const { user, business, employee, loading, isOwner, isEmployee } = useAuth();
  const { notifications } = useNotification();
  const [loginType, setLoginType] = useState<'owner' | 'employee'>('owner');
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  if (loading) {
    return <LoadingScreen />;
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
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        currentView={currentPage}
        onViewChange={setCurrentPage}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="bg-blue-50 border-b border-blue-200 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-blue-800 font-medium">
                  {notifications[0].message}
                </span>
              </div>
            </div>
          </div>
        )}
        
        <main className="flex-1 overflow-auto">
          {renderCurrentPage()}
        </main>
      </div>
    </div>
  );
}