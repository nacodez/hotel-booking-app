#!/usr/bin/env node

import bcrypt from 'bcryptjs'
import { 
  initializeFirebaseAdmin, 
  createDocument, 
  queryDocuments, 
  COLLECTIONS 
} from '../config/firebaseAdmin.js'

// Initialize Firebase Admin
initializeFirebaseAdmin()

const hashPassword = async (password) => {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

const createHotelOwnerUser = async (email, password, firstName, lastName, role = 'hotel-owner') => {
  try {
    console.log(`🔍 Checking if user ${email} already exists...`)
    
    // Check if user already exists
    const existingUsers = await queryDocuments(COLLECTIONS.USERS, [
      { field: 'email', operator: '==', value: email.toLowerCase() }
    ])

    if (existingUsers.length > 0) {
      console.log(`⚠️  User ${email} already exists with ID: ${existingUsers[0].id}`)
      return existingUsers[0]
    }

    console.log(`🔐 Hashing password for ${email}...`)
    const hashedPassword = await hashPassword(password)

    console.log(`👤 Creating user ${email} in Firestore...`)
    const userData = {
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      emailVerified: true,
      status: 'active',
      roles: [role],
      provider: 'email',
      registrationDate: new Date(),
      lastLoginAt: null,
      refreshToken: null,
      loginHistory: []
    }

    const userId = await createDocument(COLLECTIONS.USERS, userData)
    console.log(`✅ Successfully created user ${email} with ID: ${userId}`)
    
    return { id: userId, ...userData }
  } catch (error) {
    console.error(`❌ Error creating user ${email}:`, error)
    throw error
  }
}

const main = async () => {
  console.log('🏨 Hotel Owner User Creation Script')
  console.log('===================================')
  
  try {
    // Create hotel owner users
    const usersToCreate = [
      {
        email: 'hotelowner@email.com',
        password: 'password123', // You should change this to a secure password
        firstName: 'Hotel',
        lastName: 'Owner',
        role: 'hotel-owner'
      },
      {
        email: 'hotelowneradmin@email.com', 
        password: 'admin123', // You should change this to a secure password
        firstName: 'Hotel Owner',
        lastName: 'Admin',
        role: 'hotel-owner'
      }
    ]

    console.log(`\n📝 Creating ${usersToCreate.length} hotel owner users...\n`)

    for (const userData of usersToCreate) {
      await createHotelOwnerUser(
        userData.email,
        userData.password,
        userData.firstName,
        userData.lastName,
        userData.role
      )
      console.log('') // Empty line for readability
    }

    console.log('🎉 All hotel owner users created successfully!')
    console.log('\n📋 You can now login with these credentials:')
    console.log('  - hotelowner@email.com / password123')
    console.log('  - hotelowneradmin@email.com / admin123')
    console.log('\n⚠️  IMPORTANT: Please change these default passwords after first login!')
    
  } catch (error) {
    console.error('💥 Script failed:', error)
    process.exit(1)
  }
}

// Run the script
main().then(() => {
  console.log('\n🏁 Script completed successfully')
  process.exit(0)
}).catch((error) => {
  console.error('💥 Script failed:', error)
  process.exit(1)
})