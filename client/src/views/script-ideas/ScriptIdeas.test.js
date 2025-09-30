import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { defineComponent, h } from 'vue'

const toastMock = { add: vi.fn() }
vi.mock('primevue/usetoast', () => ({ useToast: () => toastMock }))

const clientsModuleMock = vi.hoisted(() => ({
  fetchClients: vi.fn(() => Promise.resolve([])),
  getClient: vi.fn(() => Promise.resolve({ name: '客戶' }))
}))
vi.mock('@/services/clients', () => clientsModuleMock)

const scriptIdeasModuleMock = vi.hoisted(() => ({
  listScriptIdeas: vi.fn(() => Promise.resolve([])),
  createScriptIdea: vi.fn(() => Promise.resolve({})),
  updateScriptIdea: vi.fn(() => Promise.resolve({})),
  deleteScriptIdea: vi.fn(() => Promise.resolve({})),
  getScriptIdea: vi.fn(() => Promise.resolve({
    _id: 'idea-1',
    clientId: 'client-1',
    summaryScript: '原始腳本',
    headline: '原始標題',
    videoUrl: '',
    videoName: ''
  }))
}))
vi.mock('@/services/scriptIdeas', () => ({
  ...scriptIdeasModuleMock,
  SCRIPT_IDEA_STATUS: { PENDING: 'pending', APPROVED: 'approved', REVISION: 'revision' }
}))

const {
  fetchClients: fetchClientsMock,
  getClient: getClientMock
} = clientsModuleMock

const {
  listScriptIdeas: listScriptIdeasMock,
  createScriptIdea: createScriptIdeaMock,
  updateScriptIdea: updateScriptIdeaMock,
  deleteScriptIdea: deleteScriptIdeaMock,
  getScriptIdea: getScriptIdeaMock
} = scriptIdeasModuleMock

const ButtonStub = defineComponent({
  name: 'Button',
  props: ['label', 'icon', 'severity', 'disabled', 'loading'],
  emits: ['click'],
  setup(props, { emit, slots, attrs }) {
    return () =>
      h(
        'button',
        {
          ...attrs,
          'data-label': props.label,
          'data-icon': props.icon,
          disabled: props.disabled || attrs.disabled || props.loading,
          onClick: (event) => {
            if (props.disabled || attrs.disabled || props.loading) return
            emit('click', event)
            attrs.onClick?.(event)
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
  setup(props, { emit, attrs }) {
    return () =>
      h('input', {
        ...attrs,
        value: props.modelValue ?? '',
        onInput: (event) => emit('update:modelValue', event.target.value)
      })
  }
})

const TextareaStub = defineComponent({
  name: 'Textarea',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  setup(props, { emit, attrs }) {
    return () =>
      h('textarea', {
        ...attrs,
        value: props.modelValue ?? '',
        onInput: (event) => emit('update:modelValue', event.target.value)
      })
  }
})

const DropdownStub = defineComponent({
  name: 'Dropdown',
  props: ['modelValue', 'options', 'optionLabel', 'optionValue'],
  emits: ['update:modelValue'],
  setup(props, { emit, attrs }) {
    return () =>
      h(
        'select',
        {
          ...attrs,
          value: props.modelValue ?? '',
          onChange: (event) => emit('update:modelValue', event.target.value)
        },
        (props.options || []).map((option) =>
          h('option', { value: option[props.optionValue || 'value'] }, option[props.optionLabel || 'label'])
        )
      )
  }
})

const InputNumberStub = defineComponent({
  name: 'InputNumber',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  setup(props, { emit, attrs }) {
    return () =>
      h('input', {
        ...attrs,
        type: 'number',
        value: props.modelValue ?? 0,
        onInput: (event) => emit('update:modelValue', Number(event.target.value))
      })
  }
})

const CalendarStub = defineComponent({
  name: 'Calendar',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  setup(props, { emit, attrs }) {
    return () =>
      h('input', {
        ...attrs,
        type: 'date',
        value: props.modelValue ? new Date(props.modelValue).toISOString().slice(0, 10) : '',
        onInput: (event) => emit('update:modelValue', new Date(event.target.value))
      })
  }
})

const DialogStub = defineComponent({
  name: 'Dialog',
  props: ['visible'],
  emits: ['update:visible'],
  setup(props, { slots }) {
    return () => (props.visible ? h('div', { class: 'dialog-stub' }, [slots.default?.(), slots.footer?.()]) : null)
  }
})

const CardStub = defineComponent({
  name: 'Card',
  setup(_, { slots }) {
    return () => h('section', { class: 'card-stub' }, [slots.title?.(), slots.content?.()])
  }
})

const DataTableStub = defineComponent({
  name: 'DataTable',
  props: ['value'],
  setup(props) {
    return () =>
      h(
        'div',
        { class: 'datatable-stub' },
        (props.value || []).map((row) => h('div', { class: 'datatable-row' }, JSON.stringify(row)))
      )
  }
})

const ColumnStub = defineComponent({ name: 'Column' })

const TagStub = defineComponent({
  name: 'Tag',
  props: ['value'],
  setup(props) {
    return () => h('span', { class: 'tag-stub' }, props.value)
  }
})

const FileUploadStub = defineComponent({
  name: 'FileUpload',
  emits: ['select', 'remove', 'update:files'],
  setup(_, { slots, emit }) {
    return () =>
      h('div', { class: 'file-upload-stub' }, [
        h(
          'button',
          {
            type: 'button',
            'data-action': 'select',
            onClick: () => {
              const files = [{ name: 'demo.mp4' }]
              emit('update:files', files)
              emit('select', { files })
            }
          },
          '選擇檔案'
        ),
        slots.empty?.()
      ])
  }
})

const globalStubs = {
  Button: ButtonStub,
  InputText: InputTextStub,
  Textarea: TextareaStub,
  Dropdown: DropdownStub,
  InputNumber: InputNumberStub,
  Calendar: CalendarStub,
  Dialog: DialogStub,
  Card: CardStub,
  DataTable: DataTableStub,
  Column: ColumnStub,
  Tag: TagStub,
  FileUpload: FileUploadStub
}

const createTestRouter = async (initialRoute = '/') => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'ScriptIdeasClients', component: { template: '<div />' } },
      { path: '/script-ideas/:clientId', name: 'ScriptIdeasRecords', component: { template: '<div />' } },
      { path: '/script-ideas/:clientId/records/:recordId', name: 'ScriptIdeasDetail', component: { template: '<div />' } }
    ]
  })
  await router.push(initialRoute)
  await router.isReady()
  return router
}

import ScriptIdeas from './ScriptIdeas.vue'
import ScriptIdeasRecords from './ScriptIdeasRecords.vue'
import ScriptIdeasDetail from './ScriptIdeasDetail.vue'

describe('ScriptIdeas 客戶列表', () => {
  beforeEach(() => {
    fetchClientsMock.mockReset()
    toastMock.add.mockClear()
  })

  it('載入客戶並能搜尋與導航', async () => {
    fetchClientsMock.mockResolvedValueOnce([
      { _id: 'c1', name: '星光企業' },
      { _id: 'c2', name: '晨曦品牌' }
    ])

    const router = await createTestRouter()
    const pushSpy = vi.spyOn(router, 'push')
    const wrapper = mount(ScriptIdeas, { global: { plugins: [router], stubs: globalStubs } })
    await flushPromises()

    expect(wrapper.text()).toContain('星光企業')
    expect(wrapper.text()).toContain('晨曦品牌')

    const searchInput = wrapper.find('input')
    await searchInput.setValue('晨曦')
    await flushPromises()

    expect(wrapper.text()).toContain('晨曦品牌')
    expect(wrapper.text()).not.toContain('星光企業')

    const manageButton = wrapper.find('button[data-label="管理腳本"]')
    await manageButton.trigger('click')
    expect(pushSpy).toHaveBeenCalledWith({ name: 'ScriptIdeasRecords', params: { clientId: 'c2' } })
  })
})

describe('ScriptIdeasRecords 管理腳本記錄', () => {
  beforeEach(() => {
    listScriptIdeasMock.mockReset()
    createScriptIdeaMock.mockReset()
    updateScriptIdeaMock.mockReset()
    deleteScriptIdeaMock.mockReset()
    getClientMock.mockReset()
    toastMock.add.mockClear()
  })

  it('可以新增與刪除腳本記錄', async () => {
    getClientMock.mockResolvedValueOnce({ _id: 'client-1', name: '影片客戶' })
    listScriptIdeasMock
      .mockResolvedValueOnce([
        { _id: 'idea-1', date: '2024-01-02T00:00:00.000Z', location: '台北', scriptCount: 3, status: 'pending' }
      ])
      .mockResolvedValueOnce([
        { _id: 'idea-1', date: '2024-01-02T00:00:00.000Z', location: '台北', scriptCount: 3, status: 'pending' },
        { _id: 'idea-2', date: '2024-01-05T00:00:00.000Z', location: '台中', scriptCount: 2, status: 'approved' }
      ])
      .mockResolvedValueOnce([
        { _id: 'idea-1', date: '2024-01-02T00:00:00.000Z', location: '台北', scriptCount: 3, status: 'pending' }
      ])
    createScriptIdeaMock.mockResolvedValue({ _id: 'idea-2' })
    deleteScriptIdeaMock.mockResolvedValue({ success: true })
    const router = await createTestRouter('/script-ideas/client-1')
    const wrapper = mount(ScriptIdeasRecords, {
      props: { clientId: 'client-1' },
      global: { plugins: [router], stubs: globalStubs }
    })
    await flushPromises()

    expect(listScriptIdeasMock).toHaveBeenCalledWith('client-1')
    expect(wrapper.vm.records).toHaveLength(1)

    await wrapper.vm.openCreate()
    wrapper.vm.form.date = new Date('2024-01-05T00:00:00.000Z')
    wrapper.vm.form.location = '台中'
    wrapper.vm.form.scriptCount = 2
    wrapper.vm.form.status = 'approved'
    await wrapper.vm.submitForm()
    await flushPromises()

    expect(createScriptIdeaMock).toHaveBeenCalledWith(
      'client-1',
      expect.objectContaining({
        date: expect.stringContaining('2024-01-05'),
        location: '台中',
        scriptCount: 2,
        status: 'approved'
      })
    )
    expect(listScriptIdeasMock).toHaveBeenCalledTimes(2)

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    await wrapper.vm.confirmDelete({ _id: 'idea-1' })
    await flushPromises()

    expect(deleteScriptIdeaMock).toHaveBeenCalledWith('client-1', 'idea-1')
    expect(listScriptIdeasMock).toHaveBeenCalledTimes(3)
    confirmSpy.mockRestore()
  })
})

describe('ScriptIdeasDetail 編輯詳情', () => {
  beforeEach(() => {
    getScriptIdeaMock.mockReset()
    updateScriptIdeaMock.mockReset()
    toastMock.add.mockClear()
  })

  it('可移除影片並儲存腳本內容', async () => {
    getScriptIdeaMock.mockResolvedValueOnce({
      _id: 'idea-1',
      clientId: 'client-1',
      summaryScript: '原始腳本',
      headline: '原始標題',
      firstParagraph: '',
      dialogue: '',
      keyLines: '',
      feedback: '',
      videoUrl: 'https://example.com/demo.mp4',
      videoName: 'demo.mp4'
    })
    getScriptIdeaMock.mockResolvedValueOnce({
      _id: 'idea-1',
      clientId: 'client-1',
      summaryScript: '更新後腳本',
      headline: '更新後標題',
      firstParagraph: '',
      dialogue: '',
      keyLines: '',
      feedback: '',
      videoUrl: '',
      videoName: ''
    })
    const router = await createTestRouter('/script-ideas/client-1/records/idea-1')
    const wrapper = mount(ScriptIdeasDetail, {
      props: { clientId: 'client-1', recordId: 'idea-1' },
      global: { plugins: [router], stubs: globalStubs }
    })
    await flushPromises()

    expect(getScriptIdeaMock).toHaveBeenCalledWith('client-1', 'idea-1')
    expect(wrapper.vm.form.summaryScript).toBe('原始腳本')

    await wrapper.vm.toggleRemove()
    wrapper.vm.form.summaryScript = '更新後腳本'
    await wrapper.vm.save()
    await flushPromises()

    expect(updateScriptIdeaMock).toHaveBeenCalledWith('client-1', 'idea-1', expect.objectContaining({
      summaryScript: '更新後腳本',
      removeVideo: 'true'
    }))
    expect(getScriptIdeaMock).toHaveBeenCalledTimes(2)
  })
})
