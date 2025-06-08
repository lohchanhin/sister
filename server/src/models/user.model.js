/**
 * \u4f7f\u7528\u8005\u6a21\u578b
 */
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
// 角色模型
import Role from './role.model.js'

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    email: { type: String, required: true, unique: true },
    // 角色參照 Role 集合
    roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' }
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
