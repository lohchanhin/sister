/**
 * 素材 / 影片 Model (Asset)
 */
import mongoose from 'mongoose'
import { ROLES } from '../config/roles.js'

/* ---------- 子文件：留言 ---------- */
const commentSchema = new mongoose.Schema(
  {
    userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true }
  },
  { timestamps: true }
)

/* ---------- 主文件：Asset ---------- */
const assetSchema = new mongoose.Schema(
  {
    /* 顯示用標題（可編輯），預設同上傳時的原始檔名 */
    title:      { type: String, default: '' },

    /* 原始檔名（不可編輯） */
    filename:   { type: String, required: true },

    path:       { type: String, required: true },
    type:         { type: String, enum: ['raw', 'edited'], default: 'raw' },
    reviewStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    description:  { type: String, default: '' },

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    folderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },

    /* 允許查看角色 */
    allowRoles: {
      type: [String],
      enum: Object.values(ROLES),
      default: [ROLES.MANAGER, ROLES.EMPLOYEE]
    },

    /* 留言 */
    comments: [commentSchema]
  },
  { timestamps: true }
)

export default mongoose.model('Asset', assetSchema)
