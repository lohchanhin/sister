import {
  fetchProducts as fetchProductsRaw,
  uploadAssetAuto,
  updateAsset,
  deleteAsset,
  reviewAsset,
  fetchAssetStages,
  updateAssetStage,
  updateAssetsViewers,
  moveAssets,
  getAssetUrl,
  deleteAssetsBulk
} from './assets'
import api from './api'

export const fetchProducts = (folderId, tags = [], deep = false, sort) =>
  fetchProductsRaw(folderId, tags, deep, true, sort)

export const uploadProduct = (file, folderId, progressCb) =>
  uploadAssetAuto(file, folderId, { type: 'edited' }, progressCb)

export const updateProduct = (id, data) =>
  updateAsset(id, data)

export const deleteProduct = id =>
  deleteAsset(id)

export const reviewProduct = (id, status) =>
  reviewAsset(id, status)

export const fetchProductStages = id =>
  fetchAssetStages(id)

export const updateProductStage = (
  productId,
  stageId,
  completed,
  fromDashboard = false,
  skipPrevCheck = false
) => updateAssetStage(productId, stageId, completed, fromDashboard, skipPrevCheck)

export const updateProductsViewers = (ids, users) =>
  updateAssetsViewers(ids, users)

export const moveProducts = (ids, folderId) =>
  moveAssets(ids, folderId)

export const getProductUrl = (id, download = false) =>
  getAssetUrl(id, download)

export const deleteProducts = ids => deleteAssetsBulk(ids)
export const startBatchDownload = ids =>
  api.post('/products/batch-download', { ids }).then(res => res.data)

export const getBatchDownloadProgress = id =>
  api.get(`/products/batch-download/${id}`).then(res => res.data)
