import WeeklyNote from '../models/weeklyNote.model.js'

const parseImages = files => files?.map(f => `/static/${f.filename}`) || []

export const createWeeklyNote = async (req, res) => {
  const note = await WeeklyNote.create({
    clientId: req.params.clientId,
    platformId: req.params.platformId,
    week: req.body.week,
    text: req.body.text || '',
    images: parseImages(req.files)
  })
  res.status(201).json(note)
}

export const getWeeklyNote = async (req, res) => {
  const note = await WeeklyNote.findOne({
    clientId: req.params.clientId,
    platformId: req.params.platformId,
    week: req.params.week
  })
  if (!note) return res.status(404).json({ message: '備註不存在' })
  res.json(note)
}

export const updateWeeklyNote = async (req, res) => {
  const update = {
    text: req.body.text
  }
  if (req.files?.length) {
    update.images = parseImages(req.files)
  }
  const note = await WeeklyNote.findOneAndUpdate(
    {
      clientId: req.params.clientId,
      platformId: req.params.platformId,
      week: req.params.week
    },
    update,
    { new: true }
  )
  if (!note) return res.status(404).json({ message: '備註不存在' })
  res.json(note)
}
