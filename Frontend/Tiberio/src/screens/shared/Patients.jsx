import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getPatients as fetchPatientsApi, addPatient as addPatientApi } from '../../services/patient';
import Sidebar from '../../components/Sidebar';

function Patients() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get user role from localStorage
  const userRole = localStorage.getItem('userRole') || 'employee';

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    navigate('/');
  };

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await fetchPatientsApi();
        setPatients(data || []);
      } catch (err) {
        setError(err.message || 'Failed to load patients');
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const totalPatients = patients.length;
  const activePatients = patients.length; // No status field from API yet; count all

  const getYearMonthInTz = (dateLike, timeZone) => {
    if (!dateLike) return { year: '0000', month: '00' };
    const date = typeof dateLike === 'string' ? new Date(dateLike) : dateLike;
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit'
    }).formatToParts(date);
    return {
      year: parts.find(p => p.type === 'year')?.value || '0000',
      month: parts.find(p => p.type === 'month')?.value || '00'
    };
  };

  const { year: currentYearPH, month: currentMonthPH } = getYearMonthInTz(new Date(), 'Asia/Manila');
  const thisMonthCount = patients.filter((p) => {
    const { year, month } = getYearMonthInTz(p.created_at, 'Asia/Manila');
    return year === currentYearPH && month === currentMonthPH;
  }).length;

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [form, setForm] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    sex: '',
    birthdate: '',
    address: '',
    contact_number: '',
    telephone_number: '',
    senior_number: ''
  });

  const formatDateYMD = (value) => {
    if (!value) return '—';
    if (typeof value === 'string') {
      // If value is ISO-like (contains 'T'), format in Asia/Manila
      if (value.includes('T')) {
        const date = new Date(value);
        const parts = new Intl.DateTimeFormat('en-US', {
          timeZone: 'Asia/Manila',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).formatToParts(date);
        const y = parts.find(p => p.type === 'year')?.value || '0000';
        const m = parts.find(p => p.type === 'month')?.value || '01';
        const d = parts.find(p => p.type === 'day')?.value || '01';
        return `${y}-${m}-${d}`;
      }
      // Already date-only string (YYYY-MM-DD)
      return value.slice(0, 10);
    }
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Manila',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).formatToParts(value);
      const y = parts.find(p => p.type === 'year')?.value || '0000';
      const m = parts.find(p => p.type === 'month')?.value || '01';
      const d = parts.find(p => p.type === 'day')?.value || '01';
      return `${y}-${m}-${d}`;
    } catch {
      return '—';
    }
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
                <h1 className="text-2xl font-bold text-white">
                  {userRole === 'admin' ? 'Patient Management' : 'Patient Records'}
                </h1>
              </div>
              {userRole === 'admin' && (
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200" onClick={() => { setForm({ first_name: '', middle_name: '', last_name: '', sex: '', birthdate: '', address: '', contact_number: '', telephone_number: '', senior_number: '' }); setFormError(null); setIsAddOpen(true); }}>
                  Add New Patient
                </button>
              )}
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
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Total Patients</p>
                  <p className="text-2xl font-bold text-white">{totalPatients}</p>
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
                  <p className="text-2xl font-bold text-white">{activePatients}</p>
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
                  <p className="text-2xl font-bold text-white">{thisMonthCount}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters (moved below summary) */}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Birthdate</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {loading && (
                    <tr>
                      <td className="px-6 py-4 text-sm text-gray-400" colSpan="5">Loading patients...</td>
                    </tr>
                  )}
                  {error && !loading && (
                    <tr>
                      <td className="px-6 py-4 text-sm text-red-400" colSpan="5">{error}</td>
                    </tr>
                  )}
                  {!loading && !error && patients.map((patient) => {
                    const displayName = `${patient.first_name || ''} ${patient.last_name || ''}`.trim() || `Patient ${patient.id}`;
                    const initials = `${(patient.first_name?.[0] || '')}${(patient.last_name?.[0] || '')}`.toUpperCase() || 'P';
                    const phone = patient.contact_number || patient.telephone_number || '—';
                    const birthdate = formatDateYMD(patient.birthdate);
                    return (
                    <tr key={patient.id} className="hover:bg-gray-700/30 transition-colors duration-200">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                            <span className="text-white font-semibold text-sm">
                              {initials}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-white">{displayName}</div>
                            <div className="text-sm text-gray-400">ID: {patient.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{patient.age ?? '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{phone}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{birthdate}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          className="text-blue-400 hover:text-blue-300"
                          onClick={() => { setSelectedPatient({ ...patient, displayName, phone, birthdate, status: patient.status || 'Active' }); setIsProfileOpen(true); }}
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  );})}
                </tbody>
              </table>
            </div>
          </div>

          {/* Profile Modal */}
          {isProfileOpen && selectedPatient && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60" onClick={() => setIsProfileOpen(false)}></div>
              <div className="relative w-full max-w-2xl mx-4 shadow-2xl">
                <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-t-xl border border-gray-700 p-6 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-16 h-16 bg-blue-500/30 ring-2 ring-white/20 rounded-full flex items-center justify-center mr-4">
                      <span className="text-white font-bold text-lg">
                        {(selectedPatient.displayName || '').split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-2xl font-semibold text-white leading-tight">{selectedPatient.displayName || `${selectedPatient.first_name || ''} ${selectedPatient.last_name || ''}`.trim()}</h2>
                      <p className="text-blue-100/90 text-sm">ID: {selectedPatient.id}</p>
                    </div>
                  </div>
                  <button
                    className="text-blue-100 hover:text-white"
                    onClick={() => setIsProfileOpen(false)}
                    aria-label="Close profile"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="bg-gray-800 border-x border-b border-gray-700 rounded-b-xl p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                    <div className="flex-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4">
                          <p className="text-gray-400 text-xs uppercase tracking-wider">Status</p>
                          <div className="mt-1">
                            <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${(selectedPatient.status || 'Active') === 'Active' ? 'bg-green-500/10 text-green-300 ring-1 ring-green-600/30' : 'bg-red-500/10 text-red-300 ring-1 ring-red-600/30'}`}>
                              {selectedPatient.status || 'Active'}
                            </span>
                          </div>
                        </div>
                        <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4">
                          <p className="text-gray-400 text-xs uppercase tracking-wider">Birthdate</p>
                          <p className="text-white mt-1">{selectedPatient.birthdate || selectedPatient.birthdate === '' ? selectedPatient.birthdate : '—'}</p>
                        </div>
                        <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4">
                          <p className="text-gray-400 text-xs uppercase tracking-wider">Age</p>
                          <p className="text-white mt-1">{selectedPatient.age ?? '—'}</p>
                        </div>
                        <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4">
                          <p className="text-gray-400 text-xs uppercase tracking-wider">Phone</p>
                          <p className="text-white mt-1">{selectedPatient.phone || '—'}</p>
                        </div>
                        <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4 sm:col-span-2">
                          <p className="text-gray-400 text-xs uppercase tracking-wider">Address</p>
                          <p className="text-white mt-1">{selectedPatient.address || '—'}</p>
                        </div>
                        <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4">
                          <p className="text-gray-400 text-xs uppercase tracking-wider">Senior Number</p>
                          <p className="text-white mt-1">{selectedPatient.senior_number || '—'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end">
                    <button
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Patient Modal */}
          {isAddOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-black/60" onClick={() => setIsAddOpen(false)}></div>
              <div className="relative w-full max-w-2xl mx-4 shadow-2xl">
                <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-t-xl border border-gray-700 p-6 flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-white">Add New Patient</h2>
                  <button className="text-blue-100 hover:text-white" onClick={() => setIsAddOpen(false)} aria-label="Close add form">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="bg-gray-800 border-x border-b border-gray-700 rounded-b-xl p-6">
                  {formError && (
                    <div className="mb-4 text-sm text-red-400">{formError}</div>
                  )}
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setFormError(null);
                      setIsSubmitting(true);
                      try {
                        const payload = {
                          ...form,
                          // Send date as YYYY-MM-DD string to avoid timezone shifts
                          birthdate: form.birthdate || ''
                        };
                        await addPatientApi(payload);
                        // refresh list
                        const data = await fetchPatientsApi();
                        setPatients(data || []);
                        setIsAddOpen(false);
                      } catch (err) {
                        setFormError(err.message || 'Failed to add patient');
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  >
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">First Name</label>
                      <input className="w-full px-3 py-2 bg-gray-800/80 border border-gray-700 rounded-lg text-white"
                        value={form.first_name}
                        onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Middle Name</label>
                      <input className="w-full px-3 py-2 bg-gray-800/80 border border-gray-700 rounded-lg text-white"
                        value={form.middle_name}
                        onChange={(e) => setForm({ ...form, middle_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Last Name</label>
                      <input className="w-full px-3 py-2 bg-gray-800/80 border border-gray-700 rounded-lg text-white"
                        value={form.last_name}
                        onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Sex</label>
                      <select className="w-full px-3 py-2 bg-gray-800/80 border border-gray-700 rounded-lg text-white"
                        value={form.sex}
                        onChange={(e) => setForm({ ...form, sex: e.target.value })}
                        required
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Birthdate</label>
                      <input type="date" className="w-full px-3 py-2 bg-gray-800/80 border border-gray-700 rounded-lg text-white"
                        value={form.birthdate}
                        onChange={(e) => setForm({ ...form, birthdate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm text-gray-300 mb-1">Address</label>
                      <input className="w-full px-3 py-2 bg-gray-800/80 border border-gray-700 rounded-lg text-white"
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Contact Number</label>
                      <input className="w-full px-3 py-2 bg-gray-800/80 border border-gray-700 rounded-lg text-white"
                        value={form.contact_number}
                        onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Telephone Number</label>
                      <input className="w-full px-3 py-2 bg-gray-800/80 border border-gray-700 rounded-lg text-white"
                        value={form.telephone_number}
                        onChange={(e) => setForm({ ...form, telephone_number: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Senior Number</label>
                      <input className="w-full px-3 py-2 bg-gray-800/80 border border-gray-700 rounded-lg text-white"
                        value={form.senior_number}
                        onChange={(e) => setForm({ ...form, senior_number: e.target.value })}
                      />
                    </div>
                    <div className="sm:col-span-2 flex justify-end gap-3 mt-2">
                      <button type="button" className="px-4 py-2 bg-gray-700 text-white rounded-lg" onClick={() => setIsAddOpen(false)} disabled={isSubmitting}>Cancel</button>
                      <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save'}</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default Patients;
