import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const AuthPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register } = useAuth()
  const [isLoginMode, setIsLoginMode] = useState(true)
  const [authCredentials, setAuthCredentials] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [isProcessingAuth, setIsProcessingAuth] = useState(false)
  const [authError, setAuthError] = useState('')

  // Extract state from navigation
  const { returnTo, bookingIntent, message } = location.state || {}

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setAuthCredentials(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAuthSubmit = async (e) => {
    e.preventDefault()
    setAuthError('')

    if (!isLoginMode && authCredentials.password !== authCredentials.confirmPassword) {
      setAuthError('Passwords do not match')
      return
    }

    try {
      setIsProcessingAuth(true)
      
      if (isLoginMode) {
        console.log('🔐 Using backend login API...')
        await login(authCredentials.email, authCredentials.password)
        console.log('🔐 Backend login successful!')
      } else {
        console.log('🔐 Using backend register API...')
        await register({
          email: authCredentials.email,
          password: authCredentials.password,
          firstName: 'User', // You might want to add these fields to the form
          lastName: 'Name',
          role: 'user'
        })
        console.log('🔐 Backend registration successful!')
      }
      
      // Handle post-auth redirect with booking intent
      handlePostAuthRedirect()
    } catch (error) {
      console.error('🔐 Auth error:', error)
      setAuthError(error.message)
    } finally {
      setIsProcessingAuth(false)
    }
  }

  // Handle post-authentication redirect with booking intent
  const handlePostAuthRedirect = () => {
    console.log('🔄 Handling post-auth redirect', { returnTo, bookingIntent })

    if (returnTo && bookingIntent) {
      // Reconstruct booking flow based on booking intent
      if (bookingIntent.isBrowsingMode) {
        console.log('🔄 Redirecting to home for date selection')
        navigate('/?selectDates=true', {
          state: {
            selectedRoom: {
              id: bookingIntent.room.id,
              title: bookingIntent.room.title,
              price: bookingIntent.room.price
            }
          }
        })
      } else {
        console.log('🔄 Redirecting to booking confirmation')
        navigate('/booking/confirmation', {
          state: {
            bookingDetails: {
              roomId: bookingIntent.room.id,
              roomName: bookingIntent.room.title,
              roomImage: bookingIntent.room.image,
              pricePerNight: bookingIntent.room.pricePerNight,
              ...bookingIntent.searchCriteria
            }
          }
        })
      }
    } else if (returnTo) {
      console.log('🔄 Redirecting to return URL:', returnTo)
      navigate(returnTo)
    } else {
      console.log('🔄 Default redirect to dashboard')
      navigate('/dashboard')
    }
  }

  const toggleAuthMode = () => {
    setIsLoginMode(!isLoginMode)
    setAuthCredentials({
      email: '',
      password: '',
      confirmPassword: ''
    })
    setAuthError('')
  }

  return (
    <div className="container">
      <div className="auth-container">
        <div className="auth-form card">
          <h1>{isLoginMode ? 'Sign In' : 'Create Account'}</h1>
          
          {message && (
            <div className="alert alert-info">
              {message}
            </div>
          )}
          
          {authError && (
            <div className="alert alert-error">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuthSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                name="email"
                value={authCredentials.email}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                value={authCredentials.password}
                onChange={handleInputChange}
                className="form-input"
                required
              />
            </div>

            {!isLoginMode && (
              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={authCredentials.confirmPassword}
                  onChange={handleInputChange}
                  className="form-input"
                  required
                />
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isProcessingAuth}
            >
              {isProcessingAuth ? 'Processing...' : (isLoginMode ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="auth-toggle">
            <p>
              {isLoginMode ? "Don't have an account? " : "Already have an account? "}
              <button 
                type="button"
                onClick={toggleAuthMode}
                className="btn btn-secondary btn-sm"
              >
                {isLoginMode ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthPage