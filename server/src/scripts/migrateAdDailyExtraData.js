import dotenv from 'dotenv'
import mongoose from 'mongoose'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Platform from '../models/platform.model.js'
import AdDaily from '../models/adDaily.model.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

export const migratePlatform = async p => {
  const aliasToId = {}
  const idSet = new Set()
  p.fields.forEach(f => {
    idSet.add(f.id)
    if (f.id) aliasToId[f.id] = f.id
    if (f.slug) aliasToId[f.slug] = f.id
    if (f.name) aliasToId[f.name] = f.id
  })

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
      }
    }
    if (changed) {
      doc.extraData = extra
      doc.colors = colors
      await doc.save()
      console.log(`AdDaily ${doc._id} 已更新欄位鍵`)
    }
  }
}

export const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ MongoDB 已連線')
    const platforms = await Platform.find()
    for (const p of platforms) {
      await migratePlatform(p)
    }
    console.log('🍺 轉換完成')
  } catch (err) {
    console.error('❌ 轉換失敗：', err.message)
  } finally {
    await mongoose.disconnect()
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run()
}
