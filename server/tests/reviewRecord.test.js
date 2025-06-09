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
let tokenManager
let tokenResponsible
let tokenOther
let assetId
let stageId

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())

  app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)
  app.use('/api/assets', assetRoutes)

  const managerRole = await Role.create({ name: 'manager' })
  const employeeRole = await Role.create({ name: 'employee' })

  await User.create({ username: 'manager', password: 'pwd', email: 'm@test', roleId: managerRole._id })
  const responsible = await User.create({ username: 'res', password: 'pwd', email: 'r@test', roleId: employeeRole._id })
  await User.create({ username: 'other', password: 'pwd', email: 'o@test', roleId: employeeRole._id })

  let res = await request(app).post('/api/auth/login').send({ username: 'manager', password: 'pwd' })
  tokenManager = res.body.token
  res = await request(app).post('/api/auth/login').send({ username: 'res', password: 'pwd' })
  tokenResponsible = res.body.token
  res = await request(app).post('/api/auth/login').send({ username: 'other', password: 'pwd' })
  tokenOther = res.body.token

  const asset = await Asset.create({ filename: 'file.mp4', path: '/tmp/file.mp4', type: 'edited' })
  assetId = asset._id

  const stage = await ReviewStage.create({ name: 'stage1', order: 1, responsible: responsible._id })
  stageId = stage._id
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

describe('PUT /api/assets/:id/stages/:stageId', () => {
  it('should deny access for unrelated user', async () => {
    await request(app)
      .put(`/api/assets/${assetId}/stages/${stageId}`)
      .set('Authorization', `Bearer ${tokenOther}`)
      .send({ completed: true })
      .expect(403)
  })

  it('should allow responsible user to update', async () => {
    const res = await request(app)
      .put(`/api/assets/${assetId}/stages/${stageId}`)
      .set('Authorization', `Bearer ${tokenResponsible}`)
      .send({ completed: true })
      .expect(200)
    expect(res.body.completed).toBe(true)
  })

  it('should allow manager to update', async () => {
    const res = await request(app)
      .put(`/api/assets/${assetId}/stages/${stageId}`)
      .set('Authorization', `Bearer ${tokenManager}`)
      .send({ completed: false })
      .expect(200)
    expect(res.body.completed).toBe(false)
  })
})
