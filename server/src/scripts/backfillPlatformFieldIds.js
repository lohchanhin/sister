// scripts/backfillPlatformFieldIds.js
import Platform from '../models/platform.model.js'
import mongoose from 'mongoose'

await mongoose.connect(process.env.MONGODB_URI)
const ps = await Platform.find({})
for (const p of ps) {
  let changed = false
  const exist = new Set()
  p.fields.forEach((f, idx) => {
    if (!f.id) { f.id = String(new mongoose.Types.ObjectId()); changed = true }
    f.id = String(f.id)
    // 确保 slug 有，不合法就用 f_x
    if (!f.slug || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(f.slug)) {
      let i = idx + 1; while (exist.has(`f_${i}`)) i++
      f.slug = `f_${i}`; changed = true
    }
    exist.add(f.slug)
  })
  if (changed) await p.save()
}
console.log('done')
process.exit()
