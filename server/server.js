import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { initializeFirebaseAdmin } from './config/firebaseAdmin.js'
import roomRoutes from './routes/roomRoutes.js'
import bookingRoutes from './routes/bookingRoutes.js'
import authRoutes from './routes/authRoutes.js'
import hotelRoutes from './routes/hotelRoutes.js'
import emailRoutes from './routes/emailRoutes.js'
import { errorHandler } from './middleware/errorHandler.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

const rateLimitConfig = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later.'
})

app.use(helmet())
app.use(rateLimitConfig)
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}))

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Handle preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', process.env.CLIENT_URL || 'http://localhost:3000')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.header('Access-Control-Allow-Credentials', 'true')
  res.sendStatus(200)
})

// Debug middleware to log all requests
app.use((req, res, next) => {
  if (req.path.includes('/bookings')) {
    console.log(`🌐 Server received: ${req.method} ${req.path}`)
  }
  next()
})

console.log('🔥 Initializing Firebase Admin...')
try {
  initializeFirebaseAdmin()
  console.log('✅ Firebase Admin initialized successfully')
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error)
  process.exit(1)
}

app.use('/api/rooms', roomRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/hotels', hotelRoutes)
app.use('/api/email', emailRoutes)

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Hotel booking API is running',
    timestamp: new Date().toISOString()
  })
})

// Test Firebase connection
app.get('/api/test-firebase', async (req, res) => {
  try {
    const { getFirestoreAdmin } = await import('./config/firebaseAdmin.js')
    const firestore = getFirestoreAdmin()
    
    // Try a simple query to test connection
    const testQuery = await firestore.collection('rooms').limit(1).get()
    
    res.json({
      success: true,
      message: 'Firebase connection successful',
      documentsFound: testQuery.size
    })
  } catch (error) {
    console.error('❌ Firebase test failed:', error)
    res.status(500).json({
      success: false,
      message: 'Firebase connection failed',
      error: error.message
    })
  }
})

// Test auth middleware
app.get('/api/test-auth', async (req, res) => {
  try {
    const { verifyJWTToken } = await import('./middleware/authMiddleware.js')
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      })
    }
    
    // Manually verify token for testing
    const decoded = await new Promise((resolve, reject) => {
      verifyJWTToken(req, res, (err) => {
        if (err) reject(err)
        else resolve(req.user)
      })
    })
    
    res.json({
      success: true,
      message: 'Auth test successful',
      user: req.user
    })
  } catch (error) {
    console.error('❌ Auth test failed:', error)
    res.status(500).json({
      success: false,
      message: 'Auth test failed',
      error: error.message
    })
  }
})

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  })
})

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Hotel booking server running on port ${PORT}`)
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`)
})