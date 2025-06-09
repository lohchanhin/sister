import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import assetRoutes from '../src/routes/asset.routes.js'
import authRoutes from '../src/routes/auth.routes.js'
import ReviewStage from '../src/models/reviewStage.model.js'
import Asset from '../src/models/asset.model.js'
import User from '../src/models/user.model.js'
import Role from '../src/models/role.model.js'
import dotenv from 'dotenv'

dotenv.config({ override: true })
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret'

let mongo
let app
let token
let assetId
let stageId1
let stageId2

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())

  app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)
  app.use('/api/assets', assetRoutes)

  const role = await Role.create({ name: 'manager' })
  const user = await User.create({ username: 'admin', password: 'pwd', email: 'a@test', roleId: role._id })

  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'pwd' })
  token = res.body.token

  const s1 = await ReviewStage.create({ name: 'S1', order: 1, responsible: user._id })
  const s2 = await ReviewStage.create({ name: 'S2', order: 2, responsible: user._id })
  stageId1 = s1._id
  stageId2 = s2._id

  const asset = await Asset.create({ filename: 'f.mp4', path: '/tmp/f.mp4', type: 'edited', reviewStatus: 'approved' })
  assetId = asset._id
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

describe('updateStageStatus', () => {
  it('should set reviewStatus to pending when not all stages done', async () => {
    await request(app)
      .put(`/api/assets/${assetId}/stages/${stageId1}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ completed: true })
      .expect(200)

    const asset = await Asset.findById(assetId)
    expect(asset.reviewStatus).toBe('pending')
  })

  it('should set reviewStatus to approved when all stages done', async () => {
    await request(app)
      .put(`/api/assets/${assetId}/stages/${stageId2}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ completed: true })
      .expect(200)

    const asset = await Asset.findById(assetId)
    expect(asset.reviewStatus).toBe('approved')
  })
})
