/**
 * \u4f7f\u7528\u8005\u6a21\u578b
 */
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { ROLES } from '../config/roles.js'

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    email: { type: String, required: true, unique: true },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.EMPLOYEE
    }
  },
  { timestamps: true }
)

/* ---------- \u5bc6\u78bc\u52a0\u5bc6 ---------- */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

/* ---------- \u9a57\u8b49\u5bc6\u78bc ---------- */
userSchema.methods.matchPassword = function (pwd) {
  return bcrypt.compare(pwd, this.password)
}

export default mongoose.model('User', userSchema)
