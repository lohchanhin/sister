import mongoose from 'mongoose'

const platformSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    name: { type: String, required: true },
    platformType: { type: String, default: '' }
  },
  { timestamps: true }
)

platformSchema.index({ clientId: 1, name: 1 }, { unique: true })

export default mongoose.model('Platform', platformSchema)
