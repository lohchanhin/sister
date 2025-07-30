import Client from '../models/client.model.js'
import { getCache, setCache, delCache, clearCacheByPrefix } from '../utils/cache.js'

export const createClient = async (req, res) => {
  const client = await Client.create(req.body)
  await clearCacheByPrefix('clients:')
  res.status(201).json(client)
}

export const getClients = async (_req, res) => {
  const cacheKey = 'clients:all'
  const cached = await getCache(cacheKey)
  if (cached) return res.json(cached)
  const clients = await Client.find()
  await setCache(cacheKey, clients)
  res.json(clients)
}

export const getClient = async (req, res) => {
  const cacheKey = `client:${req.params.id}`
  const cached = await getCache(cacheKey)
  if (cached) return res.json(cached)
  const client = await Client.findById(req.params.id)
  if (!client) return res.status(404).json({ message: '客戶不存在' })
  await setCache(cacheKey, client)
  res.json(client)
}

export const updateClient = async (req, res) => {
  const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!client) return res.status(404).json({ message: '客戶不存在' })
  await clearCacheByPrefix('clients:')
  await delCache(`client:${req.params.id}`)
  res.json(client)
}

export const deleteClient = async (req, res) => {
  await Client.findByIdAndDelete(req.params.id)
  await clearCacheByPrefix('clients:')
  await delCache(`client:${req.params.id}`)
  res.json({ message: '客戶已刪除' })
}
