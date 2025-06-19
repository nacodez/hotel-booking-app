import { getFirestoreAdmin, initializeFirebaseAdmin } from './config/firebaseAdmin.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

process.env.NODE_ENV = 'production';

const rooms = [
  // Original rooms
  {
    name: "Deluxe Ocean View",
    type: "deluxe", 
    price: 250,
    capacity: 2,
    maxOccupancy: 2,
    bedType: "king",
    amenities: ["Ocean View", "King Bed", "Mini Bar", "WiFi", "Air Conditioning"],
    description: "Luxurious room with stunning ocean views and premium amenities",
    images: ["https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80"],
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
    images: ["https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=800&q=80"],
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
    images: ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80"],
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
    images: ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80"],
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
    images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80"],
    available: true,
    roomStatus: "available",
    hotelId: "main-hotel",
    roomNumber: "102",
    bookingPolicy: {
      advanceBookingDays: 180,
      minStayNights: 1,
      maxStayNights: 14
    }
  },
  
  // Additional Deluxe Rooms
  {
    name: "Deluxe Garden View",
    type: "deluxe",
    price: 220,
    capacity: 2,
    maxOccupancy: 3,
    bedType: "queen",
    amenities: ["Garden View", "Queen Bed", "Balcony", "WiFi", "Room Service"],
    description: "Beautiful room overlooking the hotel gardens with private balcony",
    images: ["https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80"],
    available: true,
    roomStatus: "available",
    hotelId: "main-hotel", 
    roomNumber: "202",
    bookingPolicy: {
      advanceBookingDays: 365,
      minStayNights: 1,
      maxStayNights: 30
    }
  },
  {
    name: "Deluxe Corner Suite",
    type: "deluxe",
    price: 320,
    capacity: 2,
    maxOccupancy: 2,
    bedType: "king",
    amenities: ["Corner Location", "King Bed", "Sitting Area", "Mini Bar", "WiFi", "City View"],
    description: "Spacious corner room with extra windows and seating area",
    images: ["https://images.unsplash.com/photo-1591088398332-8a7791972843?w=800&q=80"],
    available: true,
    roomStatus: "available",
    hotelId: "main-hotel",
    roomNumber: "203",
    bookingPolicy: {
      advanceBookingDays: 365,
      minStayNights: 1,
      maxStayNights: 30
    }
  },
  {
    name: "Deluxe Poolside",
    type: "deluxe", 
    price: 280,
    capacity: 2,
    maxOccupancy: 2,
    bedType: "king",
    amenities: ["Pool Access", "King Bed", "Patio", "WiFi", "Mini Fridge"],
    description: "Ground floor room with direct access to the pool area",
    images: ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80"],
    available: true,
    roomStatus: "available",
    hotelId: "main-hotel",
    roomNumber: "105",
    bookingPolicy: {
      advanceBookingDays: 365,
      minStayNights: 1,
      maxStayNights: 30
    }
  },
  {
    name: "Deluxe Terrace Room",
    type: "deluxe",
    price: 300,
    capacity: 3,
    maxOccupancy: 3,
    bedType: "king",
    amenities: ["Private Terrace", "King Bed", "Outdoor Furniture", "WiFi", "Coffee Maker"],
    description: "Top floor room with large private terrace and city views",
    images: ["https://images.unsplash.com/photo-1568495248636-6432b97bd949?w=800&q=80"],
    available: true,
    roomStatus: "available",
    hotelId: "main-hotel",
    roomNumber: "501",
    bookingPolicy: {
      advanceBookingDays: 365,
      minStayNights: 1,
      maxStayNights: 30
    }
  },
  {
    name: "Deluxe Twin View",
    type: "deluxe",
    price: 240,
    capacity: 2,
    maxOccupancy: 2,
    bedType: "twin",
    amenities: ["Twin Beds", "Mountain View", "Work Desk", "WiFi", "Air Conditioning"],
    description: "Perfect for friends or colleagues with two comfortable twin beds",
    images: ["https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80"],
    available: true,
    roomStatus: "available",
    hotelId: "main-hotel",
    roomNumber: "204",
    bookingPolicy: {
      advanceBookingDays: 365,
      minStayNights: 1,
      maxStayNights: 30
    }
  },

  // Additional Standard Rooms
  {
    name: "Standard Double",
    type: "standard",
    price: 140,
    capacity: 2,
    maxOccupancy: 2,
    bedType: "queen",
    amenities: ["Queen Bed", "WiFi", "Air Conditioning", "Cable TV"],
    description: "Comfortable standard room with all the basics you need",
    images: ["https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80"],
    available: true,
    roomStatus: "available",
    hotelId: "main-hotel",
    roomNumber: "103",
    bookingPolicy: {
      advanceBookingDays: 365,
      minStayNights: 1,
      maxStayNights: 30
    }
  },
  {
    name: "Standard Twin",
    type: "standard",
    price: 130,
    capacity: 2,
    maxOccupancy: 2,
    bedType: "twin",
    amenities: ["Twin Beds", "WiFi", "Air Conditioning", "Work Area"],
    description: "Two single beds perfect for business travelers or friends",
    images: ["https://images.unsplash.com/photo-1540518614846-7eded433c457?w=800&q=80"],
    available: true,
    roomStatus: "available",
    hotelId: "main-hotel",
    roomNumber: "104",
    bookingPolicy: {
      advanceBookingDays: 365,
      minStayNights: 1,
      maxStayNights: 30
    }
  },
  {
    name: "Standard King",
    type: "standard",
    price: 160,
    capacity: 2,
    maxOccupancy: 3,
    bedType: "king",
    amenities: ["King Bed", "WiFi", "Air Conditioning", "Mini Fridge", "Coffee Maker"],
    description: "Spacious king bed room with extra amenities",
    images: ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80"],
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
    name: "Standard Garden",
    type: "standard",
    price: 155,
    capacity: 2,
    maxOccupancy: 2,
    bedType: "queen",
    amenities: ["Garden View", "Queen Bed", "WiFi", "Air Conditioning"],
    description: "Quiet room facing the hotel garden area",
    images: ["https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80"],
    available: true,
    roomStatus: "available",
    hotelId: "main-hotel",
    roomNumber: "106",
    bookingPolicy: {
      advanceBookingDays: 365,
      minStayNights: 1,
      maxStayNights: 30
    }
  },
  {
    name: "Standard Plus",
    type: "standard",
    price: 170,
    capacity: 2,
    maxOccupancy: 3,
    bedType: "queen",
    amenities: ["Queen Bed", "Sofa Bed", "WiFi", "Mini Bar", "Air Conditioning"],
    description: "Enhanced standard room with extra sleeping space",
    images: ["https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800&q=80"],
    available: true,
    roomStatus: "available",
    hotelId: "main-hotel",
    roomNumber: "302",
    bookingPolicy: {
      advanceBookingDays: 365,
      minStayNights: 1,
      maxStayNights: 30
    }
  },
  {
    name: "Standard Courtyard",
    type: "standard",
    price: 145,
    capacity: 2,
    maxOccupancy: 2,
    bedType: "queen",
    amenities: ["Courtyard View", "Queen Bed", "WiFi", "Air Conditioning", "Safe"],
    description: "Peaceful room overlooking the interior courtyard",
    images: ["https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=800&q=80"],
    available: true,
    roomStatus: "available",
    hotelId: "main-hotel",
    roomNumber: "107",
    bookingPolicy: {
      advanceBookingDays: 365,
      minStayNights: 1,
      maxStayNights: 30
    }
  },
  {
    name: "Standard Business",
    type: "standard",
    price: 165,
    capacity: 2,
    maxOccupancy: 2,
    bedType: "king",
    amenities: ["King Bed", "Work Desk", "WiFi", "Business Center Access", "Coffee Maker"],
    description: "Business-friendly room with workspace and fast internet",
    images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80"],
    available: true,
    roomStatus: "available",
    hotelId: "main-hotel",
    roomNumber: "303",
    bookingPolicy: {
      advanceBookingDays: 365,
      minStayNights: 1,
      maxStayNights: 30
    }
  },
  {
    name: "Standard Comfort",
    type: "standard",
    price: 135,
    capacity: 1,
    maxOccupancy: 2,
    bedType: "queen",
    amenities: ["Queen Bed", "WiFi", "Air Conditioning", "Cable TV", "Room Service"],
    description: "Cozy room perfect for solo travelers or couples",
    images: ["https://images.unsplash.com/photo-1611048267451-e6ed903d4a38?w=800&q=80"],
    available: true,
    roomStatus: "available",
    hotelId: "main-hotel",
    roomNumber: "108",
    bookingPolicy: {
      advanceBookingDays: 365,
      minStayNights: 1,
      maxStayNights: 30
    }
  },

  // Additional Family Suites
  {
    name: "Family Suite Deluxe",
    type: "suite",
    price: 450,
    capacity: 6,
    maxOccupancy: 6,
    bedType: "multiple",
    amenities: ["3 Bedrooms", "2 Bathrooms", "Living Room", "Kitchen", "WiFi", "Balcony"],
    description: "Large family suite with three bedrooms and full kitchen",
    images: ["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=800&q=80"],
    available: true,
    roomStatus: "available",
    hotelId: "main-hotel",
    roomNumber: "601",
    bookingPolicy: {
      advanceBookingDays: 365,
      minStayNights: 2,
      maxStayNights: 30
    }
  },
  {
    name: "Family Ocean Suite",
    type: "suite",
    price: 500,
    capacity: 4,
    maxOccupancy: 5,
    bedType: "multiple",
    amenities: ["Ocean View", "2 Bedrooms", "Living Room", "Kitchenette", "WiFi", "Balcony"],
    description: "Premium family suite with ocean views and partial kitchen",
    images: ["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80"],
    available: true,
    roomStatus: "available",
    hotelId: "main-hotel",
    roomNumber: "602",
    bookingPolicy: {
      advanceBookingDays: 365,
      minStayNights: 2,
      maxStayNights: 30
    }
  },
  {
    name: "Family Garden Suite",
    type: "suite",
    price: 380,
    capacity: 4,
    maxOccupancy: 4,
    bedType: "multiple",
    amenities: ["Garden View", "2 Bedrooms", "Living Room", "Mini Kitchen", "WiFi"],
    description: "Family-friendly suite overlooking peaceful gardens",
    images: ["https://images.unsplash.com/photo-1495365200479-c4ed1d35e1aa?w=800&q=80"],
    available: true,
    roomStatus: "available",
    hotelId: "main-hotel",
    roomNumber: "402",
    bookingPolicy: {
      advanceBookingDays: 365,
      minStayNights: 1,
      maxStayNights: 30
    }
  },
  {
    name: "Family Connecting Suite",
    type: "suite",
    price: 420,
    capacity: 5,
    maxOccupancy: 6,
    bedType: "multiple",
    amenities: ["Connecting Rooms", "2 Bedrooms", "Shared Living Area", "WiFi", "Mini Fridge"],
    description: "Two connecting rooms perfect for large families",
    images: ["https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80"],
    available: true,
    roomStatus: "available",
    hotelId: "main-hotel",
    roomNumber: "502",
    bookingPolicy: {
      advanceBookingDays: 365,
      minStayNights: 1,
      maxStayNights: 30
    }
  },

  // Additional Executive Rooms
  {
    name: "Executive King Suite",
    type: "executive",
    price: 380,
    capacity: 2,
    maxOccupancy: 2,
    bedType: "king",
    amenities: ["King Bed", "Executive Lounge Access", "City View", "Mini Bar", "WiFi", "Concierge"],
    description: "Premium executive room with lounge access and city views",
    images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80"],
    available: true,
    roomStatus: "available",
    hotelId: "main-hotel",
    roomNumber: "403",
    bookingPolicy: {
      advanceBookingDays: 365,
      minStayNights: 1,
      maxStayNights: 30
    }
  },
  {
    name: "Executive Corner Office",
    type: "executive",
    price: 400,
    capacity: 2,
    maxOccupancy: 3,
    bedType: "king",
    amenities: ["Corner Location", "Executive Desk", "Meeting Area", "Mini Bar", "WiFi", "Printer"],
    description: "Executive room with dedicated office space and meeting area",
    images: ["https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80"],
    available: true,
    roomStatus: "available",
    hotelId: "main-hotel",
    roomNumber: "503",
    bookingPolicy: {
      advanceBookingDays: 365,
      minStayNights: 1,
      maxStayNights: 30
    }
  },
  {
    name: "Executive Club Level",
    type: "executive",
    price: 360,
    capacity: 2,
    maxOccupancy: 2,
    bedType: "queen",
    amenities: ["Club Level", "Queen Bed", "Executive Lounge", "WiFi", "Evening Cocktails"],
    description: "Club level executive room with complimentary evening cocktails",
    images: ["https://images.unsplash.com/photo-1568495248636-6432b97bd949?w=800&q=80"],
    available: true,
    roomStatus: "available",
    hotelId: "main-hotel",
    roomNumber: "404",
    bookingPolicy: {
      advanceBookingDays: 365,
      minStayNights: 1,
      maxStayNights: 30
    }
  },
  {
    name: "Executive Penthouse",
    type: "executive",
    price: 480,
    capacity: 2,
    maxOccupancy: 3,
    bedType: "king",
    amenities: ["Penthouse Level", "King Bed", "Private Balcony", "Mini Bar", "WiFi", "Butler Service"],
    description: "Top floor executive penthouse with butler service",
    images: ["https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?w=800&q=80"],
    available: true,
    roomStatus: "available",
    hotelId: "main-hotel",
    roomNumber: "701",
    bookingPolicy: {
      advanceBookingDays: 365,
      minStayNights: 2,
      maxStayNights: 30
    }
  },

  // Additional Budget Rooms
  {
    name: "Budget Twin Room",
    type: "budget",
    price: 85,
    capacity: 2,
    maxOccupancy: 2,
    bedType: "twin",
    amenities: ["Twin Beds", "WiFi", "Shared Bathroom", "Luggage Storage"],
    description: "Basic twin room perfect for backpackers and budget travelers",
    images: ["https://images.unsplash.com/photo-1559508551-44bff1de756b?w=800&q=80"],
    available: true,
    roomStatus: "available",
    hotelId: "main-hotel",
    roomNumber: "109",
    bookingPolicy: {
      advanceBookingDays: 180,
      minStayNights: 1,
      maxStayNights: 14
    }
  },
  {
    name: "Budget Double",
    type: "budget",
    price: 95,
    capacity: 2,
    maxOccupancy: 2,
    bedType: "queen",
    amenities: ["Queen Bed", "WiFi", "Air Conditioning", "Basic TV"],
    description: "Simple double room with essential amenities at great value",
    images: ["https://images.unsplash.com/photo-1496417263034-38ec4f0b665a?w=800&q=80"],
    available: true,
    roomStatus: "available",
    hotelId: "main-hotel",
    roomNumber: "110",
    bookingPolicy: {
      advanceBookingDays: 180,
      minStayNights: 1,
      maxStayNights: 14
    }
  },
  {
    name: "Budget Economy",
    type: "budget",
    price: 80,
    capacity: 1,
    maxOccupancy: 1,
    bedType: "single",
    amenities: ["Single Bed", "WiFi", "Desk", "Shared Facilities"],
    description: "Most affordable option for solo budget travelers",
    images: ["https://images.unsplash.com/photo-1586375300773-8384e3e4916f?w=800&q=80"],
    available: true,
    roomStatus: "available",
    hotelId: "main-hotel",
    roomNumber: "111",
    bookingPolicy: {
      advanceBookingDays: 90,
      minStayNights: 1,
      maxStayNights: 7
    }
  },
  {
    name: "Budget Quad",
    type: "budget",
    price: 120,
    capacity: 4,
    maxOccupancy: 4,
    bedType: "multiple",
    amenities: ["Bunk Beds", "WiFi", "Shared Bathroom", "Lockers", "Common Area"],
    description: "Hostel-style room with bunk beds for groups on a budget",
    images: ["https://images.unsplash.com/photo-1595846519845-68e298c2edd8?w=800&q=80"],
    available: true,
    roomStatus: "available",
    hotelId: "main-hotel",
    roomNumber: "112",
    bookingPolicy: {
      advanceBookingDays: 180,
      minStayNights: 1,
      maxStayNights: 10
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