import {
  fetchProducts,
  uploadAssetAuto,
  updateAsset,
  deleteAsset,
  reviewAsset,
  fetchAssetStages,
  updateAssetStage,
  updateAssetsViewers,
  getAssetUrl,
  batchDownloadAssets,
  deleteAssetsBulk,
  startBatchDownload as startAssetBatchDownload,
  getBatchDownloadProgress as getAssetBatchDownloadProgress
} from './assets'

export { fetchProducts }

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

export const updateProductStage = (productId, stageId, completed) =>
  updateAssetStage(productId, stageId, completed)

export const updateProductsViewers = (ids, users) =>
  updateAssetsViewers(ids, users)

export const getProductUrl = (id, download = false) =>
  getAssetUrl(id, download)

export const batchDownloadProducts = ids => batchDownloadAssets(ids)

export const deleteProducts = ids => deleteAssetsBulk(ids)

export const startBatchDownload = ids => startAssetBatchDownload(ids)

export const getBatchDownloadProgress = id => getAssetBatchDownloadProgress(id)
