import { 
  getFirestoreAdmin, 
  createDocument, 
  updateDocument, 
  getDocument, 
  queryDocuments, 
  deleteDocument,
  COLLECTIONS 
} from '../config/firebaseAdmin.js'
import { 
  asyncHandler, 
  AuthenticationError, 
  AuthorizationError,
  ConflictError, 
  NotFoundError,
  ValidationError 
} from '../middleware/errorHandler.js'

const firestore = getFirestoreAdmin()

// Helper function to check if dates overlap
const datesOverlap = (start1, end1, start2, end2) => {
  const s1 = new Date(start1)
  const e1 = new Date(end1)
  const s2 = new Date(start2)
  const e2 = new Date(end2)
  
  return s1 < e2 && e1 > s2
}

// Optimized batch function to check availability for multiple rooms at once
const checkBatchRoomAvailability = async (roomIds, checkInDate, checkOutDate) => {
  try {
    console.log(`🔍 Batch checking availability for ${roomIds.length} rooms from ${checkInDate} to ${checkOutDate}`)
    
    if (roomIds.length === 0) return {}
    
    const bookingsRef = firestore.collection('bookings')
    const bookingsQuery = bookingsRef
      .where('roomId', 'in', roomIds)
      .where('status', 'in', ['confirmed', 'checked-in']) // Only active bookings
    
    const bookingsSnapshot = await bookingsQuery.get()
    
    // Group bookings by roomId
    const roomBookings = {}
    bookingsSnapshot.forEach(doc => {
      const booking = doc.data()
      if (!roomBookings[booking.roomId]) {
        roomBookings[booking.roomId] = []
      }
      roomBookings[booking.roomId].push(booking)
    })
    
    // Check availability for each room
    const availabilityResults = {}
    roomIds.forEach(roomId => {
      const bookings = roomBookings[roomId] || []
      let hasConflict = false
      
      for (const booking of bookings) {
        if (datesOverlap(checkInDate, checkOutDate, booking.checkInDate, booking.checkOutDate)) {
          console.log(`❌ Date conflict found for room ${roomId}`)
          hasConflict = true
          break
        }
      }
      
      availabilityResults[roomId] = !hasConflict
      if (!hasConflict) {
        console.log(`✅ Room ${roomId} is available`)
      }
    })
    
    return availabilityResults
  } catch (error) {
    console.error('Error in batch availability check:', error)
    // Return all rooms as unavailable on error
    const errorResults = {}
    roomIds.forEach(roomId => {
      errorResults[roomId] = false
    })
    return errorResults
  }
}

export const searchAvailableRooms = asyncHandler(async (req, res) => {
  const { destinationCity, checkInDate, checkOutDate, guestCount, roomCount, page = 1, limit = 10 } = req.body
  
  // Parse pagination parameters
  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  const offset = (pageNum - 1) * limitNum

  console.log('🔍 Room search request:', { destinationCity, checkInDate, checkOutDate, guestCount, roomCount, page: pageNum, limit: limitNum })

  if (!destinationCity || !checkInDate || !checkOutDate) {
    return res.status(400).json({
      success: false,
      message: 'Missing required search parameters'
    })
  }

  // Validate dates
  const checkIn = new Date(checkInDate)
  const checkOut = new Date(checkOutDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (checkIn < today) {
    return res.status(400).json({
      success: false,
      message: 'Check-in date cannot be in the past'
    })
  }

  if (checkOut <= checkIn) {
    return res.status(400).json({
      success: false,
      message: 'Check-out date must be after check-in date'
    })
  }

  try {
    console.log('📊 Querying rooms collection...')
    const roomsRef = firestore.collection('rooms')
    
    // Base query for available rooms
    let baseQuery = roomsRef
      .where('available', '==', true)
      .where('roomStatus', '==', 'available')
    
    // For browse mode, we can get count more efficiently
    let totalSnapshot
    if (!checkInDate || !checkOutDate) {
      // Browse mode - just count available rooms quickly
      console.log('🔥 Getting total count for browse mode...')
      totalSnapshot = await baseQuery.select().get() // Only get document IDs, not full data
    } else {
      // Search mode - we need to be more conservative
      console.log('🔥 Getting total count for search mode...')
      totalSnapshot = await baseQuery.get()
    }
    console.log(`📋 Found ${totalSnapshot.size} total available rooms`)
    
    // Apply pagination to the query
    let paginatedQuery = baseQuery
      .limit(limitNum)
      .offset(offset)
    
    console.log('🔥 Executing paginated Firestore query...')
    const roomSnapshot = await paginatedQuery.get()
    console.log(`📋 Found ${roomSnapshot.size} rooms for page ${pageNum}`)

    // Pre-filter rooms by capacity in memory
    const eligibleRooms = []
    roomSnapshot.forEach(doc => {
      const roomData = doc.data()
      const roomId = doc.id
      
      console.log(`🏠 Checking room:`, { id: roomId, name: roomData.name, capacity: roomData.capacity })
      
      // Filter by capacity in-memory to avoid composite index requirement
      if (guestCount && roomData.capacity < parseInt(guestCount)) {
        console.log(`❌ Room ${roomId} capacity ${roomData.capacity} < required ${guestCount}`)
        return
      }
      
      eligibleRooms.push({ id: roomId, data: roomData })
    })
    
    console.log(`📋 ${eligibleRooms.length} rooms passed capacity filter`)
    
    // Batch check availability for all eligible rooms
    const roomIds = eligibleRooms.map(room => room.id)
    const availabilityResults = await checkBatchRoomAvailability(roomIds, checkInDate, checkOutDate)
    
    // Build final available rooms list
    const availableRooms = []
    eligibleRooms.forEach(({ id: roomId, data: roomData }) => {
      if (availabilityResults[roomId]) {
        console.log(`✅ Room ${roomId} is available`)
        
        // Calculate total nights and price
        const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24))
        const totalPrice = roomData.price * nights
        
        availableRooms.push({
          id: roomId,
          title: roomData.name,
          subtitle: `${roomData.type.charAt(0).toUpperCase() + roomData.type.slice(1)} Room`,
          description: roomData.description,
          image: roomData.images?.[0] || '/placeholder-room.jpg',
          price: totalPrice,
          pricePerNight: roomData.price,
          nights: nights,
          amenities: roomData.amenities || [],
          roomType: roomData.type,
          capacity: roomData.capacity,
          maxOccupancy: roomData.maxOccupancy || roomData.capacity,
          bedType: roomData.bedType,
          roomNumber: roomData.roomNumber,
          hotelId: roomData.hotelId
        })
      } else {
        console.log(`❌ Room ${roomId} is not available for requested dates`)
      }
    })

    console.log(`✅ Returning ${availableRooms.length} available rooms for page ${pageNum}`)

    // Calculate pagination metadata
    const totalCount = totalSnapshot.size
    const totalPages = Math.ceil(totalCount / limitNum)
    const hasNextPage = pageNum < totalPages
    const hasPrevPage = pageNum > 1

    res.json({
      success: true,
      data: availableRooms,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage,
        hasPrevPage
      },
      searchCriteria: {
        destinationCity,
        checkInDate,
        checkOutDate,
        guestCount,
        roomCount
      }
    })
  } catch (error) {
    console.error('❌ Error searching rooms:', error)
    console.error('❌ Error details:', error.message)
    console.error('❌ Error stack:', error.stack)
    res.status(500).json({
      success: false,
      message: 'Failed to search available rooms',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})

export const getRoomDetails = asyncHandler(async (req, res) => {
  const { roomId } = req.params

  if (!roomId) {
    return res.status(400).json({
      success: false,
      message: 'Room ID is required'
    })
  }

  try {
    const roomDoc = await firestore.collection('rooms').doc(roomId).get()

    if (!roomDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      })
    }

    const roomData = roomDoc.data()

    res.json({
      success: true,
      data: {
        id: roomDoc.id,
        ...roomData
      }
    })
  } catch (error) {
    console.error('Error fetching room details:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch room details'
    })
  }
})

export const getAllRooms = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query
  
  // Parse pagination parameters
  const pageNum = parseInt(page)
  const limitNum = parseInt(limit)
  const offset = (pageNum - 1) * limitNum
  
  try {
    console.log('📊 Fetching all available rooms...', { page: pageNum, limit: limitNum })
    const roomsRef = firestore.collection('rooms')
    
    // Base query for available rooms
    let baseQuery = roomsRef
      .where('available', '==', true)
      .where('roomStatus', '==', 'available')
    
    // Get total count for pagination metadata (efficiently)
    console.log('🔥 Getting total count...')
    const totalSnapshot = await baseQuery.select().get() // Only get document IDs, not full data
    console.log(`📋 Found ${totalSnapshot.size} total available rooms`)
    
    // Apply pagination to the query
    const roomSnapshot = await baseQuery
      .limit(limitNum)
      .offset(offset)
      .get()

    console.log(`📋 Found ${roomSnapshot.size} rooms for page ${pageNum}`)

    const rooms = []
    roomSnapshot.forEach(doc => {
      const roomData = doc.data()
      
      // Format room data consistently with search results
      rooms.push({
        id: doc.id,
        title: roomData.name || roomData.title,
        subtitle: `${roomData.type ? roomData.type.charAt(0).toUpperCase() + roomData.type.slice(1) : 'Standard'} Room`,
        description: roomData.description,
        image: roomData.images?.[0] || '/placeholder-room.jpg',
        price: roomData.price,
        amenities: roomData.amenities || [],
        roomType: roomData.type,
        capacity: roomData.capacity,
        maxOccupancy: roomData.maxOccupancy || roomData.capacity,
        bedType: roomData.bedType,
        roomNumber: roomData.roomNumber,
        hotelId: roomData.hotelId
      })
      
      console.log(`✅ Added room to response: ${roomData.name} - Price: ${roomData.price}, PricePerNight: ${roomData.price}`)
    })

    console.log(`✅ Returning ${rooms.length} formatted rooms for page ${pageNum}`)

    // Calculate pagination metadata
    const totalCount = totalSnapshot.size
    const totalPages = Math.ceil(totalCount / limitNum)
    const hasNextPage = pageNum < totalPages
    const hasPrevPage = pageNum > 1

    res.json({
      success: true,
      data: rooms,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNextPage,
        hasPrevPage
      }
    })
  } catch (error) {
    console.error('Error fetching all rooms:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rooms'
    })
  }
})

// ==========================================
// HOTEL OWNER ROOM MANAGEMENT FUNCTIONS
// ==========================================

// Create room (hotel owner only)
export const createRoom = asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.uid
  const {
    hotelId,
    roomNumber,
    roomType,
    title,
    description,
    price,
    capacity,
    bedType,
    bathrooms,
    size,
    amenities,
    images,
    features,
    policies
  } = req.body

  // Verify hotel ownership
  const hotel = await getDocument(COLLECTIONS.HOTELS, hotelId)
  if (!hotel || hotel.ownerId !== userId) {
    throw new AuthorizationError('You can only create rooms for your own hotels')
  }

  if (hotel.status !== 'active') {
    throw new ValidationError('Hotel must be active to add rooms')
  }

  // Check if room number already exists in this hotel
  const existingRooms = await queryDocuments(COLLECTIONS.ROOMS, [
    { field: 'hotelId', operator: '==', value: hotelId },
    { field: 'roomNumber', operator: '==', value: roomNumber }
  ])

  if (existingRooms.length > 0) {
    throw new ConflictError('Room number already exists in this hotel')
  }

  const roomData = {
    hotelId,
    hotelName: hotel.hotelName,
    ownerId: userId,
    roomNumber: roomNumber.toString(),
    roomType: roomType || 'standard',
    title: title.trim(),
    description: description.trim(),
    price: parseFloat(price),
    capacity: parseInt(capacity),
    bedType: bedType || 'queen',
    bathrooms: parseInt(bathrooms) || 1,
    size: size ? parseFloat(size) : null,
    amenities: amenities || [],
    images: images || [],
    features: features || [],
    policies: {
      smoking: policies?.smoking || false,
      pets: policies?.pets || false,
      extraBed: policies?.extraBed || false,
      extraBedPrice: policies?.extraBedPrice ? parseFloat(policies.extraBedPrice) : 0,
      cancellation: policies?.cancellation || 'Free cancellation 24 hours before check-in',
      checkin: policies?.checkin || '15:00',
      checkout: policies?.checkout || '11:00'
    },
    location: {
      city: hotel.address.city,
      state: hotel.address.state,
      country: hotel.address.country,
      floor: null,
      wing: null,
      viewType: null
    },
    status: 'available',
    isActive: true,
    rating: 0,
    reviewCount: 0,
    maxOccupancy: parseInt(capacity),
    basePrice: parseFloat(price)
  }

  const roomId = await createDocument(COLLECTIONS.ROOMS, roomData)

  // Update hotel's total rooms count
  await updateDocument(COLLECTIONS.HOTELS, hotelId, {
    totalRooms: (hotel.totalRooms || 0) + 1
  })

  res.status(201).json({
    success: true,
    message: 'Room created successfully',
    data: {
      roomId,
      roomNumber,
      hotelId
    }
  })
})

// Update room (hotel owner only)
export const updateRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params
  const userId = req.user.userId || req.user.uid
  const updates = req.body

  const room = await getDocument(COLLECTIONS.ROOMS, roomId)
  if (!room) {
    throw new NotFoundError('Room not found')
  }

  if (room.ownerId !== userId) {
    throw new AuthorizationError('You can only update your own rooms')
  }

  // Fields that can be updated by hotel owner
  const allowedFields = [
    'title', 'description', 'price', 'capacity', 'bedType', 'bathrooms',
    'size', 'amenities', 'images', 'features', 'policies', 'status'
  ]

  const filteredUpdates = {}
  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      filteredUpdates[key] = value
    }
  }

  if (Object.keys(filteredUpdates).length === 0) {
    throw new ValidationError('No valid fields to update')
  }

  // Update price-related fields if price is updated
  if (filteredUpdates.price) {
    filteredUpdates.basePrice = parseFloat(filteredUpdates.price)
  }

  // Update capacity-related fields if capacity is updated
  if (filteredUpdates.capacity) {
    filteredUpdates.maxOccupancy = parseInt(filteredUpdates.capacity)
  }

  await updateDocument(COLLECTIONS.ROOMS, roomId, filteredUpdates)

  res.json({
    success: true,
    message: 'Room updated successfully'
  })
})

// Delete room (hotel owner only)
export const deleteRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.params
  const userId = req.user.userId || req.user.uid

  const room = await getDocument(COLLECTIONS.ROOMS, roomId)
  if (!room) {
    throw new NotFoundError('Room not found')
  }

  if (room.ownerId !== userId) {
    throw new AuthorizationError('You can only delete your own rooms')
  }

  // Check for active bookings
  const activeBookings = await queryDocuments(COLLECTIONS.BOOKINGS, [
    { field: 'roomId', operator: '==', value: roomId },
    { field: 'status', operator: 'in', value: ['confirmed', 'pending'] }
  ])

  if (activeBookings.length > 0) {
    throw new ValidationError('Cannot delete room with active bookings')
  }

  // Soft delete - mark as inactive
  await updateDocument(COLLECTIONS.ROOMS, roomId, {
    isActive: false,
    deletedAt: new Date()
  })

  // Update hotel's total rooms count
  const hotel = await getDocument(COLLECTIONS.HOTELS, room.hotelId)
  if (hotel) {
    await updateDocument(COLLECTIONS.HOTELS, room.hotelId, {
      totalRooms: Math.max((hotel.totalRooms || 1) - 1, 0)
    })
  }

  res.json({
    success: true,
    message: 'Room deleted successfully'
  })
})

// Get room booking history (hotel owner only)
export const getRoomBookings = asyncHandler(async (req, res) => {
  const { roomId } = req.params
  const userId = req.user.userId || req.user.uid
  const { status, page = 1, limit = 20 } = req.query

  const room = await getDocument(COLLECTIONS.ROOMS, roomId)
  if (!room) {
    throw new NotFoundError('Room not found')
  }

  if (room.ownerId !== userId) {
    throw new AuthorizationError('You can only view bookings for your own rooms')
  }

  let filters = [
    { field: 'roomId', operator: '==', value: roomId }
  ]

  if (status) {
    filters.push({ field: 'status', operator: '==', value: status })
  }

  const allBookings = await queryDocuments(COLLECTIONS.BOOKINGS, filters, 
    { field: 'createdAt', direction: 'desc' })

  // Apply pagination
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + parseInt(limit)
  const paginatedBookings = allBookings.slice(startIndex, endIndex)

  res.json({
    success: true,
    data: {
      bookings: paginatedBookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(allBookings.length / limit),
        totalBookings: allBookings.length,
        bookingsPerPage: parseInt(limit)
      }
    }
  })
})

// Toggle room availability
export const toggleRoomAvailability = asyncHandler(async (req, res) => {
  const { roomId } = req.params
  const userId = req.user.userId || req.user.uid
  const { available = true } = req.body

  const room = await getDocument(COLLECTIONS.ROOMS, roomId)
  if (!room) {
    throw new NotFoundError('Room not found')
  }

  if (room.ownerId !== userId) {
    throw new AuthorizationError('You can only modify your own rooms')
  }

  const newStatus = available ? 'available' : 'maintenance'

  await updateDocument(COLLECTIONS.ROOMS, roomId, {
    status: newStatus,
    statusUpdatedAt: new Date()
  })

  res.json({
    success: true,
    message: `Room marked as ${newStatus}`,
    data: {
      roomId,
      status: newStatus
    }
  })
})