import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, redirectTo = '/login' }) => {
  const { currentUser, isLoading } = useAuth()
  const location = useLocation()

  // Show loading while checking authentication status
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    )
  }

  // If user is not authenticated, redirect to login with return URL
  if (!currentUser) {
    return (
      <Navigate 
        to={redirectTo} 
        state={{ 
          returnTo: location.pathname,
          fromProtectedRoute: true 
        }} 
        replace 
      />
    )
  }

  // User is authenticated, render the protected component
  return children
}

export default ProtectedRoute