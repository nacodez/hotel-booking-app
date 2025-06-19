#!/usr/bin/env node

import { getFirestoreAdmin, COLLECTIONS } from '../config/firebaseAdmin.js'
import { UserService } from '../services/firestoreService.js'

const firestore = getFirestoreAdmin()

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
}

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`
}

function formatDate(date) {
  if (!date) return 'N/A'
  try {
    if (date._seconds) {
      // Firestore timestamp
      return new Date(date._seconds * 1000).toLocaleString()
    } else if (date.toDate) {
      // Firestore timestamp object
      return date.toDate().toLocaleString()
    } else {
      // Regular date
      return new Date(date).toLocaleString()
    }
  } catch (error) {
    return 'Invalid Date'
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'active': return 'green'
    case 'pending-approval': return 'yellow'
    case 'suspended': return 'red'
    case 'rejected': return 'red'
    case 'deleted': return 'dim'
    default: return 'white'
  }
}

function printUserSummary(users) {
  console.log('\n' + colorize('='.repeat(80), 'cyan'))
  console.log(colorize('USER SUMMARY', 'cyan'))
  console.log(colorize('='.repeat(80), 'cyan'))

  const statusCounts = {}
  const roleCounts = {}
  
  users.forEach(user => {
    // Count by status
    statusCounts[user.status] = (statusCounts[user.status] || 0) + 1
    
    // Count by roles
    if (user.roles && Array.isArray(user.roles)) {
      user.roles.forEach(role => {
        roleCounts[role] = (roleCounts[role] || 0) + 1
      })
    }
  })

  console.log(`${colorize('Total Users:', 'bright')} ${users.length}`)
  console.log('')

  console.log(colorize('Status Distribution:', 'bright'))
  Object.entries(statusCounts).forEach(([status, count]) => {
    const color = getStatusColor(status)
    console.log(`  ${colorize(status.padEnd(20), color)} ${count}`)
  })
  console.log('')

  console.log(colorize('Role Distribution:', 'bright'))
  Object.entries(roleCounts).forEach(([role, count]) => {
    console.log(`  ${colorize(role.padEnd(20), 'blue')} ${count}`)
  })
}

function printUserDetails(users) {
  console.log('\n' + colorize('='.repeat(120), 'cyan'))
  console.log(colorize('USER DETAILS', 'cyan'))
  console.log(colorize('='.repeat(120), 'cyan'))

  if (users.length === 0) {
    console.log(colorize('No users found in the database.', 'yellow'))
    return
  }

  // Table header
  const header = `${'ID'.padEnd(20)} ${'Name'.padEnd(25)} ${'Email'.padEnd(35)} ${'Status'.padEnd(18)} ${'Roles'.padEnd(20)} ${'Registered'.padEnd(20)}`
  console.log(colorize(header, 'bright'))
  console.log(colorize('-'.repeat(120), 'dim'))

  users.forEach(user => {
    const id = (user.id || 'N/A').substring(0, 18).padEnd(20)
    const name = `${user.firstName || ''} ${user.lastName || ''}`.trim().substring(0, 23).padEnd(25)
    const email = (user.email || 'N/A').substring(0, 33).padEnd(35)
    const status = (user.status || 'unknown').padEnd(18)
    const roles = (user.roles && Array.isArray(user.roles) ? user.roles.join(', ') : 'N/A').substring(0, 18).padEnd(20)
    const registered = formatDate(user.registrationDate || user.createdAt).substring(0, 18).padEnd(20)

    const statusColor = getStatusColor(user.status)
    const formattedStatus = colorize(status, statusColor)
    
    console.log(`${id} ${name} ${email} ${formattedStatus} ${roles} ${registered}`)
  })
}

function printBusinessUsers(users) {
  const businessUsers = users.filter(user => user.businessInfo && Object.keys(user.businessInfo).length > 0)
  
  if (businessUsers.length === 0) {
    console.log(colorize('\nNo business users found.', 'yellow'))
    return
  }

  console.log('\n' + colorize('='.repeat(100), 'cyan'))
  console.log(colorize('BUSINESS USERS (Hotel Owners)', 'cyan'))
  console.log(colorize('='.repeat(100), 'cyan'))

  businessUsers.forEach(user => {
    console.log(colorize(`\nUser: ${user.firstName} ${user.lastName} (${user.email})`, 'bright'))
    console.log(colorize(`Status: ${user.status}`, getStatusColor(user.status)))
    
    if (user.businessInfo) {
      const business = user.businessInfo
      console.log(`  Business Name: ${business.businessName || 'N/A'}`)
      console.log(`  Business Type: ${business.businessType || 'N/A'}`)
      console.log(`  Business Phone: ${business.businessPhone || 'N/A'}`)
      console.log(`  Business Email: ${business.businessEmail || 'N/A'}`)
      if (business.description) {
        console.log(`  Description: ${business.description.substring(0, 100)}${business.description.length > 100 ? '...' : ''}`)
      }
    }
    
    if (user.approvalStatus && user.approvalStatus !== 'pending') {
      console.log(`  Approval Status: ${colorize(user.approvalStatus, user.approvalStatus === 'approved' ? 'green' : 'red')}`)
      if (user.approvalDate) {
        console.log(`  Approval Date: ${formatDate(user.approvalDate)}`)
      }
      if (user.rejectionReason) {
        console.log(`  Rejection Reason: ${colorize(user.rejectionReason, 'red')}`)
      }
    }
  })
}

async function listAllUsers() {
  try {
    console.log(colorize('Connecting to Firestore...', 'blue'))
    
    // Get all users from the users collection
    const usersSnapshot = await firestore.collection(COLLECTIONS.USERS).get()
    
    if (usersSnapshot.empty) {
      console.log(colorize('No users found in the database.', 'yellow'))
      return
    }

    const users = []
    usersSnapshot.forEach(doc => {
      const userData = doc.data()
      users.push({
        id: doc.id,
        ...userData
      })
    })

    // Sort users by registration date (newest first)
    users.sort((a, b) => {
      const dateA = a.registrationDate || a.createdAt || new Date(0)
      const dateB = b.registrationDate || b.createdAt || new Date(0)
      
      if (dateA._seconds && dateB._seconds) {
        return dateB._seconds - dateA._seconds
      } else if (dateA.toDate && dateB.toDate) {
        return dateB.toDate() - dateA.toDate()
      } else {
        return new Date(dateB) - new Date(dateA)
      }
    })

    // Print summary statistics
    printUserSummary(users)
    
    // Print user details
    printUserDetails(users)
    
    // Print business users separately
    printBusinessUsers(users)

    console.log('\n' + colorize('='.repeat(80), 'green'))
    console.log(colorize(`Successfully retrieved ${users.length} users from Firestore`, 'green'))
    console.log(colorize('='.repeat(80), 'green'))

  } catch (error) {
    console.error(colorize('Error retrieving users:', 'red'), error.message)
    
    if (error.code === 'permission-denied') {
      console.log(colorize('\nThis might be due to:', 'yellow'))
      console.log('- Firestore security rules preventing access')
      console.log('- Invalid Firebase credentials')
      console.log('- Missing admin privileges')
    } else if (error.code === 'not-found') {
      console.log(colorize('\nThe users collection might not exist yet.', 'yellow'))
    }
    
    process.exit(1)
  }
}

// Enhanced version with search and filter options
async function listUsersWithOptions() {
  const args = process.argv.slice(2)
  const options = {}
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--status':
        options.status = args[++i]
        break
      case '--role':
        options.role = args[++i]
        break
      case '--search':
        options.search = args[++i]
        break
      case '--limit':
        options.limit = parseInt(args[++i])
        break
      case '--help':
        console.log(colorize('Usage: node list-users.js [options]', 'bright'))
        console.log('')
        console.log('Options:')
        console.log('  --status <status>    Filter by status (active, pending-approval, suspended, rejected, deleted)')
        console.log('  --role <role>        Filter by role (user, hotel-owner, admin)')
        console.log('  --search <term>      Search by name or email')
        console.log('  --limit <number>     Limit number of results')
        console.log('  --help               Show this help message')
        console.log('')
        console.log('Examples:')
        console.log('  node list-users.js')
        console.log('  node list-users.js --status active')
        console.log('  node list-users.js --role hotel-owner')
        console.log('  node list-users.js --search john')
        console.log('  node list-users.js --status pending-approval --limit 10')
        return
    }
  }

  try {
    console.log(colorize('Connecting to Firestore...', 'blue'))
    
    let query = firestore.collection(COLLECTIONS.USERS)
    
    // Apply filters
    if (options.status) {
      query = query.where('status', '==', options.status)
      console.log(colorize(`Filtering by status: ${options.status}`, 'blue'))
    }
    
    if (options.role) {
      query = query.where('roles', 'array-contains', options.role)
      console.log(colorize(`Filtering by role: ${options.role}`, 'blue'))
    }
    
    if (options.limit) {
      query = query.limit(options.limit)
      console.log(colorize(`Limiting results to: ${options.limit}`, 'blue'))
    }
    
    const snapshot = await query.get()
    
    if (snapshot.empty) {
      console.log(colorize('No users found matching the criteria.', 'yellow'))
      return
    }

    let users = []
    snapshot.forEach(doc => {
      users.push({
        id: doc.id,
        ...doc.data()
      })
    })

    // Apply search filter (client-side since Firestore doesn't support full-text search)
    if (options.search) {
      const searchTerm = options.search.toLowerCase()
      users = users.filter(user => 
        (user.firstName && user.firstName.toLowerCase().includes(searchTerm)) ||
        (user.lastName && user.lastName.toLowerCase().includes(searchTerm)) ||
        (user.email && user.email.toLowerCase().includes(searchTerm)) ||
        (user.businessInfo && user.businessInfo.businessName && 
         user.businessInfo.businessName.toLowerCase().includes(searchTerm))
      )
      console.log(colorize(`Searching for: ${options.search}`, 'blue'))
    }

    if (users.length === 0) {
      console.log(colorize('No users found matching the search criteria.', 'yellow'))
      return
    }

    // Print results
    printUserSummary(users)
    printUserDetails(users)
    
    if (users.some(user => user.businessInfo)) {
      printBusinessUsers(users)
    }

    console.log('\n' + colorize('='.repeat(80), 'green'))
    console.log(colorize(`Found ${users.length} users matching criteria`, 'green'))
    console.log(colorize('='.repeat(80), 'green'))

  } catch (error) {
    console.error(colorize('Error retrieving users:', 'red'), error.message)
    process.exit(1)
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(colorize('Hotel Booking System - User Listing Tool', 'bright'))
  console.log(colorize('='.repeat(50), 'bright'))
  
  // Check if we have command line arguments
  if (process.argv.length > 2) {
    await listUsersWithOptions()
  } else {
    await listAllUsers()
  }
}