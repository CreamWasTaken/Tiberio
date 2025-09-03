import React, { useState, useEffect } from 'react';
import { getInventoryItems } from '../../../../services/item';

function AddTransactionModal({ 
  isOpen, 
  onClose, 
  isSavingTransaction, 
  mode = 'add',
  onSubmit 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [customerName, setCustomerName] = useState('');
  
  // Dynamic data states
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load inventory and categories when modal opens
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const inventoryData = await getInventoryItems();
      
      // Transform inventory data to match the expected format
      const transformedInventory = inventoryData.map(item => ({
        id: item.id,
        name: item.description || 'Unnamed Product',
        category: item.category_name || 'uncategorized',
        subcategory: item.subcategory_name || 'No Subcategory',
        price: parseFloat(item.pc_price) || 0,
        stock: item.stock || 0,
        code: item.code,
        supplier: item.supplier_name,
        subcategory_id: item.subcategory_id,
        attributes: item.attributes
      }));
      
      setInventory(transformedInventory);
    } catch (err) {
      setError(err.message);
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate receipt number on component mount
  useEffect(() => {
    if (isOpen) {
      const timestamp = new Date().getTime();
      const random = Math.floor(Math.random() * 1000);
      setReceiptNumber(`RCP-${timestamp}-${random}`);
    }
  }, [isOpen]);

  // Filter inventory based on search and category
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (item.code && item.code.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Get unique categories from inventory for filtering
  const availableCategories = [
    { key: 'all', label: 'All Items' },
    ...Array.from(new Set(inventory.map(item => item.category || 'uncategorized')))
      .filter(cat => cat !== 'uncategorized')
      .map(cat => ({ key: cat, label: cat.charAt(0).toUpperCase() + cat.slice(1) }))
  ];

  // Add item to cart
  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1, discount: 0 }]);
    }
  };

  // Remove item from cart
  const removeFromCart = (itemId) => {
    setCart(cart.filter(item => item.id !== itemId));
  };

  // Update item quantity
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCart(cart.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  // Update item discount
  const updateItemDiscount = (itemId, discount) => {
    setCart(cart.map(item => 
      item.id === itemId ? { ...item, discount: Math.max(0, discount) } : item
    ));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const itemDiscounts = cart.reduce((sum, item) => sum + (item.discount || 0), 0);
  
  // Calculate overall discount percentage based on total discounts applied
  const overallDiscountPercentage = subtotal > 0 ? Math.round((itemDiscounts / subtotal) * 100) : 0;
  const overallDiscountAmount = itemDiscounts; // Same as item discounts since that's the total discount
  
  const total = subtotal - itemDiscounts;

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      alert('Please add items to cart before proceeding');
      return;
    }

    if (!paymentMethod) {
      alert('Please select a payment method');
      return;
    }

    if (!receiptNumber.trim()) {
      alert('Please enter a receipt number');
      return;
    }

    // Prepare transaction data
    const transactionData = {
      receipt_number: receiptNumber,
      transaction_date: new Date().toISOString().split('T')[0],
      amount: total,
      payment_method: paymentMethod,
      transaction_type: 'pos_sale',
      description: 'POS Transaction',
      items: cart,
      subtotal,
      item_discounts: itemDiscounts,
      overall_discount: overallDiscountPercentage,
      overall_discount_amount: overallDiscountAmount,
      total,
      customer_name: customerName
    };

    // Call the parent onSubmit function
    onSubmit(e, transactionData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-gray-800 rounded-lg w-full max-w-[95vw] h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-700 px-8 py-6 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-white">
            {mode === 'edit' ? 'Edit Transaction' : 'Point of Sale'}
          </h2>
          <div className="flex items-center gap-6">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-3xl"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex h-[calc(95vh-140px)]">
          {/* Left Side - Inventory */}
          <div className="w-2/3 bg-gray-900 p-8 overflow-hidden">
            {/* Search and Categories */}
            <div className="mb-8">
              <div className="flex gap-6 mb-6">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-6 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-6 py-4 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg min-w-[200px]"
                >
                  {availableCategories.map(category => (
                    <option key={category.key} value={category.key}>
                      {category.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={loadData}
                  disabled={isLoading}
                  className="px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-medium"
                >
                  {isLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>

            {/* Inventory Grid */}
            <div className="grid grid-cols-3 gap-6 overflow-y-auto max-h-[calc(95vh-400px)] custom-scrollbar">
              {isLoading ? (
                <div className="col-span-full text-center py-10 text-gray-400">
                  <p>Loading inventory...</p>
                </div>
              ) : error ? (
                <div className="col-span-full text-center py-10 text-red-400">
                  <p>{error}</p>
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className="col-span-full text-center py-10 text-gray-400">
                  <p>No items found matching your criteria.</p>
                </div>
              ) : (
                filteredInventory.map(item => (
                                     <div
                     key={item.id}
                     className="bg-gray-800 border border-gray-700 rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer"
                     onClick={() => addToCart(item)}
                   >
                     <div className="flex justify-between items-start mb-3">
                       <h3 className="text-white font-medium text-base">{item.name}</h3>
                       <span className="text-sm text-gray-400 capitalize">{item.category}</span>
                     </div>
                     <div className="mb-2">
                       <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">
                         {item.subcategory}
                       </span>
                     </div>
                     <div className="flex justify-between items-center">
                       <span className="text-green-400 font-bold text-xl">₱{item.price.toLocaleString()}</span>
                       <span className="text-gray-400 text-sm">Stock: {item.stock}</span>
                     </div>
                     <div className="mt-3 text-center">
                       <span className="text-blue-400 text-sm">Click to add to cart</span>
                     </div>
                   </div>
                ))
              )}
            </div>
          </div>

          {/* Right Side - Cart */}
          <div className="w-1/3 bg-gray-800 p-8 flex flex-col">
            {/* Customer Info */}
            <div className="mb-8">
              <h3 className="text-white font-semibold text-lg mb-4">Customer Information</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Receipt Number *
                </label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  placeholder="Enter receipt number"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  required
                />
              </div>
              <input
                type="text"
                placeholder="Customer Name (Optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
              />
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto">
              <h3 className="text-white font-semibold text-lg mb-4">Cart Items</h3>
              {cart.length === 0 ? (
                <p className="text-gray-400 text-base">No items in cart</p>
              ) : (
                <div className="space-y-2">
                  {cart.map(item => (
                    <div key={item.id} className="bg-gray-700 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="text-white font-medium text-sm">{item.name}</h4>
                          <p className="text-gray-400 text-xs">₱{item.price.toLocaleString()} each</p>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-400 hover:text-red-300 text-lg"
                        >
                          ×
                        </button>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 bg-gray-600 text-white rounded flex items-center justify-center hover:bg-gray-500 text-sm"
                          >
                            -
                          </button>
                          <span className="text-white font-medium w-8 text-center text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 bg-gray-600 text-white rounded flex items-center justify-center hover:bg-gray-500 text-sm"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-green-400 font-bold text-base">
                          ₱{((item.price * item.quantity) - (item.discount || 0)).toLocaleString()}
                        </span>
                      </div>
                      {/* Item Discount Field */}
                      <div className="flex items-center gap-2">
                        <label className="text-gray-400 text-xs">Item Discount:</label>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-400 text-xs">₱</span>
                          <input
                            type="number"
                            min="0"
                            max={item.price * item.quantity}
                            value={item.discount || ''}
                            onChange={(e) => updateItemDiscount(item.id, parseFloat(e.target.value) || 0)}
                            className="w-20 px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            placeholder="0"
                          />
                        </div>
                        {item.discount > 0 && (
                          <span className="text-orange-400 text-xs">
                            -₱{item.discount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totals and Payment */}
            <div className="mt-8 border-t border-gray-700 pt-6">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-300 text-lg">
                  <span>Subtotal:</span>
                  <span>₱{subtotal.toLocaleString()}</span>
                </div>
                {itemDiscounts > 0 && (
                  <div className="flex justify-between text-orange-400 text-lg">
                    <span>Item Discounts:</span>
                    <span>-₱{itemDiscounts.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-300 text-lg">
                  <span>Overall Discount:</span>
                  <span>{overallDiscountPercentage}%</span>
                </div>
                {overallDiscountAmount > 0 && (
                  <div className="flex justify-between text-orange-400 text-lg">
                    <span>Overall Discount Amount:</span>
                    <span>-₱{overallDiscountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-white text-xl font-bold border-t border-gray-600 pt-3">
                  <span>Total:</span>
                  <span>₱{total.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment Method */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Payment Method *
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                  required
                >
                  <option value="">Select payment method</option>
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="gcash">GCash</option>
                  <option value="maya">Maya</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setCart([]);
                    setCustomerName('');
                    setPaymentMethod('');
                  }}
                  className="flex-1 px-6 py-4 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors text-lg font-medium"
                >
                  Clear Cart
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={cart.length === 0 || !paymentMethod || isSavingTransaction}
                  className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-lg font-medium"
                >
                  {isSavingTransaction ? 'Processing...' : 'Complete Sale'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddTransactionModal;


