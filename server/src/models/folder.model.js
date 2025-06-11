import mongoose from 'mongoose'

const folderSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
    description: { type: String },
    script: { type: String },
    type: { type: String, enum: ['raw', 'edited'], default: 'raw' },

    /* 可存取使用者 */
    allowedUsers: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },

    /* 標籤 */
    tags: { type: [String], default: [] },
    /* 建立者 */
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
)

export default mongoose.model('Folder', folderSchema)
