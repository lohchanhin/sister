import User from '../models/user.model.js'
import Role from '../models/role.model.js'
import { ROLES } from '../config/roles.js'

export const includeManagers = async (ids = []) => {
  const role = await Role.findOne({ name: ROLES.MANAGER })
  if (!role) return ids
  const managers = await User.find({ roleId: role._id }).select('_id')
  const managerIds = managers.map(m => m._id.toString())
  const final = Array.from(new Set([...ids.map(id => id.toString()), ...managerIds]))
  return final
}
