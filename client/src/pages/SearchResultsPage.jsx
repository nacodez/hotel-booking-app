import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { hotelBookingAPI, roomAPI } from '../services/apiService'
import BookingProgressIndicator from '../components/BookingProgressIndicator'
import DateSummaryBar from '../components/DateSummaryBar'
import RoomCard from '../components/RoomCard'

const SearchResultsPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [availableRooms, setAvailableRooms] = useState([])
  const [filteredRooms, setFilteredRooms] = useState([])
  const [isLoadingResults, setIsLoadingResults] = useState(true)
  const [searchError, setSearchError] = useState(null)
  const [searchCriteria, setSearchCriteria] = useState({})
  const [isBrowsingMode, setIsBrowsingMode] = useState(false)
  const [sortBy, setSortBy] = useState('price-low')
  const [filters, setFilters] = useState({
    roomType: '',
    amenities: [],
    priceRange: { min: 0, max: 10000 }
  })
  const [showFilters, setShowFilters] = useState(false)

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

    const fetchRooms = async () => {
      try {
        setIsLoadingResults(true)
        setSearchError(null)
        
        let response
        
        if (hasSearchCriteria) {
          // Search with specific criteria
          response = await hotelBookingAPI.searchAvailableRooms(criteria)
        } else {
          // Browse all rooms when no search criteria
          response = await roomAPI.getAllRooms()
        }
        
        if (response.success) {
          setAvailableRooms(response.data)
          setFilteredRooms(response.data)
        } else {
          throw new Error(response.message || 'Failed to fetch rooms')
        }
      } catch (error) {
        console.error('Error fetching rooms:', error)
        setSearchError('Unable to load rooms. Please try again later.')
      } finally {
        setIsLoadingResults(false)
      }
    }

    fetchRooms()
  }, [location.search])

  // Sort and filter rooms
  useEffect(() => {
    let rooms = [...availableRooms]

    // Apply filters
    if (filters.roomType) {
      rooms = rooms.filter(room => room.roomType === filters.roomType)
    }

    if (filters.amenities.length > 0) {
      rooms = rooms.filter(room => 
        filters.amenities.some(amenity => 
          room.amenities.some(roomAmenity => 
            roomAmenity.toLowerCase().includes(amenity.toLowerCase())
          )
        )
      )
    }

    rooms = rooms.filter(room => {
      const price = room.pricePerNight || room.price || 0
      return price >= filters.priceRange.min && price <= filters.priceRange.max
    })

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        rooms.sort((a, b) => (a.pricePerNight || a.price || 0) - (b.pricePerNight || b.price || 0))
        break
      case 'price-high':
        rooms.sort((a, b) => (b.pricePerNight || b.price || 0) - (a.pricePerNight || a.price || 0))
        break
      case 'name':
        rooms.sort((a, b) => a.title.localeCompare(b.title))
        break
      default:
        break
    }

    setFilteredRooms(rooms)
  }, [availableRooms, sortBy, filters])

  const handleSortChange = (e) => {
    setSortBy(e.target.value)
  }

  const handleBookRoom = (room) => {
    // If in browsing mode, redirect to home to select dates first
    if (isBrowsingMode) {
      navigate('/?selectDates=true', {
        state: {
          selectedRoom: {
            id: room.id,
            title: room.title,
            price: room.pricePerNight || room.price
          }
        }
      })
      return
    }

    // Normal booking flow with search criteria
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

  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  return (
    <div className="room-selection-page">
      {/* Progress Indicator - only show in search mode */}
      {!isBrowsingMode && <BookingProgressIndicator currentStep={2} />}
      
      {/* Date Summary Bar - only show in search mode */}
      {!isBrowsingMode && (
        <DateSummaryBar 
          checkInDate={searchCriteria.checkInDate}
          checkOutDate={searchCriteria.checkOutDate}
          guestCount={searchCriteria.guestCount}
          roomCount={searchCriteria.roomCount}
        />
      )}

      <div className="container">
        {/* Filters and Sort Section */}
        <div className="room-controls">
          <div className="results-header">
            <h1 className="page-title">
              {isBrowsingMode ? 'Browse All Rooms' : 'Select Your Room'}
            </h1>
            <p className="results-count">
              {isLoadingResults ? 'Loading...' : `${filteredRooms.length} rooms ${isBrowsingMode ? 'available' : 'found'}`}
            </p>
            {isBrowsingMode && (
              <p className="browse-notice">
                Browse our collection of rooms. To check availability and book, please select your dates.
              </p>
            )}
          </div>

          <div className="controls-row">
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

            <button 
              className="filter-toggle btn btn-secondary"
              onClick={toggleFilters}
            >
              Filters {showFilters ? '−' : '+'}
            </button>
          </div>

          {/* Collapsible Filters */}
          <div className={`filters-section ${showFilters ? 'show' : ''}`}>
            <div className="filter-group">
              <label>Room Type:</label>
              <select 
                value={filters.roomType} 
                onChange={(e) => setFilters(prev => ({...prev, roomType: e.target.value}))}
                className="filter-select"
              >
                <option value="">All Types</option>
                <option value="standard">Standard</option>
                <option value="suite">Suite</option>
                <option value="executive">Executive</option>
              </select>
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
        </div>
      </div>
    </div>
  )
}

export default SearchResultsPage