import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

const HomePage = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchCriteria, setSearchCriteria] = useState({
    guestCount: 2,
    checkInDate: '',
    checkOutDate: ''
  })
  const [validationErrors, setValidationErrors] = useState({})

  useEffect(() => {
    // Set default dates - check-in tomorrow, check-out day after
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dayAfter = new Date()
    dayAfter.setDate(dayAfter.getDate() + 2)

    setSearchCriteria(prev => ({
      ...prev,
      checkInDate: tomorrow.toISOString().split('T')[0],
      checkOutDate: dayAfter.toISOString().split('T')[0]
    }))
  }, [])

  useEffect(() => {
    // Handle anchor scrolling when page loads with hash or scroll to top if no hash
    if (location.hash) {
      // Use setTimeout to ensure the DOM is fully rendered
      setTimeout(() => {
        const element = document.querySelector(location.hash)
        if (element) {
          element.scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
          })
        }
      }, 100)
    } else {
      // If no hash, scroll to top (for home navigation)
      setTimeout(() => {
        window.scrollTo({ 
          top: 0, 
          behavior: 'smooth' 
        })
      }, 100)
    }
  }, [location.hash, location.pathname])

  const formatDateDisplay = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    const formatted = date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
    // Format like "TUE, 3 JUN 2025"
    return formatted.replace(/(\w{3}), (\d+) (\w{3}) (\d+)/, '$1, $2 $3 $4').toUpperCase()
  }

  const validateDates = (checkIn, checkOut) => {
    const errors = {}
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    if (checkInDate < today) {
      errors.checkInDate = 'Check-in date cannot be in the past'
    }

    if (checkOutDate <= checkInDate) {
      errors.checkOutDate = 'Check-out date must be after check-in date'
    }

    return errors
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setSearchCriteria(prev => {
      const updated = { ...prev, [name]: value }
      
      // Validate dates when they change
      if (name === 'checkInDate' || name === 'checkOutDate') {
        const errors = validateDates(
          name === 'checkInDate' ? value : prev.checkInDate,
          name === 'checkOutDate' ? value : prev.checkOutDate
        )
        setValidationErrors(errors)
      }
      
      return updated
    })
  }

  const handleRoomSearch = (e) => {
    e.preventDefault()
    
    // Final validation
    const errors = validateDates(searchCriteria.checkInDate, searchCriteria.checkOutDate)
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors)
      return
    }

    const searchParams = new URLSearchParams({
      destinationCity: 'New York', // Default for now
      ...searchCriteria
    })
    navigate(`/search?${searchParams.toString()}`)
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-image-container">
          <div className="hero-slideshow">
            <div className="slideshow-container">
              <div className="slide"></div>
              <div className="slide"></div>
              <div className="slide"></div>
            </div>
          </div>
          <div className="hero-gradient-overlay"></div>
        </div>
      </section>

      {/* Booking Section */}
      <section className="booking-search-section">
        <div className="booking-widget-container">
          <div className="booking-widget">
            <h2 className="booking-widget-title">BOOK A ROOM</h2>
            
            <form onSubmit={handleRoomSearch} className="booking-form">
              <div className="booking-form-fields">
                {/* Guests Dropdown */}
                <div className="booking-field">
                  <div className="field-with-icon">
                    <div className="field-icon user-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                    </div>
                    <select
                      name="guestCount"
                      value={searchCriteria.guestCount}
                      onChange={handleInputChange}
                      className="booking-input booking-select"
                    >
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <option key={num} value={num}>{num}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Check-in Date */}
                <div className="booking-field">
                  <div className="field-with-icon">
                    <div className="field-icon calendar-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                    <input
                      type="date"
                      name="checkInDate"
                      value={searchCriteria.checkInDate}
                      onChange={handleInputChange}
                      className={`booking-input booking-date ${validationErrors.checkInDate ? 'error' : ''}`}
                      required
                    />
                    <div className="date-display">
                      {formatDateDisplay(searchCriteria.checkInDate)}
                    </div>
                  </div>
                  {validationErrors.checkInDate && (
                    <div className="field-error">{validationErrors.checkInDate}</div>
                  )}
                </div>

                {/* Check-out Date */}
                <div className="booking-field">
                  <div className="field-with-icon">
                    <div className="field-icon calendar-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                    </div>
                    <input
                      type="date"
                      name="checkOutDate"
                      value={searchCriteria.checkOutDate}
                      onChange={handleInputChange}
                      className={`booking-input booking-date ${validationErrors.checkOutDate ? 'error' : ''}`}
                      required
                    />
                    <div className="date-display">
                      {formatDateDisplay(searchCriteria.checkOutDate)}
                    </div>
                  </div>
                  {validationErrors.checkOutDate && (
                    <div className="field-error">{validationErrors.checkOutDate}</div>
                  )}
                </div>
              </div>

              <button 
                type="submit" 
                className="booking-search-button"
                disabled={Object.keys(validationErrors).length > 0}
              >
                SEARCH FOR ROOMS
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="container">
          <h2>About HotelBooker</h2>
          <div className="about-content">
            <p>
              Welcome to HotelBooker, your premier destination for finding and booking the perfect accommodation. 
              We specialize in connecting travelers with exceptional hotels that offer comfort, luxury, and 
              unforgettable experiences.
            </p>
            <p>
              With our extensive network of partner hotels and user-friendly booking platform, we make it easy 
              to find the ideal room for your stay, whether you're traveling for business or pleasure.
            </p>
            <div className="about-features">
              <div className="feature">
                <h3>Best Prices</h3>
                <p>We guarantee competitive rates and exclusive deals on hotel bookings.</p>
              </div>
              <div className="feature">
                <h3>24/7 Support</h3>
                <p>Our customer service team is available around the clock to assist you.</p>
              </div>
              <div className="feature">
                <h3>Easy Booking</h3>
                <p>Simple, secure, and fast booking process with instant confirmation.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="container">
          <h2>Contact Us</h2>
          <div className="contact-content">
            <div className="contact-info">
              <div className="contact-item">
                <h3>Phone</h3>
                <p>+1 (555) 123-4567</p>
              </div>
              <div className="contact-item">
                <h3>Email</h3>
                <p>support@hotelbooker.com</p>
              </div>
              <div className="contact-item">
                <h3>Address</h3>
                <p>123 Hotel Street<br />New York, NY 10001</p>
              </div>
              <div className="contact-item">
                <h3>Hours</h3>
                <p>24/7 Customer Support<br />Available everyday</p>
              </div>
            </div>
            <div className="contact-form">
              <h3>Send us a message</h3>
              <form>
                <div className="form-group">
                  <input type="text" placeholder="Your Name" className="form-input" />
                </div>
                <div className="form-group">
                  <input type="email" placeholder="Your Email" className="form-input" />
                </div>
                <div className="form-group">
                  <textarea placeholder="Your Message" className="form-textarea" rows="5"></textarea>
                </div>
                <button type="submit" className="btn btn-primary">Send Message</button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage