import { t } from '../i18n/messages.js'
import mongoose from 'mongoose'
import Role from '../models/role.model.js'
import { getCache, setCache, delCache, clearCacheByPrefix } from '../utils/cache.js'

const normalizeViewerIds = value => {
  if (value === undefined || value === null) return undefined
  const list = Array.isArray(value) ? value : [value]
  const unique = new Set()
  list.forEach(id => {
    if (!id) return
    const str = id?.toString?.() || String(id)
    if (mongoose.Types.ObjectId.isValid(str)) {
      unique.add(str)
    }
  })
  return Array.from(unique)
}

export const createRole = async (req, res) => {
  const payload = {
    name: req.body.name,
    permissions: req.body.permissions,
    menus: req.body.menus
  }
  const viewers = normalizeViewerIds(req.body.workDiaryViewers)
  if (viewers !== undefined) payload.workDiaryViewers = viewers

  const role = await Role.create(payload)
  await clearCacheByPrefix('roles:')
  res.status(201).json(role)
}

export const getRoles = async (req, res) => {
  const cacheKey = 'roles:all'
  const cached = await getCache(cacheKey)
  if (cached) return res.json(cached)
  const roles = await Role.find()
  await setCache(cacheKey, roles)
  res.json(roles)
}

export const getRole = async (req, res) => {
  const cacheKey = `role:${req.params.id}`
  const cached = await getCache(cacheKey)
  if (cached) return res.json(cached)
  const role = await Role.findById(req.params.id)
  if (!role) return res.status(404).json({ message: t('ROLE_NOT_FOUND') })
  await setCache(cacheKey, role)
  res.json(role)
}

export const updateRole = async (req, res) => {
  const update = {
    name: req.body.name,
    permissions: req.body.permissions,
    menus: req.body.menus
  }
  const viewers = normalizeViewerIds(req.body.workDiaryViewers)
  if (viewers !== undefined) update.workDiaryViewers = viewers

  const role = await Role.findByIdAndUpdate(req.params.id, update, { new: true })
  if (!role) return res.status(404).json({ message: t('ROLE_NOT_FOUND') })
  await clearCacheByPrefix('roles:')
  await delCache(`role:${req.params.id}`)
  res.json(role)
}

export const deleteRole = async (req, res) => {
  await Role.findByIdAndDelete(req.params.id)
  await clearCacheByPrefix('roles:')
  await delCache(`role:${req.params.id}`)
  res.json({ message: t('ROLE_DELETED') })
}
