import request from 'supertest'
import express from 'express'
import cors from 'cors'
import { createCorsOptions, defaultAllowList } from '../src/config/cors.js'

describe('CORS allow list', () => {
  const createApp = () => {
    const app = express()
    const options = createCorsOptions()
    app.use(cors(options))
    app.get('/api/health', (req, res) => res.json({ status: 'ok' }))
    return app
  }

  afterEach(() => {
    delete process.env.CORS_ALLOW_LIST
  })

  it('allows origin from CORS_ALLOW_LIST', async () => {
    process.env.CORS_ALLOW_LIST = 'http://foo.com,http://bar.com'
    const app = createApp()
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://foo.com')
      .expect(200)
    expect(res.headers['access-control-allow-origin']).toBe('http://foo.com')
  })

  it('blocks origin not in CORS_ALLOW_LIST', async () => {
    process.env.CORS_ALLOW_LIST = 'http://foo.com'
    const app = createApp()
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://bar.com')
    expect(res.status).toBe(500)
    expect(res.text).toMatch(/Not allowed by CORS/)
  })

  it('uses default list when CORS_ALLOW_LIST is not set', async () => {
    const app = createApp()
    const origin = defaultAllowList[0]
    const res = await request(app)
      .get('/api/health')
      .set('Origin', origin)
      .expect(200)
    expect(res.headers['access-control-allow-origin']).toBe(origin)
  })
})
