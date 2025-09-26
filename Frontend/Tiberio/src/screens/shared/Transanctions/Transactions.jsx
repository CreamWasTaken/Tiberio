import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../../components/Sidebar';
import { getTransactions, getTransactionById } from '../../../services/transaction';
import socketService from '../../../services/socket';

function Transactions() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Table state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  
  // Date filter state
  const [selectedDate, setSelectedDate] = useState('');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef(null);
  
  // Transaction data state
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal state
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  
  // Get user role from localStorage
  const userRole = localStorage.getItem('userRole') || 'employee';

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('name');
    navigate('/');
  };

  // Handle viewing transaction details
  const handleViewTransaction = async (transactionId) => {
    try {
      setModalLoading(true);
      const transactionData = await getTransactionById(transactionId);
      setSelectedTransaction(transactionData);
      setIsViewModalOpen(true);
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      setError('Failed to load transaction details');
    } finally {
      setModalLoading(false);
    }
  };

  // Close modal
  const handleCloseModal = () => {
    setIsViewModalOpen(false);
    setSelectedTransaction(null);
  };

  // Fetch transactions from API
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getTransactions();
        setTransactions(data || []);
      } catch (err) {
        setError(err.message || 'Failed to load transactions');
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Socket.IO real-time updates for transactions
  useEffect(() => {
    const setupSocketIO = async () => {
      try {
        // Wait for Socket.IO connection to be established
        const socket = await socketService.waitForConnection();
        
        // Join transaction update room
        socketService.joinRoom('transaction-updated');
        
        // Listen for transaction updates
        const handleTransactionUpdate = (data) => {
          
          if (data.type === 'added') {
            // Add new transaction to the list
            setTransactions(prevTransactions => [data.transaction, ...prevTransactions]);
          } else if (data.type === 'updated') {
            // Update existing transaction in the list
            setTransactions(prevTransactions => 
              prevTransactions.map(transaction => 
                transaction.id === data.transaction.id ? data.transaction : transaction
              )
            );
          } else if (data.type === 'deleted') {
            // Remove deleted transaction from the list
            setTransactions(prevTransactions => {
              const filtered = prevTransactions.filter(transaction => {
                // Convert both to numbers for comparison to handle string/number mismatch
                const transactionId = Number(transaction.id);
                const deletedId = Number(data.transaction_id);
                const shouldKeep = transactionId !== deletedId;
                return shouldKeep;
              });
              return filtered;
            });
          } else if (data.type === 'item_fulfilled' || data.type === 'item_refunded') {
            // Refresh transactions to show updated status when items are fulfilled or refunded
            const refreshTransactions = async () => {
              try {
                const data = await getTransactions();
                setTransactions(data || []);
              } catch (err) {
                console.error('Failed to refresh transactions:', err);
              }
            };
            refreshTransactions();
          }
        };

        socket.on('transaction-updated', handleTransactionUpdate);

        return () => {
          socket.off('transaction-updated', handleTransactionUpdate);
          socketService.leaveRoom('transaction-updated');
        };
      } catch (error) {
        console.error('Failed to setup Socket.IO:', error);
      }
    };

    setupSocketIO();
  }, []);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target)) {
        setIsDatePickerOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Filter and sort transactions - only show fulfilled and partially_refunded
  const filteredTransactions = transactions
    .filter(transaction => {
      // Only show fulfilled and partially_refunded transactions
      const isFulfilledOrPartiallyRefunded = transaction.status === 'fulfilled' || transaction.status === 'partially_refunded';
      
      // Search by patient name or receipt number
      const patientName = `${transaction.patient_first_name || ''} ${transaction.patient_last_name || ''}`.trim();
      const matchesSearch = patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           transaction.receipt_number.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter (only for fulfilled and partially_refunded)
      const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
      
      // Date filter - when no date is selected, show today's transactions
      const transactionDate = transaction.created_at ? new Date(transaction.created_at).toDateString() : '';
      const targetDate = selectedDate ? new Date(selectedDate).toDateString() : new Date().toDateString();
      const matchesDate = transactionDate === targetDate;
      
      return isFulfilledOrPartiallyRefunded && matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'date':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        case 'amount':
          aValue = parseFloat(a.final_price);
          bValue = parseFloat(b.final_price);
          break;
        case 'patientName':
          aValue = `${a.patient_first_name || ''} ${a.patient_last_name || ''}`.trim();
          bValue = `${b.patient_first_name || ''} ${b.patient_last_name || ''}`.trim();
          break;
        case 'transactionId':
          aValue = a.receipt_number;
          bValue = b.receipt_number;
          break;
        default:
          aValue = a[sortField];
          bValue = b[sortField];
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      fulfilled: 'bg-green-100 text-green-800',
      partially_refunded: 'bg-orange-100 text-orange-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      refunded: 'bg-red-100 text-red-800'
    };
    
    const statusLabels = {
      fulfilled: 'Fulfilled',
      partially_refunded: 'Partially Refunded',
      pending: 'Pending',
      cancelled: 'Cancelled',
      refunded: 'Refunded'
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
        {statusLabels[status] || status}
      </span>
    );
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
                <h1 className="text-2xl font-bold text-white">Daily Sales</h1>
                <div className="ml-3 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-xs text-green-400">Live Updates</span>
                </div>
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Today's Date</p>
                  <p className="text-2xl font-bold text-white">{new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-400">
                    {selectedDate ? `Total Sales ${new Date(selectedDate).toLocaleDateString()}` : 'Total Sales Today'}
                  </p>
                  <p className="text-2xl font-bold text-white">
                    ₱{transactions
                      .filter(t => {
                        const isFulfilledOrPartiallyRefunded = t.status === 'fulfilled' || t.status === 'partially_refunded';
                        const targetDate = selectedDate ? new Date(selectedDate).toDateString() : new Date().toDateString();
                        const transactionDate = t.created_at ? new Date(t.created_at).toDateString() : '';
                        return isFulfilledOrPartiallyRefunded && transactionDate === targetDate;
                      })
                      .reduce((sum, t) => sum + parseFloat(t.final_price || 0), 0)
                      .toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    }
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-400">
                    {selectedDate ? `Transactions ${new Date(selectedDate).toLocaleDateString()}` : 'Transactions Today'}
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {transactions.filter(t => {
                      const isFulfilledOrPartiallyRefunded = t.status === 'fulfilled' || t.status === 'partially_refunded';
                      const targetDate = selectedDate ? new Date(selectedDate).toDateString() : new Date().toDateString();
                      const transactionDate = t.created_at ? new Date(t.created_at).toDateString() : '';
                      return isFulfilledOrPartiallyRefunded && transactionDate === targetDate;
                    }).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl">
            <div className="px-6 py-4 border-b border-gray-700">
              <h2 className="text-lg font-medium text-white">Transaction History</h2>
            </div>
            
            <div className="p-6">
              {/* Filters and Search */}
              <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      placeholder="Search by patient name or receipt number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="sm:w-48">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="block w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="fulfilled">Fulfilled</option>
                    <option value="partially_refunded">Partially Refunded</option>
                  </select>
                </div>
                <div className="sm:w-48 relative" ref={datePickerRef}>
                  <button
                    onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                    className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-700 text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent flex items-center justify-between"
                  >
                    <span className="flex items-center">
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Select Date'}
                    </span>
                    <svg className={`h-4 w-4 transform transition-transform ${isDatePickerOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  
                  {/* Date Picker Dropdown */}
                  {isDatePickerOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-gray-700 border border-gray-600 rounded-md shadow-lg z-10">
                      <div className="p-3">
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => {
                            setSelectedDate(e.target.value);
                            setIsDatePickerOpen(false);
                          }}
                          className="w-full px-3 py-2 border border-gray-600 rounded-md bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedDate('');
                              setIsDatePickerOpen(false);
                            }}
                            className="flex-1 px-3 py-1 text-sm bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
                          >
                            Clear
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDate(new Date().toISOString().split('T')[0]);
                              setIsDatePickerOpen(false);
                            }}
                            className="flex-1 px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                          >
                            Today
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-600">
                  <thead className="bg-gray-700">
                    <tr>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                        onClick={() => handleSort('transactionId')}
                      >
                        <div className="flex items-center">
                          Receipt Number
                          {sortField === 'transactionId' && (
                            <svg className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                        onClick={() => handleSort('patientName')}
                      >
                        <div className="flex items-center">
                          Patient Name
                          {sortField === 'patientName' && (
                            <svg className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                        onClick={() => handleSort('date')}
                      >
                        <div className="flex items-center">
                          Date
                          {sortField === 'date' && (
                            <svg className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th 
                        scope="col" 
                        className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:text-white"
                        onClick={() => handleSort('amount')}
                      >
                        <div className="flex items-center">
                          Amount
                          {sortField === 'amount' && (
                            <svg className={`ml-1 h-4 w-4 ${sortDirection === 'asc' ? 'transform rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Items
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-600">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
                          Loading transactions...
                        </td>
                      </tr>
                    ) : error ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-red-400">
                          Error: {error}
                        </td>
                      </tr>
                    ) : currentTransactions.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-8 text-center text-gray-400">
                          No fulfilled or partially refunded transactions found
                        </td>
                      </tr>
                    ) : (
                      currentTransactions.map((transaction) => {
                        const patientName = `${transaction.patient_first_name || ''} ${transaction.patient_last_name || ''}`.trim() || 'No Patient';
                        const itemCount = transaction.items ? transaction.items.length : 0;
                        
                        return (
                          <tr key={transaction.id} className="hover:bg-gray-700 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                              {transaction.receipt_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {patientName}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {transaction.created_at ? new Date(transaction.created_at).toLocaleDateString() : '—'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              ₱{parseFloat(transaction.final_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {getStatusBadge(transaction.status)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {itemCount}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              <button
                                onClick={() => handleViewTransaction(transaction.id)}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                              >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredTransactions.length)} of {filteredTransactions.length} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm font-medium rounded-md ${
                        page === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-300 bg-gray-700 border border-gray-600 hover:bg-gray-600'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* View Transaction Modal */}
      {isViewModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Transaction Details - {selectedTransaction?.receipt_number}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {modalLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-gray-400">Loading transaction details...</span>
                </div>
              ) : selectedTransaction ? (
                <div className="space-y-6">
                  {/* Transaction Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Transaction Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Receipt Number:</span>
                          <span className="text-white font-medium">{selectedTransaction.receipt_number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Date:</span>
                          <span className="text-white">
                            {selectedTransaction.created_at ? new Date(selectedTransaction.created_at).toLocaleString() : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Status:</span>
                          <span className="text-white">{getStatusBadge(selectedTransaction.status)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-700 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Patient Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Name:</span>
                          <span className="text-white">
                            {selectedTransaction.patient_first_name || selectedTransaction.patient_last_name 
                              ? `${selectedTransaction.patient_first_name || ''} ${selectedTransaction.patient_last_name || ''}`.trim()
                              : 'No Patient'
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Cashier:</span>
                          <span className="text-white">
                            {selectedTransaction.user_first_name || selectedTransaction.user_last_name
                              ? `${selectedTransaction.user_first_name || ''} ${selectedTransaction.user_last_name || ''}`.trim()
                              : 'Unknown'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-4">Items Purchased</h4>
                    {selectedTransaction.items && selectedTransaction.items.length > 0 ? (
                      <div className="space-y-3">
                        {selectedTransaction.items.map((item, index) => {
                          // Helper function to render lens specifications
                          const renderLensSpecs = () => {
                            const specs = [];
                            const productAttrs = item.product_attributes || {};
                            const priceListAttrs = item.price_list_attributes || {};
                            
                            // Priority: product attributes (specific values) over price_list attributes (ranges)
                            const sphere = productAttrs.sphere || (priceListAttrs.sphFR && priceListAttrs.sphTo ? `${priceListAttrs.sphFR} to ${priceListAttrs.sphTo}` : '');
                            const cylinder = productAttrs.cylinder || (priceListAttrs.cylFr && priceListAttrs.cylTo ? `${priceListAttrs.cylFr} to ${priceListAttrs.cylTo}` : '');
                            const diameter = productAttrs.diameter || priceListAttrs.diameter || '';
                            const index = productAttrs.index || priceListAttrs.index || '';
                            const tp = productAttrs.tp || priceListAttrs.tp || '';
                            const add = priceListAttrs.addFr && priceListAttrs.addTo ? `${priceListAttrs.addFr} to ${priceListAttrs.addTo}` : '';
                            const bc = priceListAttrs.bc || '';
                            const modality = priceListAttrs.modality || '';
                            
                            if (sphere) specs.push(`Sphere: ${sphere}`);
                            if (cylinder) specs.push(`Cylinder: ${cylinder}`);
                            if (diameter) specs.push(`Diameter: ${diameter}`);
                            if (index) specs.push(`Index: ${index}`);
                            if (tp) specs.push(`TP: ${tp}`);
                            if (add) specs.push(`Add: ${add}`);
                            if (bc) specs.push(`BC: ${bc}`);
                            if (modality) specs.push(`Modality: ${modality}`);
                            
                            return specs.length > 0 ? specs.join(' • ') : 'No specifications available';
                          };

                          return (
                            <div key={index} className="bg-gray-800 rounded-lg p-4 border border-gray-600">
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-400">Product:</span>
                                  <p className="text-white font-medium">{item.product_description || 'Unknown Product'}</p>
                                  <p className="text-gray-500 text-xs">Code: {item.product_code || 'N/A'}</p>
                                  <div className="mt-2">
                                    <span className="text-gray-400 text-xs">Specifications:</span>
                                    <p className="text-gray-300 text-xs mt-1">{renderLensSpecs()}</p>
                                  </div>
                                </div>
                                <div>
                                  <span className="text-gray-400">Quantity:</span>
                                  <p className="text-white">{item.quantity}</p>
                                </div>
                                <div>
                                  <span className="text-gray-400">Unit Price:</span>
                                  <p className="text-white">₱{parseFloat(item.unit_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                </div>
                                <div>
                                  <span className="text-gray-400">Total:</span>
                                  <p className="text-white font-medium">
                                    ₱{parseFloat((item.quantity * item.unit_price) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </p>
                                  {item.discount > 0 && (
                                    <p className="text-red-400 text-xs">Discount: ₱{parseFloat(item.discount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center py-4">No items found for this transaction.</p>
                    )}
                  </div>

                  {/* Transaction Summary */}
                  <div className="bg-gray-700 rounded-lg p-4">
                    <h4 className="text-sm font-medium text-gray-300 mb-4">Transaction Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Subtotal:</span>
                        <span className="text-white">₱{parseFloat(selectedTransaction.subtotal_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Total Discount:</span>
                        <span className="text-red-400">-₱{parseFloat(selectedTransaction.total_discount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-600 pt-2">
                        <span className="text-gray-300 font-medium">Final Amount:</span>
                        <span className="text-white font-bold text-lg">₱{parseFloat(selectedTransaction.final_price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>Failed to load transaction details.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-700 flex justify-end">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Transactions;