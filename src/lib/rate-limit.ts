// Simple In-Memory Rate Limiter (Works well for single instance / local deployment)
// For multi-region serverless (like Vercel Edge), consider using @vercel/kv or Redis.

interface RateLimitStore {
  count: number
  resetTime: number
}

const store = new Map<string, RateLimitStore>()

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, value] of store.entries()) {
      if (now > value.resetTime) {
        store.delete(key)
      }
    }
  }, 5 * 60 * 1000)
}

export function rateLimit(ip: string, limit: number, windowMs: number): { success: boolean; remaining: number } {
  const now = Date.now()
  const record = store.get(ip)

  if (!record) {
    store.set(ip, { count: 1, resetTime: now + windowMs })
    return { success: true, remaining: limit - 1 }
  }

  if (now > record.resetTime) {
    store.set(ip, { count: 1, resetTime: now + windowMs })
    return { success: true, remaining: limit - 1 }
  }

  if (record.count >= limit) {
    return { success: false, remaining: 0 }
  }

  record.count++
  return { success: true, remaining: limit - record.count }
}
