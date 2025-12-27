import React from 'react';
import { LogOut, Settings, Users, Package, ShoppingCart, BarChart3, History, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

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
      id: 'sales',
      label: 'Sales History',
      icon: History,
      show: isOwner || (isEmployee && permissions.dashboard_access),
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: TrendingUp,
      show: isOwner,
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
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                LedgerOne
              </h1>
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
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 hover:bg-gray-50'
                    } inline-flex items-center px-3 py-1 border-b-2 text-sm font-medium transition-all duration-200 rounded-t-lg`}
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
              {isOwner ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Owner
                </span>
              ) : isEmployee ? (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {employee?.name}
                </span>
              ) : (
                'User'
              )}
            </span>
            <Button
              onClick={signOut}
              variant="danger"
              size="sm"
              icon={<LogOut className="w-4 h-4" />}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}