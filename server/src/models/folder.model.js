import mongoose from 'mongoose'
import { ROLES } from '../config/roles.js'

const folderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
    description: { type: String },
    script: { type: String },
    type: { type: String, enum: ['raw', 'edited'], default: 'raw' },

    /* 可存取使用者 */
    allowedUsers: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },

    /* 允許查看角色 */
    allowRoles: {
      type: [String],
      enum: Object.values(ROLES),
      default: [ROLES.MANAGER, ROLES.EMPLOYEE]
    },

    /* 標籤 */
    tags: { type: [String], default: [] }
  },
  { timestamps: true }
)

export default mongoose.model('Folder', folderSchema)
