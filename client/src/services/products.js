import {
  fetchProducts,
  uploadAsset,
  updateAsset,
  deleteAsset,
  reviewAsset,
  fetchAssetStages,
  updateAssetStage,
  updateAssetsViewers,
  getAssetUrl
} from './assets'

export { fetchProducts }

export const uploadProduct = (file, folderId, progressCb) =>
  uploadAsset(file, folderId, { type: 'edited' }, progressCb)

export const updateProduct = (id, data) =>
  updateAsset(id, data)

export const deleteProduct = id =>
  deleteAsset(id)

export const reviewProduct = (id, status) =>
  reviewAsset(id, status)

export const fetchProductStages = id =>
  fetchAssetStages(id)

export const updateProductStage = (productId, stageId, completed) =>
  updateAssetStage(productId, stageId, completed)

export const updateProductsViewers = (ids, users) =>
  updateAssetsViewers(ids, users)

export const getProductUrl = (id, download = false) =>
  getAssetUrl(id, download)
