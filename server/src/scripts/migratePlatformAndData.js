import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import Platform from '../models/platform.model.js'
import AdDaily from '../models/adDaily.model.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const recordMismatch = (mismatches, platformId, key) => {
  if (!mismatches[platformId]) mismatches[platformId] = new Set()
  mismatches[platformId].add(key)
}

export const migratePlatform = async (p, mismatches) => {
  let platformChanged = false
  const aliasToId = {}
  const idSet = new Set()
  p.fields.forEach(f => {
    if (!f.id) {
      f.id = new mongoose.Types.ObjectId().toString()
      platformChanged = true
    }
    idSet.add(f.id)
    if (f.id) aliasToId[f.id] = f.id
    if (f.slug) aliasToId[f.slug] = f.id
    if (f.name) aliasToId[f.name] = f.id
  })
  if (platformChanged) {
    await p.save()
    console.log(`Platform ${p._id} 欄位 id 已補齊`)
  }

  const cursor = AdDaily.find({ platformId: p._id }).cursor()
  for await (const doc of cursor) {
    let changed = false
    const extra = {}
    for (const [k, v] of Object.entries(doc.extraData || {})) {
      const id = idSet.has(k) ? k : aliasToId[k]
      if (id) {
        extra[id] = v
        if (id !== k) changed = true
      } else {
        extra[k] = v
        recordMismatch(mismatches, p._id.toString(), k)
      }
    }
    const colors = {}
    for (const [k, v] of Object.entries(doc.colors || {})) {
      const id = idSet.has(k) ? k : aliasToId[k]
      if (id) {
        colors[id] = v
        if (id !== k) changed = true
      } else {
        colors[k] = v
        recordMismatch(mismatches, p._id.toString(), k)
      }
    }
    if (changed) {
      doc.extraData = extra
      doc.colors = colors
      await doc.save()
      console.log(`AdDaily ${doc._id} 已同步鍵值`)
    }
  }
}

export const run = async () => {
  const mismatches = {}
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ MongoDB 已連線')
    const platforms = await Platform.find()
    for (const p of platforms) {
      await migratePlatform(p, mismatches)
    }
    const report = Object.fromEntries(Object.entries(mismatches).map(([id, set]) => [id, [...set]]))
    const reportPath = path.resolve(__dirname, 'migrate-platform-report.json')
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    console.log('🍺 轉換完成，異常報告已輸出：', reportPath)
  } catch (err) {
    console.error('❌ 轉換失敗：', err.message)
  } finally {
    await mongoose.disconnect()
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run()
}
