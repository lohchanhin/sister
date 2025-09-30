import mongoose from 'mongoose'
import WorkDiary, { WORK_DIARY_STATUS } from '../models/workDiary.model.js'
import { PERMISSIONS } from '../config/permissions.js'
import { includeManagers } from '../utils/includeManagers.js'
import { createNotifications } from '../services/notification.service.js'
import { t } from '../i18n/messages.js'

const toDateRange = (value) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

const formatDateString = (date) => {
  if (!date) return ''
  const d = typeof date === 'string' ? new Date(date) : date
  if (Number.isNaN(d.getTime())) return ''
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const hasPermission = (req, perm) =>
  Array.isArray(req.user?.roleId?.permissions) &&
  req.user.roleId.permissions.includes(perm)

const ensureReadAccess = (req) => {
  const canReadAll = hasPermission(req, PERMISSIONS.WORK_DIARY_READ_ALL)
  const canReadOwn = hasPermission(req, PERMISSIONS.WORK_DIARY_READ_OWN)
  if (!canReadAll && !canReadOwn) {
    const err = new Error(t('PERMISSION_DENIED'))
    err.status = 403
    throw err
  }
  return { canReadAll, canReadOwn }
}

export const listWorkDiaries = async (req, res) => {
  const { canReadAll } = ensureReadAccess(req)
  const range = toDateRange(req.query.date)
  const filter = {}
  if (range) {
    filter.date = { $gte: range.start, $lte: range.end }
  }

  if (canReadAll) {
    if (req.query.userId && req.query.userId !== 'all') {
      filter.owner = new mongoose.Types.ObjectId(req.query.userId)
    }
  } else {
    filter.owner = req.user._id
  }

  const diaries = await WorkDiary.find(filter)
    .populate('owner', 'name email')
    .sort({ updatedAt: -1 })

  res.json(
    diaries.map((item) => ({
      id: item._id,
      title: item.title,
      content: item.content,
      summary: item.summary,
      status: item.status,
      supervisorComment: item.supervisorComment,
      date: item.date,
      author: item.owner,
      images: item.images || [],
      detailLoaded: true
    }))
  )
}

export const getWorkDiary = async (req, res) => {
  const { canReadAll } = ensureReadAccess(req)
  const diary = await WorkDiary.findById(req.params.id).populate('owner', 'name email')
  if (!diary) return res.status(404).json({ message: t('NOTE_NOT_FOUND') })
  if (!canReadAll && diary.owner._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: t('PERMISSION_DENIED') })
  }
  res.json({
    id: diary._id,
    title: diary.title,
    content: diary.content,
    summary: diary.summary,
    status: diary.status,
    supervisorComment: diary.supervisorComment,
    date: diary.date,
    author: diary.owner,
    images: diary.images || [],
    detailLoaded: true
  })
}

const buildNotificationLink = (diary) => {
  const date = formatDateString(diary.date)
  const ownerId = diary.owner?._id?.toString?.() || diary.owner?.toString?.() || ''
  return ownerId ? `/work-diaries/${date}/${ownerId}` : `/work-diaries/${date}`
}

export const updateWorkDiary = async (req, res) => {
  const { canReadAll, canReadOwn } = ensureReadAccess(req)
  const diary = await WorkDiary.findById(req.params.id).populate('owner', 'name email')
  if (!diary) return res.status(404).json({ message: t('NOTE_NOT_FOUND') })

  const ownerId = diary.owner?._id?.toString?.()
  const currentUserId = req.user._id.toString()
  const isOwner = ownerId === currentUserId
  const canReview = hasPermission(req, PERMISSIONS.WORK_DIARY_REVIEW)
  const canComment = hasPermission(req, PERMISSIONS.WORK_DIARY_COMMENT)

  if (!isOwner && !canReview && !canComment) {
    return res.status(403).json({ message: t('PERMISSION_DENIED') })
  }

  if (!canReadAll && canReadOwn && !isOwner) {
    return res.status(403).json({ message: t('PERMISSION_DENIED') })
  }

  const updates = {}
  if ('title' in req.body && (isOwner || canReview)) updates.title = req.body.title
  if ('content' in req.body && (isOwner || canReview)) updates.content = req.body.content
  if ('summary' in req.body && (isOwner || canReview)) updates.summary = req.body.summary

  const nextStatus = req.body.status
  const statusAllowedForOwner =
    isOwner &&
    nextStatus &&
    [WORK_DIARY_STATUS.DRAFT, WORK_DIARY_STATUS.SUBMITTED].includes(nextStatus)

  if (nextStatus && (canReview || statusAllowedForOwner)) {
    updates.status = nextStatus
  }

  if ('supervisorComment' in req.body && (canReview || canComment)) {
    updates.supervisorComment = req.body.supervisorComment
  }

  const previousStatus = diary.status
  const previousComment = diary.supervisorComment

  diary.set(updates)
  await diary.save()

  const result = await WorkDiary.findById(diary._id).populate('owner', 'name email')

  const notifications = []

  if (
    isOwner &&
    updates.status === WORK_DIARY_STATUS.SUBMITTED &&
    previousStatus !== WORK_DIARY_STATUS.SUBMITTED
  ) {
    const managerIds = await includeManagers([])
    if (managerIds.length) {
      await createNotifications(managerIds, {
        type: 'work-diary:submitted',
        title: `${diary.owner.name || '員工'} 提交 ${formatDateString(diary.date)} 日誌`,
        message: `${diary.owner.name || '員工'} 已提交工作日誌，請進行審核。`,
        link: buildNotificationLink(diary),
        payload: { diaryId: diary._id.toString(), status: diary.status }
      })
    }
  }

  if (
    !isOwner &&
    (updates.status !== undefined || updates.supervisorComment !== undefined) &&
    (previousStatus !== diary.status || previousComment !== diary.supervisorComment)
  ) {
    notifications.push({
      type: 'work-diary:reviewed',
      title: `${req.user.name || '主管'} 更新了您的日誌`,
      message:
        updates.status && updates.status !== previousStatus
          ? `日誌狀態變更為 ${updates.status}`
          : '主管已新增留言',
      link: buildNotificationLink(diary),
      payload: {
        diaryId: diary._id.toString(),
        status: diary.status,
        supervisorComment: diary.supervisorComment
      }
    })
  }

  if (notifications.length) {
    await createNotifications([ownerId], notifications[0])
  }

  res.json({
    id: result._id,
    title: result.title,
    content: result.content,
    summary: result.summary,
    status: result.status,
    supervisorComment: result.supervisorComment,
    date: result.date,
    author: result.owner,
    images: result.images || [],
    detailLoaded: true
  })
}

export const createWorkDiary = async (req, res) => {
  const { canReadAll, canReadOwn } = ensureReadAccess(req)
  let owner = req.user._id
  if (canReadAll && req.body.owner) {
    owner = req.body.owner
  } else if (!canReadOwn) {
    const err = new Error(t('PERMISSION_DENIED'))
    err.status = 403
    throw err
  }

  const range = toDateRange(req.body.date)
  const date = range ? range.start : new Date()

  const diary = await WorkDiary.create({
    title: req.body.title || '',
    content: req.body.content || '',
    summary: req.body.summary || '',
    date,
    status: req.body.status || WORK_DIARY_STATUS.DRAFT,
    supervisorComment: req.body.supervisorComment || '',
    owner
  })

  const populated = await diary.populate('owner', 'name email')
  res.status(201).json({
    id: populated._id,
    title: populated.title,
    content: populated.content,
    summary: populated.summary,
    status: populated.status,
    supervisorComment: populated.supervisorComment,
    date: populated.date,
    author: populated.owner,
    images: populated.images || [],
    detailLoaded: true
  })
}
