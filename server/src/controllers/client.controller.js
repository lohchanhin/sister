import { t } from '../i18n/messages.js'
import Client from '../models/client.model.js'
import { getCache, setCache, delCache, clearCacheByPrefix } from '../utils/cache.js'

export const createClient = async (req, res) => {
  const client = await Client.create(req.body)
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
