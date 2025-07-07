import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import authRoutes from '../src/routes/auth.routes.js'
import clientRoutes from '../src/routes/client.routes.js'
import platformRoutes from '../src/routes/platform.routes.js'
import platformTransferRoutes from '../src/routes/platformTransfer.routes.js'
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
const defaultFields = [
  { name: 'date',        type: 'text' },
  { name: 'spent',       type: 'number' },
  { name: 'enquiries',   type: 'number' },
  { name: 'reach',       type: 'number' },
  { name: 'impressions', type: 'number' },
  { name: 'clicks',      type: 'number' }
]

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())

  app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)
  app.use('/api/clients', clientRoutes)
  app.use('/api/clients/:clientId/platforms', platformRoutes)
  app.use('/api/platforms', platformTransferRoutes)

  const role = await Role.create({ name: 'manager' })
  await User.create({ username: 'admin', password: 'pwd', email: 'test@test', roleId: role._id })
  const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'pwd' })
  token = res.body.token
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

describe('Platform API', () => {
  it('create client', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'ClientA' })
      .expect(201)
    clientId = res.body._id
  })

  it('platform CRUD', async () => {
    const resC = await request(app)
      .post(`/api/clients/${clientId}/platforms`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Meta',
        platformType: 'Meta',
        fields: [{ name: 'note', type: 'text' }],
        mode: 'custom'
      })
      .expect(201)
    platformId = resC.body._id
    expect(resC.body.fields).toEqual([{ name: 'note', type: 'text' }])

    const resG = await request(app)
      .get(`/api/clients/${clientId}/platforms`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(resG.body.length).toBe(1)

    const resU = await request(app)
      .put(`/api/clients/${clientId}/platforms/${platformId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Meta2',
        fields: [
          { name: 'x', type: 'number' },
          { name: 'y', type: 'text' }
        ]
      })
      .expect(200)
    expect(resU.body.fields).toEqual([
      { name: 'x', type: 'number' },
      { name: 'y', type: 'text' }
    ])

    await request(app)
      .delete(`/api/clients/${clientId}/platforms/${platformId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
  })

  it('create platform with default mode', async () => {
    const res = await request(app)
      .post(`/api/clients/${clientId}/platforms`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Def',
        platformType: 'Meta',
        mode: 'default',
        fields: defaultFields
      })
      .expect(201)
    expect(res.body.mode).toBe('default')
    expect(res.body.fields).toEqual(defaultFields)
  })

  it('duplicate platform name returns 409', async () => {
    await request(app)
      .post(`/api/clients/${clientId}/platforms`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dup', platformType: 'Meta' })
      .expect(201)

    const res = await request(app)
      .post(`/api/clients/${clientId}/platforms`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Dup', platformType: 'Meta' })
      .expect(409)
    expect(res.body.message).toBe('平台名稱重複')
  })

  it('transfer platform to another client', async () => {
    const resNewClient = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'ClientB' })
      .expect(201)
    const newClientId = resNewClient.body._id

    const list = await request(app)
      .get(`/api/clients/${clientId}/platforms`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    const id = list.body[0]._id

    await request(app)
      .post(`/api/clients/${clientId}/platforms/${id}/ad-daily`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: new Date().toISOString(), spent: 1 })
      .expect(201)

    await request(app)
      .post(`/api/clients/${clientId}/platforms/${id}/weekly-notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ week: '2024-W10', text: 'note' })
      .expect(201)

    await request(app)
      .put(`/api/platforms/${id}/transfer`)
      .set('Authorization', `Bearer ${token}`)
      .send({ clientId: newClientId })
      .expect(200)

    await request(app)
      .get(`/api/clients/${newClientId}/platforms/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    const resDaily = await request(app)
      .get(`/api/clients/${newClientId}/platforms/${id}/ad-daily`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(resDaily.body.length).toBe(1)

    const resNote = await request(app)
      .get(`/api/clients/${newClientId}/platforms/${id}/weekly-notes`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(resNote.body.length).toBe(1)
  })
})
