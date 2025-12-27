import React from 'react';
import { 
  Home, 
  ShoppingCart, 
  Package, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ currentView, onViewChange, isCollapsed, onToggleCollapse }: SidebarProps) {
  const { user, business, isOwner, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, ownerOnly: false },
    { id: 'pos', label: 'Point of Sale', icon: ShoppingCart, ownerOnly: false },
    { id: 'inventory', label: 'Inventory', icon: Package, ownerOnly: false },
    { id: 'sales', label: 'Sales History', icon: BarChart3, ownerOnly: false },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, ownerOnly: true },
    { id: 'staff', label: 'Staff Management', icon: Users, ownerOnly: true },
    { id: 'settings', label: 'Settings', icon: Settings, ownerOnly: true },
  ];

  const filteredMenuItems = menuItems.filter(item => !item.ownerOnly || isOwner);

  return (
    <div className={`bg-white shadow-lg transition-all duration-300 ease-in-out ${
      isCollapsed ? 'w-16' : 'w-64'
    } flex flex-col h-full`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div>
              <h2 className="text-lg font-semibold text-gray-800 truncate">
                {business?.name || 'Business'}
              </h2>
              <p className="text-sm text-gray-500 truncate">
                {isOwner ? 'Owner' : user?.name || 'Employee'}
              </p>
            </div>
          )}
          <button
            onClick={onToggleCollapse}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isCollapsed ? 'mx-auto' : 'mr-3'} ${
                isActive ? 'text-blue-700' : 'text-gray-500'
              }`} />
              {!isCollapsed && (
                <span className="font-medium">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className={`w-full flex items-center px-3 py-2 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-700 transition-all duration-200 ${
            isCollapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
          {!isCollapsed && <span className="font-medium">Logout</span>}
        </button>
      </div>
    </div>
  );
}