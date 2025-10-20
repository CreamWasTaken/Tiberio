import React, { useState, useEffect } from 'react';

const BulkAddProductsModal = ({ 
  isOpen, 
  onClose, 
  pricelistItem, 
  onBulkAdd,
  isInline = false,
  isLoading = false,
  categoryName = ''
}) => {
  const [formData, setFormData] = useState({
    stock: '',
    lowStockThreshold: '',
    // Grade range settings
    sphereStep: 0.25,
    cylinderStep: 0.25,
    sphereStart: '',
    sphereEnd: '',
    cylinderStart: '',
    cylinderEnd: '',
    diameter: '',
    // Double Vision specific settings
    axisStep: 10,
    axisStart: '',
    axisEnd: '',
    addStep: 0.25,
    addStart: '',
    addEnd: '',
    // Generation settings
    generateAllCombinations: true,
    customCombinations: []
  });

  const [generatedProducts, setGeneratedProducts] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingProductIndex, setEditingProductIndex] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage] = useState(20);

  // Check if current pricelist item is for Double vision category
  const isDoubleVisionCategory = () => {
    if (!categoryName) return false;
    return categoryName.toLowerCase().includes('double vision');
  };

  // Initialize form data when pricelist item changes
  useEffect(() => {
    if (pricelistItem && (isOpen || isInline)) {
      
      // Helper function to clean numeric values for input fields
      const cleanNumericValue = (value) => {
        if (!value) return '';
        // Keep the original value with + or - signs for lens prescriptions
        return String(value);
      };

      setFormData({
        stock: '',
        lowStockThreshold: '5',
        sphereStep: 0.25,
        cylinderStep: 0.25,
        // Auto-populate from pricelist item data - check both attributes and top-level
        sphereStart: cleanNumericValue(pricelistItem.attributes?.sphFR || pricelistItem.sphFR),
        sphereEnd: cleanNumericValue(pricelistItem.attributes?.sphTo || pricelistItem.sphTo),
        cylinderStart: cleanNumericValue(pricelistItem.attributes?.cylFr || pricelistItem.cylFr),
        cylinderEnd: cleanNumericValue(pricelistItem.attributes?.cylTo || pricelistItem.cylTo),
        diameter: pricelistItem.attributes?.diameter || pricelistItem.diameter || '',
        // Double Vision specific fields
        axisStep: 10,
        axisStart: cleanNumericValue(pricelistItem.attributes?.axisFR || pricelistItem.axisFR),
        axisEnd: cleanNumericValue(pricelistItem.attributes?.axisTo || pricelistItem.axisTo),
        addStep: 0.25,
        addStart: cleanNumericValue(pricelistItem.attributes?.addFr || pricelistItem.addFr),
        addEnd: cleanNumericValue(pricelistItem.attributes?.addTo || pricelistItem.addTo),
        generateAllCombinations: true,
        customCombinations: []
      });
      
    }
  }, [pricelistItem, isOpen, isInline]);

  // Generate product combinations based on grade ranges
  const generateProductCombinations = () => {
    if (!formData.generateAllCombinations) return;

    // Check if stock field is filled first
    if (!formData.stock || formData.stock === '') {
      alert('Please provide a stock value before generating items');
      return;
    }

    const { sphereStart, sphereEnd, sphereStep, cylinderStart, cylinderEnd, cylinderStep } = formData;
    
    if (!sphereStart || !sphereEnd || !cylinderStart || !cylinderEnd) {
      alert('Please provide all grade range values (Sphere Start/End, Cylinder Start/End)');
      return;
    }

    // For Double vision, also check axis and add ranges
    if (isDoubleVisionCategory()) {
      const { axisStart, axisEnd, addStart, addEnd } = formData;
      if (!axisStart || !axisEnd || !addStart || !addEnd) {
        alert('Please provide all Double vision range values (Axis Start/End, Add Start/End)');
        return;
      }
    }

    setIsGenerating(true);
    
    try {
      const sphereValues = generateGradeRangeWithSigns(sphereStart, sphereEnd, parseFloat(sphereStep));
      const cylinderValues = generateGradeRangeWithSigns(cylinderStart, cylinderEnd, parseFloat(cylinderStep));
      
      let axisValues = [];
      let addValues = [];
      
      // Generate axis and add values for Double vision
      if (isDoubleVisionCategory()) {
        const { axisStart, axisEnd, axisStep, addStart, addEnd, addStep } = formData;
        axisValues = generateAxisRange(parseInt(axisStart), parseInt(axisEnd), parseInt(axisStep));
        addValues = generateGradeRangeWithSigns(addStart, addEnd, parseFloat(addStep));
      }
      
      const combinations = [];
      
      if (isDoubleVisionCategory()) {
        // Generate all combinations for Double vision (sphere, cylinder, axis, add)
        sphereValues.forEach(sphere => {
          cylinderValues.forEach(cylinder => {
            axisValues.forEach(axis => {
              addValues.forEach(add => {
                combinations.push({
                  sphere: sphere,
                  cylinder: cylinder,
                  axis: axis,
                  add: add,
                  stock: formData.stock,
                  lowStockThreshold: formData.lowStockThreshold,
                  diameter: formData.diameter,
                  index: pricelistItem.attributes?.index || '',
                  tp: pricelistItem.attributes?.tp || ''
                });
              });
            });
          });
        });
      } else {
        // Generate combinations for regular lens (sphere, cylinder only)
        sphereValues.forEach(sphere => {
          cylinderValues.forEach(cylinder => {
            combinations.push({
              sphere: sphere,
              cylinder: cylinder,
              stock: formData.stock,
              lowStockThreshold: formData.lowStockThreshold,
              diameter: formData.diameter,
              index: pricelistItem.attributes?.index || '',
              tp: pricelistItem.attributes?.tp || ''
            });
          });
        });
      }
      
      setGeneratedProducts(combinations);
    } catch (error) {
      console.error('Error generating combinations:', error);
      alert('Error generating product combinations. Please check your input values.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper function to generate grade range with preserved signs
  const generateGradeRangeWithSigns = (startStr, endStr, step) => {
    const values = [];
    const start = parseFloat(startStr);
    const end = parseFloat(endStr);
    const direction = start <= end ? 1 : -1;
    const absStep = Math.abs(step);
    
    // Determine if we should use + sign based on the original values
    const usePlusSign = startStr.startsWith('+') || endStr.startsWith('+');
    
    for (let value = start; direction * value <= direction * end; value += direction * absStep) {
      const roundedValue = Math.round(value * 100) / 100;
      let formattedValue;
      
      if (roundedValue === 0) {
        formattedValue = '0.00';
      } else if (roundedValue > 0) {
        formattedValue = usePlusSign ? `+${roundedValue.toFixed(2)}` : roundedValue.toFixed(2);
      } else {
        formattedValue = roundedValue.toFixed(2);
      }
      
      values.push(formattedValue);
    }
    
    return values;
  };

  // Helper function to generate axis range (1-180)
  const generateAxisRange = (start, end, step) => {
    const values = [];
    const direction = start <= end ? 1 : -1;
    const absStep = Math.abs(step);
    
    for (let value = start; direction * value <= direction * end; value += direction * absStep) {
      // Ensure axis values are within 1-180 range
      let axisValue = value;
      if (axisValue < 1) axisValue = 1;
      if (axisValue > 180) axisValue = 180;
      
      values.push(axisValue.toString());
    }
    
    return values;
  };


  // Add custom combination
  const addCustomCombination = () => {
    const newCombination = {
      sphere: '',
      cylinder: '',
      stock: formData.stock,
      lowStockThreshold: formData.lowStockThreshold,
      diameter: formData.diameter,
      index: pricelistItem.attributes?.index || '',
      tp: pricelistItem.attributes?.tp || ''
    };

    // Add Double vision specific fields if applicable
    if (isDoubleVisionCategory()) {
      newCombination.axis = '';
      newCombination.add = '';
    }
    
    setFormData({
      ...formData,
      customCombinations: [...formData.customCombinations, newCombination]
    });
  };

  // Update custom combination
  const updateCustomCombination = (index, field, value) => {
    const updated = [...formData.customCombinations];
    updated[index] = { ...updated[index], [field]: value };
    
    setFormData({ ...formData, customCombinations: updated });
  };

  // Remove custom combination
  const removeCustomCombination = (index) => {
    const updated = formData.customCombinations.filter((_, i) => i !== index);
    setFormData({ ...formData, customCombinations: updated });
  };

  // Remove generated product
  const removeGeneratedProduct = (index) => {
    const updated = generatedProducts.filter((_, i) => i !== index);
    setGeneratedProducts(updated);
  };

  // Edit generated product
  const editGeneratedProduct = (index) => {
    setEditingProductIndex(index);
  };

  // Update generated product
  const updateGeneratedProduct = (index, field, value) => {
    const updated = [...generatedProducts];
    updated[index] = { ...updated[index], [field]: value };
    
    setGeneratedProducts(updated);
  };

  // Save edited product
  const saveEditedProduct = () => {
    setEditingProductIndex(null);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingProductIndex(null);
  };

  // Handle product selection
  const toggleProductSelection = (index) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedProducts(newSelected);
  };

  // Select all products
  const selectAllProducts = () => {
    setSelectedProducts(new Set(generatedProducts.map((_, index) => index)));
  };

  // Deselect all products
  const deselectAllProducts = () => {
    setSelectedProducts(new Set());
  };

  // Remove selected products
  const removeSelectedProducts = () => {
    const indicesToRemove = Array.from(selectedProducts).sort((a, b) => b - a);
    let updated = [...generatedProducts];
    indicesToRemove.forEach(index => {
      updated.splice(index, 1);
    });
    setGeneratedProducts(updated);
    setSelectedProducts(new Set());
    
    // Adjust current page if needed
    const totalPages = Math.ceil(updated.length / productsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(generatedProducts.length / productsPerPage);
  const startIndex = (currentPage - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const currentProducts = generatedProducts.slice(startIndex, endIndex);

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Reset pagination when products change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [generatedProducts.length]);

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.stock === '' || formData.lowStockThreshold === '') {
      alert('Please provide stock and low stock threshold values');
      return;
    }
    
    // Determine which products to include
    let productsToAdd = [];
    
    // If products are selected, only include selected ones
    if (selectedProducts.size > 0) {
      productsToAdd = generatedProducts.filter((_, index) => selectedProducts.has(index));
    } else {
      // Otherwise include all generated products
      productsToAdd = [...generatedProducts];
    }
    
    // Always include custom combinations
    productsToAdd = [
      ...productsToAdd,
      ...formData.customCombinations.filter(combo => combo.sphere && combo.cylinder)
    ];
    
    if (productsToAdd.length === 0) {
      alert('No products to add. Please generate combinations or add custom combinations.');
      return;
    }
    
    onBulkAdd(productsToAdd, pricelistItem.id);
  };

  if (!isOpen && !isInline) return null;

  // If rendering inline, just return the content without modal wrapper
  if (isInline) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">
            Bulk Add Products - {pricelistItem?.description}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-200"
            title="Back to Single Add"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Grade Range Settings */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <h4 className="text-lg font-medium text-white mb-4">Grade Range Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sphere Start</label>
                <input
                  type="text"
                  value={formData.sphereStart}
                  onChange={(e) => setFormData({...formData, sphereStart: e.target.value})}
                  placeholder="-3.00, +1.50"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">Starting value (can be + or -)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sphere End</label>
                <input
                  type="text"
                  value={formData.sphereEnd}
                  onChange={(e) => setFormData({...formData, sphereEnd: e.target.value})}
                  placeholder="+2.00, -1.25"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">Ending value (can be + or -)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sphere Step</label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  value={formData.sphereStep}
                  onChange={(e) => setFormData({...formData, sphereStep: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Cylinder Start</label>
                <input
                  type="text"
                  value={formData.cylinderStart}
                  onChange={(e) => setFormData({...formData, cylinderStart: e.target.value})}
                  placeholder="-2.00, +0.50"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">Starting value (can be + or -)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Cylinder End</label>
                <input
                  type="text"
                  value={formData.cylinderEnd}
                  onChange={(e) => setFormData({...formData, cylinderEnd: e.target.value})}
                  placeholder="+1.50, -0.75"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">Ending value (can be + or -)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Cylinder Step</label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  value={formData.cylinderStep}
                  onChange={(e) => setFormData({...formData, cylinderStep: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Double Vision specific fields */}
            {isDoubleVisionCategory() && (
              <div className="mt-6 pt-4 border-t border-gray-700">
                <h5 className="text-md font-medium text-white mb-4">Double Vision Settings</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Axis Start</label>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={formData.axisStart}
                      onChange={(e) => setFormData({...formData, axisStart: e.target.value})}
                      placeholder="10, 90"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Starting axis value (1-180)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Axis End</label>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={formData.axisEnd}
                      onChange={(e) => setFormData({...formData, axisEnd: e.target.value})}
                      placeholder="180, 90"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Ending axis value (1-180)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Axis Step</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.axisStep}
                      onChange={(e) => setFormData({...formData, axisStep: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Add Start</label>
                    <input
                      type="text"
                      value={formData.addStart}
                      onChange={(e) => setFormData({...formData, addStart: e.target.value})}
                      placeholder="+1.00, +2.50"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Starting add value (can be + or -)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Add End</label>
                    <input
                      type="text"
                      value={formData.addEnd}
                      onChange={(e) => setFormData({...formData, addEnd: e.target.value})}
                      placeholder="+3.00, +2.75"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Ending add value (can be + or -)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Add Step</label>
                    <input
                      type="number"
                      step="0.25"
                      min="0.25"
                      value={formData.addStep}
                      onChange={(e) => setFormData({...formData, addStep: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4">
              <button
                type="button"
                onClick={generateProductCombinations}
                disabled={isGenerating || !formData.stock || formData.stock === ''}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Generate All Combinations
                  </>
                )}
              </button>
              {(!formData.stock || formData.stock === '') && (
                <p className="text-xs text-yellow-400 mt-2">Please enter a stock value before generating combinations</p>
              )}
            </div>
          </div>

          {/* Inventory Settings */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <h4 className="text-lg font-medium text-white mb-4">Inventory Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Stock *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Low Stock Threshold *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({...formData, lowStockThreshold: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Custom Combinations */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium text-white">Custom Combinations</h4>
              <button
                type="button"
                onClick={addCustomCombination}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Custom
              </button>
            </div>
            
            {formData.customCombinations.map((combo, index) => (
              <div key={index} className={`grid gap-4 mb-4 p-3 bg-gray-800 rounded-lg ${isDoubleVisionCategory() ? 'grid-cols-1 md:grid-cols-5' : 'grid-cols-1 md:grid-cols-3'}`}>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Sphere</label>
                  <input
                    type="number"
                    step="0.25"
                    value={combo.sphere}
                    onChange={(e) => updateCustomCombination(index, 'sphere', e.target.value)}
                    placeholder="-1.50, +2.25"
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Cylinder</label>
                  <input
                    type="number"
                    step="0.25"
                    value={combo.cylinder}
                    onChange={(e) => updateCustomCombination(index, 'cylinder', e.target.value)}
                    placeholder="-0.75, +1.25"
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                {isDoubleVisionCategory() && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Axis</label>
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={combo.axis || ''}
                        onChange={(e) => updateCustomCombination(index, 'axis', e.target.value)}
                        placeholder="90, 180"
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Add</label>
                      <input
                        type="text"
                        value={combo.add || ''}
                        onChange={(e) => updateCustomCombination(index, 'add', e.target.value)}
                        placeholder="+1.00, +2.50"
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeCustomCombination(index)}
                    className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition-colors duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Generated Products Preview */}
          {generatedProducts.length > 0 && (
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-medium text-white">
                  Generated Products ({generatedProducts.length} combinations)
                  {selectedProducts.size > 0 && (
                    <span className="text-blue-400 text-sm ml-2">({selectedProducts.size} selected)</span>
                  )}
                </h4>
                <div className="flex gap-2">
                  {selectedProducts.size > 0 && (
                    <button
                      type="button"
                      onClick={removeSelectedProducts}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                    >
                      Remove Selected ({selectedProducts.size})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={selectAllProducts}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllProducts}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                  >
                    Deselect All
                  </button>
                  <button
                    type="button"
                    onClick={() => setGeneratedProducts([])}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {currentProducts.map((product, index) => {
                    const actualIndex = startIndex + index;
                    return (
                    <div key={actualIndex} className="bg-gray-800 p-3 rounded-lg">
                      {editingProductIndex === actualIndex ? (
                        // Edit mode
                        <div className={`grid gap-2 ${isDoubleVisionCategory() ? 'grid-cols-1 md:grid-cols-5' : 'grid-cols-1 md:grid-cols-3'}`}>
                          <div>
                            <label className="block text-xs text-gray-300 mb-1">Sphere</label>
                            <input
                              type="number"
                              step="0.25"
                              value={product.sphere}
                              onChange={(e) => updateGeneratedProduct(actualIndex, 'sphere', e.target.value)}
                              placeholder="-1.50, +2.25"
                              className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-300 mb-1">Cylinder</label>
                            <input
                              type="number"
                              step="0.25"
                              value={product.cylinder}
                              onChange={(e) => updateGeneratedProduct(actualIndex, 'cylinder', e.target.value)}
                              placeholder="-0.75, +1.25"
                              className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          {isDoubleVisionCategory() && (
                            <>
                              <div>
                                <label className="block text-xs text-gray-300 mb-1">Axis</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="180"
                                  value={product.axis || ''}
                                  onChange={(e) => updateGeneratedProduct(actualIndex, 'axis', e.target.value)}
                                  placeholder="90, 180"
                                  className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-300 mb-1">Add</label>
                                <input
                                  type="text"
                                  value={product.add || ''}
                                  onChange={(e) => updateGeneratedProduct(actualIndex, 'add', e.target.value)}
                                  placeholder="+1.00, +2.50"
                                  className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            </>
                          )}
                          <div className="flex items-end gap-1">
                            <button
                              type="button"
                              onClick={saveEditedProduct}
                              className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors duration-200"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditing}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs transition-colors duration-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3 flex-1">
                            <input
                              type="checkbox"
                              checked={selectedProducts.has(actualIndex)}
                              onChange={() => toggleProductSelection(actualIndex)}
                              className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="text-white font-medium text-sm">
                                {isDoubleVisionCategory() ? (
                                  <>S{product.sphere} C{product.cylinder} A{product.axis} Add{product.add}</>
                                ) : (
                                  <>S{product.sphere} C{product.cylinder}</>
                                )}
                              </div>
                              <div className="text-gray-400 text-xs">Stock: {product.stock} | Threshold: {product.lowStockThreshold}</div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => editGeneratedProduct(actualIndex)}
                              className="text-gray-400 hover:text-blue-400 transition-colors duration-200 p-1"
                              title="Edit"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => removeGeneratedProduct(actualIndex)}
                              className="text-gray-400 hover:text-red-400 transition-colors duration-200 p-1"
                              title="Remove"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
                    <div className="text-sm text-gray-400">
                      Showing {startIndex + 1} to {Math.min(endIndex, generatedProducts.length)} of {generatedProducts.length} products
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded text-sm transition-colors duration-200"
                      >
                        Previous
                      </button>
                      
                      {/* Page numbers */}
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              type="button"
                              onClick={() => goToPage(pageNum)}
                              className={`px-3 py-1 rounded text-sm transition-colors duration-200 ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-600 hover:bg-gray-700 text-white'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        type="button"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded text-sm transition-colors duration-200"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || (generatedProducts.length === 0 && formData.customCombinations.length === 0)}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Adding Products...
                </>
              ) : (
                (() => {
                  let count = 0;
                  if (selectedProducts.size > 0) {
                    count = selectedProducts.size;
                  } else {
                    count = generatedProducts.length;
                  }
                  count += formData.customCombinations.filter(c => c.sphere && c.cylinder).length;
                  return `Add ${count} Products`;
                })()
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Regular modal rendering
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-white">
            Bulk Add Products - {pricelistItem?.description}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Grade Range Settings */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <h4 className="text-lg font-medium text-white mb-4">Grade Range Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sphere Start</label>
                <input
                  type="text"
                  value={formData.sphereStart}
                  onChange={(e) => setFormData({...formData, sphereStart: e.target.value})}
                  placeholder="-3.00, +1.50"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">Starting value (can be + or -)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sphere End</label>
                <input
                  type="text"
                  value={formData.sphereEnd}
                  onChange={(e) => setFormData({...formData, sphereEnd: e.target.value})}
                  placeholder="+2.00, -1.25"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">Ending value (can be + or -)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sphere Step</label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  value={formData.sphereStep}
                  onChange={(e) => setFormData({...formData, sphereStep: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Cylinder Start</label>
                <input
                  type="text"
                  value={formData.cylinderStart}
                  onChange={(e) => setFormData({...formData, cylinderStart: e.target.value})}
                  placeholder="-2.00, +0.50"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">Starting value (can be + or -)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Cylinder End</label>
                <input
                  type="text"
                  value={formData.cylinderEnd}
                  onChange={(e) => setFormData({...formData, cylinderEnd: e.target.value})}
                  placeholder="+1.50, -0.75"
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-400 mt-1">Ending value (can be + or -)</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Cylinder Step</label>
                <input
                  type="number"
                  step="0.25"
                  min="0.25"
                  value={formData.cylinderStep}
                  onChange={(e) => setFormData({...formData, cylinderStep: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Double Vision specific fields */}
            {isDoubleVisionCategory() && (
              <div className="mt-6 pt-4 border-t border-gray-700">
                <h5 className="text-md font-medium text-white mb-4">Double Vision Settings</h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Axis Start</label>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={formData.axisStart}
                      onChange={(e) => setFormData({...formData, axisStart: e.target.value})}
                      placeholder="10, 90"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Starting axis value (1-180)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Axis End</label>
                    <input
                      type="number"
                      min="1"
                      max="180"
                      value={formData.axisEnd}
                      onChange={(e) => setFormData({...formData, axisEnd: e.target.value})}
                      placeholder="180, 90"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Ending axis value (1-180)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Axis Step</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.axisStep}
                      onChange={(e) => setFormData({...formData, axisStep: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Add Start</label>
                    <input
                      type="text"
                      value={formData.addStart}
                      onChange={(e) => setFormData({...formData, addStart: e.target.value})}
                      placeholder="+1.00, +2.50"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Starting add value (can be + or -)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Add End</label>
                    <input
                      type="text"
                      value={formData.addEnd}
                      onChange={(e) => setFormData({...formData, addEnd: e.target.value})}
                      placeholder="+3.00, +2.75"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Ending add value (can be + or -)</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Add Step</label>
                    <input
                      type="number"
                      step="0.25"
                      min="0.25"
                      value={formData.addStep}
                      onChange={(e) => setFormData({...formData, addStep: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4">
              <button
                type="button"
                onClick={generateProductCombinations}
                disabled={isGenerating || !formData.stock || formData.stock === ''}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Generate All Combinations
                  </>
                )}
              </button>
              {(!formData.stock || formData.stock === '') && (
                <p className="text-xs text-yellow-400 mt-2">Please enter a stock value before generating combinations</p>
              )}
            </div>
          </div>

          {/* Inventory Settings */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <h4 className="text-lg font-medium text-white mb-4">Inventory Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Stock *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({...formData, stock: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Low Stock Threshold *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({...formData, lowStockThreshold: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Custom Combinations */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-medium text-white">Custom Combinations</h4>
              <button
                type="button"
                onClick={addCustomCombination}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Custom
              </button>
            </div>
            
            {formData.customCombinations.map((combo, index) => (
              <div key={index} className={`grid gap-4 mb-4 p-3 bg-gray-800 rounded-lg ${isDoubleVisionCategory() ? 'grid-cols-1 md:grid-cols-5' : 'grid-cols-1 md:grid-cols-3'}`}>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Sphere</label>
                  <input
                    type="number"
                    step="0.25"
                    value={combo.sphere}
                    onChange={(e) => updateCustomCombination(index, 'sphere', e.target.value)}
                    placeholder="-1.50, +2.25"
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Cylinder</label>
                  <input
                    type="number"
                    step="0.25"
                    value={combo.cylinder}
                    onChange={(e) => updateCustomCombination(index, 'cylinder', e.target.value)}
                    placeholder="-0.75, +1.25"
                    className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                {isDoubleVisionCategory() && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Axis</label>
                      <input
                        type="number"
                        min="1"
                        max="180"
                        value={combo.axis || ''}
                        onChange={(e) => updateCustomCombination(index, 'axis', e.target.value)}
                        placeholder="90, 180"
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Add</label>
                      <input
                        type="text"
                        value={combo.add || ''}
                        onChange={(e) => updateCustomCombination(index, 'add', e.target.value)}
                        placeholder="+1.00, +2.50"
                        className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeCustomCombination(index)}
                    className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded transition-colors duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Generated Products Preview */}
          {generatedProducts.length > 0 && (
            <div className="bg-gray-900/50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-lg font-medium text-white">
                  Generated Products ({generatedProducts.length} combinations)
                  {selectedProducts.size > 0 && (
                    <span className="text-blue-400 text-sm ml-2">({selectedProducts.size} selected)</span>
                  )}
                </h4>
                <div className="flex gap-2">
                  {selectedProducts.size > 0 && (
                    <button
                      type="button"
                      onClick={removeSelectedProducts}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                    >
                      Remove Selected ({selectedProducts.size})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={selectAllProducts}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    onClick={deselectAllProducts}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                  >
                    Deselect All
                  </button>
                  <button
                    type="button"
                    onClick={() => setGeneratedProducts([])}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors duration-200"
                  >
                    Clear All
                  </button>
                </div>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="space-y-2">
                  {currentProducts.map((product, index) => {
                    const actualIndex = startIndex + index;
                    return (
                    <div key={actualIndex} className="bg-gray-800 p-3 rounded-lg">
                      {editingProductIndex === actualIndex ? (
                        // Edit mode
                        <div className={`grid gap-2 ${isDoubleVisionCategory() ? 'grid-cols-1 md:grid-cols-5' : 'grid-cols-1 md:grid-cols-3'}`}>
                          <div>
                            <label className="block text-xs text-gray-300 mb-1">Sphere</label>
                            <input
                              type="number"
                              step="0.25"
                              value={product.sphere}
                              onChange={(e) => updateGeneratedProduct(actualIndex, 'sphere', e.target.value)}
                              placeholder="-1.50, +2.25"
                              className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-300 mb-1">Cylinder</label>
                            <input
                              type="number"
                              step="0.25"
                              value={product.cylinder}
                              onChange={(e) => updateGeneratedProduct(actualIndex, 'cylinder', e.target.value)}
                              placeholder="-0.75, +1.25"
                              className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                          {isDoubleVisionCategory() && (
                            <>
                              <div>
                                <label className="block text-xs text-gray-300 mb-1">Axis</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="180"
                                  value={product.axis || ''}
                                  onChange={(e) => updateGeneratedProduct(actualIndex, 'axis', e.target.value)}
                                  placeholder="90, 180"
                                  className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-gray-300 mb-1">Add</label>
                                <input
                                  type="text"
                                  value={product.add || ''}
                                  onChange={(e) => updateGeneratedProduct(actualIndex, 'add', e.target.value)}
                                  placeholder="+1.00, +2.50"
                                  className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                              </div>
                            </>
                          )}
                          <div className="flex items-end gap-1">
                            <button
                              type="button"
                              onClick={saveEditedProduct}
                              className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors duration-200"
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditing}
                              className="bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs transition-colors duration-200"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3 flex-1">
                            <input
                              type="checkbox"
                              checked={selectedProducts.has(actualIndex)}
                              onChange={() => toggleProductSelection(actualIndex)}
                              className="h-4 w-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="text-white font-medium text-sm">
                                {isDoubleVisionCategory() ? (
                                  <>S{product.sphere} C{product.cylinder} A{product.axis} Add{product.add}</>
                                ) : (
                                  <>S{product.sphere} C{product.cylinder}</>
                                )}
                              </div>
                              <div className="text-gray-400 text-xs">Stock: {product.stock} | Threshold: {product.lowStockThreshold}</div>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              type="button"
                              onClick={() => editGeneratedProduct(actualIndex)}
                              className="text-gray-400 hover:text-blue-400 transition-colors duration-200 p-1"
                              title="Edit"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              type="button"
                              onClick={() => removeGeneratedProduct(actualIndex)}
                              className="text-gray-400 hover:text-red-400 transition-colors duration-200 p-1"
                              title="Remove"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
                
                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-700">
                    <div className="text-sm text-gray-400">
                      Showing {startIndex + 1} to {Math.min(endIndex, generatedProducts.length)} of {generatedProducts.length} products
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded text-sm transition-colors duration-200"
                      >
                        Previous
                      </button>
                      
                      {/* Page numbers */}
                      <div className="flex gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              type="button"
                              onClick={() => goToPage(pageNum)}
                              className={`px-3 py-1 rounded text-sm transition-colors duration-200 ${
                                currentPage === pageNum
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-600 hover:bg-gray-700 text-white'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        type="button"
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded text-sm transition-colors duration-200"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || (generatedProducts.length === 0 && formData.customCombinations.length === 0)}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Adding Products...
                </>
              ) : (
                (() => {
                  let count = 0;
                  if (selectedProducts.size > 0) {
                    count = selectedProducts.size;
                  } else {
                    count = generatedProducts.length;
                  }
                  count += formData.customCombinations.filter(c => c.sphere && c.cylinder).length;
                  return `Add ${count} Products`;
                })()
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BulkAddProductsModal;
