import { getFirestoreAdmin, initializeFirebaseAdmin } from './config/firebaseAdmin.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

process.env.NODE_ENV = 'production';

const rooms = [
  {
    name: "Deluxe Ocean View",
    type: "deluxe",
    price: 250,
    capacity: 2,
    maxOccupancy: 2,
    bedType: "king",
    amenities: ["Ocean View", "King Bed", "Mini Bar", "WiFi", "Air Conditioning"],
    description: "Luxurious room with stunning ocean views and premium amenities",
    images: ["https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=500"],
    available: true,
    roomStatus: "available",
    hotelId: "main-hotel",
    roomNumber: "201",
    bookingPolicy: {
      advanceBookingDays: 365,
      minStayNights: 1,
      maxStayNights: 30
    }
  },
  {
    name: "Standard City View",
    type: "standard", 
    price: 150,
    capacity: 2,
    maxOccupancy: 2,
    bedType: "queen",
    amenities: ["City View", "Queen Bed", "WiFi", "Air Conditioning"],
    description: "Comfortable room with city views and essential amenities",
    images: ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500"],
    available: true,
    roomStatus: "available",
    hotelId: "main-hotel",
    roomNumber: "101",
    bookingPolicy: {
      advanceBookingDays: 365,
      minStayNights: 1,
      maxStayNights: 30
    }
  },
  {
    name: "Family Suite",
    type: "suite",
    price: 400,
    capacity: 4,
    maxOccupancy: 4,
    bedType: "multiple",
    amenities: ["Living Room", "2 Bedrooms", "Kitchen", "WiFi", "Air Conditioning", "Balcony"],
    description: "Spacious suite perfect for families with separate living area", 
    images: ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=500"],
    available: true,
    roomStatus: "available",
    hotelId: "main-hotel",
    roomNumber: "301",
    bookingPolicy: {
      advanceBookingDays: 365,
      minStayNights: 1,
      maxStayNights: 30
    }
  },
  {
    name: "Executive Business Suite",
    type: "executive",
    price: 350,
    capacity: 2,
    maxOccupancy: 3,
    bedType: "king",
    amenities: ["Business Center", "King Bed", "Work Desk", "Mini Bar", "WiFi", "Air Conditioning", "City View"],
    description: "Perfect for business travelers with dedicated work space and premium amenities",
    images: ["https://images.unsplash.com/photo-1590490360182-c33d57733427?w=500"],
    available: true,
    roomStatus: "available",
    hotelId: "main-hotel",
    roomNumber: "401",
    bookingPolicy: {
      advanceBookingDays: 365,
      minStayNights: 1,
      maxStayNights: 30
    }
  },
  {
    name: "Budget Room",
    type: "budget",
    price: 100,
    capacity: 1,
    maxOccupancy: 2,
    bedType: "single",
    amenities: ["Single Bed", "WiFi", "Air Conditioning", "Shared Bathroom"],
    description: "Affordable accommodation with essential amenities for budget travelers",
    images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500"],
    available: true,
    roomStatus: "available",
    hotelId: "main-hotel",
    roomNumber: "102",
    bookingPolicy: {
      advanceBookingDays: 180,
      minStayNights: 1,
      maxStayNights: 14
    }
  }
];

async function addRooms() {
  try {
    console.log('🔥 Starting to add rooms...');
    console.log('🔧 Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      // FIRESTORE_EMULATOR_HOST: process.env.FIRESTORE_EMULATOR_HOST,
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID
    });
    
    // Initialize Firebase Admin first
    console.log('🔥 Initializing Firebase Admin...');
    await initializeFirebaseAdmin();
    
    const db = getFirestoreAdmin();
    console.log('✅ Firebase Admin initialized successfully');
    
    // Clear existing rooms first
    const existingRooms = await db.collection('rooms').get();
    const batch = db.batch();
    existingRooms.forEach(doc => {
      batch.delete(doc.ref);
    });
    await batch.commit();
    console.log('🗑️ Cleared existing rooms');
    
    // Add new rooms
    for (const room of rooms) {
      const docRef = await db.collection('rooms').add({
        ...room,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`✅ Added room: ${room.name} (ID: ${docRef.id})`);
    }
    
    console.log('🎉 All rooms added successfully!');
    console.log('📍 You can view them at: http://localhost:4000/firestore');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding rooms:', error);
    process.exit(1);
  }
}

addRooms();