

/**
 * \u89d2\u8272 Model
 */
import mongoose from 'mongoose'

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    permissions: { type: [String], default: [] }
  },
  { timestamps: true }
)


export default mongoose.model('Role', roleSchema)
