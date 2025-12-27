import React from 'react';
import { LogOut, Settings, Users, Package, ShoppingCart, BarChart3 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

interface NavbarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

export function Navbar({ currentPage, onPageChange }: NavbarProps) {
  const { business, employee, isOwner, isEmployee, signOut } = useAuth();

  const getEmployeePermissions = () => {
    if (!employee) return { pos_access: false, inventory_access: false, dashboard_access: false };
    return employee.permissions;
  };

  const permissions = getEmployeePermissions();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: BarChart3,
      show: isOwner || (isEmployee && permissions.dashboard_access),
    },
    {
      id: 'pos',
      label: 'POS',
      icon: ShoppingCart,
      show: isOwner || (isEmployee && permissions.pos_access),
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Package,
      show: isOwner || (isEmployee && permissions.inventory_access),
    },
    {
      id: 'staff',
      label: 'Staff',
      icon: Users,
      show: isOwner,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      show: isOwner,
    },
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-blue-600">LedgerOne</h1>
              {business && (
                <span className="ml-3 text-sm text-gray-500">
                  {business.name}
                </span>
              )}
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.filter(item => item.show).map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => onPageChange(item.id)}
                    className={`${
                      currentPage === item.id
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              {isOwner ? 'Owner' : isEmployee ? employee?.name : 'User'}
            </span>
            <button
              onClick={signOut}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}