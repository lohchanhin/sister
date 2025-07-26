/**
 * 素材 / 影片 Model (Asset)
 */
import mongoose from 'mongoose'

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
    url:        { type: String },
    type:         { type: String, enum: ['raw', 'edited'], default: 'raw' },
    reviewStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    description:  { type: String, default: '' },

    // ===== 新增進度與發布相關欄位 =====
    editor:             { type: String, default: '' },               // 剪輯師
    editCompletedAt:    { type: Date },                               // 完成剪輯日期
    xhsStatus:          { type: String, enum: ['published', 'unpublished'], default: 'unpublished' },
    scheduledPublishAt: { type: Date },                               // 設定發佈日期
    finalChecked:       { type: Boolean, default: false },            // 最終檢查
    fbSynced:           { type: Boolean, default: false },            // Facebook 同步
    fbResponsible:      { type: String, default: '' },                // FB 負責人

    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    folderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },

    /* 標籤 */
    tags:       { type: [String], default: [] },

    /* 可查看使用者 */
    allowedUsers: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] },

    /* 留言 */
    comments: [commentSchema]
  },
  { timestamps: true }
)


export default mongoose.model('Asset', assetSchema)
