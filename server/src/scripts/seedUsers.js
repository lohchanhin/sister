import dotenv from 'dotenv'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import User from '../models/user.model.js'
import { ROLES } from '../config/roles.js'

dotenv.config()

const users = [
  { username: 'employee', password: '123456', email: 'employee@example.com', role: ROLES.EMPLOYEE },
  { username: 'manager', password: '123456', email: 'manager@example.com', role: ROLES.MANAGER },
  { username: 'outsource', password: '123456', email: 'outsource@example.com', role: ROLES.OUTSOURCE }
]

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ MongoDB 已連線')

    await User.deleteMany({})

    for (const user of users) {
      user.password = await bcrypt.hash(user.password, 10)
    }

    await User.insertMany(users)
    console.log('📌 預設帳號建立完成')
  } catch (err) {
    console.error('❌ 建立帳號失敗：', err.message)
  } finally {
    await mongoose.disconnect()
  }
}

seed()
