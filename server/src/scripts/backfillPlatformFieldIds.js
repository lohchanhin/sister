// scripts/backfillPlatformFieldIds.js
import mongoose from 'mongoose'
import Platform from '../models/platform.model.js'

const SLUG_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/

const normalizeSlug = (name) => {
  if (!name) return ''
  let out = String(name).trim().toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')       // 非字元转 _
    .replace(/^_+|_+$/g, '')            // 去头尾 _
  if (!out || !SLUG_RE.test(out)) return ''
  return out
}

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('[ERR] MONGODB_URI missing'); process.exit(1)
  }
  await mongoose.connect(uri)
  const platforms = await Platform.find({}).lean(false)
  let touched = 0

  for (const p of platforms) {
    if (!Array.isArray(p.fields) || !p.fields.length) continue
    let changed = false
    const usedSlugs = new Set()

    // 先收集已存在 slug，避免冲突
    for (const f of p.fields) {
      const s = f.slug && SLUG_RE.test(f.slug) ? f.slug : normalizeSlug(f.name)
      if (s) usedSlugs.add(s)
    }

    let seq = 0
    const nextSlug = () => {
      while (true) {
        seq += 1
        const candidate = `f_${seq}`
        if (!usedSlugs.has(candidate)) return candidate
      }
    }

    for (const f of p.fields) {
      // id: 统一字符串
      if (!f.id) { f.id = String(new mongoose.Types.ObjectId()); changed = true }
      else if (typeof f.id !== 'string') { f.id = String(f.id); changed = true }

      // slug: 优先现有合法，其次英文名规范化，再用 f_x，且要全局唯一
      let slug = (f.slug && SLUG_RE.test(f.slug)) ? f.slug : normalizeSlug(f.name)
      if (!slug || usedSlugs.has(slug)) slug = nextSlug()
      if (f.slug !== slug) { f.slug = slug; changed = true }
      usedSlugs.add(slug)
    }

    if (changed) {
      await p.save()
      touched += 1
      console.log(`[OK] Platform ${p._id} updated: ${p.fields.length} fields`)
    }
  }

  console.log(`done. platforms updated: ${touched}`)
  await mongoose.disconnect()
  process.exit(0)
}

main().catch(async (e) => {
  console.error(e)
  try { await mongoose.disconnect() } catch {}
  process.exit(1)
})
