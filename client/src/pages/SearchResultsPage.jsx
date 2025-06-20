import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { hotelBookingAPI, roomAPI } from '../services/apiService'
import BookingProgressIndicator from '../components/BookingProgressIndicator'
import DateSummaryBar from '../components/DateSummaryBar'
import RoomCard from '../components/RoomCard'
import PaginationControls from '../components/PaginationControls'
import '../styles/pagination.css'

const SearchResultsPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [availableRooms, setAvailableRooms] = useState([])
  const [filteredRooms, setFilteredRooms] = useState([])
  const [isLoadingResults, setIsLoadingResults] = useState(true)
  const [searchError, setSearchError] = useState(null)
  const [searchCriteria, setSearchCriteria] = useState({})
  const [isBrowsingMode, setIsBrowsingMode] = useState(false)
  const [sortBy, setSortBy] = useState('price-low')
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [isChangingPage, setIsChangingPage] = useState(false)
  const roomsPerPage = 10

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const criteria = {
      destinationCity: searchParams.get('destinationCity'),
      checkInDate: searchParams.get('checkInDate'),
      checkOutDate: searchParams.get('checkOutDate'),
      guestCount: parseInt(searchParams.get('guestCount')) || 1,
      roomCount: parseInt(searchParams.get('roomCount')) || 1
    }
    setSearchCriteria(criteria)

    const hasSearchCriteria = criteria.destinationCity && criteria.checkInDate && criteria.checkOutDate
    setIsBrowsingMode(!hasSearchCriteria)

    const fetchRooms = async (page = 1) => {
      try {
        setIsLoadingResults(true)
        setSearchError(null)
        
        let response
        
        if (hasSearchCriteria) {
          // Search with specific criteria
          response = await hotelBookingAPI.searchAvailableRooms(criteria, page, roomsPerPage)
        } else {
          // Browse all rooms when no search criteria
          response = await roomAPI.getAllRooms(page, roomsPerPage)
        }
        
        if (response.success) {
          setAvailableRooms(response.data)
          setFilteredRooms(response.data)
          setPagination(response.pagination)
        } else {
          throw new Error(response.message || 'Failed to fetch rooms')
        }
      } catch (error) {
        console.error('Error fetching rooms:', error)
        setSearchError('Unable to load rooms. Please try again later.')
        setPagination(null)
      } finally {
        setIsLoadingResults(false)
        setIsChangingPage(false)
      }
    }

    // Reset pagination when search criteria change
    setCurrentPage(1)
    setPagination(null)
    fetchRooms(1)
  }, [location.search])

  // Sort rooms
  useEffect(() => {
    let rooms = [...availableRooms]

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        rooms.sort((a, b) => (a.price || 0) - (b.price || 0))
        break
      case 'price-high':
        rooms.sort((a, b) => (b.price || 0) - (a.price || 0))
        break
      case 'name':
        rooms.sort((a, b) => a.title.localeCompare(b.title))
        break
      default:
        break
    }

    setFilteredRooms(rooms)
  }, [availableRooms, sortBy])

  const handleSortChange = (e) => {
    setSortBy(e.target.value)
  }

  // Handle page changes
  const handlePageChange = async (newPage) => {
    if (newPage === currentPage || isLoadingResults || isChangingPage) return
    
    setIsChangingPage(true)
    setCurrentPage(newPage)
    
    try {
      const hasSearchCriteria = searchCriteria.destinationCity && searchCriteria.checkInDate && searchCriteria.checkOutDate
      let response
      
      if (hasSearchCriteria) {
        response = await hotelBookingAPI.searchAvailableRooms(searchCriteria, newPage, roomsPerPage)
      } else {
        response = await roomAPI.getAllRooms(newPage, roomsPerPage)
      }
      
      if (response.success) {
        setAvailableRooms(response.data)
        setFilteredRooms(response.data)
        setPagination(response.pagination)
        
        // Scroll to top of results
        const roomControls = document.querySelector('.room-controls')
        if (roomControls) {
          roomControls.scrollIntoView({ behavior: 'smooth' })
        }
      }
    } catch (error) {
      console.error('Error changing page:', error)
      setSearchError('Unable to load page. Please try again.')
    } finally {
      setIsChangingPage(false)
    }
  }

  // Date formatting functions
  const formatDisplayDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).toUpperCase().replace(',', ',')
  }

  const calculateNights = () => {
    if (!searchCriteria.checkInDate || !searchCriteria.checkOutDate) return 0
    const checkIn = new Date(searchCriteria.checkInDate)
    const checkOut = new Date(searchCriteria.checkOutDate)
    const timeDiff = checkOut.getTime() - checkIn.getTime()
    return Math.ceil(timeDiff / (1000 * 3600 * 24))
  }

  const handleBookRoom = (room) => {
    // Check if user is authenticated first
    if (!currentUser) {
      console.log('🔒 User not authenticated, redirecting to login')
      
      // Save booking intent for post-login redirect
      const bookingIntent = {
        room: {
          id: room.id,
          title: room.title,
          price: room.price,
          pricePerNight: room.pricePerNight || room.price
        },
        searchCriteria,
        isBrowsingMode
      }
      
      // Redirect to login with booking intent
      navigate('/login', {
        state: {
          returnTo: isBrowsingMode ? '/' : '/booking/confirmation',
          bookingIntent,
          message: 'Please log in to continue with your booking'
        }
      })
      return
    }

    console.log('✅ User authenticated, proceeding with booking')
    
    // If in browsing mode, redirect to home to select dates first
    if (isBrowsingMode) {
      navigate('/?selectDates=true', {
        state: {
          selectedRoom: {
            id: room.id,
            title: room.title,
            price: room.price
          }
        }
      })
      return
    }

    // Normal booking flow with search criteria for authenticated users
    navigate('/booking/confirmation', {
      state: {
        bookingDetails: {
          roomId: room.id,
          roomName: room.title,
          pricePerNight: room.pricePerNight || room.price,
          ...searchCriteria
        }
      }
    })
  }


  return (
    <div className="room-selection-page">
      {/* Progress Indicator - only show in search mode */}
      {!isBrowsingMode && <BookingProgressIndicator currentStep={2} />}

      <div className="container">
        {/* Filters and Sort Section */}
        <div className="room-controls">
          <div className="results-header">
            {isBrowsingMode && (
              <p className="browse-notice">
                Browse our collection of rooms. To check availability and book, please select your dates.
              </p>
            )}
            
            <div className="title-count-row">
              <h1 className="page-title">
                {isBrowsingMode ? 'Browse All Rooms' : 'Select Your Room'}
              </h1>
              <p className="results-count">
                {isLoadingResults ? 'Loading...' : pagination ? `${pagination.totalCount} rooms ${isBrowsingMode ? 'available' : 'found'}` : `${filteredRooms.length} rooms ${isBrowsingMode ? 'available' : 'found'}`}
              </p>
            </div>
          </div>

          {/* Date info row - only show in search mode */}
          {!isBrowsingMode && (
            <div className="date-info-row">
              <div className="selected-dates">
                <span>{formatDisplayDate(searchCriteria.checkInDate)}</span>
                <span className="date-arrow"> → </span>
                <span>{formatDisplayDate(searchCriteria.checkOutDate)}</span>
              </div>
              <div className="guests-nights">
                {(() => {
                  const nights = calculateNights()
                  return (
                    <>
                      <span>{nights} {nights === 1 ? 'Night' : 'Nights'}</span>
                      <span className="separator"> • </span>
                      <span>{searchCriteria.guestCount || 1} {(searchCriteria.guestCount || 1) === 1 ? 'Guest' : 'Guests'}</span>
                    </>
                  )
                })()}
              </div>
            </div>
          )}

          <div className="controls-row">
            <div></div>
            <div className="sort-section">
              <label htmlFor="sort-select" className="sort-label">Sort by:</label>
              <div className="sort-dropdown">
                <select
                  id="sort-select"
                  value={sortBy}
                  onChange={handleSortChange}
                  className="sort-select"
                >
                  <option value="price-low">LOWEST PRICE</option>
                  <option value="price-high">HIGHEST PRICE</option>
                  <option value="name">ROOM NAME</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Room Listings */}
        <div className="room-listings">
          {isLoadingResults ? (
            // Loading skeletons
            <div className="rooms-list">
              {[...Array(3)].map((_, index) => (
                <RoomCard key={index} isLoading={true} />
              ))}
            </div>
          ) : searchError ? (
            <div className="error-state">
              <div className="alert alert-error">
                {searchError}
              </div>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="no-rooms-state">
              <div className="no-rooms-content">
                <div className="no-rooms-icon">
                  <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M3 21h18"/>
                    <path d="M5 21V7l8-4v18"/>
                    <path d="M19 21V11l-6-4"/>
                  </svg>
                </div>
                <h3>No rooms available</h3>
                <p>Sorry, no rooms match your search criteria. Please try adjusting your filters or dates.</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => navigate('/')}
                >
                  Modify Search
                </button>
              </div>
            </div>
          ) : (
            <div className="rooms-list">
              {filteredRooms.map(room => (
                <RoomCard 
                  key={room.id} 
                  room={room} 
                  onBookRoom={handleBookRoom}
                  buttonText={isBrowsingMode ? 'Select Dates' : 'Book Now'}
                />
              ))}
            </div>
          )}
          
          {/* Pagination Controls */}
          {!isLoadingResults && !searchError && pagination && (
            <PaginationControls
              pagination={pagination}
              onPageChange={handlePageChange}
              isLoading={isChangingPage}
              showResultsInfo={true}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchResultsPage