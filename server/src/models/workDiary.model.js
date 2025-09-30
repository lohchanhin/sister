import mongoose from 'mongoose'

const contentBlockSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['text', 'todo', 'link', 'custom'],
      default: 'text'
    },
    value: { type: String, default: '' },
    order: { type: Number, default: 0 }
  },
  { _id: false }
)

const managerCommentSchema = new mongoose.Schema(
  {
    text: { type: String, default: '' },
    commentedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    commentedAt: { type: Date }
  },
  { _id: false }
)

const workDiarySchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    title: { type: String, required: true, trim: true },
    contentBlocks: { type: [contentBlockSchema], default: [] },
    images: { type: [String], default: [] },
    managerComment: { type: managerCommentSchema, default: {} },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'approved', 'rejected'],
      default: 'draft'
    },
    visibility: {
      type: String,
      enum: ['private', 'team', 'company', 'custom'],
      default: 'private'
    },
    visibleTo: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: []
    }
  },
  { timestamps: true }
)

workDiarySchema.index({ author: 1, date: 1 }, { unique: true })
workDiarySchema.index({ date: -1 })
workDiarySchema.index({ status: 1 })

export default mongoose.model('WorkDiary', workDiarySchema)
