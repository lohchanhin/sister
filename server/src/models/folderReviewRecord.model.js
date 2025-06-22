import mongoose from 'mongoose'

const folderReviewRecordSchema = new mongoose.Schema(
  {
    folderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', required: true },
    stageId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReviewStage', required: true },
    completed: { type: Boolean, default: false },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
)

folderReviewRecordSchema.index({ folderId: 1, stageId: 1 }, { unique: true })

export default mongoose.model('FolderReviewRecord', folderReviewRecordSchema)
