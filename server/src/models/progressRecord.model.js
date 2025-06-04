/**
 * \u9032\u5ea6\u7d00\u9304\uff1a\u6bcf\u5217\u8cc7\u6599\u5c0d\u61c9\u4e00\u500b\u6a21\u677f
 */
import mongoose from 'mongoose'

const recordSchema = new mongoose.Schema(
  {
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProgressTemplate', required: true },
    fieldValues: { type: Object, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
)

export default mongoose.model('ProgressRecord', recordSchema)
