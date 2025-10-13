import React, { useState, useEffect } from 'react';
import { getInventoryItems } from '../../../../services/item';
import Alert from '../../../../components/Alert';

function AddTransactionModal({ 
  isOpen, 
  onClose, 
  isSavingTransaction, 
  onSubmit,
  selectedPatient = null,
  transactionFormError = null,
  onClearError = null
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [specFilters, setSpecFilters] = useState({
    sphere: '',
    cylinder: '',
    add: '',
    axis: '',
    steps: '',
    modality: ''
  });
  
  // Dynamic data states
  const [inventory, setInventory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Custom alert state
  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info', // 'info', 'success', 'warning', 'error'
    onConfirm: null
  });

  // Load inventory and categories when modal opens
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Set customer name when selectedPatient changes or modal opens
  useEffect(() => {
    if (isOpen && selectedPatient && selectedPatient.displayName) {
      setCustomerName(selectedPatient.displayName);
    } else if (!selectedPatient || !selectedPatient.displayName) {
      setCustomerName('');
    }
  }, [selectedPatient, isOpen]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const inventoryData = await getInventoryItems();
      
      // Transform inventory data to match the expected format
      const transformedInventory = inventoryData.map(item => ({
        id: item.id, // This is the price_list.id
        name: item.description || 'Unnamed Product',
        category: item.category_name || 'uncategorized',
        subcategory: item.subcategory_name || 'No Subcategory',
        price: parseFloat(item.pc_price) || 0,
        stock: item.stock || 0,
        code: item.code,
        supplier: item.supplier_name,
        subcategory_id: item.subcategory_id,
        attributes: item.attributes // This now contains both price_list attributes and product attributes merged
      }));
      
      setInventory(transformedInventory);
    } catch (err) {
      setError(err.message);
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter inventory based on search, category, spec filters, and stock
  const filteredInventory = inventory.filter(item => {
    const searchLower = searchQuery.toLowerCase();
    
    // Filter out items with 0 stock
    if (item.stock <= 0) {
      return false;
    }
    
    // Search in basic fields
    const basicMatch = item.name.toLowerCase().includes(searchLower) ||
                      (item.code && item.code.toLowerCase().includes(searchLower)) ||
                      (item.supplier && item.supplier.toLowerCase().includes(searchLower));
    
    // Search in lens specifications
    let specsMatch = false;
    if (item.attributes && typeof item.attributes === 'object') {
      const lensSpecs = [
        item.attributes.index,
        item.attributes.diameter,
        item.attributes.sphere,
        item.attributes.cylinder,
        item.attributes.add,
        item.attributes.axis,
        item.attributes.steps,
        item.attributes.modality,
        // Fallback to range attributes if specific ones not available
        item.attributes.sphFR,
        item.attributes.sphTo,
        item.attributes.cylFr,
        item.attributes.cylTo
      ].filter(spec => spec && spec !== '' && spec !== '0');
      
      specsMatch = lensSpecs.some(spec => 
        spec.toString().toLowerCase().includes(searchLower)
      );
    }
    
    // Individual spec filters
    let specFiltersMatch = true;
    if (item.attributes && typeof item.attributes === 'object') {
      Object.keys(specFilters).forEach(specKey => {
        if (specFilters[specKey] && specFilters[specKey].trim() !== '') {
          const itemValue = item.attributes[specKey];
          if (!itemValue || itemValue.toString().toLowerCase().indexOf(specFilters[specKey].toLowerCase()) === -1) {
            specFiltersMatch = false;
          }
        }
      });
    }
    
    const matchesSearch = basicMatch || specsMatch;
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory && specFiltersMatch;
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
  
  // Calculate change
  const payment = parseFloat(paymentAmount) || 0;
  const change = payment - total;

  // Helper function to format item attributes for display
  const formatItemSpecs = (attributes) => {
    if (!attributes || typeof attributes !== 'object') return null;
    
    const specs = [];
    
    // Prioritize specific product attributes over range attributes
    const lensSpecFields = [
      { key: 'index', label: 'Index' },
      { key: 'diameter', label: 'Diameter' },
      // Specific product attributes (preferred for inventory items)
      { key: 'sphere', label: 'Sphere' },
      { key: 'cylinder', label: 'Cylinder' },
      // Range attributes (fallback if specific attributes not available)
      { key: 'sphFR', label: 'Sph FR' },
      { key: 'sphTo', label: 'Sph To' },
      { key: 'cylFr', label: 'Cyl Fr' },
      { key: 'cylTo', label: 'Cyl To' }
    ];
    
    // Add lens specs, prioritizing specific values over ranges
    lensSpecFields.forEach(field => {
      if (attributes[field.key] && attributes[field.key] !== '' && attributes[field.key] !== '0') {
        // Don't show range fields if we already have specific values
        if ((field.key === 'sphFR' || field.key === 'sphTo') && attributes.sphere) {
          return; // Skip range fields if specific sphere value exists
        }
        if ((field.key === 'cylFr' || field.key === 'cylTo') && attributes.cylinder) {
          return; // Skip range fields if specific cylinder value exists
        }
        
        specs.push(`${field.label}: ${attributes[field.key]}`);
      }
    });
    
    return specs.length > 0 ? specs : null;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (cart.length === 0) {
      setAlertConfig({
        isOpen: true,
        title: 'Empty Cart',
        message: 'Please add items to cart before proceeding',
        type: 'warning',
        onConfirm: () => setAlertConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    if (!receiptNumber.trim()) {
      setAlertConfig({
        isOpen: true,
        title: 'Missing Receipt Number',
        message: 'Please enter a receipt number',
        type: 'warning',
        onConfirm: () => setAlertConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    if (payment < total) {
      setAlertConfig({
        isOpen: true,
        title: 'Insufficient Payment',
        message: `Payment amount (₱${payment.toLocaleString()}) is less than total amount (₱${total.toLocaleString()})`,
        type: 'warning',
        onConfirm: () => setAlertConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    // Prepare transaction data
    const transactionData = {
      receipt_number: receiptNumber,
      transaction_date: new Date().toISOString().split('T')[0],
      amount: total,
      transaction_type: 'pos_sale',
      description: 'POS Transaction',
      items: cart,
      subtotal,
      item_discounts: itemDiscounts,
      overall_discount: overallDiscountPercentage,
      overall_discount_amount: overallDiscountAmount,
      total,
      customer_name: customerName,
      payment_amount: payment,
      change_amount: change
    };

    // Call the parent onSubmit function
    onSubmit(e, transactionData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-1 sm:p-2 md:p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-[98vw] sm:max-w-[95vw] md:max-w-[90vw] lg:max-w-[95vw] xl:max-w-[90vw] h-[98vh] sm:h-[95vh] md:h-[90vh] lg:h-[95vh] xl:h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gray-700 px-2 sm:px-3 md:px-4 lg:px-6 xl:px-8 py-2 sm:py-3 md:py-4 lg:py-5 xl:py-6 flex items-center justify-between flex-shrink-0">
          <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold text-white truncate">
            Point of Sale
          </h2>
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 lg:gap-6">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-lg sm:text-xl md:text-2xl lg:text-3xl p-1 hover:bg-gray-600 rounded transition-colors"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
          {/* Left Side - Inventory */}
          <div className="w-full lg:w-2/3 bg-gray-900 p-1 sm:p-2 md:p-3 lg:p-4 xl:p-6 overflow-hidden flex flex-col">
            {/* Search and Categories */}
            <div className="mb-1 sm:mb-2 flex-shrink-0">
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 mb-1 sm:mb-2">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search items, specs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                  />
                </div>
              </div>
              
              {/* Individual Lens Spec Filters */}
              <div className="mb-1 sm:mb-2">
                <h4 className="text-white text-xs sm:text-sm font-medium mb-1">Filter by Lens Specifications:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1">
                  <div>
                    <label className="block text-gray-300 text-xs mb-0.5">Sphere</label>
                    <input
                      type="text"
                      placeholder="+2.50"
                      value={specFilters.sphere}
                      onChange={(e) => setSpecFilters(prev => ({ ...prev, sphere: e.target.value }))}
                      className="w-full px-1 py-1 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-xs mb-0.5">Cylinder</label>
                    <input
                      type="text"
                      placeholder="-1.25"
                      value={specFilters.cylinder}
                      onChange={(e) => setSpecFilters(prev => ({ ...prev, cylinder: e.target.value }))}
                      className="w-full px-1 py-1 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-xs mb-0.5">Add</label>
                    <input
                      type="text"
                      placeholder="+2.00"
                      value={specFilters.add}
                      onChange={(e) => setSpecFilters(prev => ({ ...prev, add: e.target.value }))}
                      className="w-full px-1 py-1 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-xs mb-0.5">Axis</label>
                    <input
                      type="text"
                      placeholder="90"
                      value={specFilters.axis}
                      onChange={(e) => setSpecFilters(prev => ({ ...prev, axis: e.target.value }))}
                      className="w-full px-1 py-1 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-xs mb-0.5">Steps</label>
                    <input
                      type="text"
                      placeholder="0.25"
                      value={specFilters.steps}
                      onChange={(e) => setSpecFilters(prev => ({ ...prev, steps: e.target.value }))}
                      className="w-full px-1 py-1 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 text-xs mb-0.5">Modality</label>
                    <input
                      type="text"
                      placeholder="Monthly"
                      value={specFilters.modality}
                      onChange={(e) => setSpecFilters(prev => ({ ...prev, modality: e.target.value }))}
                      className="w-full px-1 py-1 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-xs"
                    />
                  </div>
                </div>
                <div className="mt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSpecFilters({ sphere: '', cylinder: '', add: '', axis: '', steps: '', modality: '' })}
                    className="text-gray-400 hover:text-white text-xs underline"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
              
              {/* Category Filter */}
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 justify-end">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm min-w-[100px] sm:min-w-[120px]"
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
                  className="px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm font-medium"
                >
                  {isLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>

            {/* Inventory Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-1 sm:gap-2 md:gap-3 lg:gap-4 xl:gap-6 overflow-y-auto flex-1 custom-scrollbar auto-rows-max">
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
                filteredInventory.map(item => {
                  const specs = formatItemSpecs(item.attributes);
                  return (
                    <div
                      key={item.id}
                      className="bg-gray-800 border border-gray-700 rounded-lg p-1.5 sm:p-2 md:p-3 lg:p-4 xl:p-6 hover:border-blue-500 transition-colors cursor-pointer flex flex-col h-fit min-h-[180px] sm:min-h-[200px] md:min-h-[220px] lg:min-h-[240px]"
                      onClick={() => addToCart(item)}
                    >
                      <div className="flex justify-between items-start mb-1 sm:mb-2">
                        <h3 className="text-white font-medium text-xs sm:text-sm md:text-sm lg:text-base truncate flex-1 mr-1">{item.name}</h3>
                        <span className="text-xs text-gray-400 capitalize flex-shrink-0">{item.category}</span>
                      </div>
                      <div className="mb-1 sm:mb-2">
                        <span className="text-xs text-gray-500 bg-gray-700 px-1 sm:px-2 py-0.5 sm:py-1 rounded inline-block">
                          {item.subcategory}
                        </span>
                      </div>
                      {specs ? (
                        <div className="mb-1 sm:mb-2 flex-1">
                          <div className="text-gray-300 text-xs space-y-0.5">
                            {specs.map((spec, index) => (
                              <div key={index} className="flex justify-between">
                                <span className="text-gray-400 truncate">{spec.split(':')[0]}:</span>
                                <span className="text-white font-medium ml-1">{spec.split(':')[1]}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="mb-1 sm:mb-2 flex-1">
                          <div className="text-gray-500 text-xs italic">
                            No specifications available
                          </div>
                        </div>
                      )}
                      <div className="flex justify-between items-center mt-auto">
                        <span className="text-green-400 font-bold text-sm sm:text-base md:text-base lg:text-lg xl:text-xl">₱{item.price.toLocaleString()}</span>
                        <span className="text-gray-400 text-xs">Stock: {item.stock}</span>
                      </div>
                      <div className="mt-1 sm:mt-2 text-center">
                        <span className="text-blue-400 text-xs">Click to add</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Side - Cart */}
          <div className="w-full lg:w-1/3 bg-gray-800 p-1 sm:p-2 md:p-3 lg:p-4 xl:p-6 flex flex-col min-h-0 overflow-auto max-h-full">
            {/* Customer Info */}
            <div className="mb-1 sm:mb-2 flex-shrink-0">
              <h3 className="text-white font-semibold text-sm sm:text-base md:text-base lg:text-lg mb-1">Customer Information</h3>
              <div className="mb-1">
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Receipt Number *
                </label>
                <input
                  type="text"
                  value={receiptNumber}
                  onChange={(e) => {
                    setReceiptNumber(e.target.value);
                    // Clear error when user starts typing
                    if (transactionFormError && onClearError) {
                      onClearError();
                    }
                  }}
                  placeholder="Enter receipt number"
                  className="w-full px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                  required
                />
                {transactionFormError && (
                  <div className="mt-1 p-1 bg-red-900/20 border border-red-500/50 rounded-md">
                    <p className="text-red-400 text-xs">{transactionFormError}</p>
                  </div>
                )}
              </div>
              <div className="mb-1">
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  placeholder={selectedPatient ? "Selected patient name" : "Customer Name (Optional)"}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs sm:text-sm"
                />
                {selectedPatient && (
                  <p className="text-xs text-blue-400 mt-1 truncate">
                    ✓ Auto-filled with selected patient: {selectedPatient.displayName}
                  </p>
                )}
              </div>
              
              {/* Payment Amount */}
              <div className="mt-1 sm:mt-2">
                <label className="block text-xs font-medium text-gray-300 mb-1">
                  Payment Amount *
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm">₱</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto min-h-[60px] sm:min-h-[80px] md:min-h-[100px] lg:min-h-[120px] max-h-[200px] sm:max-h-[250px] md:max-h-[300px] lg:max-h-[350px] custom-scrollbar">
              <h3 className="text-white font-semibold text-sm sm:text-base md:text-base lg:text-lg mb-1 sm:mb-2 lg:mb-3">Cart Items</h3>
              {cart.length === 0 ? (
                <p className="text-gray-400 text-xs sm:text-sm md:text-sm lg:text-base">No items in cart</p>
              ) : (
                <div className="space-y-1 sm:space-y-1.5 md:space-y-2 pr-1 sm:pr-2">
                  {cart.map(item => {
                    const specs = formatItemSpecs(item.attributes);
                    return (
                      <div key={item.id} className="bg-gray-700 rounded-lg p-1 sm:p-1.5 md:p-2 lg:p-3">
                        <div className="flex justify-between items-start mb-1 sm:mb-2">
                          <div className="flex-1 min-w-0">
                            <h4 className="text-white font-medium text-xs sm:text-sm md:text-sm truncate">{item.name}</h4>
                            <p className="text-gray-400 text-xs">₱{item.price.toLocaleString()} each</p>
                            {specs && (
                              <div className="mt-1">
                                <div className="text-gray-300 text-xs space-y-0.5">
                                  {specs.slice(0, 2).map((spec, index) => (
                                    <div key={index} className="flex justify-between">
                                      <span className="text-gray-400 truncate">{spec.split(':')[0]}:</span>
                                      <span className="text-white font-medium ml-1">{spec.split(':')[1]}</span>
                                    </div>
                                  ))}
                                  {specs.length > 2 && (
                                    <div className="text-gray-500 text-xs">+{specs.length - 2} more...</div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="text-red-400 hover:text-red-300 text-sm sm:text-base md:text-base lg:text-lg flex-shrink-0 ml-1 p-1 hover:bg-red-900/20 rounded"
                          >
                            ×
                          </button>
                        </div>
                        <div className="flex items-center justify-between mb-1 sm:mb-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 lg:w-6 lg:h-6 bg-gray-600 text-white rounded flex items-center justify-center hover:bg-gray-500 text-xs"
                            >
                              -
                            </button>
                            <span className="text-white font-medium w-5 sm:w-6 md:w-6 lg:w-8 text-center text-xs sm:text-sm">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-4 h-4 sm:w-5 sm:h-5 md:w-5 md:h-5 lg:w-6 lg:h-6 bg-gray-600 text-white rounded flex items-center justify-center hover:bg-gray-500 text-xs"
                            >
                              +
                            </button>
                          </div>
                          <span className="text-green-400 font-bold text-xs sm:text-sm md:text-sm lg:text-base">
                            ₱{((item.price * item.quantity) - (item.discount || 0)).toLocaleString()}
                          </span>
                        </div>
                        {/* Item Discount Field */}
                        <div className="flex items-center gap-1 flex-wrap">
                          <label className="text-gray-400 text-xs">Discount:</label>
                          <div className="flex items-center gap-1">
                            <span className="text-gray-400 text-xs">₱</span>
                            <input
                              type="number"
                              min="0"
                              max={item.price * item.quantity}
                              value={item.discount || ''}
                              onChange={(e) => updateItemDiscount(item.id, parseFloat(e.target.value) || 0)}
                              className="w-10 sm:w-12 md:w-14 lg:w-16 px-1 py-0.5 sm:py-1 bg-gray-600 border border-gray-500 rounded text-white text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                    );
                  })}
                </div>
              )}
            </div>

            {/* Totals and Payment */}
            <div className="mt-1 sm:mt-2 border-t border-gray-700 pt-1 sm:pt-2 flex-shrink-0">
              <div className="space-y-1 mb-1 sm:mb-2">
                <div className="flex justify-between text-gray-300 text-xs sm:text-sm">
                  <span>Subtotal:</span>
                  <span>₱{subtotal.toLocaleString()}</span>
                </div>
                {itemDiscounts > 0 && (
                  <div className="flex justify-between text-orange-400 text-xs sm:text-sm">
                    <span>Item Discounts:</span>
                    <span>-₱{itemDiscounts.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-300 text-xs sm:text-sm">
                  <span>Overall Discount:</span>
                  <span>{overallDiscountPercentage}%</span>
                </div>
                {overallDiscountAmount > 0 && (
                  <div className="flex justify-between text-orange-400 text-xs sm:text-sm">
                    <span>Overall Discount Amount:</span>
                    <span>-₱{overallDiscountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-white text-sm sm:text-base md:text-base font-bold border-t border-gray-600 pt-1">
                  <span>Total:</span>
                  <span>₱{total.toLocaleString()}</span>
                </div>
                
                {/* Payment and Change Display */}
                {paymentAmount && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-gray-300 text-xs sm:text-sm">
                      <span>Payment:</span>
                      <span>₱{payment.toLocaleString()}</span>
                    </div>
                    <div className={`flex justify-between text-sm sm:text-base md:text-base font-bold ${
                      change >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      <span>Change:</span>
                      <span>₱{change.toLocaleString()}</span>
                    </div>
                    {change < 0 && (
                      <p className="text-red-400 text-xs">
                        Insufficient payment amount
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCart([]);
                    setPaymentAmount('');
                    // Reset customer name to selected patient's name if available
                    if (selectedPatient && selectedPatient.displayName) {
                      setCustomerName(selectedPatient.displayName);
                    } else {
                      setCustomerName('');
                    }
                  }}
                  className="flex-1 px-2 sm:px-3 md:px-3 py-1.5 sm:py-2 md:py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors text-xs sm:text-sm md:text-sm font-medium"
                >
                  Clear Cart
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={cart.length === 0 || isSavingTransaction || !paymentAmount || payment < total}
                  className="flex-1 px-2 sm:px-3 md:px-3 py-1.5 sm:py-2 md:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm md:text-sm font-medium"
                >
                  {isSavingTransaction ? 'Processing...' : 'Complete Sale'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Alert Modal */}
      <Alert
        isOpen={alertConfig.isOpen}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
        onConfirm={alertConfig.onConfirm || (() => setAlertConfig(prev => ({ ...prev, isOpen: false })))}
        onCancel={null}
        showCancel={false}
        confirmText="OK"
      />
    </div>
  );
}

export default AddTransactionModal;


