import Asset from '../models/asset.model.js';
import { getAssets } from './asset.controller.js';
import path from 'node:path';
import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import archiver from 'archiver';
import bucket, { uploadFile as gcsUploadFile, getSignedUrl } from '../utils/gcs.js';
import { getCache, setCache, delCache } from '../utils/cache.js';

export const getProducts = async (req, res) => {
  if (!req.query.type) req.query.type = 'edited';
  await getAssets(req, res);
};

export const batchDownload = async (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || !ids.length) {
    return res.status(400).json({ message: '參數錯誤' });
  }

  const progressId = Date.now().toString(36) + Math.random().toString(36).slice(2);
  const cacheKey = `zip_progress:${progressId}`;
  await setCache(cacheKey, { percent: 0, url: null, error: null }, 600);
  res.json({ progressId });

  (async () => {
    let tmpDir = '';
    try {
      const products = await Asset.find({ _id: { $in: ids }, type: 'edited' });
      if (!products.length) {
        await setCache(cacheKey, { percent: 100, url: null, error: '找不到成品' }, 600);
        return;
      }

      tmpDir = await fs.mkdtemp('/tmp/product-batch-');
      const zipName = `products-${Date.now()}.zip`;
      const zipPath = path.join(tmpDir, zipName);

      await new Promise(async (resolve, reject) => {
        const output = createWriteStream(zipPath);
        const archive = archiver('zip', { zlib: { level: 9 } });

        output.on('close', resolve);
        archive.on('error', reject);
        
        archive.pipe(output);

        let processed = 0;
        const total = products.length;

        for (const product of products) {
          const localPath = path.join(tmpDir, product.filename);
          try {
            await bucket.file(product.path).download({ destination: localPath });
            archive.file(localPath, { name: product.title || product.filename });
            
            processed++;
            const percent = Math.round((processed / total) * 100);
            await setCache(cacheKey, { percent, url: null, error: null }, 600);

          } catch (err) {
            console.error(`Failed to download or archive ${product.path}:`, err);
            const currentProgress = await getCache(cacheKey) || {};
            const newError = (currentProgress.error || '') + `無法處理 ${product.title || product.filename}. `;
            await setCache(cacheKey, { ...currentProgress, error: newError }, 600);
          }
        }

        archive.finalize();
      });

      const gcsPath = await gcsUploadFile(zipPath, zipName, 'application/zip');
      const url = await getSignedUrl(gcsPath, {
        responseDisposition: `attachment; filename="${zipName}"`
      });
      
      const finalProgress = await getCache(cacheKey) || {};
      await setCache(cacheKey, { ...finalProgress, percent: 100, url }, 600);

    } catch (e) {
      console.error('zip error', e);
      await setCache(cacheKey, { percent: 100, url: null, error: e.message }, 600);
    } finally {
      if (tmpDir) {
        await fs.rm(tmpDir, { recursive: true, force: true }).catch(err => console.error(`Failed to remove temp dir ${tmpDir}:`, err));
      }
    }
  })();
};

export const getBatchDownloadProgress = async (req, res) => {
  const cacheKey = `zip_progress:${req.params.id}`;
  const data = await getCache(cacheKey);
  if (!data) return res.status(404).json({ message: 'not found' });
  if (data.url || data.error) {
    await delCache(cacheKey);
  }
  res.json(data);
};
