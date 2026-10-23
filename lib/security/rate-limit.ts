/**
 * DAMEZ BARBERSHOP - SLIDING WINDOW RATE LIMITER
 * 
 * Proteksi Denial of Service (DoS), brute force, dan automated bot spam
 * pada endpoint publik /api/booking/checkout dan /api/booking/hold.
 * Sesuai PRD: Maksimal 10 request per menit per alamat IP.
 * Mematuhi standar RFC 6585 (HTTP 429 Too Many Requests).
 */

export interface RateLimitConfig {
  maxRequests: number       // Contoh: 10
  windowSeconds: number     // Contoh: 60 detik (1 menit)
  identifierPrefix?: string // Contoh: "ip" atau "phone"
}

export interface RateLimitResult {
  isAllowed: boolean
  limit: number
  remaining: number
  resetTime: number         // Unix epoch time (seconds)
  retryAfter: number        // Seconds until reset
  headers: Record<string, string>
}

interface RequestRecord {
  timestamps: number[]
}

class SlidingWindowRateLimiter {
  private store: Map<string, RequestRecord> = new Map()

  /**
   * Mengecek dan mencatat request pada sliding window
   */
  check(identifier: string, config: RateLimitConfig): RateLimitResult {
    const now = Date.now()
    const windowMs = config.windowSeconds * 1000
    const windowStart = now - windowMs

    const key = `${config.identifierPrefix || 'rate'}:${identifier}`
    let record = this.store.get(key)

    if (!record) {
      record = { timestamps: [] }
      this.store.set(key, record)
    }

    // Buang timestamps yang berada di luar jendela waktu
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart)

    const isAllowed = record.timestamps.length < config.maxRequests
    const currentCount = record.timestamps.length

    if (isAllowed) {
      record.timestamps.push(now)
    }

    const remaining = Math.max(0, config.maxRequests - record.timestamps.length)
    const oldestTimestamp = record.timestamps[0] || now
    const resetTime = Math.ceil((oldestTimestamp + windowMs) / 1000)
    const retryAfter = Math.max(1, Math.ceil((oldestTimestamp + windowMs - now) / 1000))

    const headers: Record<string, string> = {
      'X-RateLimit-Limit': String(config.maxRequests),
      'X-RateLimit-Remaining': String(remaining),
      'X-RateLimit-Reset': String(resetTime)
    }

    if (!isAllowed) {
      headers['Retry-After'] = String(retryAfter)
    }

    return {
      isAllowed,
      limit: config.maxRequests,
      remaining,
      resetTime,
      retryAfter,
      headers
    }
  }

  /**
   * Membersihkan data memori (berguna untuk testing atau periodically)
   */
  clear(): void {
    this.store.clear()
  }

  /**
   * Garbage collector untuk membuang record lama
   */
  prune(windowMs: number = 300000): void {
    const threshold = Date.now() - windowMs
    for (const [key, record] of this.store.entries()) {
      record.timestamps = record.timestamps.filter((ts) => ts > threshold)
      if (record.timestamps.length === 0) {
        this.store.delete(key)
      }
    }
  }
}

// Global Singleton RateLimiter
export const globalRateLimiter = new SlidingWindowRateLimiter()

/**
 * Konfigurasi Standar Sesuai PRD Damez Barbershop
 */
export const BOOKING_RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxRequests: 10,
  windowSeconds: 60, // 10 request / 60 detik per IP
  identifierPrefix: 'ip_booking'
}

export const CHECKOUT_RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxRequests: 10,
  windowSeconds: 60, // 10 request / 60 detik per IP
  identifierPrefix: 'ip_checkout'
}

export const PHONE_RATE_LIMIT_CONFIG: RateLimitConfig = {
  maxRequests: 5,
  windowSeconds: 300, // 5 booking hold / 5 menit per nomor HP
  identifierPrefix: 'phone_hold'
}

/**
 * Mengekstrak Alamat IP Klien dari Request Headers (mendukung Cloudflare, Vercel, Nginx proxy)
 */
export function extractClientIp(request: Request): string {
  const headers = request.headers

  // 1. Cloudflare Connecting IP
  const cfIp = headers.get('cf-connecting-ip')
  if (cfIp && cfIp.trim() !== '') {
    return cfIp.trim()
  }

  // 2. X-Real-IP
  const realIp = headers.get('x-real-ip')
  if (realIp && realIp.trim() !== '') {
    return realIp.trim()
  }

  // 3. X-Forwarded-For (ambil alamat pertama sebelum koma)
  const forwardedFor = headers.get('x-forwarded-for')
  if (forwardedFor && forwardedFor.trim() !== '') {
    const firstIp = forwardedFor.split(',')[0].trim()
    if (firstIp) return firstIp
  }

  // 4. Default fallback untuk lingkungan testing lokal
  return '127.0.0.1'
}

/**
 * Membuat Response HTTP 429 Too Many Requests standar RFC 6585
 */
export function createRateLimitResponse(result: RateLimitResult, customMessage?: string): Response {
  const body = {
    success: false,
    error: customMessage || 'Terlalu banyak permintaan (Rate limit exceeded). Silakan coba lagi nanti.',
    retry_after_seconds: result.retryAfter,
    limit: result.limit,
    remaining: result.remaining
  }

  return new Response(JSON.stringify(body), {
    status: 429,
    headers: {
      'Content-Type': 'application/json',
      ...result.headers
    }
  })
}
