import axios from 'axios'
import { cacheManager } from './cacheService'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authAPI = {
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData)
    return response.data
  },

  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials)
    return response.data
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout')
    return response.data
  },

  getUserProfile: async () => {
    const response = await apiClient.get('/auth/profile')
    return response.data
  },

  updateProfile: async (updates) => {
    const response = await apiClient.put('/auth/profile', updates)
    return response.data
  },

  changePassword: async (passwordData) => {
    const response = await apiClient.put('/auth/change-password', passwordData)
    return response.data
  },

  refreshToken: async (refreshToken) => {
    const response = await apiClient.post('/auth/refresh-token', { refreshToken })
    return response.data
  }
}

export const adminAPI = {
  // User management
  getPendingUsers: async () => {
    const response = await apiClient.get('/auth/admin/pending-users')
    return response.data
  },

  getAllUsers: async (params = {}) => {
    const response = await apiClient.get('/auth/admin/users', { params })
    return response.data
  },

  approveUser: async (userId, data) => {
    const response = await apiClient.post(`/auth/admin/users/${userId}/approve`, data)
    return response.data
  },

  rejectUser: async (userId, data) => {
    const response = await apiClient.post(`/auth/admin/users/${userId}/reject`, data)
    return response.data
  },

  updateUserRole: async (userId, roles) => {
    const response = await apiClient.put(`/auth/admin/users/${userId}/roles`, { roles })
    return response.data
  },

  toggleUserSuspension: async (userId, suspend, reason) => {
    const response = await apiClient.put(`/auth/admin/users/${userId}/suspension`, { suspend, reason })
    return response.data
  },

  // Hotel management
  getPendingHotels: async (params = {}) => {
    const response = await apiClient.get('/hotels/admin/applications', { 
      params: { status: 'pending-review', ...params }
    })
    return response.data
  },

  getAllHotels: async (params = {}) => {
    const response = await apiClient.get('/hotels/admin/hotels', { params })
    return response.data
  },

  approveHotel: async (applicationId, data) => {
    const response = await apiClient.post(`/hotels/admin/applications/${applicationId}/approve`, data)
    return response.data
  },

  rejectHotel: async (applicationId, data) => {
    const response = await apiClient.post(`/hotels/admin/applications/${applicationId}/reject`, data)
    return response.data
  }
}

export const hotelAPI = {
  // Hotel owner functions
  submitHotelApplication: async (applicationData) => {
    const response = await apiClient.post('/hotels/application', applicationData)
    return response.data
  },

  getMyHotelApplications: async () => {
    const response = await apiClient.get('/hotels/my-applications')
    return response.data
  },

  getMyHotels: async () => {
    const response = await apiClient.get('/hotels/my-hotels')
    return response.data
  },

  updateMyHotel: async (hotelId, updates) => {
    const response = await apiClient.put(`/hotels/my-hotels/${hotelId}`, updates)
    return response.data
  },

  getMyHotelRooms: async (hotelId) => {
    const response = await apiClient.get(`/hotels/my-hotels/${hotelId}/rooms`)
    return response.data
  },

  // Admin functions
  getAllHotelApplications: async (params = {}) => {
    const response = await apiClient.get('/hotels/admin/applications', { params })
    return response.data
  },

  approveHotelApplication: async (applicationId, comments) => {
    const response = await apiClient.post(`/hotels/admin/applications/${applicationId}/approve`, { comments })
    return response.data
  },

  rejectHotelApplication: async (applicationId, reason, comments) => {
    const response = await apiClient.post(`/hotels/admin/applications/${applicationId}/reject`, { reason, comments })
    return response.data
  },

  getAllHotels: async (params = {}) => {
    const response = await apiClient.get('/hotels/admin/hotels', { params })
    return response.data
  },

  toggleHotelStatus: async (hotelId, activate, reason) => {
    const response = await apiClient.put(`/hotels/admin/hotels/${hotelId}/status`, { activate, reason })
    return response.data
  },

  // Public functions
  getPublicHotels: async (params = {}) => {
    const response = await apiClient.get('/hotels/public', { params })
    return response.data
  }
}

export const roomAPI = {
  // Public functions
  searchAvailableRooms: async (searchCriteria, page = 1, limit = 10) => {
    // Create cache key based on search criteria and pagination
    const cacheKey = `search:${JSON.stringify({...searchCriteria, page, limit})}`
    
    // Try cache first (1 minute TTL for search results)
    const cached = cacheManager.getMemory(cacheKey)
    if (cached) {
      console.log('🎯 Using cached search results')
      return cached
    }
    
    const response = await apiClient.post('/rooms/search', {
      ...searchCriteria,
      page,
      limit
    })
    
    // Cache successful responses
    if (response.data.success) {
      cacheManager.setMemory(cacheKey, response.data, 60000) // 1 minute
    }
    
    return response.data
  },

  getRoomDetails: async (roomId) => {
    // Create cache key for room details
    const cacheKey = `room:${roomId}`
    
    // Try cache first (5 minutes TTL for room details)
    const cached = cacheManager.getMemory(cacheKey)
    if (cached) {
      console.log('🎯 Using cached room details')
      return cached
    }
    
    const response = await apiClient.get(`/rooms/${roomId}`)
    
    // Cache successful responses
    if (response.data.success) {
      cacheManager.setMemory(cacheKey, response.data, 300000) // 5 minutes
    }
    
    return response.data
  },

  getAllRooms: async (page = 1, limit = 10) => {
    // Create cache key for browse mode
    const cacheKey = `browse:${page}:${limit}`
    
    // Try cache first (3 minutes TTL for browse results)
    const cached = cacheManager.getMemory(cacheKey)
    if (cached) {
      console.log('🎯 Using cached browse results')
      return cached
    }
    
    const response = await apiClient.get('/rooms/all', {
      params: { page, limit }
    })
    
    // Cache successful responses
    if (response.data.success) {
      cacheManager.setMemory(cacheKey, response.data, 180000) // 3 minutes
    }
    
    return response.data
  },

  // Hotel owner functions
  createRoom: async (roomData) => {
    const response = await apiClient.post('/rooms/create', roomData)
    return response.data
  },

  updateRoom: async (roomId, updates) => {
    const response = await apiClient.put(`/rooms/${roomId}`, updates)
    return response.data
  },

  deleteRoom: async (roomId) => {
    const response = await apiClient.delete(`/rooms/${roomId}`)
    return response.data
  },

  getRoomBookings: async (roomId, params = {}) => {
    const response = await apiClient.get(`/rooms/${roomId}/bookings`, { params })
    return response.data
  },

  toggleRoomAvailability: async (roomId, available) => {
    const response = await apiClient.put(`/rooms/${roomId}/availability`, { available })
    return response.data
  }
}

export const bookingAPI = {
  createBookingReservation: async (bookingDetails) => {
    const response = await apiClient.post('/bookings/create', bookingDetails)
    
    // Clear cache when booking is created (affects availability)
    if (response.data.success) {
      // Clear all search and browse caches as availability has changed
      const keys = Object.keys(cacheManager.getStats().memory.keys || [])
      keys.forEach(key => {
        if (key.includes('search:') || key.includes('browse:')) {
          cacheManager.deleteMemory(key)
        }
      })
    }
    
    return response.data
  },

  getUserBookingHistory: async () => {
    const response = await apiClient.get('/bookings/user-history')
    return response.data
  },

  getBookingDetails: async (bookingId) => {
    const response = await apiClient.get(`/bookings/${bookingId}`)
    return response.data
  },

  cancelBookingReservation: async (bookingId) => {
    const response = await apiClient.delete(`/bookings/${bookingId}/cancel`)
    
    // Clear cache when booking is cancelled (affects availability)
    if (response.data.success) {
      // Clear all search and browse caches as availability has changed
      const keys = Object.keys(cacheManager.getStats().memory.keys || [])
      keys.forEach(key => {
        if (key.includes('search:') || key.includes('browse:')) {
          cacheManager.deleteMemory(key)
        }
      })
    }
    
    return response.data
  },

  sendBookingEmail: async (bookingId, emailAddress) => {
    const response = await apiClient.post(`/bookings/${bookingId}/send-email`, {
      email: emailAddress
    })
    return response.data
  }
}

export const emailAPI = {
  sendBookingConfirmation: async (bookingData) => {
    const response = await apiClient.post('/email/booking-confirmation', bookingData)
    return response.data
  },

  testEmailConnection: async () => {
    const response = await apiClient.get('/email/test-connection')
    return response.data
  },

  sendTestEmail: async (email) => {
    const response = await apiClient.post('/email/test', { email })
    return response.data
  }
}

// Legacy export for backward compatibility
export const hotelBookingAPI = {
  ...roomAPI,
  ...bookingAPI,
  ...emailAPI
}

export default apiClient