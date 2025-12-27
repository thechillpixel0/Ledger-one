import React, { useState, useEffect } from 'react';
import { Building, User, Lock } from 'lucide-react';
import { supabase, Business } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

interface EmployeeLoginProps {
  onSwitchToOwner: () => void;
}

export function EmployeeLogin({ onSwitchToOwner }: EmployeeLoginProps) {
  const { loginEmployee } = useAuth();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBusinesses();
  }, []);

  useEffect(() => {
    if (selectedBusiness) {
      fetchEmployees(selectedBusiness);
    }
  }, [selectedBusiness]);

  const fetchBusinesses = async () => {
    const { data } = await supabase
      .from('businesses')
      .select('*')
      .order('name');
    
    if (data) setBusinesses(data);
  };

  const fetchEmployees = async (businessId: string) => {
    const { data } = await supabase
      .from('employees')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .order('name');
    
    if (data) setEmployees(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await loginEmployee(selectedBusiness, selectedEmployee, passcode);
    
    if (!result.success) {
      setError(result.error || 'Login failed');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">LedgerOne</h1>
          <h2 className="text-xl text-gray-600">Employee Login</h2>
        </div>

        <form className="mt-8 space-y-6 bg-white p-8 rounded-lg shadow-md" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="business" className="block text-sm font-medium text-gray-700">
              Select Business
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building className="h-5 w-5 text-gray-400" />
              </div>
              <select
                id="business"
                required
                value={selectedBusiness}
                onChange={(e) => setSelectedBusiness(e.target.value)}
                className="pl-10 block w-full border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Choose a business</option>
                {businesses.map((business) => (
                  <option key={business.id} value={business.id}>
                    {business.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="employee" className="block text-sm font-medium text-gray-700">
              Select Employee
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <select
                id="employee"
                required
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="pl-10 block w-full border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                disabled={!selectedBusiness}
              >
                <option value="">Choose employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="passcode" className="block text-sm font-medium text-gray-700">
              Passcode
            </label>
            <div className="mt-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="passcode"
                name="passcode"
                type="password"
                required
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="pl-10 block w-full border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                placeholder="Enter your passcode"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !selectedBusiness || !selectedEmployee}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={onSwitchToOwner}
              className="text-gray-600 hover:text-gray-500 text-sm"
            >
              Owner Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}