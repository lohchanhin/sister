import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import authRoutes from '../src/routes/auth.routes.js'
import clientRoutes from '../src/routes/client.routes.js'
import platformRoutes from '../src/routes/platform.routes.js'
import adDailyRoutes from '../src/routes/adDaily.routes.js'
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
const date = new Date('2024-01-01').toISOString()

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())

  app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)
  app.use('/api/clients', clientRoutes)
  app.use('/api/clients/:clientId/platforms', platformRoutes)
  app.use('/api/clients/:clientId/platforms/:platformId/ad-daily', adDailyRoutes)

  const role = await Role.create({ name: 'manager' })
  await User.create({ username: 'admin', password: 'pwd', email: 'test@test', roleId: role._id })
  const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'pwd' })
  token = res.body.token
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

describe('rename platform field', () => {
  it('rename field and keep adDaily data and colors accessible', async () => {
    const clientRes = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'ClientA' })
      .expect(201)
    clientId = clientRes.body._id

    const platformRes = await request(app)
      .post(`/api/clients/${clientId}/platforms`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Meta',
        fields: [{ id: 'old', name: 'Old', slug: 'old', type: 'number' }]
      })
      .expect(201)
    platformId = platformRes.body._id

    await request(app)
      .post(`/api/clients/${clientId}/platforms/${platformId}/ad-daily`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date, extraData: { old: 5 }, colors: { old: '#fff' } })
      .expect(201)

    await request(app)
      .put(`/api/clients/${clientId}/platforms/${platformId}/rename-field`)
      .set('Authorization', `Bearer ${token}`)
      .send({ id: 'old', name: 'New', slug: 'new' })
      .expect(200)

    const list = await request(app)
      .get(`/api/clients/${clientId}/platforms/${platformId}/ad-daily?start=${date}&end=${date}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(list.body[0].extraData).toEqual({ new: 5 })
    expect(list.body[0].colors).toEqual({ new: '#fff' })

    const platform = await request(app)
      .get(`/api/clients/${clientId}/platforms/${platformId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(platform.body.fields[0]).toMatchObject({ id: 'old', name: 'New', slug: 'new' })
  })

  it('rejects invalid slug format', async () => {
    const clientRes = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'ClientB' })
      .expect(201)
    const cid = clientRes.body._id

    const platformRes = await request(app)
      .post(`/api/clients/${cid}/platforms`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Meta', fields: [{ id: 'a', name: 'A', slug: 'a', type: 'text' }] })
      .expect(201)

    const res = await request(app)
      .put(`/api/clients/${cid}/platforms/${platformRes.body._id}/rename-field`)
      .set('Authorization', `Bearer ${token}`)
      .send({ id: 'a', name: 'A', slug: '1a' })
      .expect(400)
    expect(res.body.code).toBe('SLUG_INVALID')
  })

  it('rejects duplicate slug', async () => {
    const clientRes = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'ClientC' })
      .expect(201)
    const cid = clientRes.body._id

    const platformRes = await request(app)
      .post(`/api/clients/${cid}/platforms`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Meta',
        fields: [
          { id: 'a', name: 'A', slug: 'a', type: 'text' },
          { id: 'b', name: 'B', slug: 'b', type: 'text' }
        ]
      })
      .expect(201)

    const res = await request(app)
      .put(`/api/clients/${cid}/platforms/${platformRes.body._id}/rename-field`)
      .set('Authorization', `Bearer ${token}`)
      .send({ id: 'b', name: 'B', slug: 'a' })
      .expect(409)
    expect(res.body.code).toBe('SLUG_DUPLICATE')
  })
})
