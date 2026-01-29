import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Reports = () => {
  const { user } = useAuth();
  const [reportType, setReportType] = useState('sales');
  const [loading, setLoading] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reportData, setReportData] = useState(null);

  useEffect(() => {
    // Set default date range (last 30 days)
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    setDateTo(today.toISOString().split('T')[0]);
    setDateFrom(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  const fetchReport = async () => {
    if (!dateFrom || !dateTo) {
      toast.error('Please select date range');
      return;
    }

    setLoading(true);
    try {
      const params = { date_from: dateFrom, date_to: dateTo };
      let response;

      switch (reportType) {
        case 'sales':
          response = await api.get('/reports/sales', { params });
          break;
        case 'services':
          response = await api.get('/reports/services', { params });
          break;
        case 'profit-loss':
          if (user?.role !== 'owner') {
            toast.error('Only owner can view P&L report');
            return;
          }
          response = await api.get('/reports/profit-loss', { params });
          break;
        case 'inventory':
          response = await api.get('/reports/inventory');
          break;
        case 'customers':
          response = await api.get('/reports/customers');
          break;
        default:
          return;
      }

      setReportData(response.data);
    } catch (error) {
      toast.error('Failed to generate report');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const renderSalesReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total Sales</p>
          <p className="text-2xl font-bold text-gray-900">
            KSh {reportData?.total_sales?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total Orders</p>
          <p className="text-2xl font-bold text-gray-900">{reportData?.total_orders || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500">Average Order</p>
          <p className="text-2xl font-bold text-gray-900">
            KSh {reportData?.average_order?.toFixed(2) || 0}
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h3>
        <div className="space-y-2">
          {reportData?.payment_breakdown?.map((method, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <span className="font-medium capitalize">{method.method}</span>
              <div className="text-right">
                <p className="font-bold">KSh {method.total.toLocaleString()}</p>
                <p className="text-sm text-gray-500">{method.count} transactions</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Daily Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Orders</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Sales</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reportData?.daily_breakdown?.map((day, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 text-sm">{new Date(day.date).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-sm text-right">{day.orders}</td>
                  <td className="px-4 py-2 text-sm text-right font-medium">
                    KSh {day.sales.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderServicesReport = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Services Performance</h3>
          <p className="text-sm text-gray-500">
            Total Revenue: <span className="font-bold">KSh {reportData?.total_revenue?.toLocaleString()}</span>
          </p>
        </div>
        <div className="space-y-2">
          {reportData?.services?.map((service, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">{service.name}</p>
                <p className="text-sm text-gray-500">{service.quantity} times</p>
              </div>
              <p className="font-bold">KSh {service.revenue.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProfitLossReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">
            KSh {reportData?.revenue?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total Expenses</p>
          <p className="text-2xl font-bold text-red-600">
            KSh {reportData?.expenses?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500">Net Profit</p>
          <p className={`text-2xl font-bold ${reportData?.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            KSh {reportData?.net_profit?.toLocaleString() || 0}
          </p>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-sm text-gray-500">Profit Margin</p>
        <p className="text-3xl font-bold text-primary-600">{reportData?.profit_margin?.toFixed(2) || 0}%</p>
      </div>
    </div>
  );

  const renderInventoryReport = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total Items</p>
          <p className="text-2xl font-bold text-gray-900">{reportData?.total_items || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total Value</p>
          <p className="text-2xl font-bold text-gray-900">
            KSh {reportData?.total_value?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500">Low Stock Items</p>
          <p className="text-2xl font-bold text-red-600">{reportData?.low_stock_count || 0}</p>
        </div>
      </div>

      {reportData?.low_stock_items?.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Low Stock Items</h3>
          <div className="space-y-2">
            {reportData.low_stock_items.map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-500">
                    Current: {item.quantity} / Min: {item.min_quantity}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderCustomersReport = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <p className="text-sm text-gray-500">Total Customers</p>
        <p className="text-2xl font-bold text-gray-900">{reportData?.total_customers || 0}</p>
      </div>

      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Top Customers</h3>
        <div className="space-y-2">
          {reportData?.top_customers?.slice(0, 10).map((customer, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <p className="font-medium">{customer.name}</p>
                <p className="text-sm text-gray-500">{customer.phone}</p>
              </div>
              <p className="font-bold">KSh {customer.total_spent.toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">Generate detailed business reports</p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value);
                setReportData(null);
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="sales">Sales Report</option>
              <option value="services">Services Performance</option>
              <option value="inventory">Inventory Report</option>
              <option value="customers">Customers Report</option>
              {user?.role === 'owner' && <option value="profit-loss">Profit & Loss</option>}
            </select>
          </div>
          {(reportType === 'sales' || reportType === 'services' || reportType === 'profit-loss') && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </>
          )}
        </div>
        <button
          onClick={fetchReport}
          disabled={loading}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Generate Report'}
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      )}

      {reportData && !loading && (
        <>
          {reportType === 'sales' && renderSalesReport()}
          {reportType === 'services' && renderServicesReport()}
          {reportType === 'profit-loss' && renderProfitLossReport()}
          {reportType === 'inventory' && renderInventoryReport()}
          {reportType === 'customers' && renderCustomersReport()}
        </>
      )}
    </div>
  );
};

export default Reports;