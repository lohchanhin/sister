import {
  jest,
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach
} from '@jest/globals'
import request from 'supertest'
import express from 'express'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import dotenv from 'dotenv'

dotenv.config({ override: true })
process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret'

let mongo
let app
let uploadFileMock
let getSignedUrlMock
let managerToken
let employeeToken
let otherEmployeeToken
let employeeId
let managerId
let diaryId
let firstImagePath

let Role
let User
beforeAll(async () => {
  jest.unstable_mockModule('../src/utils/gcs.js', () => ({
    uploadFile: jest.fn().mockImplementation((_path, destination) => Promise.resolve(destination)),
    getSignedUrl: jest
      .fn()
      .mockImplementation(filePath => `https://signed.example.com/${filePath}`)
  }))

  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())

  const [{ default: workDiaryRoutes }, { default: authRoutes }] = await Promise.all([
    import('../src/routes/workDiary.routes.js'),
    import('../src/routes/auth.routes.js')
  ])

  ;[{ default: Role }, { default: User }] = await Promise.all([
    import('../src/models/role.model.js'),
    import('../src/models/user.model.js')
  ])

  const gcs = await import('../src/utils/gcs.js')
  uploadFileMock = gcs.uploadFile
  getSignedUrlMock = gcs.getSignedUrl

  app = express()
  app.use(express.json())
  app.use('/api/auth', authRoutes)
  app.use('/api/work-diaries', workDiaryRoutes)

  const managerRole = await Role.create({ name: 'manager' })
  const employeeRole = await Role.create({ name: 'employee' })

  const manager = await User.create({
    username: 'manager',
    password: 'pass123',
    email: 'manager@test.com',
    roleId: managerRole._id
  })
  managerId = manager._id.toString()

  const employee = await User.create({
    username: 'alice',
    password: 'pass123',
    email: 'alice@test.com',
    roleId: employeeRole._id
  })
  employeeId = employee._id.toString()

  const otherEmployee = await User.create({
    username: 'bob',
    password: 'pass123',
    email: 'bob@test.com',
    roleId: employeeRole._id
  })

  const managerLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'manager', password: 'pass123' })
    .expect(200)
  managerToken = managerLogin.body.token

  const employeeLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'alice', password: 'pass123' })
    .expect(200)
  employeeToken = employeeLogin.body.token

  const otherEmployeeLogin = await request(app)
    .post('/api/auth/login')
    .send({ username: 'bob', password: 'pass123' })
    .expect(200)
  otherEmployeeToken = otherEmployeeLogin.body.token
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongo.stop()
})

beforeEach(() => {
  uploadFileMock.mockClear()
  getSignedUrlMock.mockClear()
})

describe('Work Diary API', () => {
  it('員工可以建立自己的工作日誌並附帶圖片簽名網址', async () => {
    const res = await request(app)
      .post('/api/work-diaries')
      .set('Authorization', `Bearer ${employeeToken}`)
      .field('date', '2024-05-20')
      .field('title', '第一天工作紀錄')
      .field('contentBlocks', JSON.stringify([{ type: 'text', value: '完成需求整理' }]))
      .attach('images', Buffer.from('hello'), 'note.png')
      .expect(201)

    expect(uploadFileMock).toHaveBeenCalled()
    expect(res.body.title).toBe('第一天工作紀錄')
    expect(res.body.images).toHaveLength(1)
    expect(res.body.images[0].url).toContain('https://signed.example.com/')
    diaryId = res.body._id
    firstImagePath = res.body.images[0].path
  })

  it('其他員工無法檢視或編輯私有日誌', async () => {
    await request(app)
      .get(`/api/work-diaries/${diaryId}`)
      .set('Authorization', `Bearer ${otherEmployeeToken}`)
      .expect(403)

    await request(app)
      .put(`/api/work-diaries/${diaryId}`)
      .set('Authorization', `Bearer ${otherEmployeeToken}`)
      .field('title', '嘗試竄改')
      .expect(403)
  })

  it('列表支援篩選並依角色限制可見資料', async () => {
    await request(app)
      .post('/api/work-diaries')
      .set('Authorization', `Bearer ${otherEmployeeToken}`)
      .field('date', '2024-05-21')
      .field('title', '第二位員工日誌')
      .field('status', 'submitted')
      .expect(201)

    const managerList = await request(app)
      .get('/api/work-diaries')
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200)
    expect(managerList.body.length).toBeGreaterThanOrEqual(2)

    const employeeList = await request(app)
      .get('/api/work-diaries')
      .set('Authorization', `Bearer ${employeeToken}`)
      .expect(200)
    expect(employeeList.body.every(diary => diary.author._id === employeeId)).toBe(true)

    const filterByAuthor = await request(app)
      .get(`/api/work-diaries?author=${employeeId}`)
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200)
    expect(filterByAuthor.body.every(diary => diary.author._id === employeeId)).toBe(true)

    const filterByDate = await request(app)
      .get('/api/work-diaries?startDate=2024-05-20&endDate=2024-05-20')
      .set('Authorization', `Bearer ${managerToken}`)
      .expect(200)
    expect(filterByDate.body.every(diary => diary.date.startsWith('2024-05-20'))).toBe(true)
  })

  it('員工更新自己的日誌可保留舊圖片並新增新圖片', async () => {
    const res = await request(app)
      .put(`/api/work-diaries/${diaryId}`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .field('title', '第一天工作紀錄（更新）')
      .field('keepImages', firstImagePath)
      .attach('images', Buffer.from('new file'), 'new.png')
      .expect(200)

    expect(uploadFileMock).toHaveBeenCalled()
    expect(res.body.images).toHaveLength(2)
    const paths = res.body.images.map(img => img.path)
    expect(paths).toContain(firstImagePath)
  })

  it('非主管不得審核工作日誌', async () => {
    await request(app)
      .patch(`/api/work-diaries/${diaryId}/review`)
      .set('Authorization', `Bearer ${employeeToken}`)
      .send({ status: 'approved', comment: '自審不允許' })
      .expect(403)
  })

  it('主管可審核並留下留言', async () => {
    const res = await request(app)
      .patch(`/api/work-diaries/${diaryId}/review`)
      .set('Authorization', `Bearer ${managerToken}`)
      .send({ status: 'approved', comment: '做得很好' })
      .expect(200)

    expect(getSignedUrlMock).toHaveBeenCalled()
    expect(res.body.status).toBe('approved')
    expect(res.body.managerComment.text).toBe('做得很好')
    expect(res.body.managerComment.commentedBy._id).toBe(managerId)
  })
})
