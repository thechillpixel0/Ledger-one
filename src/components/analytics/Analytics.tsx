import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, ShoppingCart, Users, Calendar, BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface AnalyticsData {
  dailySales: { date: string; amount: number; transactions: number }[];
  topProducts: { name: string; quantity: number; revenue: number }[];
  employeePerformance: { name: string; sales: number; transactions: number }[];
  paymentMethods: { method: string; amount: number; count: number }[];
  monthlyTrends: { month: string; sales: number; transactions: number }[];
}

export function Analytics() {
  const { business } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    dailySales: [],
    topProducts: [],
    employeePerformance: [],
    paymentMethods: [],
    monthlyTrends: [],
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState(30); // days

  useEffect(() => {
    if (business?.id) {
      fetchAnalytics();
    }
  }, [business?.id, dateRange]);

  const fetchAnalytics = async () => {
    if (!business?.id) return;

    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - dateRange);

      // Fetch transactions with items
      const { data: transactions } = await supabase
        .from('transactions')
        .select(`
          *,
          transaction_items (*)
        `)
        .eq('business_id', business.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());

      if (transactions) {
        // Process daily sales
        const dailySalesMap = new Map();
        transactions.forEach(transaction => {
          const date = new Date(transaction.created_at).toISOString().split('T')[0];
          if (!dailySalesMap.has(date)) {
            dailySalesMap.set(date, { amount: 0, transactions: 0 });
          }
          const day = dailySalesMap.get(date);
          day.amount += transaction.total_amount;
          day.transactions += 1;
        });

        const dailySales = Array.from(dailySalesMap.entries()).map(([date, data]) => ({
          date,
          amount: data.amount,
          transactions: data.transactions,
        })).sort((a, b) => a.date.localeCompare(b.date));

        // Process top products
        const productMap = new Map();
        transactions.forEach(transaction => {
          transaction.transaction_items?.forEach(item => {
            if (!productMap.has(item.item_name)) {
              productMap.set(item.item_name, { quantity: 0, revenue: 0 });
            }
            const product = productMap.get(item.item_name);
            product.quantity += item.quantity;
            product.revenue += item.total_price;
          });
        });

        const topProducts = Array.from(productMap.entries())
          .map(([name, data]) => ({ name, quantity: data.quantity, revenue: data.revenue }))
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 10);

        // Process employee performance
        const employeeMap = new Map();
        employeeMap.set('Owner', { sales: 0, transactions: 0 });

        // Fetch employee names
        const { data: employees } = await supabase
          .from('employees')
          .select('id, name')
          .eq('business_id', business.id);

        employees?.forEach(emp => {
          employeeMap.set(emp.name, { sales: 0, transactions: 0 });
        });

        transactions.forEach(transaction => {
          let employeeName = 'Owner';
          if (transaction.employee_id) {
            const employee = employees?.find(emp => emp.id === transaction.employee_id);
            employeeName = employee?.name || 'Unknown';
          }
          
          if (!employeeMap.has(employeeName)) {
            employeeMap.set(employeeName, { sales: 0, transactions: 0 });
          }
          
          const emp = employeeMap.get(employeeName);
          emp.sales += transaction.total_amount;
          emp.transactions += 1;
        });

        const employeePerformance = Array.from(employeeMap.entries())
          .map(([name, data]) => ({ name, sales: data.sales, transactions: data.transactions }))
          .filter(emp => emp.transactions > 0)
          .sort((a, b) => b.sales - a.sales);

        // Process payment methods
        const paymentMap = new Map();
        transactions.forEach(transaction => {
          if (!paymentMap.has(transaction.payment_method)) {
            paymentMap.set(transaction.payment_method, { amount: 0, count: 0 });
          }
          const payment = paymentMap.get(transaction.payment_method);
          payment.amount += transaction.total_amount;
          payment.count += 1;
        });

        const paymentMethods = Array.from(paymentMap.entries()).map(([method, data]) => ({
          method,
          amount: data.amount,
          count: data.count,
        }));

        // Process monthly trends (last 12 months)
        const monthlyMap = new Map();
        const last12Months = new Date();
        last12Months.setMonth(last12Months.getMonth() - 12);

        const { data: monthlyTransactions } = await supabase
          .from('transactions')
          .select('*')
          .eq('business_id', business.id)
          .gte('created_at', last12Months.toISOString());

        monthlyTransactions?.forEach(transaction => {
          const month = new Date(transaction.created_at).toISOString().slice(0, 7);
          if (!monthlyMap.has(month)) {
            monthlyMap.set(month, { sales: 0, transactions: 0 });
          }
          const monthData = monthlyMap.get(month);
          monthData.sales += transaction.total_amount;
          monthData.transactions += 1;
        });

        const monthlyTrends = Array.from(monthlyMap.entries())
          .map(([month, data]) => ({ month, sales: data.sales, transactions: data.transactions }))
          .sort((a, b) => a.month.localeCompare(b.month));

        setAnalytics({
          dailySales,
          topProducts,
          employeePerformance,
          paymentMethods,
          monthlyTrends,
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getTotalSales = () => {
    return analytics.dailySales.reduce((sum, day) => sum + day.amount, 0);
  };

  const getTotalTransactions = () => {
    return analytics.dailySales.reduce((sum, day) => sum + day.transactions, 0);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
        <div className="flex space-x-2">
          {[7, 30, 90].map(days => (
            <button
              key={days}
              onClick={() => setDateRange(days)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                dateRange === days
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
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

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <div className="flex items-center">
            <ShoppingCart className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">
                {getTotalTransactions()}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg. Sale</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(getTotalTransactions() > 0 ? getTotalSales() / getTotalTransactions() : 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-orange-500">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Daily Avg.</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(analytics.dailySales.length > 0 ? getTotalSales() / analytics.dailySales.length : 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
          <div className="space-y-3">
            {analytics.topProducts.slice(0, 5).map((product, index) => (
              <div key={product.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-medium mr-3">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.quantity} sold</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(product.revenue)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Employee Performance */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Performance</h3>
          <div className="space-y-3">
            {analytics.employeePerformance.map((employee, index) => (
              <div key={employee.name} className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium mr-3 ${
                    employee.name === 'Owner' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{employee.name}</p>
                    <p className="text-xs text-gray-500">{employee.transactions} transactions</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {formatCurrency(employee.sales)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
          <div className="space-y-3">
            {analytics.paymentMethods.map((payment) => (
              <div key={payment.method} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 capitalize">
                    {payment.method.replace('_', ' ')}
                  </p>
                  <p className="text-xs text-gray-500">{payment.count} transactions</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-900">
                    {formatCurrency(payment.amount)}
                  </span>
                  <p className="text-xs text-gray-500">
                    {((payment.amount / getTotalSales()) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Daily Sales Chart */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Sales Trend</h3>
          <div className="space-y-2">
            {analytics.dailySales.slice(-7).map((day) => {
              const maxAmount = Math.max(...analytics.dailySales.map(d => d.amount));
              const percentage = maxAmount > 0 ? (day.amount / maxAmount) * 100 : 0;
              
              return (
                <div key={day.date} className="flex items-center">
                  <div className="w-20 text-xs text-gray-500">
                    {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1 mx-3">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                  <div className="w-20 text-xs text-gray-900 text-right">
                    {formatCurrency(day.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}