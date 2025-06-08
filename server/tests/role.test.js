import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import roleRoutes from '../src/routes/role.routes.js'
import authRoutes from '../src/routes/auth.routes.js'
import User from '../src/models/user.model.js'
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
  app.use('/api/roles', roleRoutes)

  await User.create({
    username: 'admin',
    password: 'mypwd',
    email: 'admin@example.com',
    role: 'manager'
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

describe('Role CRUD', () => {
  let roleId

  it('create role', async () => {
    const res = await request(app)
      .post('/api/roles')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'editor', permissions: ['edit'] })
      .expect(201)
    roleId = res.body._id
  })

  it('get roles', async () => {
    const res = await request(app)
      .get('/api/roles')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(res.body.length).toBe(1)
  })

  it('get role by id', async () => {
    const res = await request(app)
      .get(`/api/roles/${roleId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(res.body.name).toBe('editor')
  })

  it('update role', async () => {
    const res = await request(app)
      .put(`/api/roles/${roleId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ permissions: ['edit', 'delete'] })
      .expect(200)
    expect(res.body.permissions).toContain('delete')
  })

  it('delete role', async () => {
    await request(app)
      .delete(`/api/roles/${roleId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    const res = await request(app)
      .get('/api/roles')
      .set('Authorization', `Bearer ${token}`)
    expect(res.body.length).toBe(0)
  })
})
