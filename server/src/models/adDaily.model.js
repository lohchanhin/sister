import mongoose from 'mongoose'

const adDailySchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    platformId: { type: mongoose.Schema.Types.ObjectId, ref: 'Platform', required: true },
    date: { type: Date, required: true },
    spent: { type: Number, default: 0 },
    enquiries: { type: Number, default: 0 },
    reach: { type: Number, default: 0 },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    extraData: { type: mongoose.Schema.Types.Mixed },
    colors: { type: mongoose.Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
)

adDailySchema.index({ clientId: 1, platformId: 1, date: 1 }, { unique: true })

export default mongoose.model('AdDaily', adDailySchema)
