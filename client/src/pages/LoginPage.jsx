import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, currentUser } = useAuth()
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  })
  
  const [validationErrors, setValidationErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)

  // Extract state from navigation
  const { returnTo, bookingIntent, message } = location.state || {}

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser) {
      handlePostLoginRedirect()
    }
  }, [currentUser, navigate, location])

  // Handle post-login redirect with booking intent
  const handlePostLoginRedirect = () => {
    console.log('🔄 Handling post-login redirect', { returnTo, bookingIntent })

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
              pricePerNight: bookingIntent.room.pricePerNight,
              ...bookingIntent.searchCriteria
            }
          }
        })
      }
    } else if (returnTo) {
      console.log('🔄 Redirecting to return URL:', returnTo)
      navigate(returnTo, { replace: true })
    } else {
      console.log('🔄 Default redirect to dashboard')
      const from = location.state?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    }
  }

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (!formData.password.trim()) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }

    return errors
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    setIsLoading(true)
    setValidationErrors({})

    try {
      await login(formData.email, formData.password, formData.rememberMe)
      
      // Redirect will be handled by useEffect when currentUser updates
    } catch (error) {
      console.error('Login error:', error)
      setValidationErrors({
        submit: 'Invalid email or password. Please try again.'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e) => {
    e.preventDefault()
    
    if (!formData.email.trim()) {
      setValidationErrors({ email: 'Please enter your email address' })
      return
    }

    if (!validateEmail(formData.email)) {
      setValidationErrors({ email: 'Please enter a valid email address' })
      return
    }

    setIsLoading(true)
    try {
      // Simulate password reset email
      await new Promise(resolve => setTimeout(resolve, 1500))
      setShowForgotPassword(true)
      setValidationErrors({})
    } catch (error) {
      setValidationErrors({ submit: 'Failed to send password reset email. Please try again.' })
    } finally {
      setIsLoading(false)
    }
  }

  if (currentUser) {
    return null // Will redirect via useEffect
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          {/* Hotel Logo */}
          <div className="auth-header">
            <div className="hotel-logo">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 21h18"/>
                <path d="M5 21V7l8-4v18"/>
                <path d="M19 21V11l-6-4"/>
                <circle cx="9" cy="12" r="1"/>
                <circle cx="15" cy="12" r="1"/>
              </svg>
            </div>
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to your account to continue</p>
          </div>

          {/* Booking Intent Message */}
          {message && (
            <div className="alert alert-info">
              {message}
            </div>
          )}

          {/* Success Message */}
          {showForgotPassword && (
            <div className="alert alert-success">
              Password reset instructions have been sent to your email address.
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Email Field */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">Email Address</label>
              <div className="input-container">
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`form-input ${validationErrors.email ? 'error' : ''}`}
                  placeholder="Enter your email"
                  disabled={isLoading}
                  autoComplete="email"
                />
                <div className="input-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
              </div>
              {validationErrors.email && (
                <div className="form-error">{validationErrors.email}</div>
              )}
            </div>

            {/* Password Field */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <div className="input-container">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className={`form-input ${validationErrors.password ? 'error' : ''}`}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                      <line x1="1" y1="1" x2="23" y2="23"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
              {validationErrors.password && (
                <div className="form-error">{validationErrors.password}</div>
              )}
            </div>

            {/* Form Options */}
            <div className="form-options">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                <span className="checkmark"></span>
                Remember me
              </label>

              <button
                type="button"
                className="forgot-password-link"
                onClick={handleForgotPassword}
                disabled={isLoading}
              >
                Forgot password?
              </button>
            </div>

            {/* Submit Error */}
            {validationErrors.submit && (
              <div className="form-error submit-error">{validationErrors.submit}</div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  Signing In...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage