import redis, { CACHE_TTL } from '../config/redis.js'

export async function getCache(key) {
  console.log('[Redis] GET', key)
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
  console.log('[Redis] SETEX', key, ttl)
  await redis.setex(key, ttl, val)
}


export async function delCache(key) {
  console.log('[Redis] DEL', key)
  await redis.del(key)
}

export async function clearCacheByPrefix(prefix) {
  console.log('[Redis] KEYS', `${prefix}*`)
  const keys = await redis.keys(`${prefix}*`)

  if (keys.length) {
    console.log('[Redis] DEL', keys)
    await redis.del(keys)
  }

}
