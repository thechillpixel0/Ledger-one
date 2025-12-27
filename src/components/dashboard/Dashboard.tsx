import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, Package, AlertTriangle } from 'lucide-react';
import { supabase, Product, Transaction } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';

export function Dashboard() {
  const { business } = useAuth();
  const [stats, setStats] = useState({
    todaysSales: 0,
    todaysTransactions: 0,
    monthlySales: 0,
    monthlyTransactions: 0,
  });
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [viewPeriod, setViewPeriod] = useState<'daily' | 'monthly'>('daily');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (business?.id) {
      fetchDashboardData();
    }
  }, [business?.id]);

  const fetchDashboardData = async () => {
    if (!business?.id) return;

    setLoading(true);
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Fetch today's transactions
    const { data: todayTransactions } = await supabase
      .from('transactions')
      .select('total_amount')
      .eq('business_id', business.id)
      .gte('created_at', `${today}T00:00:00.000Z`)
      .lt('created_at', `${today}T23:59:59.999Z`);

    // Fetch monthly transactions
    const { data: monthlyTransactions } = await supabase
      .from('transactions')
      .select('total_amount')
      .eq('business_id', business.id)
      .gte('created_at', monthStart);

    // Fetch low stock products
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('business_id', business.id)
      .eq('is_active', true)
      .order('stock_quantity');

    const lowStock = products?.filter(p => p.stock_quantity <= p.low_stock_threshold) || [];

    setStats({
      todaysSales: todayTransactions?.reduce((sum, t) => sum + Number(t.total_amount), 0) || 0,
      todaysTransactions: todayTransactions?.length || 0,
      monthlySales: monthlyTransactions?.reduce((sum, t) => sum + Number(t.total_amount), 0) || 0,
      monthlyTransactions: monthlyTransactions?.length || 0,
    });

    setLowStockProducts(lowStock);
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const currentStats = viewPeriod === 'daily' 
    ? { sales: stats.todaysSales, transactions: stats.todaysTransactions }
    : { sales: stats.monthlySales, transactions: stats.monthlyTransactions };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewPeriod('daily')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewPeriod === 'daily'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setViewPeriod('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewPeriod === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            This Month
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {viewPeriod === 'daily' ? "Today's Sales" : "Monthly Sales"}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(currentStats.sales)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                {viewPeriod === 'daily' ? "Today's Transactions" : "Monthly Transactions"}
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {currentStats.transactions}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Low Stock Alerts</p>
              <p className="text-2xl font-bold text-gray-900">
                {lowStockProducts.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200">
          <div className="p-6">
            <div className="flex items-center mb-4">
              <Package className="h-5 w-5 text-red-600 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900">Low Stock Products</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Current Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Threshold
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {lowStockProducts.map((product) => (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.stock_quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.low_stock_threshold}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                          Low Stock
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}