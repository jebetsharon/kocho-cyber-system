import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { PlusIcon, EyeIcon, XMarkIcon } from '@heroicons/react/24/outline';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      const params = statusFilter ? { status: statusFilter } : {};
      const response = await api.get('/orders', { params });
      setOrders(response.data.orders);
    } catch (error) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const viewOrder = async (orderId) => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setSelectedOrder(response.data.order);
      setShowModal(true);
    } catch (error) {
      toast.error('Failed to load order details');
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}`, { status });
      toast.success('Order status updated');
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        setShowModal(false);
      }
    } catch (error) {
      toast.error('Failed to update order');
    }
  };

  const cancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await api.post(`/orders/${orderId}/cancel`);
      toast.success('Order cancelled');
      fetchOrders();
      setShowModal(false);
    } catch (error) {
      toast.error('Failed to cancel order');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      paid: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      partial: 'bg-orange-100 text-orange-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="mt-1 text-sm text-gray-500">Manage all your orders and transactions</p>
        </div>
        <Link
          to="/orders/new"
          className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Order
        </Link>
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="block w-full sm:w-64 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
        >
          <option value="">All Orders</option>
          <option value="pending">Pending</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.order_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {order.customer?.name || 'Walk-in'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    KSh {order.final_amount?.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                      {order.payment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => viewOrder(order.id)}
                      className="text-primary-600 hover:text-primary-900"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No orders found</p>
            </div>
          )}
        </div>
      )}

      {/* Order Details Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowModal(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Order Details</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Order Number</p>
                    <p className="font-medium">{selectedOrder.order_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Customer</p>
                    <p className="font-medium">{selectedOrder.customer?.name || 'Walk-in customer'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="font-medium uppercase">{selectedOrder.payment_method}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-500 mb-2">Order Items</p>
                  <div className="border border-gray-200 rounded-lg divide-y">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="p-3 flex justify-between">
                        <div>
                          <p className="font-medium">{item.item_name}</p>
                          <p className="text-sm text-gray-500">
                            {item.quantity} x KSh {item.unit_price.toLocaleString()}
                          </p>
                        </div>
                        <p className="font-medium">KSh {item.total_price.toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">KSh {selectedOrder.total_amount?.toLocaleString()}</span>
                  </div>
                  {selectedOrder.discount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Discount</span>
                      <span className="font-medium">- KSh {selectedOrder.discount?.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary-600">KSh {selectedOrder.final_amount?.toLocaleString()}</span>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div>
                    <p className="text-sm text-gray-500">Notes</p>
                    <p className="mt-1 text-sm">{selectedOrder.notes}</p>
                  </div>
                )}

                <div className="flex space-x-3 pt-4">
                  {selectedOrder.status === 'pending' && (
                    <>
                      <button
                        onClick={() => updateOrderStatus(selectedOrder.id, 'completed')}
                        className="flex-1 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                      >
                        Mark as Completed
                      </button>
                      <button
                        onClick={() => cancelOrder(selectedOrder.id)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Cancel Order
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;