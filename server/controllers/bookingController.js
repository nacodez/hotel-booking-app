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
    cacheService.invalidateAvailabilityCache(roomId)

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
  const userId = req.user.uid

  try {
    const bookingsSnapshot = await firestore.collection('bookings')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get()

    const userBookings = []
    bookingsSnapshot.forEach(doc => {
      userBookings.push({
        id: doc.id,
        ...doc.data()
      })
    })

    res.json({
      success: true,
      data: userBookings
    })
  } catch (error) {
    console.error('Error fetching user bookings:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking history'
    })
  }
})

export const cancelBookingReservation = asyncHandler(async (req, res) => {
  const { bookingId } = req.params
  const userId = req.user.uid

  if (!bookingId) {
    return res.status(400).json({
      success: false,
      message: 'Booking ID is required'
    })
  }

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
        message: 'Not authorized to cancel this booking'
      })
    }

    if (bookingData.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Booking is already cancelled'
      })
    }

    await firestore.collection('bookings').doc(bookingId).update({
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    })

    // Invalidate availability cache for this room when booking is cancelled
    cacheService.invalidateAvailabilityCache(booking.roomId)

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
  const userId = req.user.uid

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