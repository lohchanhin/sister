import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import folderRoutes from '../src/routes/folder.routes.js'
import authRoutes from '../src/routes/auth.routes.js'
import Role from '../src/models/role.model.js'
import User from '../src/models/user.model.js'
import Folder from '../src/models/folder.model.js'
import { getCache } from '../src/utils/cache.js'
import dotenv from 'dotenv'

dotenv.config({ override: true })
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret'

let mongo
let app
let token
let adminId

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())

  app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)
  app.use('/api/folders', folderRoutes)

  const managerRole = await Role.create({ name: 'manager', permissions: ['folder:read'] })
  const admin = await User.create({ username: 'admin', password: 'pwd', roleId: managerRole._id })
  adminId = admin._id.toString()
  await Folder.create({ name: 'F1', type: 'raw' })

  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'pwd' })
  token = res.body.token
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

test('getFolders 使用 Redis 快取', async () => {
  const res1 = await request(app)
    .get('/api/folders')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)

  const key = `folders:${adminId}:${JSON.stringify({})}`
  const cached = await getCache(key)
  expect(cached).not.toBeNull()

  await Folder.deleteMany({})

  const res2 = await request(app)
    .get('/api/folders')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)
  expect(res2.body).toEqual(res1.body)
})
