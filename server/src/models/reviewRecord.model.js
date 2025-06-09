import mongoose from 'mongoose'

const reviewRecordSchema = new mongoose.Schema(
  {
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
    stageId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReviewStage', required: true },
    completed: { type: Boolean, default: false },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
)

reviewRecordSchema.index({ assetId: 1, stageId: 1 }, { unique: true })

export default mongoose.model('ReviewRecord', reviewRecordSchema)
