import Asset from "../models/asset.model.js"
import path from "node:path"
import fs from "node:fs/promises"
import { createWriteStream } from "node:fs"
import archiver from "archiver"
import gcsUtil from "../utils/gcs.js"
import * as cache from "../utils/cache.js"

export const getProducts = async (req, res) => {
  try {
    const { folderId, tags } = req.query
    const query = { type: "edited" }

    if (folderId) {
      query.folderId = folderId
    }

    if (tags) {
      const tagArray = tags.split(",")
      query.tags = { $all: tagArray }
    }

    const products = await Asset.find(query)
      .populate("uploadedBy", "username name")
      .populate("updatedBy", "username")
      .sort({ createdAt: -1 })

    const data = products.map((a) => ({
      ...a.toObject(),
      fileName: a.filename,
      fileType: a.type,
      uploaderName: a.uploadedBy?.name || a.uploadedBy?.username,
      updatedBy: a.updatedBy
        ? {
            username: a.updatedBy?.username,
          }
        : null,
    }))

    res.json(data)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

export const batchDownload = async (req, res) => {
  const { ids } = req.body
  if (!Array.isArray(ids) || !ids.length) {
    return res.status(400).json({ message: "參數錯誤" })
  }

  const progressId = Date.now().toString(36) + Math.random().toString(36).slice(2)
  const cacheKey = `zip_progress:${progressId}`
  await cache.setCache(cacheKey, { percent: 0, url: null, error: null }, 600)
  res.json({ progressId })
  ;(async () => {
    let tmpDir = ""
    try {
      const products = await Asset.find({ _id: { $in: ids }, type: "edited" })
      if (!products.length) {
        await cache.setCache(cacheKey, { percent: 100, url: null, error: "找不到成品" }, 600)
        return
      }

      tmpDir = await fs.mkdtemp("/tmp/product-batch-")
      const zipName = `products-${Date.now()}.zip`
      const zipPath = path.join(tmpDir, zipName)

      await new Promise(async (resolve, reject) => {
        const output = createWriteStream(zipPath)
        const archive = archiver("zip", { zlib: { level: 9 } })

        output.on("close", resolve)
        archive.on("error", reject)

        archive.pipe(output)

        let processed = 0
        const total = products.length

        for (const product of products) {
          const localPath = path.join(tmpDir, product.filename)
          try {
            await gcsUtil.bucket.file(product.path).download({ destination: localPath })
            archive.file(localPath, { name: product.title || product.filename })

            processed++
            const percent = Math.round((processed / total) * 100)
            await cache.setCache(cacheKey, { percent, url: null, error: null }, 600)
          } catch (err) {
            console.error(`Failed to download or archive ${product.path}:`, err)
            const currentProgress = (await cache.getCache(cacheKey)) || {}
            const newError = (currentProgress.error || "") + `無法處理 ${product.title || product.filename}. `
            await cache.setCache(cacheKey, { ...currentProgress, error: newError }, 600)
          }
        }

        archive.finalize()
      })

      const gcsPath = await gcsUtil.gcsUploadFile(zipPath, zipName, "application/zip")
      const url = await gcsUtil.getSignedUrl(gcsPath, {
        responseDisposition: `attachment; filename="${zipName}"`,
      })

      const finalProgress = (await cache.getCache(cacheKey)) || {}
      await cache.setCache(cacheKey, { ...finalProgress, percent: 100, url }, 600)
    } catch (e) {
      console.error("zip error", e)
      await cache.setCache(cacheKey, { percent: 100, url: null, error: e.message }, 600)
    } finally {
      if (tmpDir) {
        await fs
          .rm(tmpDir, { recursive: true, force: true })
          .catch((err) => console.error(`Failed to remove temp dir ${tmpDir}:`, err))
      }
    }
  })()
}

export const getBatchDownloadProgress = async (req, res) => {
  const cacheKey = `zip_progress:${req.params.id}`
  const data = await cache.getCache(cacheKey)
  if (!data) return res.status(404).json({ message: "not found" })
  if (data.url || data.error) {
    await cache.delCache(cacheKey)
  }
  res.json(data)
}
