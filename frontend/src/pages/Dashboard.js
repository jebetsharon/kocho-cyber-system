import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  BanknotesIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  TrendingUpIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/reports/dashboard');
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const statCards = [
    {
      name: "Today's Sales",
      value: `KSh ${stats?.today_sales?.toLocaleString() || 0}`,
      icon: BanknotesIcon,
      color: 'bg-green-500',
      subtext: `${stats?.today_orders || 0} orders`,
    },
    {
      name: "Monthly Sales",
      value: `KSh ${stats?.month_sales?.toLocaleString() || 0}`,
      icon: TrendingUpIcon,
      color: 'bg-blue-500',
      subtext: `${stats?.month_orders || 0} orders`,
    },
    {
      name: 'Total Customers',
      value: stats?.total_customers || 0,
      icon: UserGroupIcon,
      color: 'bg-purple-500',
      subtext: `${stats?.new_customers || 0} new this month`,
    },
    {
      name: 'Pending Orders',
      value: stats?.pending_orders || 0,
      icon: ClockIcon,
      color: 'bg-yellow-500',
      subtext: 'Need attention',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className={`flex-shrink-0 ${stat.color} rounded-md p-3`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{stat.value}</div>
                    </dd>
                    <dd className="text-sm text-gray-500 mt-1">{stat.subtext}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Low Stock Alert */}
      {stats?.low_stock_count > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <span className="font-medium">{stats.low_stock_count} items</span> are running low on stock.{' '}
                <Link to="/inventory?filter=low_stock" className="font-medium underline hover:text-yellow-800">
                  View inventory
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
              <Link
                to="/orders"
                className="text-sm font-medium text-primary-600 hover:text-primary-500"
              >
                View all
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {stats?.recent_orders?.length > 0 ? (
              stats.recent_orders.map((order) => (
                <div key={order.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{order.order_number}</p>
                      <p className="text-sm text-gray-500">
                        {order.customer?.name || 'Walk-in customer'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(order.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        KSh {order.final_amount?.toLocaleString()}
                      </p>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.payment_status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {order.payment_status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                <ShoppingBagIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2">No recent orders</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Services */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Top Services This Month</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {stats?.top_services?.length > 0 ? (
              stats.top_services.map((service, index) => (
                <div key={index} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{service.name}</p>
                      <p className="text-sm text-gray-500">{service.quantity} times</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-900">
                        KSh {service.revenue?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                <p>No service data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Link
            to="/orders/new"
            className="flex flex-col items-center justify-center p-4 border-2 border-primary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <ShoppingBagIcon className="h-8 w-8 text-primary-500 mb-2" />
            <span className="text-sm font-medium text-gray-900">New Order</span>
          </Link>
          <Link
            to="/customers"
            className="flex flex-col items-center justify-center p-4 border-2 border-primary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <UserGroupIcon className="h-8 w-8 text-primary-500 mb-2" />
            <span className="text-sm font-medium text-gray-900">Customers</span>
          </Link>
          <Link
            to="/inventory"
            className="flex flex-col items-center justify-center p-4 border-2 border-primary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <ExclamationTriangleIcon className="h-8 w-8 text-primary-500 mb-2" />
            <span className="text-sm font-medium text-gray-900">Inventory</span>
          </Link>
          <Link
            to="/reports"
            className="flex flex-col items-center justify-center p-4 border-2 border-primary-200 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
          >
            <TrendingUpIcon className="h-8 w-8 text-primary-500 mb-2" />
            <span className="text-sm font-medium text-gray-900">Reports</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;