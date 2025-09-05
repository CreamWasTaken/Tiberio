import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getSuppliers, deleteSupplier } from '../../../services/supplier';
import { getCategories, deleteCategory } from '../../../services/category';
import AddSupplierModal from './components/AddSupplierModal';
import EditSupplierModal from './components/EditSupplierModal';
import AddCategoryModal from './components/AddCategoryModal';
import EditCategoryModal from './components/EditCategoryModal';
import DeleteConfirmationModal from './components/DeleteConfirmationModal';
import Sidebar from '../../../components/Sidebar';

const InventoryManagement = () => {
  // Custom scrollbar styles
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
        height: 8px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #374151;
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #6B7280;
        border-radius: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #9CA3AF;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('suppliers');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Category state
  const [categories, setCategories] = useState([]);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');

  // Delete confirmation modal state

  // Handle URL parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'categories') {
      setActiveTab('categories');
    }
  }, [location.search]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleteType, setDeleteType] = useState(''); // 'supplier' or 'category'

  // Abort controller for request cancellation
  const abortControllerRef = useRef(null);

  useEffect(() => {
    // Create abort controller for this component
    abortControllerRef.current = new AbortController();
    
    // Fetch data with proper error handling for cancelled requests
    const loadData = async () => {
      try {
        await Promise.all([
          fetchSuppliers(),
          fetchCategories()
        ]);
      } catch (error) {
        // Only show error if it's not a cancellation
        if (error.message !== 'Request cancelled') {
          setError(error.message);
        }
      }
    };

    loadData();

    // Cleanup function to abort requests when component unmounts
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('name');
    navigate('/');
  };

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const data = await getSuppliers(abortControllerRef.current?.signal);
      setSuppliers(data);
      setError(null);
    } catch (err) {
      // Don't set error for cancelled requests
      if (err.message !== 'Request cancelled') {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await getCategories(abortControllerRef.current?.signal);
      setCategories(data);
    } catch (err) {
      // Don't set error for cancelled requests
      if (err.message !== 'Request cancelled') {
        setError(err.message);
      }
    }
  };

  const handleAddSupplier = () => {
    setShowAddModal(true);
  };

  const handleEditSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setShowEditModal(true);
  };

  const handleDeleteSupplier = (supplier) => {
    setDeleteItem(supplier);
    setDeleteType('supplier');
    setShowDeleteModal(true);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setSelectedSupplier(null);
  };

  const handleSupplierAdded = () => {
    fetchSuppliers();
    handleModalClose();
  };

  const handleSupplierUpdated = () => {
    fetchSuppliers();
    handleModalClose();
  };

  // Category handlers
  const handleAddCategory = () => {
    setShowAddCategoryModal(true);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setShowEditCategoryModal(true);
  };

  const handleDeleteCategory = (category) => {
    setDeleteItem(category);
    setDeleteType('category');
    setShowDeleteModal(true);
  };

  const handleCategoryModalClose = () => {
    setShowAddCategoryModal(false);
    setShowEditCategoryModal(false);
    setSelectedCategory(null);
  };

  const handleCategoryAdded = () => {
    fetchCategories();
    handleCategoryModalClose();
  };

  const handleCategoryUpdated = () => {
    fetchCategories();
    handleCategoryModalClose();
  };

  // Delete confirmation handlers
  const handleDeleteConfirm = async () => {
    try {
      if (deleteType === 'supplier') {
        await deleteSupplier(deleteItem.id);
        await fetchSuppliers();
      } else if (deleteType === 'category') {
        await deleteCategory(deleteItem.id);
        await fetchCategories();
      }
      handleDeleteModalClose();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteModalClose = () => {
    setShowDeleteModal(false);
    setDeleteItem(null);
    setDeleteType('');
  };

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCategories = categories.filter(category =>
    category.name?.toLowerCase().includes(categorySearchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(categorySearchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
        userType="admin"
        onLogout={handleLogout}
      />

      {/* Main content area */}
      <div className="flex-1 lg:ml-0 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-gray-800/80 backdrop-blur-xl border-b border-gray-700 flex-shrink-0">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                {/* Mobile menu button */}
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="lg:hidden mr-4 text-gray-300 hover:text-white"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <h1 className="text-2xl font-bold text-white">Inventory Management</h1>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 custom-scrollbar scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {/* Tab Navigation */}
            <div className="mb-8">
              <nav className="flex space-x-8 border-b border-gray-700">
                <button
                  onClick={() => setActiveTab('suppliers')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'suppliers'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  Suppliers
                </button>
                <button
                  onClick={() => setActiveTab('categories')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'categories'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  Categories
                </button>
              </nav>
            </div>

            {/* Suppliers Section */}
            {activeTab === 'suppliers' && (
              <>
                {/* Page Header */}
                <div className="mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2">Manage Suppliers</h2>
                  <p className="text-gray-400">Add, edit, and manage your suppliers and their information</p>
                </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Total Suppliers Card */}
              <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Total Suppliers</p>
                    <p className="text-2xl font-bold text-white">{suppliers.length}</p>
                  </div>
                </div>
              </div>

              {/* Active Suppliers Card */}
              <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">Active Suppliers</p>
                    <p className="text-2xl font-bold text-white">{suppliers.length}</p>
                  </div>
                </div>
              </div>

              {/* Suppliers with Email Card */}
              <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">With Email</p>
                    <p className="text-2xl font-bold text-white">
                      {suppliers.filter(supplier => supplier.email && supplier.email.trim() !== '').length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Suppliers with Contact Card */}
              <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-orange-600 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-400">With Contact</p>
                    <p className="text-2xl font-bold text-white">
                      {suppliers.filter(supplier => supplier.contact_number && supplier.contact_number.trim() !== '').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Add Button */}
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
              <div className="relative w-full sm:w-96">
                <input
                  type="text"
                  placeholder="Search suppliers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <button
                onClick={handleAddSupplier}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Supplier
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Suppliers Table */}
            <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Supplier Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Contact Person
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Contact Number
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Address
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredSuppliers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                          {searchTerm ? 'No suppliers found matching your search.' : 'No suppliers found.'}
                        </td>
                      </tr>
                    ) : (
                      filteredSuppliers.map((supplier) => (
                        <tr key={supplier.id} className="hover:bg-gray-700/30 transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                            {supplier.name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {supplier.contact_person}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {supplier.contact_number}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                            {supplier.email}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">
                            {supplier.address}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditSupplier(supplier)}
                                className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeleteSupplier(supplier)}
                                className="text-red-400 hover:text-red-300 transition-colors duration-200"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

            {/* Categories Section */}
            {activeTab === 'categories' && (
              <div>
              {/* Page Header */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-white mb-2">Manage Categories</h2>
                <p className="text-gray-400">Add, edit, and manage your price categories</p>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Categories Card */}
                <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-400">Total Categories</p>
                      <p className="text-2xl font-bold text-white">{categories.length}</p>
                    </div>
                  </div>
                </div>

                {/* Categories with Description Card */}
                <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-teal-600 rounded-lg flex items-center justify-center mr-4">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-400">With Description</p>
                      <p className="text-2xl font-bold text-white">
                        {categories.filter(category => category.description && category.description.trim() !== '').length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Add Button */}
              <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                <div className="relative w-full sm:w-96">
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={categorySearchTerm}
                    onChange={(e) => setCategorySearchTerm(e.target.value)}
                    className="w-full px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <svg
                    className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <button
                  onClick={handleAddCategory}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Category
                </button>
              </div>

              {/* Categories Table */}
              <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Category Name
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {filteredCategories.length === 0 ? (
                        <tr>
                          <td colSpan="3" className="px-6 py-8 text-center text-gray-400">
                            {categorySearchTerm ? 'No categories found matching your search.' : 'No categories found.'}
                          </td>
                        </tr>
                      ) : (
                        filteredCategories.map((category) => (
                          <tr key={category.id} className="hover:bg-gray-700/30 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-medium">
                              {category.name}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">
                              {category.description || 'No description'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleEditCategory(category)}
                                  className="text-blue-400 hover:text-blue-300 transition-colors duration-200"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleDeleteCategory(category)}
                                  className="text-red-400 hover:text-red-300 transition-colors duration-200"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            )}

            {/* Modals */}
            {showAddModal && (
              <AddSupplierModal
                isOpen={showAddModal}
                onClose={handleModalClose}
                onSupplierAdded={handleSupplierAdded}
              />
            )}

            {showEditModal && selectedSupplier && (
              <EditSupplierModal
                isOpen={showEditModal}
                onClose={handleModalClose}
                onSupplierUpdated={handleSupplierUpdated}
                supplier={selectedSupplier}
              />
            )}

            {/* Category Modals */}
            {showAddCategoryModal && (
              <AddCategoryModal
                isOpen={showAddCategoryModal}
                onClose={handleCategoryModalClose}
                onCategoryAdded={handleCategoryAdded}
              />
            )}

                         {showEditCategoryModal && selectedCategory && (
               <EditCategoryModal
                 isOpen={showEditCategoryModal}
                 onClose={handleCategoryModalClose}
                 onCategoryUpdated={handleCategoryUpdated}
                 category={selectedCategory}
               />
             )}

             {/* Delete Confirmation Modal */}
             {showDeleteModal && deleteItem && (
               <DeleteConfirmationModal
                 isOpen={showDeleteModal}
                 onClose={handleDeleteModalClose}
                 onConfirm={handleDeleteConfirm}
                 title={`Delete ${deleteType === 'supplier' ? 'Supplier' : 'Category'}`}
                 message={`Are you sure you want to delete this ${deleteType}?`}
                 itemName={deleteItem.name}
               />
             )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default InventoryManagement;
