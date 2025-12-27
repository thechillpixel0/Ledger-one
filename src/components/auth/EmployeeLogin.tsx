import React, { useState, useEffect } from 'react';
import { Building, User, Lock } from 'lucide-react';
import { supabase, Business } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

interface EmployeeLoginProps {
  onSwitchToOwner: () => void;
}

export function EmployeeLogin({ onSwitchToOwner }: EmployeeLoginProps) {
  const { loginEmployee } = useAuth();
  const { error: showError, success: showSuccess } = useNotification();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);

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
    
    if (!selectedBusiness || !selectedEmployee || !passcode) {
      showError('Missing Information', 'Please fill in all fields');
      return;
    }
    
    setLoading(true);

    const result = await loginEmployee(selectedBusiness, selectedEmployee, passcode);
    
    if (result.success) {
      showSuccess('Login Successful', 'Welcome back!');
    } else {
      showError('Login Failed', result.error || 'Invalid credentials');
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

          <Select
            label="Select Business"
            icon={<Building className="h-5 w-5" />}
            value={selectedBusiness}
            onChange={(e) => setSelectedBusiness(e.target.value)}
            options={[
              { value: '', label: 'Choose a business' },
              ...businesses.map(business => ({
                value: business.id,
                label: business.name
              }))
            ]}
            required
          />

          <Select
            label="Select Employee"
            icon={<User className="h-5 w-5" />}
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            options={[
              { value: '', label: 'Choose employee' },
              ...employees.map(employee => ({
                value: employee.id,
                label: employee.name
              }))
            ]}
            disabled={!selectedBusiness}
            required
          />

          <Input
            label="Passcode"
            type="password"
            icon={<Lock className="h-5 w-5" />}
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Enter your passcode"
            required
          />

          <Button
            type="submit"
            variant="success"
            size="lg"
            loading={loading}
            disabled={!selectedBusiness || !selectedEmployee || !passcode}
            className="w-full"
          >
            Login
          </Button>

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