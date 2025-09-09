import React, { useState, useEffect } from 'react';
import { createOrder } from '../../../../services/order';
import { getSuppliers } from '../../../../services/supplier';
import { getInventoryItems } from '../../../../services/item';
import Alert from '../../../../components/Alert';

const NewOrderModal = ({ isOpen, onClose, onOrderCreated }) => {
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [newOrderForm, setNewOrderForm] = useState({
    supplier_id: '',
    description: '',
    receipt_number: '',
    items: []
  });
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Alert state
  const [alert, setAlert] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info'
  });

  // Load suppliers and products when modal opens
  useEffect(() => {
    if (isOpen) {
      loadFormData();
    }
  }, [isOpen]);

  // Alert helper functions
  const showAlert = (title, message, type = 'info') => {
    setAlert({
      isOpen: true,
      title,
      message,
      type
    });
  };

  const hideAlert = () => {
    setAlert(prev => ({ ...prev, isOpen: false }));
  };

  const loadFormData = async () => {
    try {
      setIsLoadingData(true);
      
      // Fetch suppliers and products
      const [suppliersData, productsData] = await Promise.all([
        getSuppliers(),
        getInventoryItems()
      ]);
      
      setSuppliers(suppliersData || []);
      setProducts(productsData || []);
      
      // Reset form
      setNewOrderForm({
        supplier_id: '',
        description: '',
        receipt_number: '',
        items: []
      });
    } catch (err) {
      console.error('Error loading form data:', err);
      showAlert('Error', 'Failed to load suppliers and products', 'error');
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleClose = () => {
    setNewOrderForm({
      supplier_id: '',
      description: '',
      receipt_number: '',
      items: []
    });
    onClose();
  };

  const handleAddItem = () => {
    setNewOrderForm(prev => ({
      ...prev,
      items: [...prev.items, { item_id: '', qty: 1, unit_price: '' }]
    }));
  };

  const handleRemoveItem = (index) => {
    setNewOrderForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const handleItemChange = (index, field, value) => {
    setNewOrderForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    
    console.log('Submitting order with data:', newOrderForm);
    
    if (!newOrderForm.supplier_id) {
      showAlert('Validation Error', 'Please select a supplier', 'warning');
      return;
    }
    
    if (newOrderForm.items.length === 0) {
      showAlert('Validation Error', 'Please add at least one item', 'warning');
      return;
    }
    
    // Validate items
    for (let item of newOrderForm.items) {
      if (!item.item_id || !item.qty || item.unit_price === '' || item.unit_price === null || item.unit_price === undefined) {
        showAlert('Validation Error', 'Please fill in all item details', 'warning');
        return;
      }
    }
    
    try {
      setIsSubmittingOrder(true);
      
      await createOrder(newOrderForm);
      
      // Show success message
      showAlert('Success!', 'Order created successfully!', 'success');
      
      // Close modal after a short delay
      setTimeout(() => {
        handleClose();
      }, 1500);
      
      // Notify parent component (with error handling)
      try {
        await onOrderCreated();
      } catch (refreshError) {
        console.error('Error refreshing data after order creation:', refreshError);
        // Don't show this error to user as the order was created successfully
      }
      
    } catch (err) {
      console.error('Error creating order:', err);
      showAlert('Error', err.message || 'Failed to create order', 'error');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={handleClose}></div>
      <div className="relative w-full max-w-4xl mx-4 shadow-2xl">
        <div className="bg-gray-800 border border-gray-700 rounded-xl">
          {/* Modal Header */}
          <div className="px-6 py-4 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-white">Create New Order</h3>
                <p className="text-sm text-gray-400">Add a new purchase order</p>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-white transition-colors duration-200"
                disabled={isSubmittingOrder}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <form onSubmit={handleSubmitOrder}>
            <div className="p-6 max-h-[70vh] overflow-y-auto">

              {isLoadingData ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-400">Loading suppliers and products...</span>
                </div>
              ) : (
                <>
                  {/* Order Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Supplier *
                      </label>
                      <select
                        value={newOrderForm.supplier_id}
                        onChange={(e) => setNewOrderForm(prev => ({ ...prev, supplier_id: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-900/60 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                        disabled={isSubmittingOrder}
                      >
                        <option value="">Select a supplier</option>
                        {suppliers.map(supplier => (
                          <option key={supplier.id} value={supplier.id}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Receipt Number
                      </label>
                      <input
                        type="text"
                        value={newOrderForm.receipt_number}
                        onChange={(e) => setNewOrderForm(prev => ({ ...prev, receipt_number: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-900/60 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter receipt number"
                        disabled={isSubmittingOrder}
                      />
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newOrderForm.description}
                      onChange={(e) => setNewOrderForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-900/60 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter order description"
                      rows={3}
                      disabled={isSubmittingOrder}
                    />
                  </div>

                  {/* Order Items */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium text-white">Order Items</h4>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm transition-colors duration-200 disabled:opacity-50"
                        disabled={isSubmittingOrder}
                      >
                        Add Item
                      </button>
                    </div>

                    {newOrderForm.items.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <p>No items added yet. Click "Add Item" to get started.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {newOrderForm.items.map((item, index) => (
                          <div key={index} className="bg-gray-900/50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="text-white font-medium">Item {index + 1}</h5>
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-400 hover:text-red-300 disabled:opacity-50"
                                disabled={isSubmittingOrder}
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Product *
                                </label>
                                <select
                                  value={item.item_id}
                                  onChange={(e) => handleItemChange(index, 'item_id', e.target.value)}
                                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  required
                                  disabled={isSubmittingOrder}
                                >
                                  <option value="">Select product</option>
                                  {products.map(product => (
                                    <option key={product.id} value={product.id}>
                                      {product.description} - {product.code}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Quantity *
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.qty}
                                  onChange={(e) => handleItemChange(index, 'qty', parseInt(e.target.value) || 1)}
                                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  required
                                  disabled={isSubmittingOrder}
                                />
                              </div>

                              <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1">
                                  Unit Price *
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={item.unit_price || ''}
                                  onChange={(e) => handleItemChange(index, 'unit_price', e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  required
                                  disabled={isSubmittingOrder}
                                  placeholder="0.00"
                                />
                              </div>
                            </div>

                            <div className="mt-2 text-right">
                              <span className="text-sm text-gray-400">
                                Total: {formatCurrency((item.qty || 0) * (parseFloat(item.unit_price) || 0))}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-700 flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
                disabled={isSubmittingOrder}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50"
                disabled={isSubmittingOrder || isLoadingData}
              >
                {isSubmittingOrder ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Alert Component */}
      <Alert
        isOpen={alert.isOpen}
        title={alert.title}
        message={alert.message}
        type={alert.type}
        onConfirm={hideAlert}
        confirmText="OK"
      />
    </div>
  );
};

export default NewOrderModal;
