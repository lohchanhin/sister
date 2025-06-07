import User from '../models/user.model.js'
import bcrypt from 'bcryptjs'

const managerOnly = (req,res) => {
  if (req.user.role !== 'manager') {
    res.status(403).json({ message:'僅限 Manager 操作' })
    return true
  }
  return false
}

/* 取得所有使用者 */
export const getAllUsers = async (req,res) => {
  if (!req.query.role && managerOnly(req,res)) return
  const filter = req.query.role ? { role: req.query.role } : {}
  const users = await User.find(filter).select('-password')
  res.json(users)
}

/* 新增 */
export const createUser = async (req,res) => {
  if (managerOnly(req,res)) return
  const { name,email,role,password } = req.body
  if (await User.findOne({ email })) return res.status(400).json({ message:'Email 已存在' })
  const hash = await bcrypt.hash(password,12)
  const u = await User.create({ name,email,role,password:hash })
  res.status(201).json(u)
}

/* 更新 */
export const updateUser = async (req,res) => {
  if (managerOnly(req,res)) return
  const { name,email,role,password } = req.body
  const u = await User.findById(req.params.id)
  if (!u) return res.status(404).json({ message:'找不到使用者' })
  if (email && email!==u.email && await User.findOne({ email }))
    return res.status(400).json({ message:'Email 已存在' })
  if (name)  u.name  = name
  if (email) u.email = email
  if (role)  u.role  = role
  if (password) u.password = await bcrypt.hash(password,12)
  await u.save()
  res.json(u)
}

/* 刪除 */
export const deleteUser = async (req,res) => {
  if (managerOnly(req,res)) return
  await User.findByIdAndDelete(req.params.id)
  res.json({ message:'已刪除' })
}

/* 取得個人資料 */
export const getProfile = async (req,res) => {
  res.json(req.user)
}

/* 更新個人資料 */
export const updateProfile = async (req,res) => {
  const { username,email,password } = req.body
  const u = await User.findById(req.user._id)
  if (!u) return res.status(404).json({ message:'找不到使用者' })
  if (username && username!==u.username && await User.findOne({ username }))
    return res.status(400).json({ message:'使用者已存在' })
  if (email && email!==u.email && await User.findOne({ email }))
    return res.status(400).json({ message:'Email 已存在' })
  if (username) u.username = username
  if (email)    u.email    = email
  if (password) u.password = await bcrypt.hash(password,12)
  await u.save()
  res.json(u)
}
