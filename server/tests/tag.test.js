import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import tagRoutes from '../src/routes/tag.routes.js'
import authRoutes from '../src/routes/auth.routes.js'
import User from '../src/models/user.model.js'
import Role from '../src/models/role.model.js'
import dotenv from 'dotenv'

dotenv.config({ override: true })
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret'

let mongo
let app
let token

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())

  app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)
  app.use('/api/tags', tagRoutes)

  const role = await Role.create({ name: 'manager', permissions: ['tag:manage'] })
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

describe('Tag CRUD', () => {
  let tagId

  it('create tag', async () => {
    const res = await request(app)
      .post('/api/tags')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 't1' })
      .expect(201)
    tagId = res.body._id
  })

  it('get tags', async () => {
    const res = await request(app)
      .get('/api/tags')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(res.body.length).toBe(1)
  })

  it('update tag', async () => {
    const res = await request(app)
      .put(`/api/tags/${tagId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'tag2' })
      .expect(200)
    expect(res.body.name).toBe('tag2')
  })

  it('delete tag', async () => {
    await request(app)
      .delete(`/api/tags/${tagId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    const res = await request(app)
      .get('/api/tags')
      .set('Authorization', `Bearer ${token}`)
    expect(res.body.length).toBe(0)
  })
})
