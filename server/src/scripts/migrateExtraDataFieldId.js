import dotenv from 'dotenv'
import mongoose from 'mongoose'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import Platform from '../models/platform.model.js'
import AdDaily from '../models/adDaily.model.js'

// 舊名稱或舊 slug 對應現有欄位 slug 的表
export const oldFieldMappings = {
  // 範例：Meta 平台的舊欄位 old 對應到現有欄位 new
  Meta: {
    old: 'new'
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

export const migratePlatform = async (p, mismatches = []) => {
  const nameToId = {}
  const slugToId = {}
  const aliasToId = {}
  let platformUpdated = false
  p.fields.forEach(f => {
    if (!f.id) {
      f.id = new mongoose.Types.ObjectId().toString()
      platformUpdated = true
    }
    nameToId[f.name] = f.id
    slugToId[f.slug] = f.id
  })

  const mapping = oldFieldMappings[p.name] || {}
  for (const [oldKey, target] of Object.entries(mapping)) {
    aliasToId[oldKey] = nameToId[target] || slugToId[target]
  }

  if (platformUpdated) {
    await p.save()
    console.log(`平台 ${p.name} 已補齊欄位 id`)
  }

  let adDailyCount = 0
  let successCount = 0
  let failCount = 0
  const cursor = AdDaily.find({ platformId: p._id }).cursor()
  for await (const doc of cursor) {
    adDailyCount += 1
    let changed = false
    const extra = {}
    for (const [k, v] of Object.entries(doc.extraData || {})) {
      const fid = nameToId[k] || slugToId[k] || aliasToId[k]
      if (fid) {
        extra[fid] = v
        successCount += 1
        if (fid !== k) changed = true
      } else {
        extra[k] = v
        failCount += 1
        mismatches.push({ platform: p.name, docId: doc._id.toString(), field: k, type: 'extraData' })
        console.warn(`AdDaily ${doc._id} 欄位 ${k} 無對應 ID`)
      }
    }
    const colors = {}
    for (const [k, v] of Object.entries(doc.colors || {})) {
      const fid = nameToId[k] || slugToId[k] || aliasToId[k]
      if (fid) {
        colors[fid] = v
        successCount += 1
        if (fid !== k) changed = true
      } else {
        colors[k] = v
        failCount += 1
        mismatches.push({ platform: p.name, docId: doc._id.toString(), field: k, type: 'color' })
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
  console.log(`平台 ${p.name} 共處理 ${adDailyCount} 筆 AdDaily，成功 ${successCount} 欄位，失敗 ${failCount} 欄位`)
  return mismatches
}

export const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ MongoDB 已連線')

    const platforms = await Platform.find()
    const mismatches = []
    for (const p of platforms) {
      await migratePlatform(p, mismatches)
    }
    if (mismatches.length) {
      const outPath = path.resolve(__dirname, 'migrateExtraDataFieldId-unmatched.json')
      fs.writeFileSync(outPath, JSON.stringify(mismatches, null, 2))
      console.warn(`已輸出無法匹配欄位至 ${outPath}`)
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
