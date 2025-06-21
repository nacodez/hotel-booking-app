import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { bookingAPI } from '../services/apiService'

const FinalConfirmationPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(true)
  const [confirmationNumber, setConfirmationNumber] = useState('')
  const [copySuccess, setCopySuccess] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [emailSending, setEmailSending] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailAddress, setEmailAddress] = useState('')
  const [emailValidationError, setEmailValidationError] = useState('')

  const bookingDetails = location.state?.bookingDetails
  const contactInfo = location.state?.contactInfo

  // Debug logging to check room image data
  useEffect(() => {
    console.log('🖼️ FinalConfirmationPage - Full location.state:', location.state)
    console.log('🖼️ FinalConfirmationPage - bookingDetails:', bookingDetails)
    console.log('🖼️ FinalConfirmationPage - roomImage:', bookingDetails?.roomImage)
  }, [])

  useEffect(() => {
    // Use confirmation number from backend or generate fallback
    const backendConfirmationNumber = location.state?.confirmationNumber
    if (backendConfirmationNumber) {
      setConfirmationNumber(backendConfirmationNumber)
    } else {
      // Fallback: Generate confirmation number if not provided
      const generateConfirmationNumber = () => {
        const timestamp = Date.now().toString().slice(-10)
        return `BK2025${timestamp}`
      }
      setConfirmationNumber(generateConfirmationNumber())
    }
    
    // Hide success animation after 2 seconds
    const timer = setTimeout(() => {
      setShowSuccessAnimation(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  // Redirect if no booking data
  if (!bookingDetails || !contactInfo) {
    navigate('/')
    return null
  }

  // Calculate booking totals
  const calculateNights = () => {
    const checkIn = new Date(bookingDetails.checkInDate)
    const checkOut = new Date(bookingDetails.checkOutDate)
    return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
  }

  const calculateTotals = () => {
    const nights = calculateNights()
    const roomRate = nights * bookingDetails.pricePerNight
    const taxAndService = roomRate * 0.09
    const total = roomRate + taxAndService

    return {
      nights,
      roomRate,
      taxAndService,
      total
    }
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 2
    }).format(price).replace('SGD', 'S$')
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString = '15:00') => {
    return timeString
  }

  const handleCopyConfirmation = async () => {
    try {
      await navigator.clipboard.writeText(confirmationNumber)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handlePrintBooking = () => {
    window.print()
  }

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const popularDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'aol.com']
    
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address'
    }
    
    const domain = email.split('@')[1]?.toLowerCase()
    if (!popularDomains.includes(domain)) {
      return 'Please use a popular email provider (Gmail, Yahoo, Outlook, etc.)'
    }
    
    return null
  }

  const handleEmailConfirmation = () => {
    // Show email input modal first
    setEmailAddress(contactInfo.email || '')
    setShowEmailModal(true)
    setEmailValidationError('')
  }

  const handleSendEmail = async () => {
    if (emailSending || isEmailSent) return

    // Validate email
    const validationError = validateEmail(emailAddress)
    if (validationError) {
      setEmailValidationError(validationError)
      return
    }

    setEmailSending(true)
    setEmailError('')
    setShowEmailModal(false)

    try {
      // Get the real booking ID from location state
      const bookingId = location.state?.bookingId
      
      if (!bookingId) {
        throw new Error('Booking ID not found. Please try refreshing the page.')
      }

      console.log('📧 Sending booking confirmation email for booking:', bookingId)
      console.log('📧 Target email address:', emailAddress)
      
      const response = await bookingAPI.sendBookingEmail(bookingId, emailAddress)
      
      if (response.success) {
        setIsEmailSent(true)
        console.log('✅ Email sent successfully to:', response.data?.recipient)
        
        // Show success message for 5 seconds
        setTimeout(() => {
          setIsEmailSent(false)
        }, 5000)
      } else {
        throw new Error(response.message || 'Failed to send email')
      }
    } catch (error) {
      console.error('❌ Failed to send booking confirmation email:', error)
      setEmailError(error.message || 'Failed to send email. Please try again.')
      
      // Clear error after 5 seconds
      setTimeout(() => {
        setEmailError('')
      }, 5000)
    } finally {
      setEmailSending(false)
    }
  }

  const handleReturnHome = () => {
    navigate('/')
  }

  const { nights, roomRate, taxAndService, total } = calculateTotals()

  return (
    <div className="final-confirmation-page">
      {/* Success Animation Overlay */}
      {showSuccessAnimation && (
        <div className="success-animation-overlay">
          <div className="success-animation-content">
            <div className="success-checkmark">
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="var(--color-success)"
                  strokeWidth="4"
                  className="success-circle"
                />
                <path
                  d="M25 50 L40 65 L75 30"
                  fill="none"
                  stroke="var(--color-success)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="success-check"
                />
              </svg>
            </div>
            <h2 className="success-message">Booking Confirmed!</h2>
          </div>
        </div>
      )}

      <div className="container">
        {/* Header Section */}
        <div className="confirmation-header">
          <div className="header-content">
            <h1 className="confirmation-title">YOUR BOOKING HAS BEEN CONFIRMED</h1>
            <p className="confirmation-message">
              Thank you for your booking! A confirmation email has been sent to{' '}
              <strong>{contactInfo.email}</strong>
            </p>
            
            {/* Details Box */}
            <div className="confirmation-details-box">
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Check-in</span>
                  <span className="detail-value">
                    {formatDate(bookingDetails.checkInDate)}
                    <span className="time">from {formatTime('15:00')}</span>
                  </span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Check-out</span>
                  <span className="detail-value">
                    {formatDate(bookingDetails.checkOutDate)}
                    <span className="time">until {formatTime('11:00')}</span>
                  </span>
                </div>
                
                <div className="detail-item">
                  <span className="detail-label">Confirmation Number</span>
                  <div className="confirmation-number-container">
                    <span className="detail-value confirmation-number">{confirmationNumber}</span>
                    <button 
                      className="copy-btn"
                      onClick={handleCopyConfirmation}
                      title="Copy confirmation number"
                    >
                      {copySuccess ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20,6 9,17 4,12"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                        </svg>
                      )}
                    </button>
                    {copySuccess && <span className="copy-success">Copied!</span>}
                  </div>
                </div>
                
                <div className="detail-item total-price">
                  <span className="detail-label">Total Price</span>
                  <span className="detail-value price">{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Details Card */}
        <div className="booking-details-card">
          <div className="card-content">
            {/* Room Information */}
            <div className="room-section">
              <div className="room-image-container">
                <img 
                  src={bookingDetails.roomImage || 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80'} 
                  alt={bookingDetails.roomName}
                  className="summary-room-image"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80'
                  }}
                />
              </div>
              
              <div className="room-info">
                <h3 className="room-title">{bookingDetails.roomName}</h3>
                <div className="room-details">
                  <div className="detail-row">
                    <span className="label">Dates:</span>
                    <span className="value">
                      {new Date(bookingDetails.checkInDate).toLocaleDateString()} - {new Date(bookingDetails.checkOutDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Duration:</span>
                    <span className="value">{nights} {nights === 1 ? 'night' : 'nights'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Guests:</span>
                    <span className="value">{bookingDetails.guestCount} {bookingDetails.guestCount === 1 ? 'guest' : 'guests'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Package Breakdown */}
            <div className="package-breakdown">
              <h4 className="section-title">Package Breakdown</h4>
              <div className="breakdown-items">
                <div className="breakdown-item">
                  <span className="item-label">Room rate ({nights} {nights === 1 ? 'night' : 'nights'})</span>
                  <span className="item-value">{formatPrice(roomRate)}</span>
                </div>
                <div className="breakdown-item">
                  <span className="item-label">Tax & Service Charges (9%)</span>
                  <span className="item-value">{formatPrice(taxAndService)}</span>
                </div>
                <div className="breakdown-divider"></div>
                <div className="breakdown-item total">
                  <span className="item-label">Total Amount</span>
                  <span className="item-value">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            {/* Guest Information */}
            <div className="guest-information">
              <h4 className="section-title">Guest Information</h4>
              <div className="guest-details">
                <div className="guest-detail-row">
                  <span className="label">Name:</span>
                  <span className="value">{contactInfo.title} {contactInfo.firstName} {contactInfo.lastName}</span>
                </div>
                <div className="guest-detail-row">
                  <span className="label">Email:</span>
                  <span className="value">{contactInfo.email}</span>
                </div>
                <div className="guest-detail-row">
                  <span className="label">Phone:</span>
                  <span className="value">{contactInfo.phoneNumber}</span>
                </div>
                {contactInfo.specialRequests && (
                  <div className="guest-detail-row">
                    <span className="label">Special Requests:</span>
                    <span className="value">{contactInfo.specialRequests}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="action-buttons">
          <div className="primary-actions">
            <button 
              className="action-btn print-btn"
              onClick={handlePrintBooking}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6,9 6,2 18,2 18,9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <polyline points="6,14 18,14 18,22 6,22 6,14"/>
              </svg>
              PRINT BOOKING
            </button>
            
            <button 
              className={`action-btn email-btn ${emailSending ? 'sending' : ''} ${isEmailSent ? 'sent' : ''}`}
              onClick={handleEmailConfirmation}
              disabled={emailSending || isEmailSent}
            >
              {emailSending ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="spinning">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M16 12l-4-4-4 4"/>
                    <path d="M12 16V8"/>
                  </svg>
                  SENDING...
                </>
              ) : isEmailSent ? (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20,6 9,17 4,12"/>
                  </svg>
                  EMAIL SENT!
                </>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                  EMAIL CONFIRMATION
                </>
              )}
            </button>
            
            {/* Email Error Message */}
            {emailError && (
              <div className="email-error-message">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                {emailError}
              </div>
            )}
          </div>
          
          <div className="secondary-actions">
            <button 
              className="return-home-link"
              onClick={handleReturnHome}
            >
              ← RETURN TO HOME
            </button>
          </div>
        </div>
      </div>

      {/* Email Confirmation Modal */}
      {showEmailModal && (
        <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Email Confirmation</h3>
              <button 
                className="modal-close"
                onClick={() => setShowEmailModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <p>Enter a valid email address to receive your booking confirmation:</p>
              
              <div className="email-input-group">
                <label htmlFor="emailAddress">Email Address</label>
                <input
                  id="emailAddress"
                  type="email"
                  value={emailAddress}
                  onChange={(e) => {
                    setEmailAddress(e.target.value)
                    setEmailValidationError('')
                  }}
                  className={`modal-input ${emailValidationError ? 'error' : ''}`}
                  placeholder="your-email@gmail.com"
                  autoFocus
                />
                {emailValidationError && (
                  <div className="input-error">{emailValidationError}</div>
                )}
              </div>
              
              <p className="email-note">
                📧 We recommend using Gmail, Yahoo, Outlook, or other popular email providers
              </p>
            </div>
            
            <div className="modal-footer">
              <button 
                className="modal-btn secondary"
                onClick={() => setShowEmailModal(false)}
              >
                Cancel
              </button>
              <button 
                className="modal-btn primary"
                onClick={handleSendEmail}
                disabled={!emailAddress || emailValidationError}
              >
                Send Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FinalConfirmationPage