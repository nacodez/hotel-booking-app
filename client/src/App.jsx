import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
// import { HelmetProvider } from 'react-helmet-async'
// import { ErrorBoundary } from './components/ErrorBoundary'
import NavigationHeader from './components/NavigationHeader'
import ProtectedRoute from './components/ProtectedRoute'
import HomePage from './pages/HomePage'
import SearchResultsPage from './pages/SearchResultsPage'
import RoomDetailsPage from './pages/RoomDetailsPage'
import BookingConfirmationPage from './pages/BookingConfirmationPage'
import FinalConfirmationPage from './pages/FinalConfirmationPage'
import UserDashboard from './pages/UserDashboard'
import AuthPage from './pages/AuthPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
// import NotFoundPage from './pages/NotFoundPage'
// import SEOHead from './components/SEOHead'
import './styles/App.css'
import './styles/error-pages.css'
import './styles/loading.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="hotel-booking-app">
          <NavigationHeader />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/search" element={<SearchResultsPage />} />
              <Route path="/room/:roomId" element={<RoomDetailsPage />} />
              <Route 
                path="/booking/confirmation" 
                element={
                  <ProtectedRoute>
                    <BookingConfirmationPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/booking/final-confirmation" 
                element={
                  <ProtectedRoute>
                    <FinalConfirmationPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <UserDashboard />
                  </ProtectedRoute>
                } 
              />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App