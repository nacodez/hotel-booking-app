import express from 'express'
import { body } from 'express-validator'
import { 
  createBookingReservation, 
  getUserBookingHistory, 
  cancelBookingReservation,
  getBookingDetails,
  sendBookingEmail 
} from '../controllers/bookingController.js'
import { verifyJWTToken } from '../middleware/authMiddleware.js'

const router = express.Router()

// Debug middleware to log all booking requests  
router.use((req, res, next) => {
  console.log(`📝 Booking route hit: ${req.method} ${req.originalUrl}`)
  console.log('📝 Request body:', JSON.stringify(req.body, null, 2))
  console.log('📝 Headers:', req.headers.authorization ? 'Auth present' : 'No auth')
  next()
})

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('❌ Booking route error:', error)
  res.status(500).json({
    success: false,
    message: error.message || 'Internal server error'
  })
})

const validateBookingData = [
  body('roomId')
    .notEmpty()
    .withMessage('Room ID is required'),
  body('roomName')
    .trim()
    .notEmpty()
    .withMessage('Room name is required'),
  body('checkInDate')
    .isISO8601()
    .withMessage('Check-in date must be a valid date'),
  body('checkOutDate')
    .isISO8601()
    .withMessage('Check-out date must be a valid date')
    .custom((checkOutDate, { req }) => {
      if (new Date(checkOutDate) <= new Date(req.body.checkInDate)) {
        throw new Error('Check-out date must be after check-in date')
      }
      return true
    }),
  body('guestCount')
    .isInt({ min: 1, max: 10 })
    .withMessage('Guest count must be between 1 and 10'),
  body('guestInformation')
    .isObject()
    .withMessage('Guest information is required'),
  body('guestInformation.firstName')
    .trim()
    .notEmpty()
    .withMessage('First name is required'),
  body('guestInformation.lastName')
    .trim()
    .notEmpty()
    .withMessage('Last name is required'),
  body('guestInformation.email')
    .isEmail()
    .withMessage('Valid email is required'),
  body('guestInformation.phoneNumber')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required'),
  body('totalAmount')
    .isFloat({ min: 0 })
    .withMessage('Total amount must be a positive number'),
  body('pricePerNight')
    .isFloat({ min: 0 })
    .withMessage('Price per night must be a positive number')
]

router.post('/create', verifyJWTToken, validateBookingData, createBookingReservation)

router.get('/user-history', verifyJWTToken, getUserBookingHistory)

router.get('/:bookingId', verifyJWTToken, getBookingDetails)

router.delete('/:bookingId/cancel', verifyJWTToken, cancelBookingReservation)

router.post('/:bookingId/send-email', verifyJWTToken, sendBookingEmail)

// Test endpoint for debugging
router.get('/test', verifyJWTToken, async (req, res) => {
  try {
    console.log('🧪 Booking test endpoint called')
    console.log('🧪 User from token:', req.user)
    
    const { getFirestoreAdmin } = await import('../config/firebaseAdmin.js')
    const firestore = getFirestoreAdmin()
    
    // Test basic Firestore connection
    const testCollection = await firestore.collection('bookings').limit(1).get()
    console.log('🧪 Firestore test query successful, found:', testCollection.size, 'documents')
    
    res.json({
      success: true,
      message: 'Booking test successful',
      user: req.user,
      firestoreWorking: true,
      testDocuments: testCollection.size
    })
  } catch (error) {
    console.error('🧪 Booking test failed:', error)
    res.status(500).json({
      success: false,
      message: 'Booking test failed',
      error: error.message,
      stack: error.stack
    })
  }
})

export default router