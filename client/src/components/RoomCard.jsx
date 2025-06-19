import { useState } from 'react'

const RoomCard = ({ room, onBookRoom, isLoading = false, buttonText = 'BOOK ROOM' }) => {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-SG', {
      style: 'currency',
      currency: 'SGD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price).replace('SGD', 'S$')
  }

  const handleBookRoom = () => {
    if (onBookRoom && !isLoading) {
      onBookRoom(room)
    }
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoaded(true)
  }

  if (isLoading) {
    return <RoomCardSkeleton />
  }

  return (
    <div className="room-card-container">
      <div className="room-card">
        {/* Room Image */}
        <div className="room-image-container">
          {!imageLoaded && (
            <div className="room-image-skeleton">
              <div className="skeleton-shimmer"></div>
            </div>
          )}
          
          {imageError ? (
            <div className="room-image-placeholder">
              <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21,15 16,10 5,21"/>
              </svg>
            </div>
          ) : (
            <img
              src={room.image || '/placeholder-room.jpg'}
              alt={room.title}
              className={`room-image ${imageLoaded ? 'loaded' : ''}`}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}
        </div>

        {/* Room Details */}
        <div className="room-details">
          <div className="room-content">
            <h3 className="room-title">{room.title || 'ROOM TITLE'}</h3>
            <p className="room-subtitle">{room.subtitle || 'LOREM IPSUM DOLOR SIT AMET'}</p>
            <p className="room-description">
              {room.description || 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'}
            </p>
            
            {room.amenities && room.amenities.length > 0 && (
              <div className="room-amenities">
                {room.amenities.slice(0, 4).map((amenity, index) => (
                  <span key={index} className="amenity-tag">{amenity}</span>
                ))}
              </div>
            )}
          </div>

          <div className="room-booking">
            <div className="room-pricing">
              <div className="room-price">
                {formatPrice(room.pricePerNight || 1080)}/night
              </div>
              <div className="price-disclaimer">
                Subject to GST and charges
              </div>
            </div>
            
            <button 
              className="book-room-btn"
              onClick={handleBookRoom}
              disabled={isLoading}
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const RoomCardSkeleton = () => {
  return (
    <div className="room-card-container">
      <div className="room-card skeleton">
        <div className="room-image-skeleton">
          <div className="skeleton-shimmer"></div>
        </div>
        <div className="room-details">
          <div className="room-content">
            <div className="skeleton-text skeleton-title"></div>
            <div className="skeleton-text skeleton-subtitle"></div>
            <div className="skeleton-text skeleton-description"></div>
            <div className="skeleton-text skeleton-description short"></div>
          </div>
          <div className="room-booking">
            <div className="room-pricing">
              <div className="skeleton-text skeleton-price"></div>
              <div className="skeleton-text skeleton-disclaimer"></div>
            </div>
            <div className="skeleton-button"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoomCard