import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import { getUserLogs } from '../../services/auth';

function AccountManagement() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userLogs, setUserLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(10);

  // Set user role when component mounts
  useEffect(() => {
    localStorage.setItem('userRole', 'admin');
    fetchUserLogs();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  const fetchUserLogs = async () => {
    setLoading(true);
    try {
      const logs = await getUserLogs();
      
      // Handle different response formats
      if (logs && Array.isArray(logs)) {
        setUserLogs(logs);
      } else if (logs && logs.data && Array.isArray(logs.data)) {
        setUserLogs(logs.data);
      } else if (logs && logs.logs && Array.isArray(logs.logs)) {
        setUserLogs(logs.logs);
      } else {
        setUserLogs([]);
      }
    } catch (error) {
      console.error('Error fetching user logs:', error);
      alert('Failed to fetch user logs: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = userLogs.filter(log => {
    const matchesSearch = (log.user_name || 'Unknown User')
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Pagination logic
  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
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

  const refreshLogs = () => {
    fetchUserLogs();
    setCurrentPage(1); // Reset to first page when refreshing
  };

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
        userType="admin"
        onLogout={handleLogout}
      />

      {/* Main content area */}
      <div className="flex-1 lg:ml-0">
        {/* Header */}
        <header className="bg-gray-800/80 backdrop-blur-xl border-b border-gray-700">
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
                <h1 className="text-2xl font-bold text-white">Account Management</h1>
              </div>
              <button
                onClick={refreshLogs}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Logins</p>
                  <p className="text-2xl font-bold text-white">{userLogs.length}</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Unique Users</p>
                  <p className="text-2xl font-bold text-white">
                    {new Set(userLogs.map(log => log.user_name)).size}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-2">Search Users</label>
                <input
                  type="text"
                  placeholder="Search by user name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
          
          {/* User Login Logs */}
          <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">User Login Activity</h2>
              <div className="text-sm text-gray-400">
                Showing {currentLogs.length} of {filteredLogs.length} logs
                {searchTerm && ` (filtered from ${userLogs.length} total)`}
              </div>
            </div>
            
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="text-gray-400 mt-4">Loading user logs...</p>
              </div>
            ) : currentLogs.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Login Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                      {currentLogs.map((log, index) => (
                        <tr key={index} className="hover:bg-gray-700/30 transition-colors duration-200">
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                                <span className="text-xs font-bold text-white">
                                  {(log.user_name || 'U').charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="text-sm font-medium text-white">
                                {log.user_name || 'Unknown User'}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              log.user_type === 'admin' 
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg' 
                                : log.user_type === 'employee'
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                                : 'bg-gray-500 text-gray-100'
                            }`}>
                              {log.user_type === 'admin' && (
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                                </svg>
                              )}
                              {log.user_type === 'employee' && (
                                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                              {log.user_type || 'User'}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-300">
                            <div className="flex flex-col">
                              <span className="text-white font-medium">
                                {log.created_at ? new Date(log.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                }) : 'N/A'}
                              </span>
                              <span className="text-xs text-gray-400">
                                {log.created_at ? new Date(log.created_at).toLocaleTimeString('en-US', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  hour12: true
                                }) : 'N/A'}
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-gray-700 pt-6">
                    <div className="text-sm text-gray-400">
                      Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={goToPreviousPage}
                        disabled={currentPage === 1}
                        className="px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        Previous
                      </button>
                      
                      {/* Page numbers */}
                      <div className="flex space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-300 bg-gray-700 border border-gray-600 hover:bg-gray-600'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                      
                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className="px-3 py-2 text-sm font-medium text-gray-300 bg-gray-700 border border-gray-600 rounded-lg hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors duration-200"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No user logs found</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AccountManagement;
