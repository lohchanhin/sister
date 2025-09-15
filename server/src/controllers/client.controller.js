import { t } from '../i18n/messages.js'
import Client from '../models/client.model.js'
import Role from '../models/role.model.js'
import User from '../models/user.model.js'
import UserClientPermission from '../models/userClientPermission.model.js'
import { ROLES } from '../config/roles.js'
import { getCache, setCache, delCache, clearCacheByPrefix } from '../utils/cache.js'

export const createClient = async (req, res) => {
  const client = await Client.create(req.body)

  const managerRole = await Role.findOne({ name: ROLES.MANAGER })
  if (managerRole) {
    const managers = await User.find({ roleId: managerRole._id })
    const docs = []
    for (const u of managers) {
      if (!u.allowedClients.some(cid => cid.equals(client._id))) {
        u.allowedClients.push(client._id)
        docs.push({ userId: u._id, clientId: client._id })
      }
    }
    if (docs.length) {
      await UserClientPermission.insertMany(docs, { ordered: false }).catch(() => {})
    }
    await Promise.all(managers.map(u => u.save()))
    await clearCacheByPrefix('users:')
  }

  await clearCacheByPrefix('clients:')
  res.status(201).json(client)
}

export const getClients = async (req, res) => {
  const allowed = req.user.allowedClients || []
  const cacheKey = allowed.length ? `clients:user:${req.user._id}` : 'clients:all'
  const cached = await getCache(cacheKey)
  if (cached) return res.json(cached)
  const query = allowed.length ? { _id: { $in: allowed } } : {}
  const clients = await Client.find(query)
  await setCache(cacheKey, clients)
  res.json(clients)
}

export const getClient = async (req, res) => {
  const cacheKey = `client:${req.params.id}`
  const cached = await getCache(cacheKey)
  if (cached) return res.json(cached)
  const client = await Client.findById(req.params.id)
  if (!client) return res.status(404).json({ message: t('CLIENT_NOT_FOUND') })
  await setCache(cacheKey, client)
  res.json(client)
}

export const updateClient = async (req, res) => {
  const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!client) return res.status(404).json({ message: t('CLIENT_NOT_FOUND') })
  await clearCacheByPrefix('clients:')
  await delCache(`client:${req.params.id}`)
  res.json(client)
}

export const deleteClient = async (req, res) => {
  await Client.findByIdAndDelete(req.params.id)
  await clearCacheByPrefix('clients:')
  await delCache(`client:${req.params.id}`)
  res.json({ message: t('CLIENT_DELETED') })
}
