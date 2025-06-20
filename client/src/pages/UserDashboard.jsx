import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import BookingDetailsModal from '../components/BookingDetailsModal'
import CancelBookingModal from '../components/CancelBookingModal'
import { bookingAPI, roomAPI } from '../services/apiService'

const UserDashboard = () => {
  const { currentUser, logoutUser } = useAuth()
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState('upcoming')
  const [userBookings, setUserBookings] = useState([])
  const [isLoadingBookings, setIsLoadingBookings] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [bookingToCancel, setBookingToCancel] = useState(null)
  const [bookingError, setBookingError] = useState(null)

  const bookingsPerPage = 6

  // Fetch real user bookings from Firebase
  useEffect(() => {
    const fetchUserBookings = async () => {
      try {
        setIsLoadingBookings(true)
        setBookingError(null)
        
        // Check authentication
        console.log('🔐 Current user:', currentUser)
        console.log('🔐 User ID:', currentUser?.id || currentUser?.uid || 'No user ID')
        console.log('🔐 Auth token:', localStorage.getItem('authToken') ? 'Present' : 'Missing')
        
        // Fetch user's booking history
        console.log('📚 Fetching user booking history...')
        const bookingResponse = await bookingAPI.getUserBookingHistory()
        
        console.log('📚 Full API Response:', JSON.stringify(bookingResponse, null, 2))
        
        if (!bookingResponse.success) {
          throw new Error(bookingResponse.message || 'Failed to fetch bookings')
        }

        const bookings = bookingResponse.data || []
        console.log('📚 Number of bookings found:', bookings.length)
        console.log('📚 Raw bookings from API:', bookings)

        if (bookings.length === 0) {
          console.log('📚 No bookings found for user')
          setUserBookings([])
          return
        }

        // Fetch room details for each booking to get images
        console.log('🏨 Fetching room details for', bookings.length, 'bookings...')
        const enrichedBookings = await Promise.all(
          bookings.map(async (booking, index) => {
            try {
              console.log(`🏨 Fetching room details for booking ${index + 1}/${bookings.length} - Room ID: ${booking.roomId}`)
              
              // Get room details to fetch the image
              const roomResponse = await roomAPI.getRoomDetails(booking.roomId)
              const roomData = roomResponse.success ? roomResponse.data : null
              
              console.log(`🏨 Room response for ${booking.roomId}:`, roomResponse.success ? 'Success' : 'Failed')
              
              const enrichedBooking = {
                ...booking,
                roomImage: roomData?.images?.[0] || 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80',
                // Map Firebase structure to component expectations
                contactInfo: {
                  name: `${booking.guestInformation?.firstName || ''} ${booking.guestInformation?.lastName || ''}`.trim(),
                  email: booking.guestInformation?.email || '',
                  phone: booking.guestInformation?.phoneNumber || ''
                },
                specialRequests: booking.guestInformation?.specialRequests || '',
                bookedDate: booking.createdAt
              }
              
              console.log(`📝 Enriched booking ${index + 1}:`, {
                id: enrichedBooking.id,
                confirmationNumber: enrichedBooking.confirmationNumber,
                roomName: enrichedBooking.roomName,
                checkInDate: enrichedBooking.checkInDate,
                status: enrichedBooking.status
              })
              
              return enrichedBooking
            } catch (roomError) {
              console.warn('Failed to fetch room details for booking:', booking.id, roomError)
              // Return booking with fallback image
              return {
                ...booking,
                roomImage: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80',
                contactInfo: {
                  name: `${booking.guestInformation?.firstName || ''} ${booking.guestInformation?.lastName || ''}`.trim(),
                  email: booking.guestInformation?.email || '',
                  phone: booking.guestInformation?.phoneNumber || ''
                },
                specialRequests: booking.guestInformation?.specialRequests || '',
                bookedDate: booking.createdAt
              }
            }
          })
        )
        
        console.log('✅ Final enriched bookings:', enrichedBookings.length, 'bookings processed')
        console.log('📚 Setting bookings in state:', enrichedBookings)
        setUserBookings(enrichedBookings)
      } catch (error) {
        console.error('❌ Error fetching bookings:', error)
        console.error('❌ Error details:', {
          message: error.message,
          stack: error.stack,
          response: error.response?.data
        })
        
        // Show detailed error message if available
        const errorMessage = error.response?.data?.message || error.message || 'Failed to load bookings'
        setBookingError(errorMessage)
        setUserBookings([]) // Set empty array on error
      } finally {
        setIsLoadingBookings(false)
      }
    }

    if (currentUser) {
      fetchUserBookings()
    } else {
      console.log('⚠️ No current user, skipping booking fetch')
    }
  }, [currentUser])

  // Filter bookings based on active tab
  const getFilteredBookings = () => {
    const today = new Date()
    let filtered = userBookings

    if (activeTab === 'upcoming') {
      filtered = userBookings.filter(booking => {
        const checkInDate = new Date(booking.checkInDate)
        return checkInDate >= today && booking.status === 'confirmed'
      })
    } else {
      filtered = userBookings.filter(booking => {
        const checkOutDate = new Date(booking.checkOutDate)
        return checkOutDate < today || booking.status === 'completed' || booking.status === 'cancelled'
      })
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(booking =>
        booking.roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.confirmationNumber.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply sorting
    switch (sortBy) {
      case 'date-desc':
        filtered.sort((a, b) => new Date(b.checkInDate) - new Date(a.checkInDate))
        break
      case 'date-asc':
        filtered.sort((a, b) => new Date(a.checkInDate) - new Date(b.checkInDate))
        break
      case 'price-desc':
        filtered.sort((a, b) => b.totalAmount - a.totalAmount)
        break
      case 'price-asc':
        filtered.sort((a, b) => a.totalAmount - b.totalAmount)
        break
      default:
        break
    }

    return filtered
  }

  const filteredBookings = getFilteredBookings()
  const totalPages = Math.ceil(filteredBookings.length / bookingsPerPage)
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * bookingsPerPage,
    currentPage * bookingsPerPage
  )

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
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed':
        return 'status-confirmed'
      case 'completed':
        return 'status-completed'
      case 'cancelled':
        return 'status-cancelled'
      default:
        return 'status-default'
    }
  }

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking)
    setShowDetailsModal(true)
  }

  const handleCancelBooking = (booking) => {
    setBookingToCancel(booking)
    setShowCancelModal(true)
  }

  const confirmCancelBooking = async () => {
    try {
      console.log('❌ Cancelling booking:', bookingToCancel.id)
      
      // Call real API to cancel booking
      const response = await bookingAPI.cancelBookingReservation(bookingToCancel.id)
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to cancel booking')
      }
      
      // Update local state to reflect cancellation
      setUserBookings(prev =>
        prev.map(booking =>
          booking.id === bookingToCancel.id
            ? { ...booking, status: 'cancelled' }
            : booking
        )
      )
      
      setShowCancelModal(false)
      setBookingToCancel(null)
      
      console.log('✅ Booking cancelled successfully')
    } catch (error) {
      console.error('Error cancelling booking:', error)
      console.error('Cancel error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      })
      
      // Show specific error message to user
      const errorMessage = error.response?.data?.message || error.message || 'Failed to cancel booking'
      
      // For now, just log it - TODO: Add proper error state management
      alert(`Failed to cancel booking: ${errorMessage}`)
    }
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setCurrentPage(1)
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  const handleSortChange = (e) => {
    setSortBy(e.target.value)
    setCurrentPage(1)
  }

  const handleBookNow = () => {
    navigate('/')
  }

  const handleLogout = async () => {
    try {
      await logoutUser()
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
      // Still redirect to home even if logout API fails
      navigate('/')
    }
  }

  if (!currentUser) {
    navigate('/login')
    return null
  }

  if (isLoadingBookings) {
    return (
      <div className="user-dashboard">
        <div className="container">
          <div className="dashboard-loading">
            <div className="spinner"></div>
            <p>Loading your bookings...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="user-dashboard">
      <div className="container">

        {/* Tab Navigation */}
        <div className="dashboard-tabs">
          <button
            className={`tab-button ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => handleTabChange('upcoming')}
          >
            Upcoming Bookings
            {userBookings.filter(b => {
              const checkInDate = new Date(b.checkInDate)
              return checkInDate >= new Date() && b.status === 'confirmed'
            }).length > 0 && (
              <span className="tab-count">
                {userBookings.filter(b => {
                  const checkInDate = new Date(b.checkInDate)
                  return checkInDate >= new Date() && b.status === 'confirmed'
                }).length}
              </span>
            )}
          </button>
          <button
            className={`tab-button ${activeTab === 'past' ? 'active' : ''}`}
            onClick={() => handleTabChange('past')}
          >
            Past Bookings
          </button>
        </div>

        {/* Search and Filter Controls */}
        {filteredBookings.length > 0 && (
          <div className="dashboard-controls">
            <div className="search-section">
              <div className="search-input-container">
                <input
                  type="text"
                  placeholder="Search by room name or confirmation number..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="search-input"
                />
                <div className="search-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"/>
                    <path d="m21 21-4.35-4.35"/>
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="sort-section">
              <label htmlFor="sort-select" className="sort-label">Sort by:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={handleSortChange}
                className="sort-select"
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="price-asc">Price: Low to High</option>
              </select>
            </div>
          </div>
        )}


        {/* Bookings Content */}
        <div className="dashboard-content">
          {paginatedBookings.length === 0 && !bookingError ? (
            <div className="empty-state">
              {activeTab === 'upcoming' ? (
                <div className="empty-content">
                  <div className="empty-icon">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <path d="M3 21h18"/>
                      <path d="M5 21V7l8-4v18"/>
                      <path d="M19 21V11l-6-4"/>
                      <circle cx="9" cy="12" r="1"/>
                      <circle cx="15" cy="12" r="1"/>
                    </svg>
                  </div>
                  <h3>No upcoming bookings</h3>
                  <p>Ready for your next adventure? Discover amazing places to stay.</p>
                  <button className="btn btn-primary" onClick={handleBookNow}>
                    Book Your Stay
                  </button>
                </div>
              ) : (
                <div className="empty-content">
                  <div className="empty-icon">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12,6 12,12 16,14"/>
                    </svg>
                  </div>
                  <h3>No past bookings yet</h3>
                  <p>Your booking history will appear here once you've completed your stays.</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Bookings Grid */}
              <div className="bookings-grid">
                {paginatedBookings.map(booking => (
                  <div key={booking.id} className="booking-card">
                    <div className="booking-image">
                      <img 
                        src={booking.roomImage || '/placeholder-room.jpg'} 
                        alt={booking.roomName}
                        className="room-thumbnail"
                      />
                      <div className={`status-badge ${getStatusBadgeClass(booking.status)}`}>
                        {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                      </div>
                    </div>
                    
                    <div className="booking-content">
                      <div className="booking-header">
                        <h3 className="room-title">{booking.roomName}</h3>
                        <p className="confirmation-number">#{booking.confirmationNumber}</p>
                      </div>
                      
                      <div className="booking-dates">
                        <div className="date-info">
                          <span className="date-label">Check-in</span>
                          <span className="date-value">{formatDate(booking.checkInDate)}</span>
                        </div>
                        <div className="date-separator">→</div>
                        <div className="date-info">
                          <span className="date-label">Check-out</span>
                          <span className="date-value">{formatDate(booking.checkOutDate)}</span>
                        </div>
                      </div>
                      
                      <div className="booking-details">
                        <div className="detail-item">
                          <span className="detail-label">Guests:</span>
                          <span className="detail-value">{booking.guestCount}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Total:</span>
                          <span className="detail-value price">{formatPrice(booking.totalAmount)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="booking-actions">
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleViewDetails(booking)}
                      >
                        View Details
                      </button>
                      {activeTab === 'upcoming' && booking.status === 'confirmed' && (
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => handleCancelBooking(booking)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    ← Previous
                  </button>
                  
                  <div className="pagination-info">
                    <span>Page {currentPage} of {totalPages}</span>
                    <span className="results-count">
                      ({filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'})
                    </span>
                  </div>
                  
                  <button
                    className="pagination-btn"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {showDetailsModal && selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          onClose={() => {
            setShowDetailsModal(false)
            setSelectedBooking(null)
          }}
        />
      )}

      {showCancelModal && bookingToCancel && (
        <CancelBookingModal
          booking={bookingToCancel}
          onConfirm={confirmCancelBooking}
          onCancel={() => {
            setShowCancelModal(false)
            setBookingToCancel(null)
          }}
        />
      )}
    </div>
  )
}

export default UserDashboard