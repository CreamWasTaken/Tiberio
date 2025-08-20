import { useNavigate } from 'react-router-dom';

function EmployeeDashboard() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="bg-gray-800/80 backdrop-blur-xl border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <img 
                src="/TiberioLogo.jpg" 
                alt="Tiberio Eye Clinic Logo" 
                className="w-12 h-12 rounded-full mr-4"
              />
              <h1 className="text-2xl font-bold text-white">Employee Dashboard</h1>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Patient Records Card */}
          <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">Patient Records</h3>
            </div>
            <p className="text-gray-300 mb-4">Access and manage patient information</p>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors duration-200">
              View Records
            </button>
          </div>

          {/* Appointments Card */}
          <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">Appointments</h3>
            </div>
            <p className="text-gray-300 mb-4">Schedule and manage appointments</p>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors duration-200">
              Manage Appointments
            </button>
          </div>

          {/* Inventory Card */}
          <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white">Inventory</h3>
            </div>
            <p className="text-gray-300 mb-4">Check and update inventory levels</p>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors duration-200">
              Check Inventory
            </button>
          </div>
        </div>

        {/* Welcome Message */}
        <div className="mt-8 bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-8">
          <h2 className="text-3xl font-bold text-white mb-4">Welcome, Employee!</h2>
          <p className="text-gray-300 text-lg">
            You have access to patient records, appointments, and inventory management. Use the dashboard above to navigate through your daily tasks.
          </p>
        </div>
      </main>
    </div>
  );
}

export default EmployeeDashboard;
