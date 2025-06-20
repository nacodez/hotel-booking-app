import { getFirestoreAdmin } from '../config/firebaseAdmin.js'
import { asyncHandler } from '../middleware/errorHandler.js'
import emailService from '../services/emailService.js'
import cacheService from '../services/cacheService.js'

const firestore = getFirestoreAdmin()

const generateConfirmationNumber = () => {
  const timestamp = Date.now().toString().slice(-6)
  const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `HB${timestamp}${randomStr}`
}

export const createBookingReservation = asyncHandler(async (req, res) => {
  console.log('🎯 Booking request received')
  console.log('👤 Full req.user object:', JSON.stringify(req.user, null, 2))
  
  const {
    roomId,
    roomName,
    checkInDate,
    checkOutDate,
    guestCount,
    guestInformation,
    totalAmount,
    pricePerNight
  } = req.body

  const userId = req.user?.uid || req.user?.userId || req.user?.id
  console.log('👤 Extracted userId:', userId)

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'User ID not found in token'
    })
  }

  if (!roomId || !checkInDate || !checkOutDate || !guestInformation) {
    return res.status(400).json({
      success: false,
      message: 'Missing required booking information'
    })
  }

  try {
    console.log('🏨 Checking if room exists:', roomId)
    const roomDoc = await firestore.collection('rooms').doc(roomId).get()
    if (!roomDoc.exists) {
      console.log('❌ Room not found:', roomId)
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      })
    }
    console.log('✅ Room found:', roomDoc.data()?.name)

    // TODO: Re-enable booking conflict check after creating Firestore index
    // For now, skip conflict checking to allow bookings to work
    console.log('📅 Skipping booking conflict check (index needed)')
    
    // const conflictingBookings = await firestore.collection('bookings')
    //   .where('roomId', '==', roomId)
    //   .where('status', 'in', ['confirmed', 'checked-in'])
    //   .where('checkInDate', '<=', checkOutDate)
    //   .where('checkOutDate', '>=', checkInDate)
    //   .get()

    // if (!conflictingBookings.empty) {
    //   return res.status(409).json({
    //     success: false,
    //     message: 'Room is not available for the selected dates'
    //   })
    // }

    const confirmationNumber = generateConfirmationNumber()
    
    const bookingData = {
      userId,
      roomId,
      roomName,
      checkInDate,
      checkOutDate,
      guestCount: guestCount || 1,
      guestInformation,
      totalAmount,
      pricePerNight,
      confirmationNumber,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    console.log('💾 Creating booking in Firestore...')
    const bookingRef = await firestore.collection('bookings').add(bookingData)
    console.log('✅ Booking created successfully:', bookingRef.id)

    // Invalidate availability cache for this room when booking is created
    try {
      cacheService.invalidateAvailabilityCache(roomId)
    } catch (cacheError) {
      console.warn('⚠️ Cache invalidation failed during booking creation (non-critical):', cacheError.message)
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: {
        bookingId: bookingRef.id,
        confirmationNumber,
        ...bookingData
      }
    })
  } catch (error) {
    console.error('Error creating booking:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create booking reservation'
    })
  }
})

export const getUserBookingHistory = asyncHandler(async (req, res) => {
  const userId = req.user.userId || req.user.uid

  console.log('📚 getUserBookingHistory called for userId:', userId)
  console.log('📚 req.user object:', JSON.stringify(req.user, null, 2))

  try {
    console.log('📚 Querying bookings collection for userId:', userId)
    
    // First try without orderBy to avoid index issues
    const bookingsSnapshot = await firestore.collection('bookings')
      .where('userId', '==', userId)
      .get()

    console.log('📚 Firestore query completed. Found', bookingsSnapshot.size, 'documents')

    const userBookings = []
    bookingsSnapshot.forEach(doc => {
      console.log('📚 Processing booking doc:', doc.id, doc.data())
      userBookings.push({
        id: doc.id,
        ...doc.data()
      })
    })

    // Sort in memory instead of in query to avoid index requirements
    userBookings.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0)
      const dateB = new Date(b.createdAt || 0)
      return dateB - dateA // Descending order
    })

    console.log('📚 Final user bookings:', userBookings.length, 'items')

    res.json({
      success: true,
      data: userBookings
    })
  } catch (error) {
    console.error('❌ Error fetching user bookings:', error)
    console.error('❌ Error stack:', error.stack)
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      name: error.name
    })
    
    res.status(500).json({
      success: false,
      message: `Failed to fetch booking history: ${error.message}`,
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    })
  }
})

export const cancelBookingReservation = asyncHandler(async (req, res) => {
  const { bookingId } = req.params
  const userId = req.user.userId || req.user.uid

  console.log('❌ Cancel booking request:', { bookingId, userId })

  if (!bookingId) {
    console.log('❌ Missing booking ID')
    return res.status(400).json({
      success: false,
      message: 'Booking ID is required'
    })
  }

  try {
    console.log('❌ Fetching booking document:', bookingId)
    const bookingDoc = await firestore.collection('bookings').doc(bookingId).get()

    if (!bookingDoc.exists) {
      console.log('❌ Booking not found:', bookingId)
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      })
    }

    const bookingData = bookingDoc.data()
    console.log('❌ Booking data:', { 
      bookingUserId: bookingData.userId, 
      requestUserId: userId, 
      status: bookingData.status,
      roomId: bookingData.roomId 
    })

    if (bookingData.userId !== userId) {
      console.log('❌ User not authorized:', { bookingUserId: bookingData.userId, requestUserId: userId })
      console.log('❌ Booking confirmation:', bookingData.confirmationNumber)
      console.log('❌ This suggests a data inconsistency - booking appeared in user dashboard but belongs to different user')
      return res.status(403).json({
        success: false,
        message: `Not authorized to cancel this booking. This booking belongs to user ${bookingData.userId} but you are ${userId}`
      })
    }

    if (bookingData.status === 'cancelled') {
      console.log('❌ Booking already cancelled')
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      })
    }

    console.log('❌ Updating booking status to cancelled')
    await firestore.collection('bookings').doc(bookingId).update({
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    // Invalidate availability cache for this room when booking is cancelled
    try {
      console.log('❌ Invalidating cache for room:', bookingData.roomId)
      cacheService.invalidateAvailabilityCache(bookingData.roomId)
      console.log('✅ Cache invalidated successfully')
    } catch (cacheError) {
      console.warn('⚠️ Cache invalidation failed (non-critical):', cacheError.message)
      // Don't fail the cancellation if cache invalidation fails
    }

    console.log('✅ Booking cancelled successfully')
    res.json({
      success: true,
      message: 'Booking cancelled successfully'
    })
  } catch (error) {
    console.error('Error cancelling booking:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking'
    })
  }
})

export const getBookingDetails = asyncHandler(async (req, res) => {
  const { bookingId } = req.params
  const userId = req.user.userId || req.user.uid

  try {
    const bookingDoc = await firestore.collection('bookings').doc(bookingId).get()

    if (!bookingDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      })
    }

    const bookingData = bookingDoc.data()

    if (bookingData.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      })
    }

    res.json({
      success: true,
      data: {
        id: bookingDoc.id,
        ...bookingData
      }
    })
  } catch (error) {
    console.error('Error fetching booking details:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking details'
    })
  }
})

export const sendBookingEmail = asyncHandler(async (req, res) => {
  const { bookingId } = req.params
  const userId = req.user?.uid || req.user?.userId || req.user?.id

  console.log('📧 Email request for booking:', bookingId)

  if (!bookingId) {
    return res.status(400).json({
      success: false,
      message: 'Booking ID is required'
    })
  }

  try {
    // Verify booking exists and belongs to user
    const bookingDoc = await firestore.collection('bookings').doc(bookingId).get()
    
    if (!bookingDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      })
    }

    const bookingData = bookingDoc.data()
    
    if (bookingData.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to send email for this booking'
      })
    }

    // Send email
    console.log('📧 Sending email for booking:', bookingId)
    const emailResult = await emailService.sendBookingConfirmation(bookingId)
    
    res.json({
      success: true,
      message: 'Booking confirmation email sent successfully',
      data: {
        messageId: emailResult.messageId,
        recipient: emailResult.recipient
      }
    })
  } catch (error) {
    console.error('Error sending booking email:', error)
    
    // Determine if it's an email service error or other error
    let errorMessage = 'Failed to send booking confirmation email'
    if (error.message.includes('Email service not initialized')) {
      errorMessage = 'Email service is not properly configured'
    } else if (error.message.includes('authentication')) {
      errorMessage = 'Email authentication failed. Please check email configuration.'
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
})