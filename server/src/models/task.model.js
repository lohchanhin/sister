/**
 * \u4efb\u52d9\u6a21\u578b\uff1a\u526a\u8f2f\u9700\u6c42\u3001\u9032\u5ea6
 */
import mongoose from 'mongoose'

const taskSchema = new mongoose.Schema(
  {
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'approved'],
      default: 'pending'
    },
    requirements: { type: String, required: true },
    comments: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        message: { type: String }
      }
    ]
  },
  { timestamps: true }
)

export default mongoose.model('Task', taskSchema)
