// Simple in-memory cache service for room data and availability
class CacheService {
  constructor() {
    this.cache = new Map()
    this.timers = new Map()
    this.defaultTTL = 5 * 60 * 1000 // 5 minutes default TTL
  }

  // Set cache entry with TTL
  set(key, value, ttl = this.defaultTTL) {
    // Clear existing timer if exists
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
    }

    // Set the cache entry
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    })

    // Set expiration timer
    const timer = setTimeout(() => {
      this.delete(key)
    }, ttl)
    
    this.timers.set(key, timer)
    
    console.log(`💾 Cached: ${key} (TTL: ${ttl}ms)`)
  }

  // Get cache entry
  get(key) {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.delete(key)
      return null
    }

    console.log(`🎯 Cache hit: ${key}`)
    return entry.value
  }

  // Delete cache entry
  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key))
      this.timers.delete(key)
    }
    
    const deleted = this.cache.delete(key)
    if (deleted) {
      console.log(`🗑️ Cache deleted: ${key}`)
    }
    return deleted
  }

  // Clear all cache
  clear() {
    // Clear all timers
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers.clear()
    this.cache.clear()
    console.log('🧹 Cache cleared')
  }

  // Get cache stats
  stats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      memoryUsage: this.getMemoryUsage()
    }
  }

  // Estimate memory usage
  getMemoryUsage() {
    let size = 0
    this.cache.forEach((value, key) => {
      size += key.length * 2 // approximate string size
      size += JSON.stringify(value.value).length * 2 // approximate object size
    })
    return size
  }

  // Generate cache key for room availability
  getRoomAvailabilityKey(roomIds, checkInDate, checkOutDate) {
    const sortedIds = Array.isArray(roomIds) ? roomIds.sort().join(',') : roomIds
    return `availability:${sortedIds}:${checkInDate}:${checkOutDate}`
  }

  // Generate cache key for room data pagination
  getRoomDataKey(page, limit, hasSearchCriteria = false) {
    return `rooms:${hasSearchCriteria ? 'search' : 'browse'}:${page}:${limit}`
  }

  // Generate cache key for total count
  getTotalCountKey(hasSearchCriteria = false) {
    return `count:${hasSearchCriteria ? 'search' : 'browse'}`
  }

  // Generate cache key for search results
  getSearchResultsKey(criteria, page, limit) {
    const criteriaStr = JSON.stringify({
      destinationCity: criteria.destinationCity,
      checkInDate: criteria.checkInDate,
      checkOutDate: criteria.checkOutDate,
      guestCount: criteria.guestCount,
      roomCount: criteria.roomCount
    })
    return `search:${Buffer.from(criteriaStr).toString('base64')}:${page}:${limit}`
  }

  // Cache room availability results
  cacheAvailability(roomIds, checkInDate, checkOutDate, results) {
    const key = this.getRoomAvailabilityKey(roomIds, checkInDate, checkOutDate)
    // Cache availability for 2 minutes (bookings change less frequently)
    this.set(key, results, 2 * 60 * 1000)
  }

  // Get cached room availability
  getCachedAvailability(roomIds, checkInDate, checkOutDate) {
    const key = this.getRoomAvailabilityKey(roomIds, checkInDate, checkOutDate)
    return this.get(key)
  }

  // Cache room data
  cacheRoomData(page, limit, data, pagination, hasSearchCriteria = false) {
    const key = this.getRoomDataKey(page, limit, hasSearchCriteria)
    this.set(key, { data, pagination }, 3 * 60 * 1000) // 3 minutes for room data
  }

  // Get cached room data
  getCachedRoomData(page, limit, hasSearchCriteria = false) {
    const key = this.getRoomDataKey(page, limit, hasSearchCriteria)
    return this.get(key)
  }

  // Cache search results
  cacheSearchResults(criteria, page, limit, data, pagination) {
    const key = this.getSearchResultsKey(criteria, page, limit)
    // Cache search results for 1 minute (they're more dynamic)
    this.set(key, { data, pagination }, 1 * 60 * 1000)
  }

  // Get cached search results
  getCachedSearchResults(criteria, page, limit) {
    const key = this.getSearchResultsKey(criteria, page, limit)
    return this.get(key)
  }

  // Cache total count
  cacheTotalCount(count, hasSearchCriteria = false) {
    const key = this.getTotalCountKey(hasSearchCriteria)
    this.set(key, count, 5 * 60 * 1000) // 5 minutes for total count
  }

  // Get cached total count
  getCachedTotalCount(hasSearchCriteria = false) {
    const key = this.getTotalCountKey(hasSearchCriteria)
    return this.get(key)
  }

  // Invalidate cache when rooms are modified
  invalidateRoomCaches() {
    console.log('🔄 Invalidating room caches...')
    const keysToDelete = []
    
    this.cache.forEach((value, key) => {
      if (key.startsWith('rooms:') || key.startsWith('count:') || 
          key.startsWith('search:') || key.startsWith('availability:')) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => this.delete(key))
    console.log(`🔄 Invalidated ${keysToDelete.length} room cache entries`)
  }

  // Invalidate specific availability cache when bookings change
  invalidateAvailabilityCache(roomId) {
    console.log(`🔄 Invalidating availability cache for room ${roomId}...`)
    const keysToDelete = []
    
    this.cache.forEach((value, key) => {
      if (key.startsWith('availability:') && key.includes(roomId)) {
        keysToDelete.push(key)
      }
    })
    
    keysToDelete.forEach(key => this.delete(key))
    console.log(`🔄 Invalidated ${keysToDelete.length} availability cache entries for room ${roomId}`)
  }
}

// Create singleton instance
const cacheService = new CacheService()

export default cacheService