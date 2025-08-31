import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './screens/auth'
import { AdminDashboard, AccountManagement, InventoryManagement } from './screens/admin'
import { EmployeeDashboard } from './screens/employee'
import { Patients } from './screens/shared/Patients'
import { Pricelist } from './screens/shared/PriceList'
import { Inventory } from './screens/shared/Inventory'
import { Orders } from './screens/shared/Orders'
import { Transactions } from './screens/shared/Transanctions'
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
        <Route path="/admin/inventory-management" element={
          <ProtectedRoute requiredRole="admin">
            <InventoryManagement />
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
        <Route path="/prices" element={
          <ProtectedRoute requiredRole={['admin', 'employee']}>
            <Pricelist />
          </ProtectedRoute>
        } />
        <Route path="/inventory" element={
          <ProtectedRoute requiredRole={['admin', 'employee']}>
            <Inventory />
          </ProtectedRoute>
        } />
        <Route path="/orders" element={
          <ProtectedRoute requiredRole={['admin', 'employee']}>
            <Orders />
          </ProtectedRoute>
        } />
        <Route path="/transactions" element={
          <ProtectedRoute requiredRole={['admin', 'employee']}>
            <Transactions />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

export default App
