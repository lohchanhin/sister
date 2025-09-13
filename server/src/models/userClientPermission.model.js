import mongoose from 'mongoose'

const userClientPermissionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true }
  },
  { timestamps: true }
)

userClientPermissionSchema.index({ userId: 1, clientId: 1 }, { unique: true })

export default mongoose.model('UserClientPermission', userClientPermissionSchema)
