import React, { useState, useEffect } from 'react';
import { getSuppliers } from '../../../../services/supplier';

const OrderFilters = ({ 
  filters, 
  onFiltersChange, 
  onClearFilters 
}) => {
  const [suppliers, setSuppliers] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const suppliersData = await getSuppliers();
      setSuppliers(suppliersData || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== '' && value !== null && value !== undefined
  );

  return (
    <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl mb-6">
      {/* Filter Header */}
      <div 
        className="px-6 py-4 border-b border-gray-700 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <h3 className="text-lg font-medium text-white">Filters</h3>
            {hasActiveFilters && (
              <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                Active
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClearFilters();
                }}
                className="text-sm text-gray-400 hover:text-white transition-colors duration-200"
              >
                Clear All
              </button>
            )}
            <svg 
              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search
              </label>
              <input
                type="text"
                value={filters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Receipt number, description, supplier..."
                className="w-full px-3 py-2 bg-gray-900/60 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Status
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 bg-gray-900/60 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="on-delivery">On Delivery</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Supplier Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Supplier
              </label>
              <select
                value={filters.supplier_id || ''}
                onChange={(e) => handleFilterChange('supplier_id', e.target.value)}
                className="w-full px-3 py-2 bg-gray-900/60 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Suppliers</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sort By
              </label>
              <select
                value={filters.sort_by || 'created_at'}
                onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                className="w-full px-3 py-2 bg-gray-900/60 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="created_at">Date Created</option>
                <option value="updated_at">Date Updated</option>
                <option value="total_price">Total Price</option>
                <option value="status">Status</option>
                <option value="receipt_number">Receipt Number</option>
              </select>
            </div>
          </div>

          {/* Date Range Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={filters.start_date || ''}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                className="w-full px-3 py-2 bg-gray-900/60 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={filters.end_date || ''}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className="w-full px-3 py-2 bg-gray-900/60 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Sort Order */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sort Order
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sort_order"
                  value="DESC"
                  checked={filters.sort_order === 'DESC'}
                  onChange={(e) => handleFilterChange('sort_order', e.target.value)}
                  className="mr-2 text-blue-600"
                />
                <span className="text-gray-300">Newest First</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sort_order"
                  value="ASC"
                  checked={filters.sort_order === 'ASC'}
                  onChange={(e) => handleFilterChange('sort_order', e.target.value)}
                  className="mr-2 text-blue-600"
                />
                <span className="text-gray-300">Oldest First</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderFilters;
