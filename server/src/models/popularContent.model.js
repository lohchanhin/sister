import mongoose from 'mongoose'

const popularContentSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    platformKey: { type: String, required: true },
    title: { type: String, required: true },
    publishDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    coverPath: { type: String, default: '' },
    exposure: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    coverCtr: { type: Number, default: 0 },
    avgWatchSeconds: { type: Number, default: 0 },
    completionRate: { type: Number, default: 0 },
    twoSecondDropRate: { type: Number, default: 0 },
    reviewNotes: { type: String, default: '' },
    trendLink: { type: String, default: '' },
    reminderNotes: { type: String, default: '' }
  },
  { timestamps: true }
)

popularContentSchema.index({ clientId: 1, platformKey: 1, publishDate: -1 })

export default mongoose.model('PopularContent', popularContentSchema)
