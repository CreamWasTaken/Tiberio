import React, { useState, useEffect } from 'react';
import BulkAddProductsModal from './BulkAddProductsModal';

const AddProductsModal = ({ 
  isOpen, 
  onClose, 
  pricelistItem, 
  onBulkAdd,
  onSingleAdd,
  isBulkAdding = false
}) => {
  const [activeTab, setActiveTab] = useState('single');
  const [singleProductData, setSingleProductData] = useState({
    sphere: '',
    cylinder: '',
    stock: '',
    lowStockThreshold: '5',
    diameter: '',
    index: '',
    tp: ''
  });

  // Initialize single product data when pricelist item changes
  useEffect(() => {
    if (pricelistItem && isOpen) {
      setSingleProductData({
        sphere: '',
        cylinder: '',
        stock: '',
        lowStockThreshold: '5',
        diameter: pricelistItem.attributes?.diameter || '',
        index: pricelistItem.attributes?.index || '',
        tp: pricelistItem.attributes?.tp || ''
      });
    }
  }, [pricelistItem, isOpen]);

  // Handle single product submission
  const handleSingleSubmit = (e) => {
    e.preventDefault();
    
    // Validate inputs
    if (!singleProductData.sphere || !singleProductData.cylinder || !singleProductData.stock) {
      alert('Please provide sphere, cylinder, and stock values.');
      return;
    }
    
    if (isNaN(parseFloat(singleProductData.sphere)) || isNaN(parseFloat(singleProductData.cylinder)) || isNaN(parseInt(singleProductData.stock))) {
      alert('Please enter valid numeric values.');
      return;
    }
    
    const productData = {
      sphere: parseFloat(singleProductData.sphere).toFixed(2),
      cylinder: parseFloat(singleProductData.cylinder).toFixed(2),
      stock: parseInt(singleProductData.stock),
      lowStockThreshold: parseInt(singleProductData.lowStockThreshold),
      diameter: singleProductData.diameter,
      index: singleProductData.index,
      tp: singleProductData.tp
    };
    
    onSingleAdd(productData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-700 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            Add Products - {pricelistItem?.description}
            {isBulkAdding && (
              <div className="flex items-center gap-2 text-sm text-blue-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                Adding Products...
              </div>
            )}
          </h3>
          <button
            onClick={onClose}
            disabled={isBulkAdding}
            className="text-gray-400 hover:text-white disabled:text-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700">
          <button
            onClick={() => setActiveTab('single')}
            disabled={isBulkAdding}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors duration-200 ${
              activeTab === 'single'
                ? 'text-blue-400 border-b-2 border-blue-500 bg-gray-900/50'
                : 'text-gray-400 hover:text-gray-200'
            } ${isBulkAdding ? 'disabled:opacity-50 disabled:cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Single Product
            </div>
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            disabled={isBulkAdding}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors duration-200 ${
              activeTab === 'bulk'
                ? 'text-blue-400 border-b-2 border-blue-500 bg-gray-900/50'
                : 'text-gray-400 hover:text-gray-200'
            } ${isBulkAdding ? 'disabled:opacity-50 disabled:cursor-not-allowed' : ''}`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Bulk Add Products
            </div>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {activeTab === 'single' ? (
            // Single Product Form
            <form onSubmit={handleSingleSubmit} className="space-y-6">
              <div className="bg-gray-900/50 rounded-lg p-4">
                <h4 className="text-lg font-medium text-white mb-4">Single Product Details</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Sphere *</label>
                    <input
                      type="number"
                      step="0.25"
                      required
                      value={singleProductData.sphere}
                      onChange={(e) => setSingleProductData({...singleProductData, sphere: e.target.value})}
                      placeholder="e.g., -1.50, +2.25, -3.75"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Enter positive (+) or negative (-) values</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Cylinder *</label>
                    <input
                      type="number"
                      step="0.25"
                      required
                      value={singleProductData.cylinder}
                      onChange={(e) => setSingleProductData({...singleProductData, cylinder: e.target.value})}
                      placeholder="e.g., -0.75, +1.25, -2.50"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <p className="text-xs text-gray-400 mt-1">Enter positive (+) or negative (-) values</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Stock *</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={singleProductData.stock}
                      onChange={(e) => setSingleProductData({...singleProductData, stock: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Low Stock Threshold</label>
                    <input
                      type="number"
                      min="0"
                      value={singleProductData.lowStockThreshold}
                      onChange={(e) => setSingleProductData({...singleProductData, lowStockThreshold: e.target.value})}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Diameter</label>
                    <input
                      type="text"
                      value={singleProductData.diameter}
                      onChange={(e) => setSingleProductData({...singleProductData, diameter: e.target.value})}
                      placeholder="e.g., 65, 70"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Index</label>
                    <input
                      type="text"
                      value={singleProductData.index}
                      onChange={(e) => setSingleProductData({...singleProductData, index: e.target.value})}
                      placeholder="e.g., 1.56, 1.67"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                >
                  Add Product
                </button>
              </div>
            </form>
          ) : (
            // Bulk Add Products - Inline content instead of separate modal
            <BulkAddProductsModal
              isOpen={false} // Don't render as separate modal
              onClose={() => setActiveTab('single')} // Go back to single tab instead of closing
              pricelistItem={pricelistItem}
              onBulkAdd={onBulkAdd}
              isInline={true} // New prop to indicate inline rendering
              isLoading={isBulkAdding}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default AddProductsModal;
