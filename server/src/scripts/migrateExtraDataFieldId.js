import dotenv from 'dotenv'
import mongoose from 'mongoose'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Platform from '../models/platform.model.js'
import AdDaily from '../models/adDaily.model.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ MongoDB 已連線')

    const platforms = await Platform.find()
    for (const p of platforms) {
      const nameToId = {}
      const slugToId = {}
      let platformUpdated = false
      p.fields.forEach(f => {
        if (!f.id) {
          f.id = new mongoose.Types.ObjectId().toString()
          platformUpdated = true
        }
        nameToId[f.name] = f.id
        slugToId[f.slug] = f.id
      })
      if (platformUpdated) {
        await p.save()
        console.log(`平台 ${p.name} 已補齊欄位 id`)
      }

      const cursor = AdDaily.find({ platformId: p._id }).cursor()
      for await (const doc of cursor) {
        let changed = false
        const extra = {}
        for (const [k, v] of Object.entries(doc.extraData || {})) {
          const fid = nameToId[k] || slugToId[k]
          if (fid) {
            extra[fid] = v
            if (fid !== k) changed = true
          } else {
            extra[k] = v
            console.warn(`AdDaily ${doc._id} 欄位 ${k} 無對應 ID`)
          }
        }
        const colors = {}
        for (const [k, v] of Object.entries(doc.colors || {})) {
          const fid = nameToId[k] || slugToId[k]
          if (fid) {
            colors[fid] = v
            if (fid !== k) changed = true
          } else {
            colors[k] = v
            console.warn(`AdDaily ${doc._id} 色票 ${k} 無對應 ID`)
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
    console.log('🍺 轉換完成')
  } catch (err) {
    console.error('❌ 轉換失敗：', err.message)
  } finally {
    await mongoose.disconnect()
  }
}

run()
