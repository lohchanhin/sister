// scripts/migrateAdDailyKeysToFieldIds.js
import mongoose from 'mongoose'
import Platform from '../models/platform.model.js'
import AdDaily from '../models/adDaily.model.js'

const isObject = (v) => v && typeof v === 'object' && !Array.isArray(v)

function buildIdMap(platform) {
  const map = {}
  for (const f of platform.fields || []) {
    const fid = String(f.id)
    map[fid] = fid
    if (f.slug) map[f.slug] = fid
    if (f.name) map[f.name] = fid
  }
  return map
}

/**
 * 把一条记录的 extra/colors 迁移到 id 键
 * @param {Object} idMap  平台的 id 映射
 * @param {Object} extra  原 extraData
 * @param {Object} colors 原 colors
 * @param {boolean} destructive 是否破坏性：true=只保留 id 键；false=保留未知键
 */
function migrateOne(idMap, extra, colors, destructive = true) {
  const outExtra = {}
  const outColors = {}

  // 先按映射生成 id 键集合
  for (const [k, v] of Object.entries(extra || {})) {
    const nk = idMap[k]
    if (nk) outExtra[nk] = v
  }
  for (const [k, v] of Object.entries(colors || {})) {
    const nk = idMap[k]
    if (nk) outColors[nk] = v
  }

  if (!destructive) {
    // 非破坏性：保留未知键
    for (const [k, v] of Object.entries(extra || {})) {
      if (!(k in outExtra)) outExtra[k] = v
    }
    for (const [k, v] of Object.entries(colors || {})) {
      if (!(k in outColors)) outColors[k] = v
    }
  }

  // 如果没有任何映射命中，仍保留原对象（非破坏性时）
  return { extra: outExtra, colors: outColors }
}

async function migratePlatform(platform, { apply = false, destructive = true, pageSize = 1000 }) {
  const idMap = buildIdMap(platform)
  const filter = { platformId: platform._id }

  const total = await AdDaily.countDocuments(filter)
  let skip = 0, changed = 0, scanned = 0
  const ops = []

  while (skip < total) {
    const batch = await AdDaily.find(filter).skip(skip).limit(pageSize).lean()
    skip += batch.length
    scanned += batch.length

    for (const doc of batch) {
      const beforeExtra = isObject(doc.extraData) ? doc.extraData : {}
      const beforeColors = isObject(doc.colors) ? doc.colors : {}
      const { extra, colors } = migrateOne(idMap, beforeExtra, beforeColors, destructive)

      // 仅当变化时入队
      const diff =
        JSON.stringify(extra) !== JSON.stringify(beforeExtra) ||
        JSON.stringify(colors) !== JSON.stringify(beforeColors)

      if (diff) {
        changed += 1
        if (apply) {
          ops.push({
            updateOne: {
              filter: { _id: doc._id },
              update: { $set: { extraData: extra, colors } }
            }
          })
        }
      }

      // 批量提交
      if (apply && ops.length >= 1000) {
        await AdDaily.bulkWrite(ops, { ordered: false })
        ops.length = 0
      }
    }

    if (!apply) {
      console.log(`[dry-run] platform=${platform._id} scanned=${scanned}/${total} changed=${changed}`)
    } else {
      console.log(`[apply] platform=${platform._id} scanned=${scanned}/${total} queuedOps=${ops.length} changed=${changed}`)
    }
  }

  if (apply && ops.length) {
    await AdDaily.bulkWrite(ops, { ordered: false })
  }

  return { scanned, changed }
}

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) { console.error('[ERR] MONGODB_URI missing'); process.exit(1) }
  await mongoose.connect(uri)

  const apply = process.argv.includes('--apply')       // 默认 dry-run
  const keep = process.argv.includes('--keep-unknown') // 保留未知鍵（非破坏性）
  const destructive = !keep

  const platforms = await Platform.find({}).lean(false)
  let totalChanged = 0, totalScanned = 0

  for (const p of platforms) {
    if (!Array.isArray(p.fields) || !p.fields.length) continue
    const { scanned, changed } = await migratePlatform(p, { apply, destructive })
    totalScanned += scanned
    totalChanged += changed
  }

  console.log(`\nDONE. scanned=${totalScanned}, changed=${totalChanged}, mode=${apply ? 'APPLY' : 'DRY-RUN'}, destructive=${destructive}`)
  await mongoose.disconnect()
  process.exit(0)
}

main().catch(async (e) => {
  console.error(e)
  try { await mongoose.disconnect() } catch {}
  process.exit(1)
})
