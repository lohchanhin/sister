// models/platform.model.js
import mongoose from 'mongoose'

/** slug 规则：字母或下划线开头，仅字母/数字/下划线 */
const SLUG_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/

/** 从名称生成尽量友好的 slug；不满足规则则返回空串 */
function normalizeSlug(name) {
  if (!name) return ''
  let s = String(name).trim().toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')   // 非法字符→_
    .replace(/^_+|_+$/g, '')        // 去头尾 _
  return SLUG_RE.test(s) ? s : ''
}

/** 字段子文档（关闭自动 _id） */
const FieldSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
      default: () => new mongoose.Types.ObjectId().toString()
    },
    name:   { type: String, required: true },
    slug:   { type: String, required: true },
    type:   { type: String, enum: ['text', 'number', 'date', 'formula'], default: 'text' },
    order:  { type: Number, default: 0 },
    formula:{ type: String, default: '' }
  },
  { _id: false }
)

const PlatformSchema = new mongoose.Schema(
  {
    clientId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    name:         { type: String, required: true },
    platformType: { type: String, default: '' },
    mode:         { type: String, default: 'custom' },

    /** 自订字段 */
    fields:       { type: [FieldSchema], default: [] },

    /** 平台级别的永久别名（旧键→字段 id），用于读取时的兼容/迁移 */
    fieldAliases: { type: Object, default: {} }
  },
  { timestamps: true }
)

/** 同一客户下平台名唯一 */
PlatformSchema.index({ clientId: 1, name: 1 }, { unique: true })

/**
 * 统一规范字段：
 * - id 一律字符串且存在
 * - slug 合法/去重（name→slug，不行就分配 f_1...）
 * - order 补齐为 1..n（仅当缺失/非法时）
 */
PlatformSchema.pre('validate', function(next) {
  try {
    if (!Array.isArray(this.fields)) return next()

    // 已占用的 slug 集合（先收集合法的，便于 f_x 递增）
    const used = new Set(
      this.fields
        .map(f => (SLUG_RE.test(f?.slug || '') ? f.slug : ''))
        .filter(Boolean)
    )

    let seq = 0
    const nextSlug = () => {
      while (true) {
        seq += 1
        const candidate = `f_${seq}`
        if (!used.has(candidate)) return candidate
      }
    }

    this.fields.forEach((f, idx) => {
      // id: 保证存在且为 String
      if (!f.id) f.id = new mongoose.Types.ObjectId().toString()
      else if (typeof f.id !== 'string') f.id = String(f.id)

      // slug: 先用传入的合法值；否则根据 name 生成；仍不行则 f_n
      let slug = SLUG_RE.test(f?.slug || '') ? f.slug : normalizeSlug(f?.name)
      if (!slug || used.has(slug)) slug = nextSlug()
      f.slug = slug
      used.add(slug)

      // order: 缺失/NaN/负数时按位置补 1..n（保留已有的正整数）
      if (!Number.isInteger(f.order) || f.order < 1) f.order = idx + 1

      // type 合法性兜底
      if (!['text','number','date','formula'].includes(f.type)) f.type = 'text'
    })

    next()
  } catch (e) {
    next(e)
  }
})

export default mongoose.model('Platform', PlatformSchema)
