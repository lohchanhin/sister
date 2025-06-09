import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import reviewStageRoutes from '../src/routes/reviewStage.routes.js'
import authRoutes from '../src/routes/auth.routes.js'
import ReviewStage from '../src/models/reviewStage.model.js'
import User from '../src/models/user.model.js'
import Role from '../src/models/role.model.js'
import dotenv from 'dotenv'

dotenv.config({ override: true })
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret'

let mongo
let app
let token
let stageId

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())

  app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)
  app.use('/api/review-stages', reviewStageRoutes)

  const role = await Role.create({ name: 'manager', permissions: ['review:manage'] })
  await User.create({ username: 'admin', password: 'pwd', email: 'admin@test', roleId: role._id })
  const user = await User.findOne({ username: 'admin' })
  const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'pwd' })
  token = res.body.token
  global.userId = user._id
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

describe('ReviewStage CRUD', () => {
  it('create stage', async () => {
    const res = await request(app)
      .post('/api/review-stages')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '審核一', order: 1, responsible: global.userId })
      .expect(201)
    expect(res.body.name).toBe('審核一')
    stageId = res.body._id
  })

  it('create stage with invalid responsible', async () => {
    const fakeId = new mongoose.Types.ObjectId()
    await request(app)
      .post('/api/review-stages')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '審核二', order: 2, responsible: fakeId })
      .expect(400)
  })

  it('update stage with invalid responsible', async () => {
    const fakeId = new mongoose.Types.ObjectId()
    await request(app)
      .put(`/api/review-stages/${stageId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ responsible: fakeId })
      .expect(400)
  })
})
