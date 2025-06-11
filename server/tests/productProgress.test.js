import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import productRoutes from '../src/routes/product.routes.js'
import assetRoutes from '../src/routes/asset.routes.js'
import authRoutes from '../src/routes/auth.routes.js'
import ReviewStage from '../src/models/reviewStage.model.js'
import ReviewRecord from '../src/models/reviewRecord.model.js'
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
  app.use('/api/products', productRoutes)
  app.use('/api/assets', assetRoutes)

  const role = await Role.create({ name: 'manager' })
  const user = await User.create({ username: 'admin', password: 'pwd', email: 'a@test', roleId: role._id })

  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'pwd' })
  token = res.body.token

  const asset = await Asset.create({ filename: 'f.mp4', path: '/tmp/f.mp4', type: 'edited' })
  assetId = asset._id

  const s1 = await ReviewStage.create({ name: 'S1', order: 1, responsible: user._id })
  const s2 = await ReviewStage.create({ name: 'S2', order: 2, responsible: user._id })
  stageId1 = s1._id
  stageId2 = s2._id
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

test('should return progress data', async () => {
  await ReviewRecord.create({ assetId, stageId: stageId1, completed: true })
  const res = await request(app)
    .get('/api/products?progress=true')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)

  expect(res.body[0].progress.done).toBe(1)
  expect(res.body[0].progress.total).toBe(2)
})
