import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from '../../../components/Sidebar';
import { getUserLogs, getAllUsers, changeUserStatus, changePassword, addUser } from '../../../services/auth';

function AccountManagement() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userLogs, setUserLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(10);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ show: false, message: '', onConfirm: null, title: '' });
  
  // Add User Form State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    type: 'employee'
  });
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [showAddUserPassword, setShowAddUserPassword] = useState(false);

  // Set user role when component mounts
  useEffect(() => {
    localStorage.setItem('userRole', 'admin');
    fetchUserLogs();
    fetchUsers();
  }, []);

  // Auto-hide toast after 5 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, message: '', type: 'success' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Handle Escape key to close modals
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        if (showPasswordModal) {
          setShowPasswordModal(false);
          setSelectedUser(null);
          setNewPassword('');
        }
        if (showAddUserModal) {
          setShowAddUserModal(false);
          resetAddUserForm();
        }
        if (confirmDialog.show) {
          setConfirmDialog({ show: false, message: '', onConfirm: null, title: '' });
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [showPasswordModal, showAddUserModal, confirmDialog.show]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const showConfirmDialog = (title, message, onConfirm) => {
    setConfirmDialog({ show: true, title, message, onConfirm });
  };

  const handleConfirm = () => {
    if (confirmDialog.onConfirm) {
      confirmDialog.onConfirm();
    }
    setConfirmDialog({ show: false, message: '', onConfirm: null, title: '' });
  };

  const handleCancel = () => {
    setConfirmDialog({ show: false, message: '', onConfirm: null, title: '' });
  };

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
      showToast('Failed to fetch user logs: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await getAllUsers();
      if (response && response.users && Array.isArray(response.users)) {
        setUsers(response.users);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      showToast('Failed to fetch users: ' + error.message, 'error');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleChangeUserStatus = async (userId, newStatus) => {
    const action = newStatus === 'active' ? 'activate' : 'deactivate';
    showConfirmDialog(
      `Confirm ${action}`,
      `Are you sure you want to ${action} this user?`,
      async () => {
        try {
          await changeUserStatus(userId, newStatus);
          showToast(`User ${action}d successfully!`, 'success');
          fetchUsers(); // Refresh users list
        } catch (error) {
          showToast('Failed to update user status: ' + error.message, 'error');
        }
      }
    );
  };

  const handleChangePassword = async (userId) => {
    setSelectedUser(userId);
    setNewPassword('');
    setShowPassword(false);
    setShowPasswordModal(true);
  };

  const handleConfirmPasswordChange = async () => {
    if (!newPassword) {
      showToast('New password cannot be empty!', 'error');
      return;
    }
    showConfirmDialog(
      'Confirm Password Change',
      'Are you sure you want to change this user\'s password?',
      async () => {
        try {
          await changePassword(selectedUser, newPassword);
          showToast('Password changed successfully!', 'success');
          setShowPasswordModal(false);
          setSelectedUser(null);
          setNewPassword('');
        } catch (error) {
          showToast('Failed to change password: ' + error.message, 'error');
        }
      }
    );
  };

  // Add User Form Handlers
  const handleAddUserInputChange = (e) => {
    const { name, value } = e.target;
    setAddUserForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddUserSubmit = async (e) => {
    e.preventDefault();
    
    if (!addUserForm.username || !addUserForm.password || !addUserForm.first_name || !addUserForm.last_name || !addUserForm.type) {
      showToast('All fields are required!', 'error');
      return;
    }

    setAddUserLoading(true);
    try {
      await addUser(addUserForm);
      showToast('User created successfully!', 'success');
      setShowAddUserModal(false);
      setAddUserForm({
        username: '',
        password: '',
        first_name: '',
        last_name: '',
        type: 'employee'
      });
      fetchUsers(); // Refresh users list
    } catch (error) {
      showToast('Failed to create user: ' + error.message, 'error');
    } finally {
      setAddUserLoading(false);
    }
  };

  const resetAddUserForm = () => {
    setAddUserForm({
      username: '',
      password: '',
      first_name: '',
      last_name: '',
      type: 'employee'
    });
    setShowAddUserPassword(false);
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
                <h1 className="text-2xl font-bold text-white">Account Management</h1>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-8 custom-scrollbar scroll-smooth">
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
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-400">
                  Showing {currentLogs.length} of {filteredLogs.length} logs
                  {searchTerm && ` (filtered from ${userLogs.length} total)`}
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
            
            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="text-gray-400 mt-4">Loading user logs...</p>
              </div>
            ) : currentLogs.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700 text-sm">
                    <thead className="bg-gray-700/50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                          Login Time
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                      {currentLogs.map((log, index) => (
                        <tr key={index} className="hover:bg-gray-700/30 transition-colors duration-200">
                          <td className="px-3 py-2 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-2">
                                <span className="text-[10px] font-bold text-white">
                                  {(log.user_name || 'U').charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="text-xs font-medium text-white">
                                {log.user_name || 'Unknown User'}
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              log.user_type === 'admin' 
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow' 
                                : log.user_type === 'employee'
                                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow' 
                                : 'bg-gray-500 text-gray-100'
                            }`}>
                              {log.user_type || 'User'}
                            </span>
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-300">
                            <div className="flex flex-col leading-tight">
                              <span className="text-white font-medium">
                                {log.created_at ? new Date(log.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                }) : 'N/A'}
                              </span>
                              <span className="text-[10px] text-gray-400">
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

          {/* All Users Section */}
          <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-8 mt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Manage Users</h2>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add User
                </button>
                <button
                  onClick={fetchUsers}
                  disabled={usersLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {usersLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>
            {usersLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <p className="text-gray-400 mt-4">Loading users...</p>
              </div>
            ) : users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700 text-sm">
                  <thead className="bg-gray-700/50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Username
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800/50 divide-y divide-gray-700">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-700/30 transition-colors duration-200">
                                                 <td className="px-3 py-2 whitespace-nowrap">
                           <div className="flex items-center">
                             <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mr-2">
                               <span className="text-[10px] font-bold text-white">
                                 {(user.first_name || 'U').charAt(0).toUpperCase()}
                               </span>
                             </div>
                             <div className="text-xs font-medium text-white">
                               {user.first_name} {user.last_name}
                             </div>
                           </div>
                         </td>
                         <td className="px-3 py-2 whitespace-nowrap">
                           <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                             user.type === 'admin' 
                               ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow' 
                               : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow'
                           }`}>
                             {user.type}
                           </span>
                         </td>
                         <td className="px-3 py-2 whitespace-nowrap">
                           <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                             user.status === 'active' 
                               ? 'bg-green-500 text-white shadow' 
                               : 'bg-red-500 text-white shadow'
                           }`}>
                             {user.status || 'active'}
                           </span>
                         </td>
                                                 <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-300">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleChangeUserStatus(user.id, user.status === 'active' ? 'inactive' : 'active')}
                              className={`inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 min-w-[100px] ${
                                user.status === 'active' 
                                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg' 
                                  : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
                              }`}
                              title={user.status === 'active' ? 'Deactivate User' : 'Activate User'}
                            >
                              {user.status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleChangePassword(user.id)}
                              className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 shadow-md hover:shadow-lg min-w-[100px]"
                              title="Change Password"
                            >
                              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-2.348-.054-4.597-.75-6.396-2.247A6 6 0 016.75 7.5c0-1.152.27-2.25.76-3.188A3 3 0 017.5 3m3 0H21" />
                              </svg>
                              Change
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No users found. Add new users from the authentication service.</p>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-600 rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl animate-slideUp">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-2.348-.054-4.597-.75-6.396-2.247A6 6 0 016.75 7.5c0-1.152.27-2.25.76-3.188A3 3 0 017.5 3m3 0H21" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Change Password</h3>
              <p className="text-gray-400">
                for {users.find(u => u.id === selectedUser) ? `${users.find(u => u.id === selectedUser).first_name} ${users.find(u => u.id === selectedUser).last_name}` : 'User'}
              </p>
            </div>

            {/* Password Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-3">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-4 py-3 pr-12 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300 transition-colors duration-200"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-600 rounded-xl hover:bg-gray-700 hover:border-gray-500 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPasswordChange}
                disabled={!newPassword.trim()}
                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
              >
                Change Password
              </button>
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-600 rounded-2xl p-8 w-full max-w-lg mx-4 shadow-2xl animate-slideUp">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Add New User</h3>
              <p className="text-gray-400">Create a new user account</p>
            </div>

            {/* Form */}
            <form onSubmit={handleAddUserSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                  <input
                    type="text"
                    name="first_name"
                    value={addUserForm.first_name}
                    onChange={handleAddUserInputChange}
                    placeholder="Enter first name"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
                  <input
                    type="text"
                    name="last_name"
                    value={addUserForm.last_name}
                    onChange={handleAddUserInputChange}
                    placeholder="Enter last name"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                <input
                  type="text"
                  name="username"
                  value={addUserForm.username}
                  onChange={handleAddUserInputChange}
                  placeholder="Enter username"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showAddUserPassword ? "text" : "password"}
                    name="password"
                    value={addUserForm.password}
                    onChange={handleAddUserInputChange}
                    placeholder="Enter password"
                    className="w-full px-4 py-3 pr-12 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAddUserPassword(!showAddUserPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300 transition-colors duration-200"
                    title={showAddUserPassword ? "Hide password" : "Show password"}
                  >
                    {showAddUserPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">User Type</label>
                <select
                  name="type"
                  value={addUserForm.type}
                  onChange={handleAddUserInputChange}
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  required
                >
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddUserModal(false);
                    resetAddUserForm();
                  }}
                  className="flex-1 px-4 py-3 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-600 rounded-xl hover:bg-gray-700 hover:border-gray-500 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addUserLoading}
                  className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:from-gray-600 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-200 shadow-lg flex items-center justify-center"
                >
                  {addUserLoading ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create User'
                  )}
                </button>
              </div>
            </form>

            {/* Close button */}
            <button
              onClick={() => {
                setShowAddUserModal(false);
                resetAddUserForm();
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmDialog.show && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-600 rounded-2xl p-8 w-full max-w-md mx-4 shadow-2xl animate-slideUp">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-.667-1.732-.001-1.732 1.586v11.134c0 1.586-.962 2.252-1.732 1.585L6.732 16.414c-.77-.666-.77-1.332 0-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{confirmDialog.title}</h3>
              <p className="text-gray-400">{confirmDialog.message}</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-3 text-sm font-medium text-gray-300 bg-gray-800 border border-gray-600 rounded-xl hover:bg-gray-700 hover:border-gray-500 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 px-4 py-3 text-sm font-medium text-white bg-red-600 rounded-xl hover:bg-red-700 transition-all duration-200"
              >
                Confirm
              </button>
            </div>
            <button
              onClick={handleCancel}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full mx-4 animate-slideUp`}>
          <div className={`rounded-xl shadow-2xl border-l-4 ${
            toast.type === 'success' 
              ? 'bg-green-500 border-green-400 text-white' 
              : 'bg-red-500 border-red-400 text-white'
          }`}>
            <div className="flex items-center p-4">
              <div className="flex-shrink-0">
                {toast.type === 'success' ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{toast.message}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setToast({ show: false, message: '', type: 'success' })}
                  className="inline-flex text-white hover:text-gray-100 focus:outline-none focus:text-gray-100 transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountManagement;
