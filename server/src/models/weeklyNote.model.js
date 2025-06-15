import mongoose from 'mongoose'

const weeklyNoteSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    platformId: { type: mongoose.Schema.Types.ObjectId, ref: 'Platform', required: true },
    week: { type: String, required: true },
    text: { type: String, default: '' },
    images: { type: [String], default: [] }
  },
  { timestamps: true }
)

weeklyNoteSchema.index({ clientId: 1, platformId: 1, week: 1 }, { unique: true })

export default mongoose.model('WeeklyNote', weeklyNoteSchema)
