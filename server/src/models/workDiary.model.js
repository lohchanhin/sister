import mongoose from 'mongoose'

export const WORK_DIARY_STATUS = Object.freeze({
  DRAFT: 'draft',
  SUBMITTED: 'submitted',
  APPROVED: 'approved',
  REVISION: 'revision'
})

const imageSchema = new mongoose.Schema(
  {
    id: { type: String },
    path: { type: String },
    name: { type: String },
    url: { type: String }
  },
  { _id: false }
)

const workDiarySchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    content: { type: String, default: '' },
    summary: { type: String, default: '' },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: Object.values(WORK_DIARY_STATUS),
      default: WORK_DIARY_STATUS.DRAFT
    },
    supervisorComment: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    images: { type: [imageSchema], default: [] }
  },
  { timestamps: true }
)

workDiarySchema.index({ date: 1, owner: 1 })

export default mongoose.model('WorkDiary', workDiarySchema)
