import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './screens/auth'
import { AdminDashboard, AccountManagement } from './screens/admin'
import { EmployeeDashboard } from './screens/employee'
import { Patients } from './screens/shared/Patients'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/account" element={
          <ProtectedRoute requiredRole="admin">
            <AccountManagement />
          </ProtectedRoute>
        } />
        <Route path="/employee" element={
          <ProtectedRoute requiredRole="employee">
            <EmployeeDashboard />
          </ProtectedRoute>
        } />
        <Route path="/patients" element={
          <ProtectedRoute requiredRole={['admin', 'employee']}>
            <Patients />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
