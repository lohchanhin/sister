import dotenv from 'dotenv'
import mongoose from 'mongoose'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Platform from '../models/platform.model.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const slugPattern = /^[a-zA-Z_][a-zA-Z0-9_]*$/
const slugify = (s, exist = new Set()) => {
  let base = s?.toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  if (!base || !slugPattern.test(base) || exist.has(base)) {
    let i = 1
    while (exist.has(`f_${i}`)) i++
    base = `f_${i}`
  }
  exist.add(base)
  return base
}

export const migratePlatform = async (platform) => {
  let changed = false
  const slugs = new Set()
  for (const f of platform.fields) {
    if (f.slug) slugs.add(f.slug)
  }
  for (const f of platform.fields) {
    if (!f.slug) {
      f.slug = slugify(f.name, slugs)
      changed = true
    }
    if (f.formula == null) {
      f.formula = ''
      changed = true
    }
  }
  if (changed) {
    await platform.save()
    console.log(`平台 ${platform.name || platform._id} 已更新欄位 slug/formula`)
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
    console.log('🍺 遷移完成')
  } catch (err) {
    console.error('❌ 遷移失敗：', err.message)
  } finally {
    await mongoose.disconnect()
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run()
}
