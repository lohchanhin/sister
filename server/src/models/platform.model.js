import mongoose from 'mongoose'

const platformSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    name: { type: String, required: true },
    platformType: { type: String, default: '' },
    mode: { type: String, default: 'custom' },
    // 自訂欄位名稱與型別
    fields: {
      type: [
        new mongoose.Schema(
          {
            name: { type: String, required: true },
            type: { type: String, default: 'text' },
            order: { type: Number, default: 0 }
          },
          { _id: false }
        )
      ],
      default: []
    }
  },
  { timestamps: true }
)

platformSchema.index({ clientId: 1, name: 1 }, { unique: true })

export default mongoose.model('Platform', platformSchema)
