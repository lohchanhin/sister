// scripts/backfillPlatformFieldIds.js
import mongoose from 'mongoose'
import Platform from '../models/platform.model.js'

const SLUG_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/
const normalizeSlug = (name) => {
  if (!name) return ''
  let out = String(name).trim().toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return SLUG_RE.test(out) ? out : ''
}

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('[ERR] MONGODB_URI missing'); process.exit(1)
  }
  await mongoose.connect(process.env.MONGODB_URI)

  // 运行时模型自检（非常关键）
  const hasIdPath = !!Platform.schema.path('fields').schema?.path('id')
  const noSubdocId = Platform.schema.path('fields').schema?._id === false
  console.log('[DEBUG] fields.id declared =', hasIdPath, ' subdoc _id disabled =', noSubdocId)
  if (!hasIdPath) {
    console.error('[FATAL] Platform.fields[].id not declared in schema the script is using. Deploy/restart first.')
    process.exit(2)
  }

  const platforms = await Platform.find({}).lean(false)
  let touched = 0

  for (const p of platforms) {
    if (!Array.isArray(p.fields) || !p.fields.length) continue

    let changed = false
    const used = new Set()

    // 先收集现有合法 slug，避免冲突
    for (const f of p.fields) {
      const s = SLUG_RE.test(f?.slug || '') ? f.slug : normalizeSlug(f?.name)
      if (s) used.add(s)
    }

    let seq = 0
    const nextSlug = () => {
      do { seq += 1 } while (used.has(`f_${seq}`))
      return `f_${seq}`
    }

    p.fields.forEach((f, idx) => {
      // 1) id 补齐 / 统一 string
      if (!f.id) { f.id = new mongoose.Types.ObjectId().toString(); changed = true }
      else if (typeof f.id !== 'string') { f.id = String(f.id); changed = true }

      // 2) slug 合法化 + 去重
      let slug = SLUG_RE.test(f?.slug || '') ? f.slug : normalizeSlug(f?.name)
      if (!slug || used.has(slug)) slug = nextSlug()
      if (slug !== f.slug) { f.slug = slug; changed = true }
      used.add(slug)

      // 3) order 补齐（可选）
      if (!Number.isInteger(f.order) || f.order < 1) { f.order = idx + 1; changed = true }
    })

    if (changed) {
      // 显式标记数组变更，避免 Mongoose 不认为改了
      p.markModified('fields')

      // 关闭校验保存，防止旧公式/旧 slug 校验拦截
      await p.save({ validateBeforeSave: false })

      touched += 1
      console.log(`[OK] Platform ${p._id} updated: ${p.fields.length} fields`)
    }
  }

  console.log(`Done. Platforms updated: ${touched}`)
  await mongoose.disconnect()
  process.exit(0)
}

main().catch(async e => {
  console.error(e)
  try { await mongoose.disconnect() } catch {}
  process.exit(1)
})
