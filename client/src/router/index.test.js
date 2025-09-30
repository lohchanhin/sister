import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')
  return {
    ...actual,
    createWebHistory: () => actual.createMemoryHistory()
  }
})

const mockUploadStore = {
  hasPending: false,
  cancelAll: vi.fn()
}

vi.mock('../stores/upload', () => ({
  useUploadStore: () => mockUploadStore
}))

const mockProgressStore = {
  hasActiveDownloads: false,
  clearActiveDownloads: vi.fn()
}

vi.mock('../stores/progress', () => ({
  useProgressStore: () => mockProgressStore
}))

const mockAuthStore = {
  isAuthenticated: true,
  user: { menus: [], permissions: [] },
  fetchProfile: vi.fn()
}

vi.mock('../stores/auth', () => ({
  useAuthStore: () => mockAuthStore
}))

import router from './index'

describe('router beforeEach 授權流程', () => {
  beforeEach(async () => {
    window.confirm = vi.fn(() => true)
    mockUploadStore.hasPending = false
    mockProgressStore.hasActiveDownloads = false
    mockAuthStore.isAuthenticated = true
    mockAuthStore.user = { menus: [], permissions: [] }
    mockAuthStore.fetchProfile = vi.fn().mockResolvedValue(undefined)
    await router.push('/login')
  })

  afterEach(async () => {
    await router.push('/login')
  })

  it('缺少選單權限時導向 Unauthorized 並保留原始路徑', async () => {
    await router.push('/roles')
    expect(mockAuthStore.fetchProfile).toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/unauthorized')
    expect(router.currentRoute.value.query.redirect).toBe('/roles')
  })

  it('擁有選單權限時可正常進入', async () => {
    mockAuthStore.user = { menus: ['roles'], permissions: [] }
    mockAuthStore.fetchProfile = vi.fn()
    await router.push('/roles')
    expect(router.currentRoute.value.path).toBe('/roles')
    expect(mockAuthStore.fetchProfile).not.toHaveBeenCalled()
  })
})
