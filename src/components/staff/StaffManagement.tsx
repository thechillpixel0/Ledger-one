import React, { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, Users, ToggleLeft, ToggleRight } from 'lucide-react';
import { supabase, Employee } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export function StaffManagement() {
  const { business } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (business?.id) {
      fetchEmployees();
    }
  }, [business?.id]);

  const fetchEmployees = async () => {
    if (!business?.id) return;

    const { data } = await supabase
      .from('employees')
      .select('*')
      .eq('business_id', business.id)
      .order('name');

    if (data) setEmployees(data);
    setLoading(false);
  };

  const toggleEmployeeStatus = async (employee: Employee) => {
    const { error } = await supabase
      .from('employees')
      .update({ is_active: !employee.is_active })
      .eq('id', employee.id);

    if (error) {
      alert('Error updating employee status');
    } else {
      fetchEmployees();
    }
  };

  const deleteEmployee = async (employee: Employee) => {
    if (confirm(`Are you sure you want to delete ${employee.name}?`)) {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', employee.id);

      if (error) {
        alert('Error deleting employee');
      } else {
        fetchEmployees();
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
        <button
          onClick={() => setShowAddEmployee(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Employee
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Permissions
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map((employee) => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {employee.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          Created: {new Date(employee.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div className="flex flex-wrap gap-1">
                        {employee.permissions.pos_access && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                            POS
                          </span>
                        )}
                        {employee.permissions.inventory_access && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Inventory
                          </span>
                        )}
                        {employee.permissions.dashboard_access && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                            Dashboard
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleEmployeeStatus(employee)}
                      className={`inline-flex items-center ${
                        employee.is_active ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      {employee.is_active ? (
                        <ToggleRight className="w-5 h-5 mr-1" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 mr-1" />
                      )}
                      {employee.is_active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => setEditingEmployee(employee)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteEmployee(employee)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(showAddEmployee || editingEmployee) && (
        <EmployeeModal
          employee={editingEmployee}
          onClose={() => {
            setShowAddEmployee(false);
            setEditingEmployee(null);
          }}
          onSave={() => {
            fetchEmployees();
            setShowAddEmployee(false);
            setEditingEmployee(null);
          }}
        />
      )}
    </div>
  );
}

interface EmployeeModalProps {
  employee: Employee | null;
  onClose: () => void;
  onSave: () => void;
}

function EmployeeModal({ employee, onClose, onSave }: EmployeeModalProps) {
  const { business } = useAuth();
  const [name, setName] = useState(employee?.name || '');
  const [passcode, setPasscode] = useState('');
  const [permissions, setPermissions] = useState({
    pos_access: employee?.permissions.pos_access || false,
    inventory_access: employee?.permissions.inventory_access || false,
    dashboard_access: employee?.permissions.dashboard_access || false,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business?.id) return;

    setLoading(true);

    try {
      const employeeData = {
        name,
        business_id: business.id,
        permissions,
        is_active: true,
        ...(passcode && { passcode }),
      };

      if (employee) {
        const { error } = await supabase
          .from('employees')
          .update(employeeData)
          .eq('id', employee.id);

        if (error) throw error;
      } else {
        if (!passcode) {
          alert('Passcode is required for new employees');
          return;
        }
        
        const { error } = await supabase
          .from('employees')
          .insert([{ ...employeeData, passcode }]);

        if (error) throw error;
      }

      onSave();
    } catch (error: any) {
      alert('Error saving employee: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {employee ? 'Edit Employee' : 'Add New Employee'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Passcode {employee && '(leave empty to keep current)'}
              </label>
              <input
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder={employee ? 'Enter new passcode' : 'Enter passcode'}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={permissions.pos_access}
                    onChange={(e) => setPermissions(prev => ({ ...prev, pos_access: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">POS Access</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={permissions.inventory_access}
                    onChange={(e) => setPermissions(prev => ({ ...prev, inventory_access: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Inventory Access</span>
                </label>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={permissions.dashboard_access}
                    onChange={(e) => setPermissions(prev => ({ ...prev, dashboard_access: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Dashboard Access</span>
                </label>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}