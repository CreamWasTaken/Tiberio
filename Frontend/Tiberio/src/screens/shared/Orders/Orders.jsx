import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar';
import { getOrders, getOrderStats, deleteOrder, updateOrderStatus } from '../../../services/order';
import socketService from '../../../services/socket';
import { NewOrderModal, ErrorBoundary, Pagination, OrderFilters, DeleteConfirmationModal } from './components';

function Orders() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [orderStats, setOrderStats] = useState({
    total_orders: 0,
    pending_orders: 0,
    completed_orders: 0,
    total_value: 0
  });
  const [error, setError] = useState(null);
  
  // Pagination and Filtering State
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10,
    has_next: false,
    has_prev: false
  });
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    supplier_id: '',
    start_date: '',
    end_date: '',
    sort_by: 'created_at',
    sort_order: 'DESC'
  });
  
  // New Order Modal State
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  
  // Delete Confirmation Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState(null);
  
  // Socket.IO Connection State
  const [socketConnected, setSocketConnected] = useState(false);
  
  // Get user role from localStorage
  const userRole = localStorage.getItem('userRole') || 'employee';

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('name');
    navigate('/');
  };

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  // New Order Modal Functions
  const handleOpenNewOrderModal = () => {
    setIsNewOrderModalOpen(true);
  };

  const handleCloseNewOrderModal = () => {
    setIsNewOrderModalOpen(false);
  };

  const handleOrderCreated = async () => {
    try {
      // Refresh orders and stats as fallback
      await fetchOrders();
      await fetchOrderStats();
    } catch (err) {
      console.error('Error refreshing data after order creation:', err);
      // Don't throw the error to prevent component crash
    }
  };

  // Filter and Pagination Handlers
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, current_page: 1 })); // Reset to first page
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: '',
      supplier_id: '',
      start_date: '',
      end_date: '',
      sort_by: 'created_at',
      sort_order: 'DESC'
    });
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current_page: page }));
  };

  const handleItemsPerPageChange = (itemsPerPage) => {
    setPagination(prev => ({ 
      ...prev, 
      items_per_page: itemsPerPage,
      current_page: 1 // Reset to first page
    }));
  };

  // Fetch orders data with pagination and filtering
  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const params = {
        page: pagination.current_page,
        limit: pagination.items_per_page,
        ...filters
      };
      
      const response = await getOrders(params);
      setOrders(response.orders || []);
      setPagination(response.pagination || pagination);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch order statistics
  const fetchOrderStats = async () => {
    try {
      const statsData = await getOrderStats();
      setOrderStats(statsData || {
        total_orders: 0,
        pending_orders: 0,
        completed_orders: 0,
        total_value: 0
      });
    } catch (err) {
      console.error('Error fetching order stats:', err);
    }
  };

  // Handle order deletion
  const handleDeleteOrder = (order) => {
    setOrderToDelete(order);
    setIsDeleteModalOpen(true);
  };

  // Confirm order deletion
  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    
    try {
      await deleteOrder(orderToDelete.id);
      // Fallback refresh in case Socket.IO doesn't work
      setTimeout(() => {
        fetchOrders();
        fetchOrderStats();
      }, 500);
    } catch (err) {
      console.error('Error deleting order:', err);
      setError('Failed to delete order: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDeleteModalOpen(false);
      setOrderToDelete(null);
    }
  };

  // Cancel order deletion
  const cancelDeleteOrder = () => {
    setIsDeleteModalOpen(false);
    setOrderToDelete(null);
  };

  // Handle order status change
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      // Fallback refresh in case Socket.IO doesn't work
      setTimeout(() => {
        fetchOrders();
        fetchOrderStats();
      }, 500);
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to update order status: ' + err.message);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    } catch {
      return '—';
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount) return '₱0.00';
    return `₱${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    const statusConfig = {
      'ordered': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Ordered' },
      'on_delivery': { bg: 'bg-blue-100', text: 'text-blue-800', label: 'On Delivery' },
      'delivered': { bg: 'bg-green-100', text: 'text-green-800', label: 'Delivered' },
      'completed': { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
      'cancelled': { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
      'returned': { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Returned' }
    };
    
    const config = statusConfig[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    return config;
  };

  // Helper function to check if an order matches current filters
  const checkOrderMatchesFilters = (order, currentFilters) => {
    // Check status filter
    if (currentFilters.status && order.status !== currentFilters.status) {
      return false;
    }
    
    // Check supplier filter
    if (currentFilters.supplier_id && order.supplier_id !== parseInt(currentFilters.supplier_id)) {
      return false;
    }
    
    // Check search filter
    if (currentFilters.search) {
      const searchTerm = currentFilters.search.toLowerCase();
      const matchesSearch = 
        (order.receipt_number && order.receipt_number.toLowerCase().includes(searchTerm)) ||
        (order.description && order.description.toLowerCase().includes(searchTerm)) ||
        (order.supplier_name && order.supplier_name.toLowerCase().includes(searchTerm));
      
      if (!matchesSearch) {
        return false;
      }
    }
    
    // Check date range filters
    if (currentFilters.start_date) {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      if (orderDate < currentFilters.start_date) {
        return false;
      }
    }
    
    if (currentFilters.end_date) {
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      if (orderDate > currentFilters.end_date) {
        return false;
      }
    }
    
    return true;
  };

  // Load data on component mount
  useEffect(() => {
    fetchOrders();
    fetchOrderStats();
  }, [pagination.current_page, pagination.items_per_page, filters]);

  // Socket.IO real-time updates for orders
  useEffect(() => {
    const setupSocketIO = async () => {
      try {
        const socket = await socketService.waitForConnection();
        setSocketConnected(true);
        
        // Join order update room
        await socketService.joinRoom('order-updated');
        
        // Listen for order updates
        const handleOrderUpdate = (data) => {
          console.log('🔌 Real-time order update received:', data);
          console.log('🔌 Current filters:', filters);
          console.log('🔌 Current pagination:', pagination);
          
          if (data.type === 'added') {
            // Check if the new order matches current filters
            const matchesFilters = checkOrderMatchesFilters(data.order, filters);
            
            if (matchesFilters) {
              // Add new order to the list (only if it matches current filters)
              setOrders(prevOrders => {
                // Check if we're on the first page, if not, don't add to avoid pagination issues
                if (pagination.current_page === 1) {
                  return [data.order, ...prevOrders];
                } else {
                  // If not on first page, just refresh the current page
                  fetchOrders();
                  return prevOrders;
                }
              });
            }
            // Always refresh stats when new order is added
            fetchOrderStats();
          } else if (data.type === 'updated') {
            // Check if the updated order matches current filters
            const matchesFilters = checkOrderMatchesFilters(data.order, filters);
            
            if (matchesFilters) {
              // Update existing order in the list
              setOrders(prevOrders => 
                prevOrders.map(order => 
                  order.id === data.order.id ? data.order : order
                )
              );
            } else {
              // If updated order no longer matches filters, remove it from current view
              setOrders(prevOrders => 
                prevOrders.filter(order => order.id !== data.order.id)
              );
            }
            // Always refresh stats when order is updated
            fetchOrderStats();
          } else if (data.type === 'deleted') {
            console.log('🔌 Processing delete event for order ID:', data.orderId, typeof data.orderId);
            console.log('🔌 Current orders before deletion:', orders.length);
            console.log('🔌 Current order IDs:', orders.map(o => ({ id: o.id, type: typeof o.id })));
            // Remove deleted order from the list
            setOrders(prevOrders => {
              const filtered = prevOrders.filter(order => {
                // Ensure both IDs are compared as integers
                const orderIdInt = parseInt(order.id);
                const deleteOrderIdInt = parseInt(data.orderId);
                const matches = orderIdInt !== deleteOrderIdInt;
                if (!matches) {
                  console.log('🔌 Found matching order to delete:', orderIdInt, 'vs', deleteOrderIdInt);
                }
                return matches;
              });
              console.log('🔌 Orders after deletion:', filtered.length);
              return filtered;
            });
            // Always refresh stats when order is deleted
            fetchOrderStats();
          }
        };

        socket.on('order-updated', handleOrderUpdate);

        // Handle connection events
        socket.on('connect', () => {
          setSocketConnected(true);
          console.log('🔌 Socket.IO connected');
        });

        socket.on('disconnect', () => {
          setSocketConnected(false);
          console.log('🔌 Socket.IO disconnected');
        });

        return () => {
          socket.off('order-updated', handleOrderUpdate);
          socket.off('connect');
          socket.off('disconnect');
          socketService.leaveRoom('order-updated');
          setSocketConnected(false);
        };
      } catch (error) {
        console.error('Failed to setup Socket.IO:', error);
        setSocketConnected(false);
      }
    };

    setupSocketIO();
  }, [filters, pagination.current_page]); // Re-setup when filters or page changes

  return (
    <ErrorBoundary>
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
                <h1 className="text-2xl font-bold text-white">Orders Management</h1>
                {/* Real-time connection indicator */}
                <div className="flex items-center ml-4">
                  <div className={`w-2 h-2 rounded-full mr-2 ${socketConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  <span className="text-xs text-gray-400">
                    {socketConnected ? 'Live Updates' : 'Offline'}
                  </span>
                </div>
              </div>
              <div className="flex space-x-3">
                <button 
                  onClick={handleOpenNewOrderModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                >
                  New Order
                </button>
             
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 custom-scrollbar scroll-smooth">
          {/* Summary Stats */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Orders</p>
                  <p className="text-2xl font-bold text-white">{orderStats.total_orders}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-yellow-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Pending Orders</p>
                  <p className="text-2xl font-bold text-white">{orderStats.pending_orders}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Completed Orders</p>
                  <p className="text-2xl font-bold text-white">{orderStats.completed_orders}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Value</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(orderStats.total_value)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <OrderFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            onClearFilters={handleClearFilters}
          />

          <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-medium text-white">Purchase Orders</h2>
            </div>
            
            <div className="p-6">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-900/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Order ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Receipt Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Supplier
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Total Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Description
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Created
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                      {error ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-8 text-center">
                            <div className="text-red-400">
                              <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className="text-lg font-medium">Error loading orders</p>
                              <p className="text-sm text-gray-400 mt-2">{error}</p>
                              <button 
                                onClick={fetchOrders}
                                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
                              >
                                Try Again
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : orders.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="px-6 py-8 text-center">
                            <div className="text-gray-400">
                              <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                              </svg>
                              <p className="text-lg font-medium">No orders found</p>
                              <p className="text-sm text-gray-400 mt-2">Get started by creating your first purchase order.</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        orders.map((order) => {
                          const statusConfig = getStatusBadge(order.status);
                          return (
                            <tr key={order.id} className="hover:bg-gray-700/50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                                #{order.id}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {order.receipt_number || '—'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {order.supplier_name || '—'}
                              </td>
                                          <td className="px-6 py-4 whitespace-nowrap">
                                            <select
                                              value={order.status}
                                              onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                              className="px-3 py-1 text-xs font-medium rounded-lg border border-gray-600 bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-700 transition-colors duration-200"
                                            >
                                              <option value="ordered">Ordered</option>
                                              <option value="on_delivery">On Delivery</option>
                                              <option value="delivered">Delivered</option>
                                              <option value="completed">Completed</option>
                                              <option value="cancelled">Cancelled</option>
                                              <option value="returned">Returned</option>
                                            </select>
                                          </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {formatCurrency(order.total_price)}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-300 max-w-xs truncate">
                                {order.description || '—'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                                {formatDate(order.created_at)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <div className="flex space-x-2">
                                  <button 
                                    onClick={() => handleViewOrder(order)}
                                    className="text-blue-400 hover:text-blue-300"
                                  >
                                    View
                                  </button>
                                  <button className="text-green-400 hover:text-green-300">
                                    Edit
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteOrder(order)}
                                    className="text-red-400 hover:text-red-300"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        <Pagination
          currentPage={pagination.current_page}
          totalPages={pagination.total_pages}
          totalItems={pagination.total_items}
          itemsPerPage={pagination.items_per_page}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      </div>
    </main>
      </div>

      {/* Order Items Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={handleCloseModal}></div>
          <div className="relative w-full max-w-4xl mx-4 shadow-2xl">
            <div className="bg-gray-800 border border-gray-700 rounded-xl">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white">Order Details</h3>
                    <p className="text-sm text-gray-400">Order #{selectedOrder.id} - {selectedOrder.receipt_number || 'No receipt number'}</p>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                {/* Order Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-white mb-3">Order Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Supplier:</span>
                        <span className="text-white">{selectedOrder.supplier_name || '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(selectedOrder.status).bg} ${getStatusBadge(selectedOrder.status).text}`}>
                          {getStatusBadge(selectedOrder.status).label}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Price:</span>
                        <span className="text-white font-semibold">{formatCurrency(selectedOrder.total_price)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Created:</span>
                        <span className="text-white">{formatDate(selectedOrder.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-900/50 rounded-lg p-4">
                    <h4 className="text-lg font-medium text-white mb-3">Description</h4>
                    <p className="text-gray-300 text-sm">{selectedOrder.description || '—'}</p>
                  </div>
                </div>

                {/* Order Items Table */}
                <div>
                  <h4 className="text-lg font-medium text-white mb-4">Order Items</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead className="bg-gray-900/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Item ID
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Unit Price
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Total
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                        {selectedOrder.items && selectedOrder.items.length > 0 ? (
                          selectedOrder.items.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-700/50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                                #{item.id}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                                {item.product_description || item.product_code || 'Unknown Product'}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                                {item.qty}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                                {formatCurrency(item.unit_price)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                                {formatCurrency((item.qty || 0) * (item.unit_price || 0))}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                  item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                  item.status === 'received' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {item.status || 'pending'}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="px-4 py-8 text-center text-gray-400">
                              No items found for this order
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-700 flex justify-end">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Order Modal */}
      <NewOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={handleCloseNewOrderModal}
        onOrderCreated={handleOrderCreated}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={cancelDeleteOrder}
        onConfirm={confirmDeleteOrder}
        order={orderToDelete}
      />
      </div>
    </ErrorBoundary>
  );
}

export default Orders;
