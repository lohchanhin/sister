import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import authRoutes from '../src/routes/auth.routes.js'
import clientRoutes from '../src/routes/client.routes.js'
import platformRoutes from '../src/routes/platform.routes.js'
import weeklyNoteRoutes from '../src/routes/weeklyNote.routes.js'
import User from '../src/models/user.model.js'
import Role from '../src/models/role.model.js'
import dotenv from 'dotenv'

dotenv.config({ override: true })
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret'

let mongo
let app
let token
let clientId
let platformId

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())

  app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)
  app.use('/api/clients', clientRoutes)
  app.use('/api/clients/:clientId/platforms', platformRoutes)
  app.use('/api/clients/:clientId/platforms/:platformId/weekly-notes', weeklyNoteRoutes)

  const role = await Role.create({ name: 'manager' })
  await User.create({ username: 'admin', password: 'pwd', email: 'a@test', roleId: role._id })
  const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'pwd' })
  token = res.body.token
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

describe('WeeklyNote API', () => {
  it('create client and platform', async () => {
    const resC = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'client' })
      .expect(201)
    clientId = resC.body._id

    const resP = await request(app)
      .post(`/api/clients/${clientId}/platforms`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Meta', platformType: 'Meta' })
      .expect(201)
    platformId = resP.body._id
  })

  it('create and get weekly note', async () => {
    const week = '2024-W01'
    await request(app)
      .post(`/api/clients/${clientId}/platforms/${platformId}/weekly-notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ week, text: 'hello' })
      .expect(201)

    const resG = await request(app)
      .get(`/api/clients/${clientId}/platforms/${platformId}/weekly-notes/${week}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(resG.body.text).toBe('hello')
  })
})
