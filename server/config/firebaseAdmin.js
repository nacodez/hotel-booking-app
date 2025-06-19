import admin from 'firebase-admin'
import dotenv from 'dotenv'

dotenv.config()

let db = null
let firebaseAdminInitialized = false

export const initializeFirebaseAdmin = () => {
  if (firebaseAdminInitialized) {
    return admin
  }

  try {
    // Check if already initialized
    if (admin.apps.length > 0) {
      console.log('Firebase Admin already initialized')
      db = admin.firestore()
      firebaseAdminInitialized = true
      return admin
    }

    // Check if using demo/emulator mode - only use emulator for actual demo project
    const isDemoMode = process.env.FIREBASE_PROJECT_ID === 'demo-project' || 
                       process.env.USE_EMULATOR === 'true'

    if (isDemoMode) {
      console.log('🔥 Initializing Firebase Admin in emulator mode')
      
      // Initialize with minimal config for emulator
      admin.initializeApp({
        projectId: 'demo-project',
        databaseURL: 'https://demo-project-default-rtdb.firebaseio.com'
      })

      db = admin.firestore()
      
      // Configure for emulator
      if (process.env.FIRESTORE_EMULATOR_HOST || process.env.NODE_ENV === 'development') {
        // Set emulator host if not already set
        if (!process.env.FIRESTORE_EMULATOR_HOST) {
          process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
        }
        console.log('🔥 Using Firestore emulator at:', process.env.FIRESTORE_EMULATOR_HOST)
      }

      firebaseAdminInitialized = true
      console.log('✅ Firebase Admin initialized in emulator mode')
      
    } else {
      // Production mode with service account
      console.log('🔧 Initializing Firebase Admin in production mode...')
      
      // Validate required credentials
      const requiredFields = ['FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL']
      for (const field of requiredFields) {
        if (!process.env[field]) {
          throw new Error(`Missing required Firebase credential: ${field}`)
        }
      }

      console.log('🔍 Firebase credentials check:', {
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKeyId: process.env.FIREBASE_PRIVATE_KEY_ID,
        privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
        hasNewlines: process.env.FIREBASE_PRIVATE_KEY?.includes('\\n') || false
      })
      
      const serviceAccount = {
        type: "service_account",
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL,
        client_id: process.env.FIREBASE_CLIENT_ID,
        auth_uri: "https://accounts.google.com/o/oauth2/auth",
        token_uri: "https://oauth2.googleapis.com/token",
        auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
        client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
      }

      console.log('🔑 Service account config:', {
        project_id: serviceAccount.project_id,
        client_email: serviceAccount.client_email,
        private_key_preview: serviceAccount.private_key?.substring(0, 50) + '...'
      })

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: process.env.FIREBASE_PROJECT_ID
      })

      db = admin.firestore()

      firebaseAdminInitialized = true
      console.log('✅ Firebase Admin initialized in production mode')
    }

  } catch (error) {
    console.error('Error initializing Firebase Admin:', error)
    
    // If production mode fails, try emulator mode as fallback
    if (!isDemoMode) {
      console.log('🔄 Falling back to emulator mode...')
      try {
        admin.initializeApp({
          projectId: 'demo-project',
          databaseURL: 'https://demo-project-default-rtdb.firebaseio.com'
        })
        
        db = admin.firestore()
        process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080'
        console.log('🔥 Using Firestore emulator at:', process.env.FIRESTORE_EMULATOR_HOST)
        
        firebaseAdminInitialized = true
        console.log('✅ Firebase Admin initialized in emulator fallback mode')
        return admin
      } catch (fallbackError) {
        console.error('Fallback to emulator also failed:', fallbackError)
      }
    }
    
    throw new Error('Failed to initialize Firebase Admin SDK')
  }

  return admin
}

export const getFirestoreAdmin = () => {
  if (!firebaseAdminInitialized) {
    initializeFirebaseAdmin()
  }
  if (!db) {
    db = admin.firestore()
  }
  return db
}

export const getAuthAdmin = () => {
  if (!firebaseAdminInitialized) {
    initializeFirebaseAdmin()
  }
  return admin.auth()
}

// Collections
export const COLLECTIONS = {
  USERS: 'users',
  BOOKINGS: 'bookings',
  ROOMS: 'rooms',
  ROOM_TYPES: 'roomTypes',
  HOTELS: 'hotels',
  HOTEL_APPLICATIONS: 'hotel_applications'
}

// Helper functions for common operations
export const createDocument = async (collection, data) => {
  try {
    const firestore = getFirestoreAdmin()
    const docRef = await firestore.collection(collection).add({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
    return docRef.id
  } catch (error) {
    console.error(`Error creating document in ${collection}:`, error)
    throw error
  }
}

export const updateDocument = async (collection, docId, data) => {
  try {
    const firestore = getFirestoreAdmin()
    await firestore.collection(collection).doc(docId).update({
      ...data,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
    return true
  } catch (error) {
    console.error(`Error updating document in ${collection}:`, error)
    throw error
  }
}

export const getDocument = async (collection, docId) => {
  try {
    const firestore = getFirestoreAdmin()
    const doc = await firestore.collection(collection).doc(docId).get()
    if (!doc.exists) {
      return null
    }
    return { id: doc.id, ...doc.data() }
  } catch (error) {
    console.error(`Error getting document from ${collection}:`, error)
    throw error
  }
}

export const queryDocuments = async (collection, filters = [], orderBy = null, limit = null) => {
  try {
    const firestore = getFirestoreAdmin()
    let query = firestore.collection(collection)

    // Apply filters
    filters.forEach(filter => {
      query = query.where(filter.field, filter.operator, filter.value)
    })

    // Apply ordering
    if (orderBy) {
      query = query.orderBy(orderBy.field, orderBy.direction || 'asc')
    }

    // Apply limit
    if (limit) {
      query = query.limit(limit)
    }

    const snapshot = await query.get()
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error(`Error querying documents from ${collection}:`, error)
    throw error
  }
}

export const deleteDocument = async (collection, docId) => {
  try {
    const firestore = getFirestoreAdmin()
    await firestore.collection(collection).doc(docId).delete()
    return true
  } catch (error) {
    console.error(`Error deleting document from ${collection}:`, error)
    throw error
  }
}