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
let formulaPlatformId

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
  await User.create({ username: 'admin', password: 'pwd', email: 'admin@test', roleId: role._id })
  const res = await request(app).post('/api/auth/login').send({ username: 'admin', password: 'pwd' })
  token = res.body.token
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

describe('Client and AdDaily', () => {
  it('create client', async () => {
    const res = await request(app)
      .post('/api/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: '測試客戶', email: 'a@test.com' })
      .expect(201)
    expect(res.body.name).toBe('測試客戶')
    clientId = res.body._id
  })

  it('create platform', async () => {
    const res = await request(app)
      .post(`/api/clients/${clientId}/platforms`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Meta', platformType: 'Meta' })
      .expect(201)
    platformId = res.body._id
  })

  it('create platform with formula field', async () => {
    const res = await request(app)
      .post(`/api/clients/${clientId}/platforms`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Calc',
        fields: [
          { name: 'a', type: 'number' },
          { name: 'b', type: 'number' },
          { name: 'c', type: 'formula', formula: 'a + b' }
        ]
      })
      .expect(201)
    formulaPlatformId = res.body._id
  })

  it('weekly aggregate', async () => {
    const start = new Date('2024-01-01')
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      await request(app)
        .post(`/api/clients/${clientId}/platforms/${platformId}/ad-daily`)
        .set('Authorization', `Bearer ${token}`)
        .send({ date: d.toISOString(), spent: 10 })
        .expect(201)
    }

    const res = await request(app)
      .get(`/api/clients/${clientId}/platforms/${platformId}/ad-daily/weekly`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(res.body[0].spent).toBe(70)
  })

  it('create adDaily with currency string', async () => {
    const res = await request(app)
      .post(`/api/clients/${clientId}/platforms/${platformId}/ad-daily`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: new Date('2024-02-01').toISOString(),
        spent: '$10',
        enquiries: '5件',
        reach: '1,000',
        impressions: '2,000',
        clicks: '7'
      })
      .expect(201)
    expect(res.body.spent).toBe(10)
    expect(res.body.enquiries).toBe(5)
    expect(res.body.reach).toBe(1000)
    expect(res.body.impressions).toBe(2000)
    expect(res.body.clicks).toBe(7)
  })

  it('create adDaily with extraData and read it', async () => {
    const custom = {
      date: new Date('2024-04-01').toISOString(),
      spent: 3,
      extraData: { metricA: '10', metricB: 5 }
    }
    const res = await request(app)
      .post(`/api/clients/${clientId}/platforms/${platformId}/ad-daily`)
      .set('Authorization', `Bearer ${token}`)
      .send(custom)
      .expect(201)
    expect(res.body.extraData).toEqual({ metricA: 10, metricB: 5 })

    const list = await request(app)
      .get(
        `/api/clients/${clientId}/platforms/${platformId}/ad-daily?start=${custom.date}&end=${custom.date}`
      )
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(list.body[0].extraData).toEqual({ metricA: 10, metricB: 5 })
  })

  it('create adDaily with currency prefix in extraData', async () => {
    const date = new Date('2024-04-03').toISOString()
    const res = await request(app)
      .post(`/api/clients/${clientId}/platforms/${platformId}/ad-daily`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date, extraData: { cost: 'RM500.12' } })
      .expect(201)
    expect(res.body.extraData).toEqual({ cost: 500.12 })

    const list = await request(app)
      .get(
        `/api/clients/${clientId}/platforms/${platformId}/ad-daily?start=${date}&end=${date}`
      )
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(list.body[0].extraData).toEqual({ cost: 500.12 })
  })

  it('create adDaily with colors and update it', async () => {
    const res = await request(app)
      .post(`/api/clients/${clientId}/platforms/${platformId}/ad-daily`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        date: new Date('2024-04-02').toISOString(),
        colors: { metricA: '#fff' }
      })
      .expect(201)
    expect(res.body.colors).toEqual({ metricA: '#fff' })

    const id = res.body._id
    const updated = await request(app)
      .put(`/api/clients/${clientId}/platforms/${platformId}/ad-daily/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ colors: { metricA: '#000' } })
      .expect(200)
    expect(updated.body.colors).toEqual({ metricA: '#000' })
  })

  it('bulk create adDaily', async () => {
    const records = [
      { date: new Date('2024-03-01').toISOString(), spent: 5, extraData: { metric: '1' } },
      { date: new Date('2024-03-02').toISOString(), spent: 7, extraData: { metric: 2 } }
    ]
    const res = await request(app)
      .post(`/api/clients/${clientId}/platforms/${platformId}/ad-daily/bulk`)
      .set('Authorization', `Bearer ${token}`)
      .send(records)
      .expect(201)
    expect(res.body.length).toBe(2)
    expect(res.body[0].extraData).toEqual({ metric: 1 })
    expect(res.body[1].extraData).toEqual({ metric: 2 })
  })

  it('compute formula on create and bulk', async () => {
    const date = new Date('2024-07-01').toISOString()
    const res = await request(app)
      .post(`/api/clients/${clientId}/platforms/${formulaPlatformId}/ad-daily`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date, extraData: { a: 2, b: 3 } })
      .expect(201)
    expect(res.body.extraData).toEqual({ a: 2, b: 3, c: 5 })

    const rows = [
      { date: new Date('2024-07-02').toISOString(), extraData: { a: 1, b: 2 } },
      { date: new Date('2024-07-03').toISOString(), extraData: { a: 3, b: 4 } }
    ]
    const bulk = await request(app)
      .post(`/api/clients/${clientId}/platforms/${formulaPlatformId}/ad-daily/bulk`)
      .set('Authorization', `Bearer ${token}`)
      .send(rows)
      .expect(201)
    expect(bulk.body[0].extraData.c).toBe(3)
    expect(bulk.body[1].extraData.c).toBe(7)
  })

  it('sort adDaily by spent desc', async () => {
    const records = [
      { date: new Date('2024-06-01').toISOString(), spent: 5 },
      { date: new Date('2024-06-02').toISOString(), spent: 20 },
      { date: new Date('2024-06-03').toISOString(), spent: 10 }
    ]
    for (const r of records) {
      await request(app)
        .post(`/api/clients/${clientId}/platforms/${platformId}/ad-daily`)
        .set('Authorization', `Bearer ${token}`)
        .send(r)
        .expect(201)
    }

    const res = await request(app)
      .get(
        `/api/clients/${clientId}/platforms/${platformId}/ad-daily?start=2024-06-01&end=2024-06-03&sort=spent&order=desc`
      )
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    const spent = res.body.map(r => r.spent)
    expect(spent).toEqual([20, 10, 5])
  })

  it('update and delete adDaily', async () => {
    const create = await request(app)
      .post(`/api/clients/${clientId}/platforms/${platformId}/ad-daily`)
      .set('Authorization', `Bearer ${token}`)
      .send({ date: new Date('2024-05-01').toISOString(), spent: 1 })
      .expect(201)
    const id = create.body._id

    const updated = await request(app)
      .put(`/api/clients/${clientId}/platforms/${platformId}/ad-daily/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ spent: 20 })
      .expect(200)
    expect(updated.body.spent).toBe(20)

    await request(app)
      .delete(`/api/clients/${clientId}/platforms/${platformId}/ad-daily/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200)

    const list = await request(app)
      .get(
        `/api/clients/${clientId}/platforms/${platformId}/ad-daily?start=2024-05-01&end=2024-05-01`
      )
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
    expect(list.body.length).toBe(0)
  })
})
