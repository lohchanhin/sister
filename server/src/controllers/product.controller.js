import { getAssets } from './asset.controller.js'

export const getProducts = async (req, res) => {
  if (!req.query.type) req.query.type = 'edited'
  await getAssets(req, res)
}
