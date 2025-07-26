import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import dotenv from 'dotenv'

import dashboardRoutes from '../src/routes/dashboard.routes.js'
import authRoutes from '../src/routes/auth.routes.js'
import assetRoutes from '../src/routes/asset.routes.js'
import ReviewStage from '../src/models/reviewStage.model.js'
import Asset from '../src/models/asset.model.js'
import User from '../src/models/user.model.js'
import Role from '../src/models/role.model.js'

dotenv.config({ override: true })
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret'

let mongo
let app
let token
let assetId
let stageId

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())

  app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)
  app.use('/api/dashboard', dashboardRoutes)
  app.use('/api/assets', assetRoutes)

  const role = await Role.create({ name: 'manager' })
  const user = await User.create({ username: 'admin', password: 'pwd', email: 'a@test.com', roleId: role._id })

  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'pwd' })
  token = res.body.token

  const asset = await Asset.create({ filename: 'p.mp4', path: '/tmp/p.mp4', type: 'edited' })
  assetId = asset._id

  const s1 = await ReviewStage.create({ name: 'S1', order: 1, responsible: user._id })
  stageId = s1._id
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

test('summary reflects stage progress after update', async () => {
  const res1 = await request(app)
    .get('/api/dashboard/summary')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)

  expect(res1.body.recentProducts[0].progress.done).toBe(0)
  expect(res1.body.recentProducts[0].pendingStage).toBe('S1')

  await request(app)
    .put(`/api/assets/${assetId}/stages/${stageId}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ completed: true })
    .expect(200)

  const res2 = await request(app)
    .get('/api/dashboard/summary')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)

  expect(res2.body.recentProducts[0].progress.done).toBe(1)
  expect(res2.body.recentProducts[0].pendingStage).toBeNull()
})
