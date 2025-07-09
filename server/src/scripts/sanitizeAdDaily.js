import dotenv from 'dotenv'
import mongoose from 'mongoose'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import AdDaily from '../models/adDaily.model.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const sanitizeNumber = val =>
  parseFloat(String(val).replace(/[^\d.]/g, '')) || 0

const numericPattern = /^[^\d-]*[\d\s,.$]+$/
const sanitizeExtraData = obj => {
  const result = {}
  if (!obj) return result
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'number') result[k] = v
    else if (numericPattern.test(String(v))) result[k] = sanitizeNumber(v)
    else result[k] = v
  }
  return result
}

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ MongoDB 已連線')

    const cursor = AdDaily.find().cursor()
    for await (const doc of cursor) {
      let updated = false
      for (const field of [
        'spent',
        'enquiries',
        'reach',
        'impressions',
        'clicks'
      ]) {
        const val = doc[field]
        if (typeof val === 'string' && numericPattern.test(val)) {
          doc[field] = sanitizeNumber(val)
          updated = true
        }
      }

      const extra = sanitizeExtraData(doc.extraData)
      if (JSON.stringify(extra) !== JSON.stringify(doc.extraData)) {
        doc.extraData = extra
        updated = true
      }

      if (updated) await doc.save()
    }
    console.log('🍺 整理完成')
  } catch (err) {
    console.error('❌ 處理失敗：', err.message)
  } finally {
    await mongoose.disconnect()
  }
}

run()
