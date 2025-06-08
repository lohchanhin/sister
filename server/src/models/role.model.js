import mongoose from 'mongoose'
import { PERMISSIONS } from '../config/permissions.js'

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    permissions: {
      type: [String],
      validate: {
        validator: (arr) => arr.every((p) => Object.values(PERMISSIONS).includes(p)),
        message: 'Invalid permission'
      },
      default: []
    }
  },
  { timestamps: true }
)

export default mongoose.model('Role', roleSchema)
