import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from '../../components/Sidebar';

function Patients() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Get user role from localStorage
  const userRole = localStorage.getItem('userRole') || 'employee';

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  // Mock patient data for demonstration
  const mockPatients = [
    { id: 1, name: 'John Doe', age: 45, phone: '+1-555-0123', lastVisit: '2024-01-15', status: 'Active' },
    { id: 2, name: 'Jane Smith', age: 32, phone: '+1-555-0124', lastVisit: '2024-01-10', status: 'Active' },
    { id: 3, name: 'Mike Johnson', age: 58, phone: '+1-555-0125', lastVisit: '2024-01-08', status: 'Inactive' },
    { id: 4, name: 'Sarah Wilson', age: 29, phone: '+1-555-0126', lastVisit: '2024-01-12', status: 'Active' },
  ];

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen(!sidebarOpen)} 
        userType={userRole}
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
                <h1 className="text-2xl font-bold text-white">
                  {userRole === 'admin' ? 'Patient Management' : 'Patient Records'}
                </h1>
              </div>
              {userRole === 'admin' && (
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200">
                  Add New Patient
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-8">
          {/* Search and Filters */}
          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search patients..."
                className="w-full px-4 py-2 bg-gray-800/80 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <select className="px-4 py-2 bg-gray-800/80 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Patients Table */}
          <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Age</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Last Visit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {mockPatients.map((patient) => (
                    <tr key={patient.id} className="hover:bg-gray-700/30 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white font-semibold text-sm">
                              {patient.name.split(' ').map(n => n[0]).join('')}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{patient.name}</div>
                            <div className="text-sm text-gray-400">ID: {patient.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{patient.age}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{patient.phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{patient.lastVisit}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          patient.status === 'Active' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {patient.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {userRole === 'admin' ? (
                          <>
                            <button className="text-blue-400 hover:text-blue-300 mr-3">Edit</button>
                            <button className="text-red-400 hover:text-red-300">Delete</button>
                          </>
                        ) : (
                          <button className="text-blue-400 hover:text-blue-300">View Details</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Patients</p>
                  <p className="text-2xl font-bold text-white">{mockPatients.length}</p>
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
                  <p className="text-sm text-gray-400">Active Patients</p>
                  <p className="text-2xl font-bold text-white">{mockPatients.filter(p => p.status === 'Active').length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-800/80 backdrop-blur-xl border border-gray-700 rounded-xl p-4">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-400">This Month</p>
                  <p className="text-2xl font-bold text-white">12</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Patients;
