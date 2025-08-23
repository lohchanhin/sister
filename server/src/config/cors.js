const defaultAllowList = [
  'https://www.golden-goose-media.com',
  'https://golden-goose-media.com',
  'http://localhost:5173',
  'http://localhost:3000'
]

export function getAllowList(env = process.env.CORS_ALLOW_LIST) {
  if (!env) return defaultAllowList
  return env.split(',').map(s => s.trim()).filter(Boolean)
}

export function createCorsOptions(env) {
  const allowList = getAllowList(env)
  return {
    origin: (origin, cb) => {
      if (!origin) return cb(null, true)
      if (allowList.includes(origin)) return cb(null, true)
      console.warn('[CORS] Blocked Origin =', origin)
      return cb(new Error('Not allowed by CORS'))
    },
    credentials: true,
    allowedHeaders:
      'Content-Type,Authorization,Accept,Origin,X-Requested-With',
    methods: 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS'
  }
}

export { defaultAllowList }
