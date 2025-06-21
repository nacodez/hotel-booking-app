import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { hotelBookingAPI } from '../services/apiService'

const RoomDetailsPage = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const [roomDetails, setRoomDetails] = useState(null)
  const [isLoadingRoom, setIsLoadingRoom] = useState(true)
  const [bookingDates, setBookingDates] = useState({
    checkInDate: '',
    checkOutDate: '',
    guestCount: 1
  })

  useEffect(() => {
    const fetchRoomDetails = async () => {
      try {
        setIsLoadingRoom(true)
        const response = await hotelBookingAPI.getRoomDetails(roomId)
        console.log('🖼️ RoomDetailsPage - Full API response:', response)
        const room = response.success ? response.data : response
        console.log('🖼️ RoomDetailsPage - Room data:', room)
        console.log('🖼️ RoomDetailsPage - Room images:', room.images)
        setRoomDetails(room)
      } catch (error) {
        console.error('Error fetching room details:', error)
      } finally {
        setIsLoadingRoom(false)
      }
    }

    fetchRoomDetails()
  }, [roomId])

  const handleBookingDateChange = (e) => {
    const { name, value } = e.target
    setBookingDates(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleRoomSelection = () => {
    if (!currentUser) {
      navigate('/auth')
      return
    }

    const bookingDetails = {
      roomId: roomDetails.id,
      roomName: roomDetails.name,
      roomImage: roomDetails.images?.[0] || roomDetails.image || 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80',
      pricePerNight: roomDetails.pricePerNight,
      ...bookingDates
    }

    navigate('/booking/confirmation', { state: { bookingDetails } })
  }

  if (isLoadingRoom) {
    return (
      <div className="container">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  if (!roomDetails) {
    return (
      <div className="container">
        <div className="card">
          <p>Room not found.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container">
      <div className="room-details-container">
        <div className="room-images">
          {roomDetails.images?.map((image, index) => (
            <img 
              key={index}
              src={image}
              alt={`${roomDetails.name} ${index + 1}`}
              className="detail-image"
            />
          ))}
        </div>

        <div className="room-content">
          <h1>{roomDetails.name}</h1>
          <p className="room-description">{roomDetails.description}</p>
          
          <div className="room-amenities">
            <h3>Amenities</h3>
            <ul>
              {roomDetails.amenities?.map(amenity => (
                <li key={amenity}>{amenity}</li>
              ))}
            </ul>
          </div>

          <div className="booking-section">
            <h3>Book This Room</h3>
            <div className="booking-form">
              <div className="form-group">
                <label className="form-label">Check-in Date</label>
                <input
                  type="date"
                  name="checkInDate"
                  value={bookingDates.checkInDate}
                  onChange={handleBookingDateChange}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Check-out Date</label>
                <input
                  type="date"
                  name="checkOutDate"
                  value={bookingDates.checkOutDate}
                  onChange={handleBookingDateChange}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Number of Guests</label>
                <select
                  name="guestCount"
                  value={bookingDates.guestCount}
                  onChange={handleBookingDateChange}
                  className="form-select"
                >
                  {[1, 2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>{num} Guest{num > 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>

              <div className="price-display">
                <h4>${roomDetails.pricePerNight}/night</h4>
              </div>

              <button 
                onClick={handleRoomSelection}
                className="btn btn-primary btn-lg"
                disabled={!bookingDates.checkInDate || !bookingDates.checkOutDate}
              >
                Book Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoomDetailsPage