import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    link: { type: String, default: '' },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    read: { type: Boolean, default: false }
  },
  { timestamps: true }
)

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 })

export default mongoose.model('Notification', notificationSchema)
