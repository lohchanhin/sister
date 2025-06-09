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
