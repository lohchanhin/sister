import Folder from '../models/folder.model.js'

export const getDescendantFolderIds = async (parentId = null) => {
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
  return ids
}

export const getAncestorFolderIds = async (folderId = null) => {
  const ids = []
  let current = folderId
  while (current) {
    const folder = await Folder.findById(current)
    if (!folder || !folder.parentId) break
    ids.push(folder.parentId)
    current = folder.parentId
  }
  return ids
}
