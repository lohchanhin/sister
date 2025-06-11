import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import folderRoutes from '../src/routes/folder.routes.js'
import authRoutes from '../src/routes/auth.routes.js'
import User from '../src/models/user.model.js'
import Role from '../src/models/role.model.js'
import dotenv from 'dotenv'

dotenv.config({ override: true })
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret'

let mongo
let app
let token
let folderId

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())

  app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)
  app.use('/api/folders', folderRoutes)

  const role = await Role.create({ name: 'manager', permissions: ['folder:manage'] })
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
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

describe('Folder type', () => {
  it('create edited folder', async () => {
    const res = await request(app)
      .post('/api/folders')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'f1', type: 'edited' })
      .expect(201)
    folderId = res.body._id
    expect(res.body.type).toBe('edited')
  })

  it('default query should return 0', async () => {
    const res = await request(app)
      .get('/api/folders')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(res.body.length).toBe(0)
  })

  it('query type edited should return folder', async () => {
    const res = await request(app)
      .get('/api/folders')
      .query({ type: 'edited' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(res.body.length).toBe(1)
  })

  it('update folder type to raw', async () => {
    const res = await request(app)
      .put(`/api/folders/${folderId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'raw' })
      .expect(200)
    expect(res.body.type).toBe('raw')
  })

  it('root edited folders should be sorted by createdAt desc', async () => {
    const res1 = await request(app)
      .post('/api/folders')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'sorted1', type: 'edited' })
      .expect(201)
    await new Promise(r => setTimeout(r, 10))
    const res2 = await request(app)
      .post('/api/folders')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'sorted2', type: 'edited' })
      .expect(201)

    const res = await request(app)
      .get('/api/folders')
      .query({ type: 'edited' })
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(res.body.length).toBe(2)
    expect(res.body[0]._id).toBe(res2.body._id)
    expect(res.body[1]._id).toBe(res1.body._id)
  })
})
