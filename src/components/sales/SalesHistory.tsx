import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, User, Filter, Download, Eye } from 'lucide-react';
import { supabase, Transaction, TransactionItem } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';

interface TransactionWithItems extends Transaction {
  items: TransactionItem[];
  employee_name?: string;
}

export function SalesHistory() {
  const { business, isOwner } = useAuth();
  const { success: showSuccess, error: showError } = useNotification();
  const [transactions, setTransactions] = useState<TransactionWithItems[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionWithItems | null>(null);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    employeeId: '',
    paymentMethod: '',
    minAmount: '',
    maxAmount: '',
  });
  const [employees, setEmployees] = useState<any[]>([]);

  useEffect(() => {
    if (business?.id) {
      fetchTransactions();
      if (isOwner) {
        fetchEmployees();
      }
    }
  }, [business?.id, isOwner]);

  useEffect(() => {
    applyFilters();
  }, [transactions, filters]);

  const fetchTransactions = async () => {
    if (!business?.id) return;

    setLoading(true);
    try {
      const { data: transactionData } = await supabase
        .from('transactions')
        .select(`
          *,
          transaction_items (*)
        `)
        .eq('business_id', business.id)
        .order('created_at', { ascending: false });

      if (transactionData) {
        // Fetch employee names for transactions
        const transactionsWithEmployees = await Promise.all(
          transactionData.map(async (transaction) => {
            let employee_name = 'Owner';
            if (transaction.employee_id) {
              const { data: employee } = await supabase
                .from('employees')
                .select('name')
                .eq('id', transaction.employee_id)
                .single();
              employee_name = employee?.name || 'Unknown Employee';
            }
            return {
              ...transaction,
              items: transaction.transaction_items || [],
              employee_name,
            };
          })
        );

        setTransactions(transactionsWithEmployees);
      }
    } catch (error) {
      showError('Error', 'Failed to fetch sales history');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    if (!business?.id) return;

    const { data } = await supabase
      .from('employees')
      .select('id, name')
      .eq('business_id', business.id)
      .eq('is_active', true);

    if (data) setEmployees(data);
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    if (filters.dateFrom) {
      filtered = filtered.filter(t => 
        new Date(t.created_at) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(t => 
        new Date(t.created_at) <= new Date(filters.dateTo + 'T23:59:59')
      );
    }

    if (filters.employeeId) {
      filtered = filtered.filter(t => t.employee_id === filters.employeeId);
    }

    if (filters.paymentMethod) {
      filtered = filtered.filter(t => t.payment_method === filters.paymentMethod);
    }

    if (filters.minAmount) {
      filtered = filtered.filter(t => t.total_amount >= parseFloat(filters.minAmount));
    }

    if (filters.maxAmount) {
      filtered = filtered.filter(t => t.total_amount <= parseFloat(filters.maxAmount));
    }

    setFilteredTransactions(filtered);
  };

  const exportToCSV = () => {
    const csvData = filteredTransactions.map(transaction => ({
      Date: new Date(transaction.created_at).toLocaleDateString(),
      Time: new Date(transaction.created_at).toLocaleTimeString(),
      'Transaction ID': transaction.id,
      Employee: transaction.employee_name,
      'Payment Method': transaction.payment_method,
      'Total Amount': transaction.total_amount,
      Items: transaction.items.map(item => `${item.item_name} (${item.quantity})`).join('; '),
    }));

    const csv = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    showSuccess('Export Complete', 'Sales history exported successfully');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getTotalSales = () => {
    return filteredTransactions.reduce((sum, t) => sum + t.total_amount, 0);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Sales History</h1>
        <div className="flex space-x-3">
          <Button
            onClick={exportToCSV}
            variant="outline"
            icon={<Download className="w-4 h-4" />}
            disabled={filteredTransactions.length === 0}
          >
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(getTotalSales())}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Transactions</p>
              <p className="text-2xl font-bold text-gray-900">
                {filteredTransactions.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center">
            <User className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Average Sale</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(filteredTransactions.length > 0 ? getTotalSales() / filteredTransactions.length : 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Filters
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Input
            label="From Date"
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
          />
          
          <Input
            label="To Date"
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
          />

          {isOwner && (
            <Select
              label="Employee"
              value={filters.employeeId}
              onChange={(e) => setFilters(prev => ({ ...prev, employeeId: e.target.value }))}
              options={[
                { value: '', label: 'All Employees' },
                { value: 'owner', label: 'Owner' },
                ...employees.map(emp => ({ value: emp.id, label: emp.name }))
              ]}
            />
          )}

          <Select
            label="Payment Method"
            value={filters.paymentMethod}
            onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value }))}
            options={[
              { value: '', label: 'All Methods' },
              { value: 'cash', label: 'Cash' },
              { value: 'card', label: 'Card' },
              { value: 'upi', label: 'UPI' },
              { value: 'bank_transfer', label: 'Bank Transfer' },
            ]}
          />

          <Input
            label="Min Amount"
            type="number"
            step="0.01"
            value={filters.minAmount}
            onChange={(e) => setFilters(prev => ({ ...prev, minAmount: e.target.value }))}
            placeholder="0.00"
          />

          <Input
            label="Max Amount"
            type="number"
            step="0.01"
            value={filters.maxAmount}
            onChange={(e) => setFilters(prev => ({ ...prev, maxAmount: e.target.value }))}
            placeholder="999999.99"
          />
        </div>

        <div className="mt-4">
          <Button
            onClick={() => setFilters({
              dateFrom: '',
              dateTo: '',
              employeeId: '',
              paymentMethod: '',
              minAmount: '',
              maxAmount: '',
            })}
            variant="outline"
            size="sm"
          >
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Transaction ID
                </th>
                {isOwner && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Employee
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>
                      <div>{new Date(transaction.created_at).toLocaleDateString()}</div>
                      <div className="text-gray-500">{new Date(transaction.created_at).toLocaleTimeString()}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {transaction.id.slice(0, 8)}...
                  </td>
                  {isOwner && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        transaction.employee_name === 'Owner' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {transaction.employee_name}
                      </span>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {transaction.payment_method.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {formatCurrency(transaction.total_amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.items.length} item(s)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Button
                      onClick={() => setSelectedTransaction(transaction)}
                      variant="outline"
                      size="sm"
                      icon={<Eye className="w-4 h-4" />}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your filters or check back later.
            </p>
          </div>
        )}
      </div>

      {/* Transaction Detail Modal */}
      <Modal
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        title="Transaction Details"
        size="lg"
      >
        {selectedTransaction && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                <p className="mt-1 text-sm font-mono text-gray-900">{selectedTransaction.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date & Time</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedTransaction.created_at).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Employee</label>
                <p className="mt-1 text-sm text-gray-900">{selectedTransaction.employee_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <p className="mt-1 text-sm text-gray-900 capitalize">
                  {selectedTransaction.payment_method.replace('_', ' ')}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Items</label>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedTransaction.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">{item.item_name}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{formatCurrency(item.unit_price)}</td>
                        <td className="px-4 py-2 text-sm font-semibold text-gray-900">{formatCurrency(item.total_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-4 py-2 text-sm font-medium text-gray-900 text-right">Total:</td>
                      <td className="px-4 py-2 text-sm font-bold text-gray-900">{formatCurrency(selectedTransaction.total_amount)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}