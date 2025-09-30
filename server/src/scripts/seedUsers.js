import dotenv from 'dotenv'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import User from '../models/user.model.js'
import Role from '../models/role.model.js'
import { ROLES } from '../config/roles.js'
import { PERMISSIONS } from '../config/permissions.js'
import { MENUS } from '../config/menus.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const users = [
  { username: 'employee', name: '員工', password: '123456', email: 'employee@example.com', role: ROLES.EMPLOYEE },
  { username: 'manager', name: '經理', password: '123456', email: 'manager@example.com', role: ROLES.MANAGER },
  { username: 'outsource', name: '外包', password: '123456', email: 'outsource@example.com', role: ROLES.OUTSOURCE }
]

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('✅ MongoDB 已連線')

    await User.deleteMany({})
    await Role.deleteMany({})

    // 建立角色資料
    const roleDocs = await Role.insertMany([
      {
        name: ROLES.EMPLOYEE,
        menus: [
          MENUS.DASHBOARD,
          MENUS.ASSETS,
          MENUS.PRODUCTS,
          MENUS.POPULAR_DATA,
          MENUS.ACCOUNT
        ]
      },
      {
        name: ROLES.MANAGER,
        permissions: Object.values(PERMISSIONS), // 包含 ROLE_MANAGE
        menus: Object.values(MENUS)
      },
      {
        name: ROLES.OUTSOURCE,
        menus: [MENUS.ASSETS]
      }
    ])
    const roleMap = {}
    for (const r of roleDocs) roleMap[r.name] = r._id

    for (const user of users) {
      user.password = await bcrypt.hash(user.password, 10)
      user.roleId = roleMap[user.role]
      delete user.role
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
