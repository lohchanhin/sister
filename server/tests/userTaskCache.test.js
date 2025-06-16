import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import userRoutes from '../src/routes/user.routes.js'
import taskRoutes from '../src/routes/task.routes.js'
import authRoutes from '../src/routes/auth.routes.js'
import Role from '../src/models/role.model.js'
import User from '../src/models/user.model.js'
import Asset from '../src/models/asset.model.js'
import { getCache } from '../src/utils/cache.js'
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
  app.use('/api/user', userRoutes)
  app.use('/api/tasks', taskRoutes)

  const managerRole = await Role.create({ name: 'manager', permissions: ['user:manage', 'task:manage'] })
  await User.create({ username: 'admin', password: 'pwd', roleId: managerRole._id })

  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'pwd' })
  token = res.body.token

  const asset = await Asset.create({ filename: 'f.mp4', path: '/tmp/f.mp4' })
  assetId = asset._id
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

test('user list cache should clear after creating user', async () => {
  await request(app)
    .get('/api/user')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)

  const key = `users:${JSON.stringify({})}`
  expect(await getCache(key)).not.toBeNull()

  await request(app)
    .post('/api/user')
    .set('Authorization', `Bearer ${token}`)
    .send({ username: 'u1', name: 'U1', email: 'u1@example.com', role: 'manager', password: 'pwd' })
    .expect(201)

  expect(await getCache(key)).toBeNull()
})

test('task list cache should clear after creating task', async () => {
  await request(app)
    .get('/api/tasks')
    .set('Authorization', `Bearer ${token}`)
    .expect(200)

  const key = `tasks:${JSON.stringify({})}`
  expect(await getCache(key)).not.toBeNull()

  await request(app)
    .post('/api/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send({ assetId: assetId.toString(), requirements: 'cut video' })
    .expect(201)

  expect(await getCache(key)).toBeNull()
})
