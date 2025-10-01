import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'

const toastMock = { add: vi.fn() }
vi.mock('primevue/usetoast', () => ({ useToast: () => toastMock }))

const clientsModuleMock = vi.hoisted(() => ({
  fetchClients: vi.fn(() => Promise.resolve([])),
  getClient: vi.fn(() => Promise.resolve({ name: '測試客戶' }))
}))
vi.mock('@/services/clients', () => clientsModuleMock)

const popularDataModuleMock = vi.hoisted(() => ({
  listPopularContents: vi.fn(() => Promise.resolve([])),
  createPopularContent: vi.fn(() => Promise.resolve({ _id: '1' })),
  updatePopularContent: vi.fn((_, __, payload) => Promise.resolve({ _id: '1', ...payload })),
  deletePopularContent: vi.fn(() => Promise.resolve({})),
  uploadPopularContentCover: vi.fn(() => Promise.resolve({}))
}))
vi.mock('@/services/popularData', () => popularDataModuleMock)

const { fetchClients: fetchClientsMock, getClient: getClientMock } = clientsModuleMock
const {
  listPopularContents: listPopularContentsMock,
  createPopularContent: createPopularContentMock,
  updatePopularContent: updatePopularContentMock,
  deletePopularContent: deletePopularContentMock,
  uploadPopularContentCover: uploadPopularContentCoverMock
} = popularDataModuleMock

const ButtonStub = defineComponent({
  name: 'Button',
  props: ['label', 'disabled'],
  emits: ['click'],
  setup(props, { emit, slots, attrs }) {
    return () =>
      h(
        'button',
        {
          ...attrs,
          class: ['button-stub', attrs.class].filter(Boolean).join(' '),
          disabled: props.disabled ?? attrs.disabled ?? false,
          onClick: (e) => {
            if (props.disabled ?? attrs.disabled) return
            emit('click', e)
            attrs.onClick?.(e)
          }
        },
        slots.default ? slots.default() : props.label
      )
  }
})

const InputTextStub = defineComponent({
  name: 'InputText',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('input', {
        value: props.modelValue,
        onInput: (event) => emit('update:modelValue', event.target.value)
      })
  }
})

const CardStub = defineComponent({
  name: 'Card',
  setup(_, { slots }) {
    return () => h('div', { class: 'card-stub' }, slots.content ? slots.content() : slots.default?.())
  }
})

const FileUploadStub = defineComponent({
  name: 'FileUpload',
  emits: ['select', 'clear'],
  setup(_, { slots }) {
    return () => h('div', { class: 'file-upload-stub' }, slots.default ? slots.default() : [])
  }
})

const globalStubs = {
  Button: ButtonStub,
  InputText: InputTextStub,
  Card: CardStub,
  FileUpload: FileUploadStub
}

const createTestRouter = async (initialRoute = { path: '/' }) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'root', component: { template: '<div />' } },
      { path: '/popular-data/:clientId', name: 'PopularDataPlatforms', component: { template: '<div />' } },
      { path: '/popular-data/:clientId/xhs', name: 'PopularDataXhs', component: { template: '<div />' } }
    ]
  })
  await router.push(initialRoute)
  await router.isReady()
  return router
}

import PopularData from './popular-data/PopularData.vue'
import PopularDataPlatforms from './popular-data/PopularDataPlatforms.vue'
import PopularDataCardDialog from './popular-data/PopularDataCardDialog.vue'

describe('PopularData 客戶列表', () => {
  beforeEach(() => {
    toastMock.add.mockClear()
    fetchClientsMock.mockReset()
  })

  it('載入客戶並可搜尋', async () => {
    fetchClientsMock.mockResolvedValueOnce([
      { _id: '1', name: '星光集團' },
      { _id: '2', name: '晨曦品牌' }
    ])

    const router = await createTestRouter()
    const pushSpy = vi.spyOn(router, 'push')
    const wrapper = mount(PopularData, { global: { stubs: globalStubs, plugins: [router] } })
    await flushPromises()

    expect(wrapper.text()).toContain('星光集團')
    expect(wrapper.text()).toContain('晨曦品牌')

    const input = wrapper.find('input')
    await input.setValue('晨曦')
    await flushPromises()

    expect(wrapper.text()).toContain('晨曦品牌')
    expect(wrapper.text()).not.toContain('星光集團')

    await wrapper.findAll('button')[0].trigger('click')
    expect(pushSpy).toHaveBeenCalledWith({ name: 'PopularDataPlatforms', params: { clientId: '2' } })
  })

  it('含無名稱客戶時仍可載入並搜尋', async () => {
    fetchClientsMock.mockResolvedValueOnce([
      { _id: '1' },
      { _id: '2', name: '晨曦品牌' }
    ])

    const router = await createTestRouter()
    const wrapper = mount(PopularData, { global: { stubs: globalStubs, plugins: [router] } })
    await flushPromises()

    expect(wrapper.findAll('.card-stub').length).toBe(2)
    expect(wrapper.text()).toContain('晨曦品牌')

    const input = wrapper.find('input')
    await input.setValue('晨曦')
    await flushPromises()

    expect(wrapper.findAll('.card-stub').length).toBe(1)
    expect(wrapper.text()).toContain('晨曦品牌')
  })
})

describe('PopularData 平台選擇', () => {
  beforeEach(() => {
    getClientMock.mockResolvedValue({ name: '行銷客戶' })
  })

  it('禁用 TikTok 與 Facebook 並導向小紅書', async () => {
    const router = await createTestRouter({ path: '/', query: { clientName: '測試客戶' } })
    const pushSpy = vi.spyOn(router, 'push')
    const wrapper = mount(PopularDataPlatforms, {
      props: { clientId: '123' },
      global: { stubs: { Button: ButtonStub }, plugins: [router] }
    })
    await flushPromises()

    const buttons = wrapper.findAll('.platforms-grid .button-stub')
    expect(buttons[0].classes()).toContain('platform-button--muted')
    expect(buttons[1].classes()).toContain('platform-button--muted')
    expect(buttons[2].classes()).toContain('platform-button--active')

    await buttons[0].trigger('click')
    await buttons[1].trigger('click')
    expect(pushSpy).not.toHaveBeenCalled()

    await buttons[2].trigger('click')
    expect(pushSpy).toHaveBeenCalledWith({ name: 'PopularDataXhs', params: { clientId: '123' } })
  })
})

describe('PopularDataCardDialog 指標提示', () => {
  it('低於閾值時顯示紅色警示', async () => {
    const wrapper = mount(PopularDataCardDialog, {
      props: {
        modelValue: true,
        content: {
          title: '測試影片',
          publishDate: '2024-01-01',
          exposure: 1000,
          viewCount: 200,
          coverCtr: 10,
          avgWatchSeconds: 5,
          completionRate: 5,
          twoSecondDropRate: 45
        }
      }
    })

    await flushPromises()
    const alerts = wrapper.findAll('.metric-alert')
    expect(alerts.length).toBeGreaterThan(0)
    expect(wrapper.text()).toContain('建議曝光需達 3000 以上')
    expect(wrapper.text()).toContain('平均觀看建議超過 10 秒')
    expect(wrapper.text()).toContain('2 秒退出率建議低於 30%')
  })
})
