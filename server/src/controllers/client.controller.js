import Client from '../models/client.model.js'

export const createClient = async (req, res) => {
  const client = await Client.create(req.body)
  res.status(201).json(client)
}

export const getClients = async (_req, res) => {
  const clients = await Client.find()
  res.json(clients)
}

export const getClient = async (req, res) => {
  const client = await Client.findById(req.params.id)
  if (!client) return res.status(404).json({ message: '客戶不存在' })
  res.json(client)
}

export const updateClient = async (req, res) => {
  const client = await Client.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!client) return res.status(404).json({ message: '客戶不存在' })
  res.json(client)
}

export const deleteClient = async (req, res) => {
  await Client.findByIdAndDelete(req.params.id)
  res.json({ message: '客戶已刪除' })
}
