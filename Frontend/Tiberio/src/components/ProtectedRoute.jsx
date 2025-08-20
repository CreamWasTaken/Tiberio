import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Get user role from localStorage (you can decode JWT here later)
  const userRole = localStorage.getItem('userRole') || 'employee';
  
  // Check if user has required role
  if (requiredRole) {
    if (Array.isArray(requiredRole)) {
      // Multiple roles allowed
      if (!requiredRole.includes(userRole)) {
        return <Navigate to="/" replace />;
      }
    } else {
      // Single role required
      if (userRole !== requiredRole) {
        return <Navigate to="/" replace />;
      }
    }
  }

  return children;
}

export default ProtectedRoute;
