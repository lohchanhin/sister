import mongoose from 'mongoose'
import { PERMISSIONS } from '../config/permissions.js'
import { MENUS } from '../config/menus.js'


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
    },

    menus: {
      type: [String],
      validate: {
        validator: (arr) => arr.every((m) => Object.values(MENUS).includes(m)),
        message: 'Invalid menu'
      },
      default: []
    },

    workDiaryViewers: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'User',
      default: []
    }


  },
  { timestamps: true }
)


export default mongoose.model('Role', roleSchema)
