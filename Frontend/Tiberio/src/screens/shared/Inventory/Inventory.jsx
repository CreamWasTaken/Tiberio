import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar';
import { getInventoryItems, updateItem } from '../../../services/item';
import { getSuppliers } from '../../../services/supplier';
import socketService from '../../../services/socket';

function Inventory() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm, setEditForm] = useState({ 
    supplier_id: '', 
    stock: '', 
    low_stock_threshold: '',
    description: '',
    code: '',
    pc_price: '',
    pc_cost: '',
    // Lens attributes
    index: '',
    diameter: '',
    sphere: '',
    cylinder: '',
    add: '',
    axis: '',
    steps: '',
    modality: '',
    set: '',
    bc: ''
  });
  const [deleteItem, setDeleteItem] = useState(null);
  
  // Filtering and pagination state
  const [filters, setFilters] = useState({
    description: '',
    code: '',
    supplier: '',
    index: '',
    diameter: '',
    sphere: '',
    cylinder: '',
    add: '',
    axis: '',
    steps: '',
    modality: '',
    set: '',
    bc: '',
    pcPrice: '',
    pcCost: '',
    stock: '',
    lowStockThreshold: '',
    status: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  
  // Grouping state
  const [groupBySubcategory, setGroupBySubcategory] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState(new Set());
  
  // Group pagination state - track pages per subcategory
  const [subcategoryPages, setSubcategoryPages] = useState({});
  const [groupItemsPerPage] = useState(10); // Items per group page
  
  const abortRef = useRef(null);
  
  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const data = await getInventoryItems(abortRef.current?.signal);

      setItems(data);
    } catch (err) {
      if (err.message !== 'Request cancelled') {
        console.error('Failed to load inventory items:', err.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    abortRef.current = new AbortController();
    fetchInventory();
    const fetchSuppliersList = async () => {
      try {
        const s = await getSuppliers(abortRef.current.signal);
        setSuppliers(s);
      } catch {
        // ignore
      }
    };
    fetchInventory();
    fetchSuppliersList();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  // Socket.IO real-time updates - setup immediately when component mounts
  useEffect(() => {
    const setupSocketIO = async () => {
      try {
        console.log('🔌 Setting up Socket.IO for Inventory component...');
        
        // Wait for Socket.IO connection to be established
        const socket = await socketService.waitForConnection();
        console.log('🔌 Socket connection established:', socket.connected);
        console.log('🔌 Socket ID:', socket.id);
   
        
        // Join inventory room
        console.log('🔌 Joining inventory-updated room');
        socketService.joinRoom('inventory-updated');
     
        
        // Listen for inventory updates
        const handleInventoryUpdate = (data) => {
          console.log('🔌 Inventory update received:', data);
          console.log('🔌 Data type:', data.type);
          console.log('🔌 Item data:', data.item);
          
          if (data.type === 'added' && data.item) {
            console.log('🔌 Adding new item to inventory:', data.item.id);
            setItems(prevItems => {
              // Add new item if not already present
              const exists = prevItems.some(item => item.id === data.item.id);
              if (exists) {
                console.log('🔌 Item already exists, skipping add');
                return prevItems;
              }
          
              console.log('🔌 Item added to inventory list');
              return [...prevItems, data.item];
            });
          } else if (data.type === 'updated' && data.item) {
            console.log('🔌 Updating item in inventory:', data.item.id);
            console.log('🔌 Updated item data:', data.item);
            setItems(prevItems => {
              console.log('🔌 Current items before update:', prevItems.length);
              const updated = prevItems.map(item => {
                if (item.id === data.item.id) {
                  console.log('🔌 Found item to update:', item.id);
                  // Ensure the updated item has all required fields
                  return {
                    ...item,
                    ...data.item,
                    // Preserve any fields that might be missing from the update
                    attributes: {
                      ...item.attributes,
                      ...data.item.attributes
                    }
                  };
                }
                return item;
              });
              console.log('🔌 Items after update:', updated.length);
              console.log('🔌 Item updated in inventory list');
              return updated;
            });
          } else if (data.type === 'deleted' && data.item) {
            console.log('🔌 Removing item from inventory:', data.item.id);
            setItems(prevItems => {
              const filtered = prevItems.filter(item => item.id !== data.item.id);
              console.log('🔌 Item removed from inventory list');
              return filtered;
            });
          } else if (data.type === 'stock_updated' && data.item) {
            console.log('🔌 Stock updated for item:', data.item.id);
            setItems(prevItems => {
              const updated = prevItems.map(item => {
                if (item.id === data.item.id) {
                  return {
                    ...item,
                    ...data.item,
                    attributes: {
                      ...item.attributes,
                      ...data.item.attributes
                    }
                  };
                }
                return item;
              });
              console.log('🔌 Stock updated in inventory list');
              return updated;
            });
          } else {
            console.log('🔌 Unknown inventory update type:', data.type);
          }
        };

        // Listen for item updates (from price list updates)
        const handleItemUpdate = (data) => {
          console.log('🔌 Real-time item update received:', data);
          
          if (data.type === 'updated' && data.item) {
            console.log('🔌 Processing ITEM UPDATE event for item:', data.item.id);
            setItems(prevItems => {
              const updated = prevItems.map(item => {
                if (item.id === data.item.id) {
                  console.log('🔌 Updating item with new data:', data.item);
                  // Ensure the updated item has all required fields
                  return {
                    ...item,
                    ...data.item,
                    // Preserve any fields that might be missing from the update
                    attributes: {
                      ...item.attributes,
                      ...data.item.attributes
                    }
                  };
                }
                return item;
              });
              console.log('🔌 Item updated in inventory, count:', updated.length);
              return updated;
            });
          }
        };

        socket.on('inventory-updated', handleInventoryUpdate);
        socket.on('item-updated', handleItemUpdate);
        console.log('🔌 Inventory update listeners registered');
        console.log('🔌 Socket event listeners:', socket.eventNames());
        console.log('🔌 Socket connection status:', socket.connected);
        console.log('🔌 Socket transport:', socket.io.engine.transport.name);
        
        // Add test event listener for debugging
        socket.on('test-connection', (data) => {
          console.log('🔌 Test event received in Inventory:', data);
        });
        
        // Test the connection by emitting a test event
        socket.emit('test-connection', {
          message: 'Inventory component connected',
          timestamp: new Date().toISOString(),
          component: 'Inventory'
        });

        return () => {
          console.log('🔌 Cleaning up Socket.IO for Inventory...');
          socket.off('inventory-updated', handleInventoryUpdate);
          socket.off('item-updated', handleItemUpdate);
          socket.off('test-connection');
          socketService.leaveRoom('inventory-updated');
        };
      } catch (error) {
        console.error('Failed to setup Socket.IO:', error);
      }
    };

    setupSocketIO();
  }, []); // Run once when component mounts
  
  // Get user role from localStorage
  const userRole = localStorage.getItem('userRole') || 'employee';

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('name');
    navigate('/');
  };

  // Handle delete item from local state (only for items with suppliers)
  const handleDeleteItem = (item) => {
    if (item.supplier_id && item.supplier_name) {
      setDeleteItem(item);
    }
  };

  // Confirm delete and remove from inventory by setting supplier to null
  const confirmDelete = async () => {
    if (deleteItem) {
      try {
        // Update the item to set supplier_id to null (inventory-only update)
        await updateItem(deleteItem.id, {
          supplier_id: null,
          addToInventory: false,
          inventoryOnlyUpdate: true
        });
        
        // Socket.IO will automatically update the UI in real-time
        setDeleteItem(null);
      } catch (error) {
        console.error('Failed to remove item from inventory:', error);
        // You could add a toast notification here to show the error
      }
    }
  };

  // Filtered and paginated items
  const filteredItems = useMemo(() => {
    console.log('Current filters:', filters);
    console.log('Total items to filter:', items.length);
    
    const filtered = items.filter(item => {
      // Helper function for exact matching of numerical values
      const exactMatch = (value, filter) => {
        if (!filter) return true;
        const itemValue = (value || '').toString().trim();
        const filterValue = filter.toString().trim();
        const matches = itemValue === filterValue;
        // Debug logging for sphere, cylinder, and description
        if (filter && (filter === filters.sphere || filter === filters.cylinder || filter === filters.description)) {
          const fieldName = filter === filters.sphere ? 'sphere' : 
                           filter === filters.cylinder ? 'cylinder' : 'description';
          console.log(`Filtering ${fieldName}: "${itemValue}" === "${filterValue}" = ${matches}`);
        }
        return matches;
      };

      // Helper function for case-insensitive exact matching (for description)
      const exactMatchCaseInsensitive = (value, filter) => {
        if (!filter) return true;
        const itemValue = (value || '').toString().trim().toLowerCase();
        const filterValue = filter.toString().trim().toLowerCase();
        const matches = itemValue === filterValue;
        // Debug logging for description
        if (filter && filter === filters.description) {
          console.log(`Filtering description (case-insensitive): "${itemValue}" === "${filterValue}" = ${matches}`);
        }
        return matches;
      };

      // Helper function for partial matching (for text fields)
      const partialMatch = (value, filter) => {
        if (!filter) return true;
        return (value || '').toLowerCase().includes(filter.toLowerCase());
      };

      // Check if item matches all non-empty filters
      const matchesDescription = exactMatchCaseInsensitive(item.description, filters.description);
      const matchesCode = partialMatch(item.code, filters.code);
      const matchesSupplier = partialMatch(item.supplier_name, filters.supplier);
      const matchesIndex = partialMatch(item.attributes?.index, filters.index);
      const matchesDiameter = partialMatch(item.attributes?.diameter, filters.diameter);
      const matchesSphere = exactMatch(item.attributes?.sphere, filters.sphere);
      const matchesCylinder = exactMatch(item.attributes?.cylinder, filters.cylinder);
      const matchesAdd = partialMatch(item.attributes?.add, filters.add);
      const matchesAxis = partialMatch(item.attributes?.axis, filters.axis);
      const matchesSteps = partialMatch(item.attributes?.steps, filters.steps);
      const matchesModality = partialMatch(item.attributes?.modality, filters.modality);
      const matchesSet = partialMatch(item.attributes?.set, filters.set);
      const matchesBc = partialMatch(item.attributes?.bc, filters.bc);
      const matchesPcPrice = partialMatch(item.pc_price, filters.pcPrice);
      const matchesPcCost = partialMatch(item.pc_cost, filters.pcCost);
      const matchesStock = partialMatch(item.attributes?.stock, filters.stock);
      const matchesLowStockThreshold = partialMatch(item.attributes?.low_stock_threshold, filters.lowStockThreshold);
      
      const matchesStatus = (() => {
        const stock = Number(item.attributes?.stock ?? 0);
        const low = Number(item.attributes?.low_stock_threshold ?? 0);
        const status = stock <= 0 ? 'Out of stock' : stock <= low ? 'Low' : 'Normal';
        return status.toLowerCase().includes(filters.status.toLowerCase());
      })();

      return (
        matchesDescription &&
        matchesCode &&
        matchesSupplier &&
        matchesIndex &&
        matchesDiameter &&
        matchesSphere &&
        matchesCylinder &&
        matchesAdd &&
        matchesAxis &&
        matchesSteps &&
        matchesModality &&
        matchesSet &&
        matchesBc &&
        matchesPcPrice &&
        matchesPcCost &&
        matchesStock &&
        matchesLowStockThreshold &&
        matchesStatus
      );
    });
    
    console.log('Filtered items count:', filtered.length);
    return filtered;
  }, [items, filters]);

  // Group items by subcategory
  const groupedItems = useMemo(() => {
    if (!groupBySubcategory) {
      return { 'All Items': filteredItems };
    }
    
    const groups = {};
    filteredItems.forEach(item => {
      const subcategoryName = item.subcategory_name || 'Uncategorized';
      if (!groups[subcategoryName]) {
        groups[subcategoryName] = [];
      }
      groups[subcategoryName].push(item);
    });
    
    // Sort groups alphabetically
    const sortedGroups = {};
    Object.keys(groups).sort().forEach(key => {
      sortedGroups[key] = groups[key];
    });
    
    return sortedGroups;
  }, [filteredItems, groupBySubcategory]);

  // Paginated grouped items
  const paginatedGroupedItems = useMemo(() => {
    if (!groupBySubcategory) {
      return {};
    }
    
    const paginatedGroups = {};
    Object.entries(groupedItems).forEach(([groupName, groupItems]) => {
      const currentPage = subcategoryPages[groupName] || 1;
      const startIndex = (currentPage - 1) * groupItemsPerPage;
      const endIndex = startIndex + groupItemsPerPage;
      paginatedGroups[groupName] = groupItems.slice(startIndex, endIndex);
    });
    
    return paginatedGroups;
  }, [groupedItems, subcategoryPages, groupItemsPerPage, groupBySubcategory]);

  // Calculate total pages per subcategory
  const subcategoryTotalPages = useMemo(() => {
    if (!groupBySubcategory) {
      return {};
    }
    
    const pagesPerSubcategory = {};
    Object.entries(groupedItems).forEach(([groupName, groupItems]) => {
      pagesPerSubcategory[groupName] = Math.ceil(groupItems.length / groupItemsPerPage);
    });
    
    return pagesPerSubcategory;
  }, [groupedItems, groupItemsPerPage, groupBySubcategory]);

  // Paginated items (when not grouping)
  const paginatedItems = useMemo(() => {
    if (groupBySubcategory) {
      return []; // Don't use pagination when grouping
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage, groupBySubcategory]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  // Handle filter change
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to first page when filtering
    setSubcategoryPages({}); // Reset all subcategory pages when filtering
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      description: '',
      code: '',
      supplier: '',
      index: '',
      diameter: '',
      sphere: '',
      cylinder: '',
      add: '',
      axis: '',
      steps: '',
      modality: '',
      set: '',
      bc: '',
      pcPrice: '',
      pcCost: '',
      stock: '',
      lowStockThreshold: '',
      status: ''
    });
    setCurrentPage(1);
    setSubcategoryPages({});
  };

  // Toggle group collapse
  const toggleGroup = (groupName) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupName)) {
        newSet.delete(groupName);
      } else {
        newSet.add(groupName);
      }
      return newSet;
    });
  };

  // Expand all groups
  const expandAllGroups = () => {
    setCollapsedGroups(new Set());
  };

  // Collapse all groups
  const collapseAllGroups = () => {
    setCollapsedGroups(new Set(Object.keys(groupedItems)));
  };

  // Handle subcategory page change
  const handleSubcategoryPageChange = (subcategoryName, newPage) => {
    setSubcategoryPages(prev => ({
      ...prev,
      [subcategoryName]: newPage
    }));
  };

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
                <h1 className="text-2xl font-bold text-white">Inventory Management</h1>
                <div className="ml-3 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-xs text-green-400">Live Updates</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <button
                  onClick={fetchInventory}
                  className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 flex items-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Refresh</span>
                </button>
                
                {/* Grouping Controls */}
                <div className="flex items-center space-x-2">
                  <label className="flex items-center space-x-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={groupBySubcategory}
                      onChange={(e) => setGroupBySubcategory(e.target.checked)}
                      className="rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Group by Subcategory</span>
                  </label>
                  
                  {groupBySubcategory && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={expandAllGroups}
                        className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors duration-200"
                      >
                        Expand All
                      </button>
                      <button
                        onClick={collapseAllGroups}
                        className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors duration-200"
                      >
                        Collapse All
                      </button>
                    </div>
                  )}
                </div>
              </div>

        

            </div>
          </div>
        </header>

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 custom-scrollbar scroll-smooth">
          <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl">
            <div className="px-6 py-4 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-white">Inventory Items</h2>
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-400">
                    {filteredItems.length} of {items.length} items
                  </span>
                  <button
                    onClick={clearFilters}
                    className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p className="text-gray-300 text-sm">Loading inventory...</p>
                  </div>
                </div>
              ) : (
                <div>
                  {items.length === 0 ? (
                    <div className="text-center py-12">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-300">No inventory items</h3>
                      <p className="mt-1 text-sm text-gray-400">Items appear here after being added to inventory.</p>
                    </div>
                  ) : (
                    <div>
                      {/* Filter Row */}
                      <div className="mb-4 grid gap-1 text-xs" style={{ gridTemplateColumns: 'repeat(19, minmax(0, 1fr))' }}>
                        <input
                          type="text"
                          placeholder="description..."
                          value={filters.description}
                          onChange={(e) => handleFilterChange('description', e.target.value)}
                          className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="code..."
                          value={filters.code}
                          onChange={(e) => handleFilterChange('code', e.target.value)}
                          className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="supplier..."
                          value={filters.supplier}
                          onChange={(e) => handleFilterChange('supplier', e.target.value)}
                          className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="index..."
                          value={filters.index}
                          onChange={(e) => handleFilterChange('index', e.target.value)}
                          className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="diameter..."
                          value={filters.diameter}
                          onChange={(e) => handleFilterChange('diameter', e.target.value)}
                          className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="sphere..."
                          value={filters.sphere}
                          onChange={(e) => handleFilterChange('sphere', e.target.value)}
                          className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="cylinder..."
                          value={filters.cylinder}
                          onChange={(e) => handleFilterChange('cylinder', e.target.value)}
                          className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="add..."
                          value={filters.add}
                          onChange={(e) => handleFilterChange('add', e.target.value)}
                          className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="axis..."
                          value={filters.axis}
                          onChange={(e) => handleFilterChange('axis', e.target.value)}
                          className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="steps..."
                          value={filters.steps}
                          onChange={(e) => handleFilterChange('steps', e.target.value)}
                          className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="modality..."
                          value={filters.modality}
                          onChange={(e) => handleFilterChange('modality', e.target.value)}
                          className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="set..."
                          value={filters.set}
                          onChange={(e) => handleFilterChange('set', e.target.value)}
                          className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="BC..."
                          value={filters.bc}
                          onChange={(e) => handleFilterChange('bc', e.target.value)}
                          className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="PC Price..."
                          value={filters.pcPrice}
                          onChange={(e) => handleFilterChange('pcPrice', e.target.value)}
                          className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="PC Cost..."
                          value={filters.pcCost}
                          onChange={(e) => handleFilterChange('pcCost', e.target.value)}
                          className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="stock..."
                          value={filters.stock}
                          onChange={(e) => handleFilterChange('stock', e.target.value)}
                          className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="text"
                          placeholder="threshold..."
                          value={filters.lowStockThreshold}
                          onChange={(e) => handleFilterChange('lowStockThreshold', e.target.value)}
                          className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <select
                          value={filters.status}
                          onChange={(e) => handleFilterChange('status', e.target.value)}
                          className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">All Status</option>
                          <option value="Normal">Normal</option>
                          <option value="Low">Low</option>
                          <option value="Out of stock">Out of Stock</option>
                        </select>
                        <div></div> {/* Actions column - no filter */}
                      </div>

                      <div className="max-h-[65vh] overflow-y-auto custom-scrollbar">
                        {groupBySubcategory ? (
                          // Grouped view
                          <div>
                            {Object.entries(paginatedGroupedItems).map(([groupName, groupItems]) => {
                              const totalItemsInGroup = groupedItems[groupName]?.length || 0;
                              const currentPage = subcategoryPages[groupName] || 1;
                              const totalPages = subcategoryTotalPages[groupName] || 1;
                              const startIndex = (currentPage - 1) * groupItemsPerPage + 1;
                              const endIndex = Math.min(currentPage * groupItemsPerPage, totalItemsInGroup);
                              
                              return (
                                <div key={groupName} className="mb-6">
                                  {/* Group Header */}
                                  <div 
                                    className="bg-gray-700/50 border border-gray-600 rounded-t-lg px-4 py-3 cursor-pointer hover:bg-gray-700/70 transition-colors duration-200"
                                    onClick={() => toggleGroup(groupName)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center space-x-3">
                                        <svg 
                                          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${collapsedGroups.has(groupName) ? 'rotate-0' : 'rotate-90'}`}
                                          fill="none" 
                                          stroke="currentColor" 
                                          viewBox="0 0 24 24"
                                        >
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                        <h3 className="text-lg font-semibold text-white">{groupName}</h3>
                                        <span className="text-sm text-gray-400">
                                          ({groupItems.length > 0 ? `${startIndex}-${endIndex} of ${totalItemsInGroup}` : '0'} items)
                                        </span>
                                      </div>
                                      <div className="text-sm text-gray-400">
                                        {collapsedGroups.has(groupName) ? 'Click to expand' : 'Click to collapse'}
                                      </div>
                                    </div>
                                  </div>
                                
                                {/* Group Items Table */}
                                {!collapsedGroups.has(groupName) && (
                                  <div className="border-l border-r border-b border-gray-700 rounded-b-lg">
                                    <table className="w-full bg-gray-900/60 table-fixed">
                                      <thead className="bg-gray-800/80">
                                        <tr>
                                          <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-32">Description</th>
                                          <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-16">Code</th>
                                          <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-24">Supplier</th>
                                          <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-12">Index</th>
                                          <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-16">Diameter</th>
                                          <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-16">Sphere</th>
                                          <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-16">Cylinder</th>
                                          <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-16">Add</th>
                                          <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-16">Axis</th>
                                          <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-16">Steps</th>
                                          <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-20">Modality</th>
                                          <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-12">Set</th>
                                          <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-12">BC</th>
                                          <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-20">PC Price</th>
                                          <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-20">PC Cost</th>
                                          <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-12">Stock</th>
                                          <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-16">Threshold</th>
                                          <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-16">Status</th>
                                          <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-16">Actions</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-gray-700">
                                        {groupItems.map((item) => (
                                          <tr key={item.id} className="hover:bg-gray-800/40 transition-colors duration-200">
                                            <td className="px-2 py-2 text-[11px] text-white font-medium whitespace-nowrap">{item.description}</td>
                                            <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">{item.code || '-'}</td>
                                            <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">{item.supplier_name || '-'}</td>
                                            <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">{item.attributes?.index || '-'}</td>
                                            <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">{item.attributes?.diameter || '-'}</td>
                                            <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">{item.attributes?.sphere || '-'}</td>
                                            <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">{item.attributes?.cylinder || '-'}</td>
                                            <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">{item.attributes?.add || '-'}</td>
                                            <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">{item.attributes?.axis || '-'}</td>
                                            <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">{item.attributes?.steps || '-'}</td>
                                            <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">{item.attributes?.modality || '-'}</td>
                                            <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">{item.attributes?.set || '-'}</td>
                                            <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">{item.attributes?.bc || '-'}</td>
                                            <td className="px-2 py-2 text-[11px] text-green-400 font-semibold whitespace-nowrap">₱{parseFloat(item.pc_price || 0).toLocaleString()}</td>
                                            <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">₱{parseFloat(item.pc_cost || 0).toLocaleString()}</td>
                                            <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">{item.attributes?.stock ?? '-'}</td>
                                            <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">{item.attributes?.low_stock_threshold ?? '-'}</td>
                                            <td className="px-2 py-2 text-[11px] whitespace-nowrap">
                                              {(() => {
                                                const stock = Number(item.attributes?.stock ?? 0);
                                                const low = Number(item.attributes?.low_stock_threshold ?? 0);
                                                const status = stock <= 0 ? 'Out of stock' : stock <= low ? 'Low' : 'Normal';
                                                const color = stock <= 0 ? 'text-red-400' : stock <= low ? 'text-yellow-400' : 'text-green-400';
                                                return <span className={`${color} font-medium`}>{status}</span>;
                                              })()}
                                            </td>
                                            <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">
                                              <div className="flex space-x-2">
                                                <button
                                                  onClick={() => {
                                                    setEditingItem(item);
                                                    setEditForm({
                                                      supplier_id: item.supplier_id || '',
                                                      stock: item.attributes?.stock ?? '',
                                                      low_stock_threshold: item.attributes?.low_stock_threshold ?? '',
                                                      description: item.description || '',
                                                      code: item.code || '',
                                                      pc_price: item.pc_price || '',
                                                      pc_cost: item.pc_cost || '',
                                                      // Lens attributes
                                                      index: item.attributes?.index || '',
                                                      diameter: item.attributes?.diameter || '',
                                                      sphere: item.attributes?.sphere || '',
                                                      cylinder: item.attributes?.cylinder || '',
                                                      add: item.attributes?.add || '',
                                                      axis: item.attributes?.axis || '',
                                                      steps: item.attributes?.steps || '',
                                                      modality: item.attributes?.modality || '',
                                                      set: item.attributes?.set || '',
                                                      bc: item.attributes?.bc || ''
                                                    });
                                                  }}
                                                  className="text-blue-400 hover:text-blue-300"
                                                >
                                                  Edit
                                                </button>
                                                {item.supplier_id && item.supplier_name && (
                                                  <button
                                                    onClick={() => handleDeleteItem(item)}
                                                    className="text-red-400 hover:text-red-300"
                                                  >
                                                    Delete
                                                  </button>
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                                
                                {/* Subcategory Pagination Controls */}
                                {totalPages > 1 && (
                                  <div className="mt-3 px-4 py-2 bg-gray-600/30 border-t border-gray-600">
                                    <div className="flex items-center justify-between">
                                      <div className="text-xs text-gray-400">
                                        {groupName}: Page {currentPage} of {totalPages}
                                      </div>
                                      <div className="flex items-center space-x-1">
                                        <button
                                          onClick={() => handleSubcategoryPageChange(groupName, Math.max(currentPage - 1, 1))}
                                          disabled={currentPage === 1}
                                          className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded transition-colors duration-200"
                                        >
                                          Prev
                                        </button>
                                        
                                        {/* Page numbers */}
                                        <div className="flex items-center space-x-1">
                                          {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                                            let pageNum;
                                            if (totalPages <= 3) {
                                              pageNum = i + 1;
                                            } else if (currentPage <= 2) {
                                              pageNum = i + 1;
                                            } else if (currentPage >= totalPages - 1) {
                                              pageNum = totalPages - 2 + i;
                                            } else {
                                              pageNum = currentPage - 1 + i;
                                            }
                                            
                                            return (
                                              <button
                                                key={pageNum}
                                                onClick={() => handleSubcategoryPageChange(groupName, pageNum)}
                                                className={`px-2 py-1 text-xs rounded transition-colors duration-200 ${
                                                  currentPage === pageNum
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
                                                }`}
                                              >
                                                {pageNum}
                                              </button>
                                            );
                                          })}
                                        </div>
                                        
                                        <button
                                          onClick={() => handleSubcategoryPageChange(groupName, Math.min(currentPage + 1, totalPages))}
                                          disabled={currentPage === totalPages}
                                          className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded transition-colors duration-200"
                                        >
                                          Next
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          // Ungrouped view (original table)
                          <div>
                            <table className="w-full bg-gray-900/60 border border-gray-700 rounded-lg table-fixed">
                              <thead className="bg-gray-800/80 sticky top-0 z-10">
                                <tr>
                                  <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-32">Description</th>
                                  <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-16">Code</th>
                                  <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-24">Supplier</th>
                                  <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-12">Index</th>
                                  <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-16">Diameter</th>
                                  <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-16">Sphere</th>
                                  <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-16">Cylinder</th>
                                  <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-16">Add</th>
                                  <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-16">Axis</th>
                                  <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-16">Steps</th>
                                  <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-20">Modality</th>
                                  <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-12">Set</th>
                                  <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-12">BC</th>
                                  <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-20">PC Price</th>
                                  <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-20">PC Cost</th>
                                  <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-12">Stock</th>
                                  <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-16">Threshold</th>
                                  <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-16">Status</th>
                                  <th className="px-2 py-2 text-left text-[10px] font-medium text-gray-300 uppercase tracking-wider whitespace-nowrap w-16">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-700">
                                {paginatedItems.map((item) => (
                                  <tr key={item.id} className="hover:bg-gray-800/40 transition-colors duration-200">
                                    <td className="px-2 py-2 text-[11px] text-white font-medium whitespace-nowrap">{item.description}</td>
                                    <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">{item.code || '-'}</td>
                                    <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">{item.supplier_name || '-'}</td>
                                    <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">{item.attributes?.index || '-'}</td>
                                    <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">{item.attributes?.diameter || '-'}</td>
                                    <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">{item.attributes?.sphere || '-'}</td>
                                    <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">{item.attributes?.cylinder || '-'}</td>
                                    <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">{item.attributes?.add || '-'}</td>
                                    <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">{item.attributes?.axis || '-'}</td>
                                    <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">{item.attributes?.steps || '-'}</td>
                                    <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">{item.attributes?.modality || '-'}</td>
                                    <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">{item.attributes?.set || '-'}</td>
                                    <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">{item.attributes?.bc || '-'}</td>
                                    <td className="px-2 py-2 text-[11px] text-green-400 font-semibold whitespace-nowrap">₱{parseFloat(item.pc_price || 0).toLocaleString()}</td>
                                    <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">₱{parseFloat(item.pc_cost || 0).toLocaleString()}</td>
                                    <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">{item.attributes?.stock ?? '-'}</td>
                                    <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">{item.attributes?.low_stock_threshold ?? '-'}</td>
                                    <td className="px-2 py-2 text-[11px] whitespace-nowrap">
                                      {(() => {
                                        const stock = Number(item.attributes?.stock ?? 0);
                                        const low = Number(item.attributes?.low_stock_threshold ?? 0);
                                        const status = stock <= 0 ? 'Out of stock' : stock <= low ? 'Low' : 'Normal';
                                        const color = stock <= 0 ? 'text-red-400' : stock <= low ? 'text-yellow-400' : 'text-green-400';
                                        return <span className={`${color} font-medium`}>{status}</span>;
                                      })()}
                                    </td>
                                    <td className="px-2 py-2 text-[11px] text-gray-300 whitespace-nowrap">
                                      <div className="flex space-x-2">
                                        <button
                                          onClick={() => {
                                            setEditingItem(item);
                                            setEditForm({
                                              supplier_id: item.supplier_id || '',
                                              stock: item.attributes?.stock ?? '',
                                              low_stock_threshold: item.attributes?.low_stock_threshold ?? '',
                                              description: item.description || '',
                                              code: item.code || '',
                                              pc_price: item.pc_price || '',
                                              pc_cost: item.pc_cost || '',
                                              // Lens attributes
                                              index: item.attributes?.index || '',
                                              diameter: item.attributes?.diameter || '',
                                              sphere: item.attributes?.sphere || '',
                                              cylinder: item.attributes?.cylinder || '',
                                              add: item.attributes?.add || '',
                                              axis: item.attributes?.axis || '',
                                              steps: item.attributes?.steps || '',
                                              modality: item.attributes?.modality || '',
                                              set: item.attributes?.set || '',
                                              bc: item.attributes?.bc || ''
                                            });
                                          }}
                                          className="text-blue-400 hover:text-blue-300"
                                        >
                                          Edit
                                        </button>
                                        {item.supplier_id && item.supplier_name && (
                                          <button
                                            onClick={() => handleDeleteItem(item)}
                                            className="text-red-400 hover:text-red-300"
                                          >
                                            Delete
                                          </button>
                                        )}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {/* Pagination Controls - Only show when not grouping */}
                      {!groupBySubcategory && totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-between">
                          <div className="text-sm text-gray-400">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} results
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                              disabled={currentPage === 1}
                              className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors duration-200"
                            >
                              Previous
                            </button>
                            
                            {/* Page numbers */}
                            <div className="flex items-center space-x-1">
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
                                    onClick={() => setCurrentPage(pageNum)}
                                    className={`px-3 py-1 text-sm rounded-lg transition-colors duration-200 ${
                                      currentPage === pageNum
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-600 hover:bg-gray-700 text-gray-300'
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              })}
                            </div>
                            
                            <button
                              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              className="px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg transition-colors duration-200"
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </main>
        {editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-white mb-6">Edit Item Details</h3>
              
              {/* Basic Information Section */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-blue-400 mb-3 border-b border-gray-700 pb-2">Basic Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <input
                      type="text"
                      value={editForm.description}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Code</label>
                    <input
                      type="text"
                      value={editForm.code}
                      onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">PC Price (₱)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.pc_price}
                      onChange={(e) => setEditForm({ ...editForm, pc_price: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">PC Cost (₱)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editForm.pc_cost}
                      onChange={(e) => setEditForm({ ...editForm, pc_cost: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Inventory Management Section */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-green-400 mb-3 border-b border-gray-700 pb-2">Inventory Management</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Supplier</label>
                  <select
                    value={editForm.supplier_id}
                    onChange={(e) => setEditForm({ ...editForm, supplier_id: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Stock</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editForm.stock}
                    onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Low Stock Threshold</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editForm.low_stock_threshold}
                    onChange={(e) => setEditForm({ ...editForm, low_stock_threshold: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  </div>
                </div>
              </div>

              {/* Lens Specifications Section */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-yellow-400 mb-3 border-b border-gray-700 pb-2">Lens Specifications</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Index</label>
                    <input
                      type="text"
                      value={editForm.index}
                      onChange={(e) => setEditForm({ ...editForm, index: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Diameter</label>
                    <input
                      type="text"
                      value={editForm.diameter}
                      onChange={(e) => setEditForm({ ...editForm, diameter: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Sphere</label>
                    <input
                      type="text"
                      value={editForm.sphere}
                      onChange={(e) => setEditForm({ ...editForm, sphere: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Cylinder</label>
                    <input
                      type="text"
                      value={editForm.cylinder}
                      onChange={(e) => setEditForm({ ...editForm, cylinder: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Add</label>
                    <input
                      type="text"
                      value={editForm.add}
                      onChange={(e) => setEditForm({ ...editForm, add: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Axis</label>
                    <input
                      type="text"
                      value={editForm.axis}
                      onChange={(e) => setEditForm({ ...editForm, axis: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Steps</label>
                    <input
                      type="text"
                      value={editForm.steps}
                      onChange={(e) => setEditForm({ ...editForm, steps: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Modality</label>
                    <input
                      type="text"
                      value={editForm.modality}
                      onChange={(e) => setEditForm({ ...editForm, modality: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Set</label>
                    <input
                      type="text"
                      value={editForm.set}
                      onChange={(e) => setEditForm({ ...editForm, set: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">BC</label>
                    <input
                      type="text"
                      value={editForm.bc}
                      onChange={(e) => setEditForm({ ...editForm, bc: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditingItem(null)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      console.log('🔌 Starting item update for ID:', editingItem.id);
                      console.log('🔌 Socket connection status:', socketService.getConnectionStatus());
                      
                      // Determine if this is an inventory-only update or full update
                      // Check if only inventory fields were changed
                      const originalItem = editingItem;
                      const priceListFields = ['description', 'code', 'pc_price', 'pc_cost'];
                      const attributeFields = ['index', 'diameter', 'sphere', 'cylinder', 'add', 'axis', 'steps', 'modality', 'set', 'bc'];
                      
                      // Check if any price list or attribute fields were changed
                      const priceListChanged = priceListFields.some(field => 
                        editForm[field] !== (originalItem[field] || '')
                      );
                      const attributesChanged = attributeFields.some(field => 
                        editForm[field] !== (originalItem.attributes?.[field] || '')
                      );
                      
                      const isInventoryOnlyUpdate = !priceListChanged && !attributesChanged;
                      
                      // Prepare the payload for the backend
                      const payload = {
                        // Always include inventory fields
                        supplier_id: editForm.supplier_id || null,
                        stock: editForm.stock,
                        low_stock_threshold: editForm.low_stock_threshold,
                        addToInventory: true, // Ensure it stays in inventory
                        inventoryOnlyUpdate: isInventoryOnlyUpdate,
                        
                        // CRITICAL: Include the specific product ID for inventory updates
                        // This ensures we update only the specific product, not all products with the same price_list_id
                        product_id: originalItem.id, // This is the unique product ID
                        
                        // Include lens specifications (for products.attributes)
                        sphere: editForm.sphere,
                        cylinder: editForm.cylinder,
                        diameter: editForm.diameter,
                        
                        // If not inventory-only, include all other fields
                        ...(isInventoryOnlyUpdate ? {} : {
                          description: editForm.description,
                          code: editForm.code,
                          pc_price: editForm.pc_price,
                          pc_cost: editForm.pc_cost,
                          subcategory_id: originalItem.subcategory_id, // Preserve original subcategory
                          
                          // Lens attributes for price_list.attributes (using backend field names)
                          index: editForm.index,
                          addFr: editForm.add, // Backend expects addFr/addTo instead of add
                          addTo: editForm.add, // For single value, use same for both
                          axis: editForm.axis,
                          steps: editForm.steps,
                          modality: editForm.modality,
                          set: editForm.set,
                          bc: editForm.bc
                        })
                      };
                      
                      console.log('🔌 Update type:', isInventoryOnlyUpdate ? 'Inventory Only' : 'Full Update');
                      console.log('🔌 Original item data:', editingItem);
                      console.log('🔌 Sending update payload:', payload);
                      // Use price_list_id for updates, not product_id
                      const priceListId = editingItem.price_list_id || editingItem.id;
                      console.log('🔌 Using price_list_id for update:', priceListId);
                      const result = await updateItem(priceListId, payload);
                      console.log('🔌 Update API response:', result);
                      
                      // Always close the modal after update attempt
                      setEditingItem(null);
                      console.log('🔌 Modal closed, socket will handle real-time update');
                      
                    } catch (e) {
                      console.error('Failed to update item', e);
                      
                      // Get more specific error message
                      let errorMessage = 'Failed to update item. Please try again.';
                      if (e.message && e.message.includes('DUPLICATE_DESCRIPTION')) {
                        errorMessage = 'An item with this description already exists. Please use a different description.';
                      } else if (e.message) {
                        errorMessage = `Failed to update item: ${e.message}`;
                      }
                      
                      // Still close the modal even if there's an error
                      setEditingItem(null);
                      alert(errorMessage);
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Delete Confirmation Modal */}
        {deleteItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-white mb-4">Confirm Delete</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to remove "{deleteItem.description}" from the inventory list? 
                This will clear the supplier assignment and remove it from the inventory display.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteItem(null)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Inventory;