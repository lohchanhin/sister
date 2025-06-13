import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import folderRoutes from '../src/routes/folder.routes.js'
import authRoutes from '../src/routes/auth.routes.js'
import User from '../src/models/user.model.js'
import Role from '../src/models/role.model.js'
import Folder from '../src/models/folder.model.js'
import dotenv from 'dotenv'

dotenv.config({ override: true })
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret'

let mongo
let app
let token
let token2
let token3
let folderId
let user1Id
let user2Id

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())

  app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)
  app.use('/api/folders', folderRoutes)

  const managerRole = await Role.create({ name: 'manager', permissions: ['folder:manage'] })
  const empRole = await Role.create({ name: 'employee', permissions: ['folder:manage'] })

  await User.create({
    username: 'admin',
    password: 'mypwd',
    email: 'admin@example.com',
    roleId: managerRole._id
  })
  const u1 = await User.create({
    username: 'user1',
    password: 'pwd',
    email: 'u1@example.com',
    roleId: empRole._id
  })
  const u2 = await User.create({
    username: 'user2',
    password: 'pwd',
    email: 'u2@example.com',
    roleId: empRole._id
  })
  user1Id = u1._id
  user2Id = u2._id

  const res = await request(app)
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'mypwd' })
  token = res.body.token

  const res2 = await request(app)
    .post('/api/auth/login')
    .send({ username: 'user1', password: 'pwd' })
  token2 = res2.body.token

  const res3 = await request(app)
    .post('/api/auth/login')
    .send({ username: 'user2', password: 'pwd' })
  token3 = res3.body.token
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
      .send({ name: 'f1', type: 'edited', allowedUsers: [user1Id] })
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
})

describe('Folder access control', () => {
  it('employee in allowedUsers can access', async () => {
    const res = await request(app)
      .get('/api/folders')
      .query({ type: 'edited' })
      .set('Authorization', `Bearer ${token2}`)
      .expect(200)
    expect(res.body.length).toBe(1)
  })

  it('employee not allowed should get 0', async () => {
    const res = await request(app)
      .get('/api/folders')
      .query({ type: 'edited' })
      .set('Authorization', `Bearer ${token3}`)
      .expect(200)
    expect(res.body.length).toBe(0)
  })
})

describe('Batch update folder viewers', () => {
  it('should update allowedUsers for multiple folders', async () => {
    const newUser = await User.create({
      username: 'viewf',
      password: 'pwd',
      email: 'viewf@example.com',
      roleId: (await Role.findOne({ name: 'employee' }))._id
    })

    await request(app)
      .put('/api/folders/viewers')
      .set('Authorization', `Bearer ${token}`)
      .send({ ids: [folderId.toString()], allowedUsers: [newUser._id.toString()] })
      .expect(200)

  const f = await Folder.findById(folderId)
  const ids = f.allowedUsers.map(id => id.toString())
  expect(ids).toContain(newUser._id.toString())
  })
})
