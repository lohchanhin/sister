/**
 * services/redisClient.js
 * —— Heroku Redis TLS、自動回退本地、單例、啟用 auto-pipelining
 */

import Redis     from 'ioredis'
import RedisMock from 'ioredis-mock'
import dotenv    from 'dotenv'
import path      from 'node:path'
import { fileURLToPath } from 'node:url'
import logger from './logger.js'

/* ---------- .env ---------- */
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

export const CACHE_TTL = Number(process.env.REDIS_TTL) || 60
const RedisClient      = process.env.NODE_ENV === 'test' ? RedisMock : Redis
const { REDIS_URL }    = process.env

/* ---------- 連線參數 ---------- */
const baseOptions = {
  lazyConnect          : true,   // 真正用到才連
  enableAutoPipelining : true,   // 自動 pipeline
  maxRetriesPerRequest : 2,      // 兩次失敗直接拋錯
  commandQueueMaxLength: 10000,
  keepAlive            : 30000
}

let redisOptions = baseOptions
if (REDIS_URL?.startsWith('rediss://')) {
  redisOptions = {
    ...baseOptions,
    tls: { rejectUnauthorized: false }   // 如需嚴謹驗證請載入 CA
  }
}

/* ---------- 初始化 ---------- */
const redis = new RedisClient(
  REDIS_URL || { host: '127.0.0.1', port: 6379 },
  redisOptions
)

logger.info(`[Redis] 初始化來源 = ${REDIS_URL ? 'Heroku' : 'localhost:6379'}`)

redis.on('connect', () => logger.info('🟢 Redis 已連線'))
redis.on('error',   err => logger.error('Redis 連線失敗：', err))

export default redis
