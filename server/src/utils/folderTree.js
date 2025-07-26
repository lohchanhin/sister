import Folder from '../models/folder.model.js'
import { getCache, setCache } from './cache.js'

const DESC_PREFIX = 'folderTree:desc'
const ANCE_PREFIX  = 'folderTree:anc'
const ROOT_PREFIX  = 'folderTree:root'
const TTL = 300

export const getDescendantFolderIds = async (parentId = null) => {
  const cacheKey = `${DESC_PREFIX}:${parentId || 'root'}`
  const cached = await getCache(cacheKey)
  if (cached) return cached

  const ids = []
  const queue = [parentId]
  while (queue.length) {
    const id = queue.shift()
    const children = await Folder.find({ parentId: id })
    for (const child of children) {
      ids.push(child._id)
      queue.push(child._id)
    }
  }
  await setCache(cacheKey, ids, TTL)
  return ids
}

export const getAncestorFolderIds = async (folderId = null) => {
  const cacheKey = `${ANCE_PREFIX}:${folderId || 'root'}`
  const cached = await getCache(cacheKey)
  if (cached) return cached

  const ids = []
  let current = folderId
  while (current) {
    const folder = await Folder.findById(current)
    if (!folder || !folder.parentId) break
    ids.push(folder.parentId)
    current = folder.parentId
  }
  await setCache(cacheKey, ids, TTL)
  return ids
}

export const getRootFolder = async (folderId) => {
  const cacheKey = `${ROOT_PREFIX}:${folderId || 'root'}`
  const cached = await getCache(cacheKey)
  if (cached) return cached

  let currentId = folderId
  let folder = null
  while (currentId) {
    folder = await Folder.findById(currentId)
    if (!folder || !folder.parentId) break
    currentId = folder.parentId
  }
  await setCache(cacheKey, folder, TTL)
  return folder
}
