import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem('authToken');
  
  if (!token) {
    return <Navigate to="/" replace />;
  }

  // If a specific role is required, you could decode the JWT here to check the role
  // For now, we'll just check if the token exists
  return children;
}

export default ProtectedRoute;
