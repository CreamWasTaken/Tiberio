import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';

function AdminDashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Set user role when component mounts
  useEffect(() => {
    localStorage.setItem('userRole', 'admin');
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    navigate('/');
  };

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
                <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* User Management Card */}
            <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white">User Management</h3>
              </div>
              <p className="text-gray-300 mb-4">Manage users, roles, and permissions</p>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200">
                Manage Users
              </button>
            </div>



            {/* Reports Card */}
            <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white">Reports</h3>
              </div>
              <p className="text-gray-300 mb-4">View analytics and generate reports</p>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200">
                View Reports
              </button>
            </div>

            {/* System Settings Card */}
            <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white">System Settings</h3>
              </div>
              <p className="text-gray-300 mb-4">Configure system preferences</p>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200">
                Settings
              </button>
            </div>
          </div>

          {/* Welcome Message */}
          <div className="mt-8 bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-8">
            <h2 className="text-3xl font-bold text-white mb-4">Welcome, Administrator!</h2>
            <p className="text-gray-300 text-lg">
              You have full access to manage the Tiberio Eye Clinic system. Use the dashboard above to navigate through different administrative functions.
            </p>
          </div>


        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
