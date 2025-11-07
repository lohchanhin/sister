import mongoose from 'mongoose'

const assetDeletionLogSchema = new mongoose.Schema(
  {
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset',
      required: true
    },
    originalFilename: {
      type: String,
      required: true
    },
    method: {
      type: String,
      enum: ['manual-single', 'manual-bulk', 'scheduled'],
      required: true
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    deletedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    versionKey: false
  }
)

assetDeletionLogSchema.index({ deletedAt: -1 })
assetDeletionLogSchema.index({ assetId: 1 })

export default mongoose.model('AssetDeletionLog', assetDeletionLogSchema)
