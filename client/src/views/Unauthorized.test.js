import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'

const pushMock = vi.fn()
const backMock = vi.fn()
const mockRoute = { query: {}, fullPath: '/unauthorized' }
const mockRouter = { push: pushMock, back: backMock, options: { history: { state: {} } } }

vi.mock('vue-router', () => ({
  useRoute: () => mockRoute,
  useRouter: () => mockRouter
}))

const ButtonStub = {
  name: 'Button',
  props: ['label'],
  emits: ['click'],
  template: '<button @click="$emit(\'click\')"><slot />{{ label }}</button>'
}

import Unauthorized from './Unauthorized.vue'

describe('Unauthorized.vue', () => {
  beforeEach(() => {
    mockRoute.query = {}
    mockRoute.fullPath = '/unauthorized'
    mockRouter.options.history.state = {}
    pushMock.mockClear()
    backMock.mockClear()
  })

  const mountComponent = () =>
    mount(Unauthorized, {
      global: {
        stubs: {
          Button: ButtonStub
        }
      }
    })

  it('顯示無權限訊息', () => {
    const wrapper = mountComponent()
    expect(wrapper.text()).toContain('無權限')
    expect(wrapper.text()).toContain('返回首頁')
  })

  it('顯示原始目標並支援返回首頁', async () => {
    mockRoute.query = { redirect: '/roles' }
    const wrapper = mountComponent()
    const info = wrapper.get('[data-test="redirect-info"]')
    expect(info.text()).toContain('/roles')

    await wrapper.get('[data-test="go-home"]').trigger('click')
    expect(pushMock).toHaveBeenCalledWith('/dashboard')
  })

  it('返回上一頁時優先導向 redirect', async () => {
    mockRoute.query = { redirect: '/roles' }
    mockRoute.fullPath = '/unauthorized?redirect=/roles'
    const wrapper = mountComponent()
    await wrapper.get('[data-test="go-back"]').trigger('click')
    expect(pushMock).toHaveBeenCalledWith('/roles')
    expect(backMock).not.toHaveBeenCalled()
  })

  it('沒有 redirect 但有瀏覽紀錄時呼叫 router.back', async () => {
    mockRouter.options.history.state = { back: '/previous' }
    const wrapper = mountComponent()
    await wrapper.get('[data-test="go-back"]').trigger('click')
    expect(backMock).toHaveBeenCalled()
    expect(pushMock).not.toHaveBeenCalled()
  })

  it('沒有 redirect 且無瀏覽紀錄時退回首頁', async () => {
    mockRouter.options.history.state = {}
    const wrapper = mountComponent()
    await wrapper.get('[data-test="go-back"]').trigger('click')
    expect(pushMock).toHaveBeenCalledWith('/dashboard')
  })
})
