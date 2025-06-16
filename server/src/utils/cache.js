import redis, { CACHE_TTL } from '../config/redis.js'

export async function getCache(key) {
  const data = await redis.get(key)
  if (!data) return null
  try {
    return JSON.parse(data)
  } catch {
    return data
  }
}

export async function setCache(key, value, ttl = CACHE_TTL) {
  const val = typeof value === 'string' ? value : JSON.stringify(value)
  await redis.setex(key, ttl, val)
}

export async function delCache(key) {
  await redis.del(key)
}

export async function clearCacheByPrefix(prefix) {
  const keys = await redis.keys(`${prefix}*`)
  if (keys.length) await redis.del(keys)
}
