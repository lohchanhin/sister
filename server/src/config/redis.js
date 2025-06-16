import Redis from 'ioredis'
import RedisMock from 'ioredis-mock'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const RedisClient = process.env.NODE_ENV === 'test' ? RedisMock : Redis

export const CACHE_TTL = process.env.REDIS_TTL ? Number(process.env.REDIS_TTL) : 60

const redis = new RedisClient(process.env.REDIS_URL || {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379
})

redis.on('connect', () => console.log('🟢 Redis 已連線'))
redis.on('error', err => console.error('Redis 連線失敗：', err))

export default redis
