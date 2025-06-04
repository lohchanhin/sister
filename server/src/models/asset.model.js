/**
 * \u7d20\u6750\uff0f\u5f71\u7247\u6a21\u578b
 */
import mongoose from 'mongoose'
import { ROLES } from '../config/roles.js'

const commentSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true }
  },
  { timestamps: true }
)

const assetSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    path: { type: String, required: true },
    type: { type: String, enum: ['raw', 'edited'], default: 'raw' },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    allowRoles: {
      type: [String],
      enum: Object.values(ROLES),
      default: [ROLES.MANAGER, ROLES.EMPLOYEE]
    },
    comments: [commentSchema]
  },
  { timestamps: true }
)

export default mongoose.model('Asset', assetSchema)
