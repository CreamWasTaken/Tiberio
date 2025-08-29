import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar';
import { getCategories } from '../../../services/category';
import { getSubcategories, addSubcategory, updateSubcategory, deleteSubcategory } from '../../../services/subcategory';
import { getItems, addItem, updateItem, deleteItem } from '../../../services/item';

function Pricelist() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  // Subcategory and item states
  const [subcategories, setSubcategories] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [subcategoryFormData, setSubcategoryFormData] = useState({
    name: '',
    description: '',
    category_id: ''
  });
  const [itemFormData, setItemFormData] = useState({
    description: '',
    code: '',
    service: 0,
    price: '',
    cost: '',
    subcategory_id: '',
    supplier_id: null
  });
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  
  // Get user role from localStorage
  const userRole = localStorage.getItem('userRole') || 'employee';

  // Refs for caching and request management
  const abortControllerRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const categoriesFetchedRef = useRef(false); // Track if categories have been fetched
  const categoriesCacheRef = useRef([]); // Cache for categories

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  // Function to fetch categories - only called once or manually
  const fetchCategories = useCallback(async (forceRefresh = false) => {
    // If categories are already cached and not forcing refresh, use cached data
    if (!forceRefresh && categoriesFetchedRef.current && categoriesCacheRef.current.length > 0) {
      setCategories(categoriesCacheRef.current);
      setLoading(false);
      setError(null);
      
      // Set active tab if not already set
      if (!activeTab && categoriesCacheRef.current.length > 0) {
        setActiveTab(categoriesCacheRef.current[0].id.toString());
      }
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const fetchedCategories = await getCategories(abortControllerRef.current?.signal);
      
      // Cache the categories
      categoriesCacheRef.current = fetchedCategories;
      categoriesFetchedRef.current = true;
      setCategories(fetchedCategories);
      setRetryCount(0);
      
      // Set active tab only if it's not already set or if the current active tab doesn't exist
      if (fetchedCategories.length > 0) {
        if (!activeTab || !fetchedCategories.find(cat => cat.id.toString() === activeTab)) {
          setActiveTab(fetchedCategories[0].id.toString());
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError' && err.message !== 'Request cancelled') {
        setError(err.message);
        console.error('Error fetching categories:', err);
        
        // Auto-retry logic (max 3 retries)
        if (retryCount < 3) {
          const delay = Math.min(1000 * Math.pow(2, retryCount), 5000);
          retryTimeoutRef.current = setTimeout(() => {
            setRetryCount(prev => prev + 1);
            fetchCategories(forceRefresh);
          }, delay);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [activeTab, retryCount]);

  // Fetch categories only once on component mount
  useEffect(() => {
    abortControllerRef.current = new AbortController();
    
    // Only fetch if not already cached
    if (!categoriesFetchedRef.current) {
      fetchCategories();
    } else {
      // Use cached data
      setCategories(categoriesCacheRef.current);
      setLoading(false);
      
      // Set active tab if not already set
      if (!activeTab && categoriesCacheRef.current.length > 0) {
        setActiveTab(categoriesCacheRef.current[0].id.toString());
      }
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []); // Empty dependency array - only run once on mount

  // Function to manually refresh categories
  const handleRefreshCategories = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
    setRetryCount(0);
    setError(null);
    fetchCategories(true); // Force refresh
  }, [fetchCategories]);

  // Function to fetch subcategories
  const fetchSubcategories = useCallback(async (categoryId) => {
    if (!categoryId) return;
    
    try {
      const fetchedSubcategories = await getSubcategories(categoryId, abortControllerRef.current?.signal);
      setSubcategories(fetchedSubcategories);
    } catch (err) {
      if (err.name !== 'AbortError' && err.message !== 'Request cancelled') {
        console.error('Error fetching subcategories:', err);
      }
    }
  }, []);

  // Function to fetch items
  const fetchItems = useCallback(async (subcategoryId) => {
    if (!subcategoryId) return;
    
    try {
      const fetchedItems = await getItems(subcategoryId, abortControllerRef.current?.signal);
      setItems(fetchedItems);
    } catch (err) {
      if (err.name !== 'AbortError' && err.message !== 'Request cancelled') {
        console.error('Error fetching items:', err);
      }
    }
  }, []);



  // Memoized function to get current category name
  const getCurrentCategoryName = useMemo(() => {
    const category = categories.find(cat => cat.id.toString() === activeTab);
    return category ? category.name : '';
  }, [categories, activeTab]);





  // Memoized total items count
  const totalItems = useMemo(() => {
    return items.length;
  }, [items]);







  // Subcategory handlers
  const handleAddSubcategory = () => {
    setSubcategoryFormData({ name: '', description: '', category_id: activeTab });
    setIsSubcategoryModalOpen(true);
  };

  const handleEditSubcategory = (subcategory) => {
    setSubcategoryFormData({ ...subcategory });
    setEditingSubcategory(subcategory);
    setIsSubcategoryModalOpen(true);
  };

  const handleDeleteSubcategory = async (id) => {
    if (window.confirm('Are you sure you want to delete this subcategory?')) {
      try {
        await deleteSubcategory(id);
        fetchSubcategories(activeTab);
      } catch (error) {
        console.error('Error deleting subcategory:', error);
      }
    }
  };

  const handleSubcategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSubcategory) {
        await updateSubcategory(editingSubcategory.id, subcategoryFormData);
      } else {
        await addSubcategory(subcategoryFormData);
      }
      setIsSubcategoryModalOpen(false);
      setEditingSubcategory(null);
      setSubcategoryFormData({ name: '', description: '', category_id: '' });
      fetchSubcategories(activeTab);
    } catch (error) {
      console.error('Error saving subcategory:', error);
    }
  };

  // Item handlers
  const handleAddPriceItem = () => {
    setItemFormData({ 
      description: '', 
      code: '', 
      service: 0, 
      price: '', 
      cost: '', 
      subcategory_id: selectedSubcategory?.id || '', 
      supplier_id: null 
    });
    setIsItemModalOpen(true);
  };

  const handleEditPriceItem = (item) => {
    setItemFormData({ ...item });
    setEditingItem(item);
    setIsItemModalOpen(true);
  };

  const handleDeletePriceItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await deleteItem(id);
        if (selectedSubcategory) {
          fetchItems(selectedSubcategory.id);
        }
      } catch (error) {
        console.error('Error deleting item:', error);
      }
    }
  };

  const handleItemSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await updateItem(editingItem.id, itemFormData);
      } else {
        await addItem(itemFormData);
      }
      setIsItemModalOpen(false);
      setEditingItem(null);
      setItemFormData({ 
        description: '', 
        code: '', 
        service: 0, 
        price: '', 
        cost: '', 
        subcategory_id: '', 
        supplier_id: null 
      });
      if (selectedSubcategory) {
        fetchItems(selectedSubcategory.id);
      }
    } catch (error) {
      console.error('Error saving item:', error);
    }
  };

  const handleSubcategorySelect = (subcategory) => {
    setSelectedSubcategory(subcategory);
    fetchItems(subcategory.id);
  };

  // Handle tab change with proper event handling
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchQuery(''); // Clear search when changing tabs
    setSelectedSubcategory(null); // Reset selected subcategory
    setItems([]); // Clear items
    fetchSubcategories(tabId); // Fetch subcategories for the selected category
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-white text-xl">
            {retryCount > 0 ? `Retrying... (${retryCount}/3)` : 'Loading categories...'}
          </div>
        </div>
      </div>
    );
  }

  if (error && retryCount >= 3) {
    return (
      <div className="flex h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">Failed to load categories</div>
          <div className="text-gray-400 text-sm mb-4">{error}</div>
          <button 
            onClick={handleRefreshCategories}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 overflow-hidden">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
        userType={userRole}
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
                <h1 className="text-2xl font-bold text-white">
                  {userRole === 'admin' ? 'Price List Management' : 'Price List'}
                </h1>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleRefreshCategories}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </button>

              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 custom-scrollbar scroll-smooth">
          
          {/* Summary Stats */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Categories</p>
                  <p className="text-2xl font-bold text-white">{categories.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Current Category</p>
                  <p className="text-2xl font-bold text-white">{getCurrentCategoryName}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0 2.08-.402 2.599-1" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Items</p>
                  <p className="text-2xl font-bold text-white">{totalItems}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl">
            {/* Tabs */}
            <div className="border-b border-gray-700 px-4">
              <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Tabs">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => handleTabChange(category.id.toString())}
                    className={`py-4 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === category.id.toString() ? 'text-blue-400 border-blue-500' : 'text-gray-400 border-transparent hover:text-gray-200 hover:border-gray-500'}`}
                  >
                    {category.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Search and Content */}
            <div className="p-6">
              {/* Search Bar */}
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={`Search ${getCurrentCategoryName}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900/60 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Subcategories Section */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-white">Subcategories</h3>
                  {userRole === 'admin' && (
                    <button
                      onClick={handleAddSubcategory}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Add Subcategory
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subcategories.map((subcategory) => (
                    <div 
                      key={subcategory.id} 
                      className={`bg-gray-900/60 border rounded-lg p-4 cursor-pointer transition-colors duration-200 ${
                        selectedSubcategory?.id === subcategory.id 
                          ? 'border-blue-500 bg-blue-900/20' 
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                      onClick={() => handleSubcategorySelect(subcategory)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-1">{subcategory.name}</h4>
                          <p className="text-gray-400 text-sm">{subcategory.description}</p>
                        </div>
                        {userRole === 'admin' && (
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditSubcategory(subcategory);
                              }}
                              className="text-gray-400 hover:text-blue-400 transition-colors duration-200"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSubcategory(subcategory.id);
                              }}
                              className="text-gray-400 hover:text-red-400 transition-colors duration-200"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {subcategories.length === 0 && (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-400">No subcategories found</h3>
                    <p className="mt-1 text-sm text-gray-500">Create a subcategory to organize your items.</p>
                  </div>
                )}
              </div>

              {/* Items Section - Only show if a subcategory is selected */}
              {selectedSubcategory && (
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      Items in {selectedSubcategory.name}
                    </h3>
                    {userRole === 'admin' && (
                      <button
                        onClick={handleAddPriceItem}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Item
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.map((item) => (
                      <div key={item.id} className="bg-gray-900/60 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors duration-200">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-white mb-1">{item.description}</h3>
                            {item.code && (
                              <span className="inline-block bg-blue-600/20 text-blue-400 text-xs px-2 py-1 rounded-full border border-blue-600/30">
                                {item.code}
                              </span>
                            )}
                          </div>
                          {userRole === 'admin' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleEditPriceItem(item)}
                                className="text-gray-400 hover:text-blue-400 transition-colors duration-200"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDeletePriceItem(item.id)}
                                className="text-gray-400 hover:text-red-400 transition-colors duration-200"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-bold text-green-400">₱{parseFloat(item.price).toLocaleString()}</span>
                          <span className="text-xs text-gray-400">ID: {item.id}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {items.length === 0 && (
                    <div className="text-center py-8">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.400a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-400">No items found in {selectedSubcategory.name}</h3>
                      <p className="mt-1 text-sm text-gray-500">Add items to this subcategory to get started.</p>
                    </div>
                  )}
                </div>
              )}


            </div>
          </div>
        </main>
      </div>



      {/* Add/Edit Subcategory Modal */}
      {isSubcategoryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingSubcategory ? 'Edit Subcategory' : 'Add New Subcategory'}
            </h3>
            <form onSubmit={handleSubcategorySubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={subcategoryFormData.name}
                    onChange={(e) => setSubcategoryFormData({...subcategoryFormData, name: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <textarea
                    value={subcategoryFormData.description}
                    onChange={(e) => setSubcategoryFormData({...subcategoryFormData, description: e.target.value})}
                    rows="3"
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsSubcategoryModalOpen(false);
                    setEditingSubcategory(null);
                    setSubcategoryFormData({ name: '', description: '', category_id: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200"
                >
                  {editingSubcategory ? 'Update Subcategory' : 'Add Subcategory'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Item Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </h3>
            <form onSubmit={handleItemSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                  <input
                    type="text"
                    required
                    value={itemFormData.description}
                    onChange={(e) => setItemFormData({...itemFormData, description: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Code</label>
                  <input
                    type="text"
                    value={itemFormData.code}
                    onChange={(e) => setItemFormData({...itemFormData, code: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Price (₱)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={itemFormData.price}
                    onChange={(e) => setItemFormData({...itemFormData, price: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Cost (₱)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemFormData.cost}
                    onChange={(e) => setItemFormData({...itemFormData, cost: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={itemFormData.service === 1}
                      onChange={(e) => setItemFormData({...itemFormData, service: e.target.checked ? 1 : 0})}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-300">Is Service</span>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsItemModalOpen(false);
                    setEditingItem(null);
                    setItemFormData({ 
                      description: '', 
                      code: '', 
                      service: 0, 
                      price: '', 
                      cost: '', 
                      subcategory_id: '', 
                      supplier_id: null 
                    });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                >
                  {editingItem ? 'Update Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Pricelist;