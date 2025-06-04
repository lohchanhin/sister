/**
 * \u81ea\u5b9a\u7fa9\u9032\u5ea6\u8ffd\u8e64\u300c\u6b04\u4f4d\u6a21\u677f\u300d
 */
import mongoose from 'mongoose'

const fieldSchema = new mongoose.Schema(
  {
    fieldName: { type: String, required: true },
    fieldType: { type: String, enum: ['string', 'date', 'number'], default: 'string' }
  },
  { _id: false }
)

const templateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    fields: [fieldSchema],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
)

export default mongoose.model('ProgressTemplate', templateSchema)
