export function formatAsset(asset) {
  if (!asset) return asset
  const obj = asset.toObject ? asset.toObject() : { ...asset }
  const {
    filename,
    type,
    uploadedBy,
    ...rest
  } = obj
  return {
    ...rest,
    fileName: filename,
    fileType: type,
    uploaderName: uploadedBy,
  }
}
