import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { hotelBookingAPI } from '../services/apiService'
import BookingProgressIndicator from '../components/BookingProgressIndicator'
import DateSummaryBar from '../components/DateSummaryBar'

const BookingConfirmationPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  
  const [contactForm, setContactForm] = useState({
    title: 'Mr.',
    firstName: '',
    lastName: '',
    email: currentUser?.email || '',
    phoneNumber: '',
    specialRequests: ''
  })
  
  const [validationErrors, setValidationErrors] = useState({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSummary, setShowSummary] = useState(false)

  const bookingDetails = location.state?.bookingDetails

  if (!bookingDetails) {
    navigate('/')
    return null
  }

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validatePhoneNumber = (phone) => {
    // Allow various international formats
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{8,}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
  }

  const validateForm = () => {
    const errors = {}

    if (!contactForm.firstName.trim()) {
      errors.firstName = 'First name is required'
    }

    if (!contactForm.lastName.trim()) {
      errors.lastName = 'Last name is required'
    }

    if (!contactForm.email.trim()) {
      errors.email = 'Email is required'
    } else if (!validateEmail(contactForm.email)) {
      errors.email = 'Please enter a valid email address'
    }

    if (!contactForm.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required'
    } else if (!validatePhoneNumber(contactForm.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid phone number'
    }

    return errors
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }))

    // Real-time validation
    if (validationErrors[name]) {
      const newErrors = { ...validationErrors }
      delete newErrors[name]
      setValidationErrors(newErrors)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Debug: Log auth state
    console.log('🔍 Booking - Current user:', currentUser)
    console.log('🔍 Booking - Auth token exists:', !!localStorage.getItem('authToken'))
    
    const errors = validateForm()
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    setIsProcessing(true)
    
    try {
      // Debug: Check if auth token exists
      const authToken = localStorage.getItem('authToken')
      console.log('Auth token exists:', !!authToken)
      console.log('Current user:', currentUser)
      
      // Calculate totals for booking
      const calculateNights = () => {
        const checkIn = new Date(bookingDetails.checkInDate)
        const checkOut = new Date(bookingDetails.checkOutDate)
        return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
      }
      
      const nights = calculateNights()
      const roomRate = nights * bookingDetails.pricePerNight
      const totalAmount = roomRate // You can add taxes later
      
      // Create the booking reservation
      const bookingPayload = {
        roomId: bookingDetails.roomId,
        roomName: bookingDetails.roomName || 'Selected Room',
        checkInDate: bookingDetails.checkInDate,
        checkOutDate: bookingDetails.checkOutDate,
        guestCount: bookingDetails.guestCount,
        guestInformation: contactForm, // Changed from contactInfo to guestInformation
        totalAmount: totalAmount,
        pricePerNight: bookingDetails.pricePerNight
      }
      
      console.log('Creating booking with payload:', bookingPayload)
      console.log('🔑 Token being sent:', !!authToken)
      
      const response = await hotelBookingAPI.createBookingReservation(bookingPayload)
      
      if (response.success) {
        // Navigate to final confirmation with booking ID
        navigate('/booking/final-confirmation', {
          state: {
            bookingDetails,
            contactInfo: contactForm,
            bookingId: response.data.bookingId,
            confirmationNumber: response.data.confirmationNumber
          }
        })
      } else {
        throw new Error(response.message || 'Failed to create booking')
      }
    } catch (error) {
      console.error('Error processing booking:', error)
      alert(`Failed to process booking: ${error.message}. Please try again.`)
    } finally {
      setIsProcessing(false)
    }
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
    const taxAndService = roomRate * 0.09 // 9% tax and service charges
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

  const { nights, roomRate, taxAndService, total } = calculateTotals()
  const isFormValid = Object.keys(validateForm()).length === 0 && 
                     contactForm.firstName && 
                     contactForm.lastName && 
                     contactForm.email && 
                     contactForm.phoneNumber

  return (
    <div className="contact-information-page">
      <BookingProgressIndicator currentStep={3} />
      
      <DateSummaryBar 
        checkInDate={bookingDetails.checkInDate}
        checkOutDate={bookingDetails.checkOutDate}
        guestCount={bookingDetails.guestCount}
      />

      <div className="container">
        {/* Mobile Summary Toggle */}
        <div className="mobile-summary-toggle">
          <button 
            className="summary-toggle-btn"
            onClick={() => setShowSummary(!showSummary)}
          >
            <span>Booking Summary</span>
            <span className="toggle-icon">{showSummary ? '−' : '+'}</span>
          </button>
        </div>

        <div className="contact-content">
          {/* Contact Form */}
          <div className="contact-form-section">
            <div className="contact-form-container">
              <h1 className="page-title">Contact Information</h1>
              <p className="page-subtitle">Please provide your contact details to complete the booking.</p>

              <form onSubmit={handleSubmit} className="contact-form">
                {/* Title Dropdown */}
                <div className="form-group">
                  <label className="form-label" htmlFor="title">Title *</label>
                  <select
                    id="title"
                    name="title"
                    value={contactForm.title}
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    <option value="Mr.">Mr.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Dr.">Dr.</option>
                  </select>
                </div>

                {/* First Name and Last Name */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="firstName">First Name *</label>
                    <input
                      id="firstName"
                      type="text"
                      name="firstName"
                      value={contactForm.firstName}
                      onChange={handleInputChange}
                      className={`form-input ${validationErrors.firstName ? 'error' : ''}`}
                      required
                    />
                    {validationErrors.firstName && (
                      <div className="form-error">{validationErrors.firstName}</div>
                    )}
                  </div>
                  
                  <div className="form-group">
                    <label className="form-label" htmlFor="lastName">Last Name *</label>
                    <input
                      id="lastName"
                      type="text"
                      name="lastName"
                      value={contactForm.lastName}
                      onChange={handleInputChange}
                      className={`form-input ${validationErrors.lastName ? 'error' : ''}`}
                      required
                    />
                    {validationErrors.lastName && (
                      <div className="form-error">{validationErrors.lastName}</div>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="form-group">
                  <label className="form-label" htmlFor="email">Email Address *</label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={contactForm.email}
                    onChange={handleInputChange}
                    className={`form-input ${validationErrors.email ? 'error' : ''}`}
                    required
                  />
                  {validationErrors.email && (
                    <div className="form-error">{validationErrors.email}</div>
                  )}
                </div>

                {/* Phone Number */}
                <div className="form-group">
                  <label className="form-label" htmlFor="phoneNumber">Phone Number *</label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    name="phoneNumber"
                    value={contactForm.phoneNumber}
                    onChange={handleInputChange}
                    className={`form-input ${validationErrors.phoneNumber ? 'error' : ''}`}
                    placeholder="+65 1234 5678"
                    required
                  />
                  {validationErrors.phoneNumber && (
                    <div className="form-error">{validationErrors.phoneNumber}</div>
                  )}
                </div>

                {/* Special Requests */}
                <div className="form-group">
                  <label className="form-label" htmlFor="specialRequests">Special Requests</label>
                  <textarea
                    id="specialRequests"
                    name="specialRequests"
                    value={contactForm.specialRequests}
                    onChange={handleInputChange}
                    className="form-textarea"
                    rows="4"
                    placeholder="Any special requests or dietary requirements..."
                  />
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  className="proceed-btn"
                  disabled={!isFormValid || isProcessing}
                >
                  {isProcessing ? 'PROCESSING...' : 'PROCEED'}
                </button>
              </form>
            </div>
          </div>

          {/* Booking Summary Sidebar */}
          <div className={`booking-summary-section ${showSummary ? 'show' : ''}`}>
            <div className="booking-summary-container">
              <h2 className="summary-title">Booking Summary</h2>
              
              {/* Room Details */}
              <div className="room-summary">
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
                <div className="room-details">
                  <h3 className="room-name">{bookingDetails.roomName}</h3>
                  <div className="stay-dates">
                    <div className="date-info">
                      <span className="date-label">Check-in:</span>
                      <span className="date-value">{new Date(bookingDetails.checkInDate).toLocaleDateString()}</span>
                    </div>
                    <div className="date-info">
                      <span className="date-label">Check-out:</span>
                      <span className="date-value">{new Date(bookingDetails.checkOutDate).toLocaleDateString()}</span>
                    </div>
                    <div className="date-info">
                      <span className="date-label">Nights:</span>
                      <span className="date-value">{nights}</span>
                    </div>
                    <div className="date-info">
                      <span className="date-label">Guests:</span>
                      <span className="date-value">{bookingDetails.guestCount}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="price-breakdown">
                <h4 className="breakdown-title">Price Breakdown</h4>
                
                <div className="price-item">
                  <span className="price-label">Room rate ({nights} {nights === 1 ? 'night' : 'nights'})</span>
                  <span className="price-value">{formatPrice(roomRate)}</span>
                </div>
                
                <div className="price-item">
                  <span className="price-label">Tax & Service Charges (9%)</span>
                  <span className="price-value">{formatPrice(taxAndService)}</span>
                </div>
                
                <div className="price-divider"></div>
                
                <div className="price-item total">
                  <span className="price-label">Total Amount</span>
                  <span className="price-value">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Additional Info */}
              <div className="summary-footer">
                <p className="cancellation-policy">
                  Free cancellation until 24 hours before check-in
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingConfirmationPage