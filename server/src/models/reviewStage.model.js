import mongoose from 'mongoose'

const reviewStageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    order: { type: Number, required: true },
    responsible: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
)

export default mongoose.model('ReviewStage', reviewStageSchema)
