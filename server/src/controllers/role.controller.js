import Role from '../models/role.model.js'

export const createRole = async (req, res) => {
  const role = await Role.create({ name: req.body.name, permissions: req.body.permissions })
  res.status(201).json(role)
}

export const getRoles = async (req, res) => {
  const roles = await Role.find()
  res.json(roles)
}

export const getRole = async (req, res) => {
  const role = await Role.findById(req.params.id)
  if (!role) return res.status(404).json({ message: '\u89d2\u8272\u4e0d\u5b58\u5728' })
  res.json(role)
}

export const updateRole = async (req, res) => {
  const role = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!role) return res.status(404).json({ message: '\u89d2\u8272\u4e0d\u5b58\u5728' })
  res.json(role)
}

export const deleteRole = async (req, res) => {
  await Role.findByIdAndDelete(req.params.id)
  res.json({ message: '\u89d2\u8272\u5df2\u522a\u9664' })
}
