import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { PlusIcon, TrashIcon, MagnifyingGlassIcon, PrinterIcon } from '@heroicons/react/24/outline';

const NewOrder = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [orderItems, setOrderItems] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentStatus, setPaymentStatus] = useState('paid');
  const [notes, setNotes] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchServices();
    fetchInventory();
  }, []);

  useEffect(() => {
    if (customerSearch.length >= 2) {
      searchCustomers();
    } else {
      setCustomers([]);
    }
  }, [customerSearch]);

  const fetchServices = async () => {
    try {
      const response = await api.get('/services');
      setServices(response.data.services);
    } catch (error) {
      console.error('Failed to load services');
    }
  };

  const fetchInventory = async () => {
    try {
      const response = await api.get('/inventory');
      setInventory(response.data.items);
    } catch (error) {
      console.error('Failed to load inventory');
    }
  };

  const searchCustomers = async () => {
    try {
      const response = await api.get(`/customers/search?q=${customerSearch}`);
      setCustomers(response.data.customers);
    } catch (error) {
      console.error('Failed to search customers');
    }
  };

  const addServiceToOrder = (service, quantity = 1) => {
    const existingItem = orderItems.find(
      (item) => item.item_type === 'service' && item.item_id === service.id
    );

    if (existingItem) {
      setOrderItems(
        orderItems.map((item) =>
          item.item_type === 'service' && item.item_id === service.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      );
    } else {
      setOrderItems([
        ...orderItems,
        {
          item_type: 'service',
          item_id: service.id,
          item_name: service.name,
          quantity,
          unit_price: service.base_price,
        },
      ]);
    }
    setShowServiceModal(false);
  };

  const addProductToOrder = (product, quantity = 1) => {
    if (product.quantity < quantity) {
      toast.error('Insufficient stock');
      return;
    }

    const existingItem = orderItems.find(
      (item) => item.item_type === 'product' && item.item_id === product.id
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (product.quantity < newQuantity) {
        toast.error('Insufficient stock');
        return;
      }
      setOrderItems(
        orderItems.map((item) =>
          item.item_type === 'product' && item.item_id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    } else {
      setOrderItems([
        ...orderItems,
        {
          item_type: 'product',
          item_id: product.id,
          item_name: product.name,
          quantity,
          unit_price: product.selling_price,
        },
      ]);
    }
    setShowProductModal(false);
  };

  const removeItem = (index) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateQuantity = (index, newQuantity) => {
    if (newQuantity < 1) return;
    const item = orderItems[index];
    if (item.item_type === 'product') {
      const product = inventory.find((p) => p.id === item.item_id);
      if (product && product.quantity < newQuantity) {
        toast.error('Insufficient stock');
        return;
      }
    }
    setOrderItems(
      orderItems.map((item, i) => (i === index ? { ...item, quantity: newQuantity } : item))
    );
  };

  const calculateTotal = () => {
    const subtotal = orderItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    return subtotal - discount;
  };

  const handleSubmit = async () => {
    if (orderItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    setSubmitting(true);
    try {
      const orderData = {
        customer_id: selectedCustomer?.id,
        items: orderItems,
        discount,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        notes,
        reference_number: referenceNumber,
      };

      const response = await api.post('/orders', orderData);
      toast.success('Order created successfully!');
      
      // Print receipt
      if (window.confirm('Do you want to print the receipt?')) {
        printReceipt(response.data.order);
      }
      
      navigate('/orders');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  const printReceipt = (order) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Receipt - ${order.order_number}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { font-size: 18px; margin-bottom: 5px; }
            .header { text-align: center; margin-bottom: 20px; }
            .details { margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
            .total { font-weight: bold; font-size: 16px; }
            .footer { margin-top: 20px; text-align: center; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Kocho Printers and Cyber Ltd</h1>
            <p>Eldoret Town, Saito Building, Alot Oloo Street, Room B10</p>
            <p>Email: kochoprinters@gmail.com | Phone: 0724444979</p>
            <hr>
          </div>
          <div class="details">
            <p><strong>Order #:</strong> ${order.order_number}</p>
            <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleString()}</p>
            ${order.customer ? `<p><strong>Customer:</strong> ${order.customer.name}</p>` : ''}
          </div>
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${order.items.map(item => `
                <tr>
                  <td>${item.item_name}</td>
                  <td>${item.quantity}</td>
                  <td>KSh ${item.unit_price.toLocaleString()}</td>
                  <td>KSh ${item.total_price.toLocaleString()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div style="margin-top: 20px;">
            <p><strong>Subtotal:</strong> KSh ${order.total_amount.toLocaleString()}</p>
            ${order.discount > 0 ? `<p><strong>Discount:</strong> KSh ${order.discount.toLocaleString()}</p>` : ''}
            <p class="total"><strong>Total:</strong> KSh ${order.final_amount.toLocaleString()}</p>
            <p><strong>Payment Method:</strong> ${order.payment_method.toUpperCase()}</p>
            <p><strong>Status:</strong> ${order.payment_status.toUpperCase()}</p>
          </div>
          <div class="footer">
            <p>Thank you for your business!</p>
            <p>Open Hours: 8:00 AM - 7:00 PM (Monday - Saturday)</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">New Order</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Items Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Customer (Optional)</h3>
            <div className="relative">
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search customer by name or phone..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              />
              <MagnifyingGlassIcon className="absolute right-3 top-3 h-5 w-5 text-gray-400" />
            </div>
            {customers.length > 0 && (
              <div className="mt-2 border border-gray-200 rounded-md max-h-48 overflow-y-auto">
                {customers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setCustomers([]);
                      setCustomerSearch('');
                    }}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0"
                  >
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-gray-500">{customer.phone}</p>
                  </button>
                ))}
              </div>
            )}
            {selectedCustomer && (
              <div className="mt-4 p-3 bg-green-50 rounded-md flex justify-between items-center">
                <div>
                  <p className="font-medium text-green-900">{selectedCustomer.name}</p>
                  <p className="text-sm text-green-700">{selectedCustomer.phone}</p>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Add Items */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add Items</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setShowServiceModal(true)}
                className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-primary-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2 text-primary-500" />
                <span className="font-medium text-gray-900">Add Service</span>
              </button>
              <button
                onClick={() => setShowProductModal(true)}
                className="flex items-center justify-center px-4 py-3 border-2 border-dashed border-primary-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2 text-primary-500" />
                <span className="font-medium text-gray-900">Add Product</span>
              </button>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Order Items</h3>
            {orderItems.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No items added yet</p>
            ) : (
              <div className="space-y-3">
                {orderItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.item_name}</p>
                      <p className="text-sm text-gray-500">KSh {item.unit_price.toLocaleString()}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateQuantity(index, parseInt(e.target.value))}
                        className="w-20 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                      <p className="w-24 text-right font-medium">
                        KSh {(item.quantity * item.unit_price).toLocaleString()}
                      </p>
                      <button
                        onClick={() => removeItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Order Summary */}
        <div className="space-y-6">
          <div className="bg-white shadow rounded-lg p-6 sticky top-20">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h3>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">
                  KSh {orderItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Discount</span>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  className="w-32 rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-right"
                />
              </div>
              <div className="border-t pt-3 flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary-600">KSh {calculateTotal().toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="cash">Cash</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="card">Card</option>
                </select>
              </div>

              {paymentMethod === 'mpesa' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">M-Pesa Code</label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="Enter M-Pesa transaction code"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                  <option value="partial">Partial</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  placeholder="Add any notes..."
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting || orderItems.length === 0}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                'Processing...'
              ) : (
                <>
                  <PrinterIcon className="h-5 w-5 mr-2" />
                  Complete Order
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Service Modal */}
      {showServiceModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowServiceModal(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Service</h3>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => addServiceToOrder(service)}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-500"
                  >
                    <p className="font-medium text-gray-900">{service.name}</p>
                    <p className="text-sm text-gray-500">KSh {service.base_price.toLocaleString()} / {service.unit}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowProductModal(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Product</h3>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {inventory.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addProductToOrder(product)}
                    disabled={product.quantity === 0}
                    className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-500">KSh {product.selling_price.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm ${product.quantity < product.min_quantity ? 'text-red-600' : 'text-gray-500'}`}>
                          Stock: {product.quantity}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewOrder;