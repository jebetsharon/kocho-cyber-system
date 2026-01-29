import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { PlusIcon, PencilIcon, ExclamationTriangleIcon, PlusCircleIcon, MinusCircleIcon } from '@heroicons/react/24/outline';

const Inventory = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLowStock, setShowLowStock] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [stockItem, setStockItem] = useState(null);
  const [stockOperation, setStockOperation] = useState('add');
  const [stockQuantity, setStockQuantity] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    category: 'stationery',
    sku: '',
    quantity: 0,
    min_quantity: 10,
    unit_price: '',
    selling_price: '',
    supplier: '',
  });

  useEffect(() => {
    fetchInventory();
  }, [showLowStock]);

  const fetchInventory = async () => {
    try {
      const params = showLowStock ? { low_stock: 'true' } : {};
      const response = await api.get('/inventory', { params });
      setItems(response.data.items);
    } catch (error) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.put(`/inventory/${editingItem.id}`, formData);
        toast.success('Item updated successfully');
      } else {
        await api.post('/inventory', formData);
        toast.success('Item created successfully');
      }
      setShowModal(false);
      resetForm();
      fetchInventory();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleStockAdjustment = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/inventory/${stockItem.id}/stock`, {
        quantity: parseInt(stockQuantity),
        operation: stockOperation,
      });
      toast.success('Stock adjusted successfully');
      setShowStockModal(false);
      setStockItem(null);
      setStockQuantity('');
      fetchInventory();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to adjust stock');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      sku: item.sku || '',
      quantity: item.quantity,
      min_quantity: item.min_quantity,
      unit_price: item.unit_price,
      selling_price: item.selling_price,
      supplier: item.supplier || '',
    });
    setShowModal(true);
  };

  const openStockModal = (item) => {
    setStockItem(item);
    setStockOperation('add');
    setStockQuantity('');
    setShowStockModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: 'stationery',
      sku: '',
      quantity: 0,
      min_quantity: 10,
      unit_price: '',
      selling_price: '',
      supplier: '',
    });
    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your stock and supplies</p>
        </div>
        {user?.role === 'owner' && (
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Item
          </button>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={showLowStock}
            onChange={(e) => setShowLowStock(e.target.checked)}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-900">
            Show only low stock items
          </label>
        </div>
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
                  Item
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Selling Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50 ${item.is_low_stock ? 'bg-red-50' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      {item.is_low_stock && (
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                        <div className="text-sm text-gray-500 capitalize">{item.category}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {item.sku || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm ${item.is_low_stock ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                      {item.quantity}
                    </span>
                    <span className="text-sm text-gray-500"> / {item.min_quantity}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    KSh {item.unit_price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    KSh {item.selling_price.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button
                      onClick={() => openStockModal(item)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Adjust Stock"
                    >
                      <PlusCircleIcon className="h-5 w-5 inline" />
                    </button>
                    {user?.role === 'owner' && (
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-primary-600 hover:text-primary-900"
                        title="Edit"
                      >
                        <PencilIcon className="h-5 w-5 inline" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {items.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p>No items found</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowModal(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <form onSubmit={handleSubmit}>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingItem ? 'Edit Item' : 'Add New Item'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Item Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category *</label>
                      <select
                        required
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      >
                        <option value="stationery">Stationery</option>
                        <option value="supplies">Office Supplies</option>
                        <option value="equipment">Equipment</option>
                        <option value="consumables">Consumables</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">SKU</label>
                      <input
                        type="text"
                        value={formData.sku}
                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Quantity *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Min. Quantity *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.min_quantity}
                        onChange={(e) => setFormData({ ...formData, min_quantity: parseInt(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Cost Price (KSh) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.unit_price}
                        onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Selling Price (KSh) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.selling_price}
                        onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Supplier</label>
                    <input
                      type="text"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700"
                  >
                    {editingItem ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showStockModal && stockItem && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowStockModal(false)}></div>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full sm:p-6">
              <form onSubmit={handleStockAdjustment}>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Adjust Stock</h3>
                <p className="text-sm text-gray-600 mb-4">
                  <strong>{stockItem.name}</strong> - Current Stock: {stockItem.quantity}
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Operation</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="add"
                          checked={stockOperation === 'add'}
                          onChange={(e) => setStockOperation(e.target.value)}
                          className="mr-2"
                        />
                        <PlusCircleIcon className="h-5 w-5 text-green-500 mr-1" />
                        Add Stock
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          value="remove"
                          checked={stockOperation === 'remove'}
                          onChange={(e) => setStockOperation(e.target.value)}
                          className="mr-2"
                        />
                        <MinusCircleIcon className="h-5 w-5 text-red-500 mr-1" />
                        Remove Stock
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Quantity *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:flex sm:flex-row-reverse gap-3">
                  <button
                    type="submit"
                    className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700"
                  >
                    Adjust Stock
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowStockModal(false)}
                    className="mt-3 sm:mt-0 w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;