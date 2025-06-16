/**
 * services/redisClient.js
 * —— 支援 Heroku Redis TLS、自動回退本地、單例模式
 */

import Redis      from 'ioredis'
import RedisMock  from 'ioredis-mock'
import dotenv     from 'dotenv'
import fs         from 'node:fs'
import path       from 'node:path'
import { fileURLToPath } from 'node:url'

/* ---------- 載入 .env ---------- */
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

/* ---------- 常數 ---------- */
export const CACHE_TTL = process.env.REDIS_TTL
  ? Number(process.env.REDIS_TTL)
  : 60

/* ---------- 判斷要用真實 Redis 或 Mock ---------- */
const RedisClient = process.env.NODE_ENV === 'test' ? RedisMock : Redis

/* ---------- 建立連線設定 ---------- */
const { REDIS_URL } = process.env

/** @type {import('ioredis').RedisOptions | undefined} */
let redisOptions

if (REDIS_URL?.startsWith('rediss://')) {
  // Heroku Redis 預設使用 TLS，先關閉憑證驗證
  redisOptions = {
    tls: {
      rejectUnauthorized: false
      // ★ 若想更嚴謹，下載官方 CA 後打開下列兩行 ★
      // ca: fs.readFileSync(
      //   path.resolve(__dirname, '../certs/redis_ca.pem'),
      //   'utf-8'
      // )
    }
  }
}

/* ---------- 初始化 Redis ---------- */
const redis = new RedisClient(
  REDIS_URL || {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT
      ? Number(process.env.REDIS_PORT)
      : 6379
  },
  redisOptions
)
console.log('[Redis] 初始化', REDIS_URL || `${process.env.REDIS_HOST || '127.0.0.1'}:${process.env.REDIS_PORT || 6379}`)

/* ---------- 事件監聽 ---------- */
redis.on('connect', () => console.log('🟢 Redis 已連線'))
redis.on('error',   err => console.error('Redis 連線失敗：', err))

export default redis
