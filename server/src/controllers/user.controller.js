import User from '../models/user.model.js'
import Role from '../models/role.model.js'
import { getCache, setCache, clearCacheByPrefix } from '../utils/cache.js'

/* 取得所有使用者 */
export const getAllUsers = async (req,res) => {
  const cacheKey = `users:${JSON.stringify(req.query)}`
  const cached = await getCache(cacheKey)
  if (cached) return res.json(cached)

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
    role: u.roleId?.name,
    menus: u.roleId?.menus || [],
    permissions: u.roleId?.permissions || []
  }))

  await setCache(cacheKey, result)
  res.json(result)
}

/* 新增 */
export const createUser = async (req,res) => {
  const { username, name, email, role, password } = req.body
  if (await User.findOne({ email })) return res.status(400).json({ message:'Email 已存在' })
  const roleDoc = await Role.findOne({ name: role })
  const u = await User.create({ username, name, email, roleId: roleDoc?._id, password })
  const populated = await u.populate('roleId')
  await clearCacheByPrefix('users:')
  res.status(201).json({
    ...populated.toObject(),
    role: populated.roleId?.name,
    menus: populated.roleId?.menus || [],
    permissions: populated.roleId?.permissions || []
  })
}

/* 更新 */
export const updateUser = async (req,res) => {
  const { username, name, email, role, password } = req.body
  const u = await User.findById(req.params.id)
  if (!u) return res.status(404).json({ message:'找不到使用者' })
  if (username && username!==u.username && await User.findOne({ username }))
    return res.status(400).json({ message:'使用者已存在' })
  if (email && email!==u.email && await User.findOne({ email }))
    return res.status(400).json({ message:'Email 已存在' })
  if (username) u.username = username
  if (name)  u.name  = name
  if (email) u.email = email
  if (role) {
    const roleDoc = await Role.findOne({ name: role })
    u.roleId = roleDoc?._id
  }
  if (password) u.password = password
  await u.save()
  await clearCacheByPrefix('users:')
  const populated = await u.populate('roleId')
  res.json({
    ...populated.toObject(),
    role: populated.roleId?.name,
    menus: populated.roleId?.menus || [],
    permissions: populated.roleId?.permissions || []
  })
}

/* 刪除 */
export const deleteUser = async (req,res) => {
  await User.findByIdAndDelete(req.params.id)
  await clearCacheByPrefix('users:')
  res.json({ message:'已刪除' })
}

/* 取得個人資料 */
export const getProfile = async (req,res) => {
  const user = await req.user.populate('roleId')
  res.json({
    ...user.toObject(),
    role: user.roleId?.name,
    menus: user.roleId?.menus || [],
    permissions: user.roleId?.permissions || []
  })
}

/* 更新個人資料 */
export const updateProfile = async (req,res) => {
  const { username, name, email, password } = req.body
  const u = await User.findById(req.user._id)
  if (!u) return res.status(404).json({ message:'找不到使用者' })
  if (username && username!==u.username && await User.findOne({ username }))
    return res.status(400).json({ message:'使用者已存在' })
  if (email && email!==u.email && await User.findOne({ email }))
    return res.status(400).json({ message:'Email 已存在' })
  if (username) u.username = username
  if (name)     u.name     = name
  if (email)    u.email    = email
  if (password) u.password = password
  await u.save()
  await clearCacheByPrefix('users:')
  const populated = await u.populate('roleId')
  res.json({
    ...populated.toObject(),
    role: populated.roleId?.name,
    menus: populated.roleId?.menus || [],
    permissions: populated.roleId?.permissions || []
  })
}
