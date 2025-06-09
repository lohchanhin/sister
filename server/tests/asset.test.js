import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import assetRoutes from '../src/routes/asset.routes.js'
import authRoutes from '../src/routes/auth.routes.js'
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

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())

  app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)
  app.use('/api/assets', assetRoutes)

  const role = await Role.create({ name: 'manager' })
  await User.create({
    username: 'admin',
    password: 'mypwd',
    email: 'admin@example.com',
    roleId: role._id
  })

  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'mypwd' })
  token = res.body.token

  const a = await Asset.create({ filename: 'file.mp4', path: '/tmp/file.mp4', type: 'edited' })
  assetId = a._id
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

describe('Asset review', () => {
  it('update reviewStatus', async () => {
    const res = await request(app)
      .put(`/api/assets/${assetId}/review`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reviewStatus: 'approved' })
      .expect(200)
    expect(res.body.reviewStatus).toBe('approved')
  })
})

describe('Asset update permission', () => {
  it('should return 403 when no permission', async () => {
    await request(app)
      .put(`/api/assets/${assetId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'new title' })
      .expect(403)
  })
})
