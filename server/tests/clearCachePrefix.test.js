import { setCache, getCache, clearCacheByPrefix } from '../src/utils/cache.js'

beforeEach(async () => {
  // ensure clean state
  await clearCacheByPrefix('test:')
})

test('clearCacheByPrefix 刪除指定前綴的所有鍵', async () => {
  await setCache('test:a', '1')
  await setCache('test:b', '2')

  expect(await getCache('test:a')).toBe('1')
  expect(await getCache('test:b')).toBe('2')

  await clearCacheByPrefix('test:')

  expect(await getCache('test:a')).toBeNull()
  expect(await getCache('test:b')).toBeNull()
})
