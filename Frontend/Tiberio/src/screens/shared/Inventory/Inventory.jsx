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
  const [editForm, setEditForm] = useState({ supplier_id: '', stock: '', low_stock_threshold: '' });
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
     
        
        // Wait for Socket.IO connection to be established
        const socket = await socketService.waitForConnection();
   
        
        // Join inventory room
  
        socketService.joinRoom('inventory-updated');
     
        
        // Listen for inventory updates
        const handleInventoryUpdate = (data) => {
        
          
          if (data.type === 'added' && data.item) {
            setItems(prevItems => {
              // Add new item if not already present
              const exists = prevItems.some(item => item.id === data.item.id);
              if (exists) {
                return prevItems;
              }
          
              return [...prevItems, data.item];
            });
          } else if (data.type === 'updated' && data.item) {
        
            setItems(prevItems => {
              const updated = prevItems.map(item => item.id === data.item.id ? data.item : item);
            
              return updated;
            });
          } else if (data.type === 'deleted' && data.item) {
         
            setItems(prevItems => {
              const filtered = prevItems.filter(item => item.id !== data.item.id);
              return filtered;
            });
          } else if (data.type === 'stock_updated' && data.item) {
            setItems(prevItems => {
              const updated = prevItems.map(item => item.id === data.item.id ? data.item : item);
              return updated;
            });
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
                  return data.item;
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
        
        // Add test event listener for debugging
        socket.on('test-connection', (data) => {
          console.log('🔌 Test event received in Inventory:', data);
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
    return items.filter(item => {
      return (
        item.description?.toLowerCase().includes(filters.description.toLowerCase()) &&
        (item.code || '').toLowerCase().includes(filters.code.toLowerCase()) &&
        (item.supplier_name || '').toLowerCase().includes(filters.supplier.toLowerCase()) &&
        (item.attributes?.index || '').toString().toLowerCase().includes(filters.index.toLowerCase()) &&
        (item.attributes?.diameter || '').toString().toLowerCase().includes(filters.diameter.toLowerCase()) &&
        (item.attributes?.sphere || '').toString().toLowerCase().includes(filters.sphere.toLowerCase()) &&
        (item.attributes?.cylinder || '').toString().toLowerCase().includes(filters.cylinder.toLowerCase()) &&
        (item.attributes?.add || '').toString().toLowerCase().includes(filters.add.toLowerCase()) &&
        (item.attributes?.axis || '').toString().toLowerCase().includes(filters.axis.toLowerCase()) &&
        (item.attributes?.steps || '').toString().toLowerCase().includes(filters.steps.toLowerCase()) &&
        (item.attributes?.modality || '').toLowerCase().includes(filters.modality.toLowerCase()) &&
        (item.attributes?.set || '').toString().toLowerCase().includes(filters.set.toLowerCase()) &&
        (item.attributes?.bc || '').toString().toLowerCase().includes(filters.bc.toLowerCase()) &&
        (item.pc_price || '').toString().includes(filters.pcPrice) &&
        (item.pc_cost || '').toString().includes(filters.pcCost) &&
        (item.attributes?.stock || '').toString().includes(filters.stock) &&
        (item.attributes?.low_stock_threshold || '').toString().includes(filters.lowStockThreshold) &&
        (() => {
          const stock = Number(item.attributes?.stock ?? 0);
          const low = Number(item.attributes?.low_stock_threshold ?? 0);
          const status = stock <= 0 ? 'Out of stock' : stock <= low ? 'Low' : 'Normal';
          return status.toLowerCase().includes(filters.status.toLowerCase());
        })()
      );
    });
  }, [items, filters]);

  // Paginated items
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  // Handle filter change
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setCurrentPage(1); // Reset to first page when filtering
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
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
                                            low_stock_threshold: item.attributes?.low_stock_threshold ?? ''
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
                      </div>

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
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
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-white mb-4">Edit Inventory</h3>
              <div className="space-y-4">
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
                  <label className="block text-sm font-medium text-gray-300 mb-2">Low stock threshold</label>
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
                      
                      // Prepare the payload for the backend (inventory-only update)
                      // NOTE: This payload ONLY contains inventory-specific fields
                      // It does NOT include any price_list fields like description, attributes, etc.
                      const payload = {
                        supplier_id: editForm.supplier_id || null, // Updates price_list.supplier_id only
                        stock: editForm.stock, // Updates products.stock
                        low_stock_threshold: editForm.low_stock_threshold, // Updates products.low_stock_threshold
                        addToInventory: true, // Ensure it stays in inventory
                        inventoryOnlyUpdate: true, // Flag to indicate this is inventory-only
                        // Include lens specifications from attributes (updates products.attributes)
                        sphere: editingItem.attributes?.sphere || '',
                        cylinder: editingItem.attributes?.cylinder || '',
                        diameter: editingItem.attributes?.diameter || ''
                      };
                      
                      console.log('🔌 Sending update payload:', payload);
                      const result = await updateItem(editingItem.id, payload);
                      console.log('🔌 Update API response:', result);
                      
                      // Always close the modal after update attempt
                      setEditingItem(null);
                      console.log('🔌 Modal closed, socket will handle real-time update');
                      
                    } catch (e) {
                      console.error('Failed to update item', e);
                      // Still close the modal even if there's an error
                      setEditingItem(null);
                      alert('Failed to update item. Please try again.');
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