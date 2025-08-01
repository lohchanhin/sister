import { t } from '../i18n/messages.js'
import ReviewStage from '../models/reviewStage.model.js'
import User from '../models/user.model.js'
import { getCache, setCache, delCache, clearCacheByPrefix } from '../utils/cache.js'

export const createStage = async (req, res) => {
  const user = await User.findById(req.body.responsible)
  if (!user) return res.status(400).json({ message: t('USER_NOT_FOUND') })

  const stage = await ReviewStage.create(req.body)
  await clearCacheByPrefix('reviewStages:')
  res.status(201).json(stage)
}

export const getStages = async (_, res) => {
  const cacheKey = 'reviewStages:all'
  const cached = await getCache(cacheKey)
  if (cached) return res.json(cached)
  const stages = await ReviewStage.find().populate('responsible').sort('order')
  await setCache(cacheKey, stages)
  res.json(stages)
}

export const updateStage = async (req, res) => {
  if (req.body.responsible) {
    const user = await User.findById(req.body.responsible)
    if (!user) return res.status(400).json({ message: t('USER_NOT_FOUND') })
  }

  const stage = await ReviewStage.findByIdAndUpdate(req.params.id, req.body, { new: true })
  if (!stage) return res.status(404).json({ message: t('REVIEW_STAGE_NOT_FOUND') })
  await clearCacheByPrefix('reviewStages:')
  await delCache(`reviewStage:${req.params.id}`)
  res.json(stage)
}

export const deleteStage = async (req, res) => {
  await ReviewStage.findByIdAndDelete(req.params.id)
  await clearCacheByPrefix('reviewStages:')
  await delCache(`reviewStage:${req.params.id}`)
  res.json({ message: t('DELETED') })
}
