import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import authRoutes from '../src/routes/auth.routes.js'
import workDiaryRoutes from '../src/routes/workDiary.routes.js'
import notificationRoutes from '../src/routes/notification.routes.js'
import Role from '../src/models/role.model.js'
import User from '../src/models/user.model.js'
import WorkDiary, { WORK_DIARY_STATUS } from '../src/models/workDiary.model.js'
import Notification from '../src/models/notification.model.js'
import { PERMISSIONS } from '../src/config/permissions.js'
import { ROLES } from '../src/config/roles.js'
import dotenv from 'dotenv'

dotenv.config({ override: true })
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret'

let mongo
let app
let employee
let manager
let employeeToken
let managerToken
let diary

beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())

  app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)
  app.use('/api/work-diaries', workDiaryRoutes)
  app.use('/api/notifications', notificationRoutes)

  const employeeRole = await Role.create({
    name: ROLES.EMPLOYEE,
    permissions: [PERMISSIONS.WORK_DIARY_READ_OWN]
  })

  const managerRole = await Role.create({
    name: ROLES.MANAGER,
    permissions: [
      PERMISSIONS.WORK_DIARY_READ_ALL,
      PERMISSIONS.WORK_DIARY_READ_OWN,
      PERMISSIONS.WORK_DIARY_REVIEW,
      PERMISSIONS.WORK_DIARY_COMMENT
    ]
  })

  employee = await User.create({
    username: 'emp1',
    password: 'pass1234',
    email: 'emp1@example.com',
    roleId: employeeRole._id
  })

  manager = await User.create({
    username: 'manager1',
    password: 'pass1234',
    email: 'manager@example.com',
    roleId: managerRole._id,
    name: '主管'
  })

  const employeeLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'emp1', password: 'pass1234' })
    .expect(200)
  employeeToken = employeeLogin.body.token

  const managerLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'manager1', password: 'pass1234' })
    .expect(200)
  managerToken = managerLogin.body.token

  diary = await WorkDiary.create({
    title: '日誌 A',
    content: '內容 A',
    owner: employee._id,
    date: new Date('2024-05-01T00:00:00Z'),
    status: WORK_DIARY_STATUS.DRAFT
  })
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

beforeEach(async () => {
  await Notification.deleteMany({})
})

describe('Work diary permissions', () => {
  it('員工僅能讀取自身日誌', async () => {
    const res = await request(app)
      .get('/api/work-diaries')
      .query({ date: '2024-05-01' })
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(200)

    expect(res.body).toHaveLength(1)
    expect(res.body[0].author._id).toBe(employee._id.toString())
  })

  it('主管可讀取指定成員日誌', async () => {
    const res = await request(app)
      .get('/api/work-diaries')
      .query({ date: '2024-05-01', userId: employee._id.toString() })
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200)

    expect(res.body).toHaveLength(1)
    expect(res.body[0].author._id).toBe(employee._id.toString())
  })
})

describe('Work diary notifications', () => {
  it('員工提交日誌時通知主管', async () => {
    await request(app)
      .put(`/api/work-diaries/${diary._id}`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ status: WORK_DIARY_STATUS.SUBMITTED })
      .expect(200)

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200)

    expect(res.body).toHaveLength(1)
    expect(res.body[0].type).toBe('work-diary:submitted')
    expect(res.body[0].title).toContain('日誌')
  })

  it('主管審核或留言時通知員工', async () => {
    await request(app)
      .put(`/api/work-diaries/${diary._id}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ status: WORK_DIARY_STATUS.APPROVED, supervisorComment: '辛苦了' })
      .expect(200)

    const res = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(200)

    expect(res.body).toHaveLength(1)
    expect(res.body[0].type).toBe('work-diary:reviewed')
    expect(res.body[0].message).toContain('日誌')
  })
})
