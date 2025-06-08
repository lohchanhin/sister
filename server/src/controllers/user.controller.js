import User from '../models/user.model.js'
import Role from '../models/role.model.js'
import bcrypt from 'bcryptjs'

const managerOnly = (req,res) => {
  if (req.user.roleId?.name !== 'manager') {
    res.status(403).json({ message:'僅限 Manager 操作' })
    return true
  }
  return false
}

/* 取得所有使用者 */
export const getAllUsers = async (req,res) => {
  if (!req.query.role && managerOnly(req,res)) return
  let filter = {}
  if (req.query.role) {
    const roleDoc = await Role.findOne({ name: req.query.role })
    if (roleDoc) filter.roleId = roleDoc._id
  }
  const users = await User.find(filter)
    .select('-password')
    .populate('roleId')

  const result = users.map((u) => ({
    ...u.toObject(),
    role: u.roleId?.name
  }))

  res.json(result)
}

/* 新增 */
export const createUser = async (req,res) => {
  const { name,email,role,password } = req.body
  if (await User.findOne({ email })) return res.status(400).json({ message:'Email 已存在' })
  const hash = await bcrypt.hash(password,12)
  const roleDoc = await Role.findOne({ name: role })
  const u = await User.create({ name,email,roleId: roleDoc?._id,password:hash })
  const populated = await u.populate('roleId')
  res.status(201).json({
    ...populated.toObject(),
    role: populated.roleId?.name
  })
}

/* 更新 */
export const updateUser = async (req,res) => {
  const { name,email,role,password } = req.body
  const u = await User.findById(req.params.id)
  if (!u) return res.status(404).json({ message:'找不到使用者' })
  if (email && email!==u.email && await User.findOne({ email }))
    return res.status(400).json({ message:'Email 已存在' })
  if (name)  u.name  = name
  if (email) u.email = email
  if (role) {
    const roleDoc = await Role.findOne({ name: role })
    u.roleId = roleDoc?._id
  }
  if (password) u.password = await bcrypt.hash(password,12)
  await u.save()
  const populated = await u.populate('roleId')
  res.json({
    ...populated.toObject(),
    role: populated.roleId?.name
  })
}

/* 刪除 */
export const deleteUser = async (req,res) => {
  await User.findByIdAndDelete(req.params.id)
  res.json({ message:'已刪除' })
}

/* 取得個人資料 */
export const getProfile = async (req,res) => {
  const user = await req.user.populate('roleId')
  res.json({
    ...user.toObject(),
    role: user.roleId?.name
  })
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
  const populated = await u.populate('roleId')
  res.json(populated)
}
