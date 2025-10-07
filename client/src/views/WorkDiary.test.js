import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { createPinia, setActivePinia } from 'pinia'

import WorkDiary from './WorkDiary.vue'
import { useAuthStore } from '@/stores/auth'

const toastMock = { add: vi.fn() }
vi.mock('primevue/usetoast', () => ({ useToast: () => toastMock }))

const workDiaryServiceMock = vi.hoisted(() => ({
  createWorkDiary: vi.fn(),
  listWorkDiaries: vi.fn(),
  getWorkDiary: vi.fn(),
  updateWorkDiary: vi.fn(),
  uploadWorkDiaryImages: vi.fn(),
  removeWorkDiaryImage: vi.fn()
}))

vi.mock('@/services/workDiary', () => workDiaryServiceMock)

const userServiceMock = vi.hoisted(() => ({
  fetchUsers: vi.fn()
}))

vi.mock('@/services/user', () => userServiceMock)

const fetchUsersMock = userServiceMock.fetchUsers

const {
  createWorkDiary: createWorkDiaryMock,
  listWorkDiaries: listWorkDiariesMock,
  getWorkDiary: getWorkDiaryMock,
  updateWorkDiary: updateWorkDiaryMock
} = workDiaryServiceMock

const formatInputDate = (value) => {
  if (!value) return ''
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date?.getTime?.())) return ''
  const yyyy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const CalendarStub = defineComponent({
  name: 'CalendarStub',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () =>
      h('input', {
        class: 'calendar-stub',
        value: formatInputDate(props.modelValue),
        onInput: (event) => emit('update:modelValue', new Date(event.target.value))
      })
  }
})

const DropdownStub = defineComponent({
  name: 'DropdownStub',
  props: ['modelValue', 'options', 'disabled'],
  emits: ['update:modelValue', 'change'],
  setup(props, { emit, attrs }) {
    return () =>
      h(
        'select',
        {
          class: ['dropdown-stub', attrs.class].filter(Boolean).join(' '),
          value: props.modelValue ?? '',
          disabled: props.disabled,
          onChange: (event) => {
            const value = event.target.value || null
            emit('update:modelValue', value)
            emit('change', value)
          }
        },
        (props.options || []).map((option) =>
          h('option', { value: option.value }, option.label)
        )
      )
  }
})

const ButtonStub = defineComponent({
  name: 'ButtonStub',
  props: ['label', 'icon', 'loading', 'disabled'],
  emits: ['click'],
  setup(props, { emit, slots, attrs }) {
    return () =>
      h(
        'button',
        {
          ...attrs,
          class: ['button-stub', attrs.class].filter(Boolean).join(' '),
          disabled: props.disabled ?? attrs.disabled ?? false,
          onClick: (event) => {
            if (props.disabled ?? attrs.disabled) return
            emit('click', event)
            attrs.onClick?.(event)
          }
        },
        slots.default?.() || props.label || props.icon || 'button'
      )
  }
})

const TextareaStub = defineComponent({
  name: 'TextareaStub',
  props: ['modelValue', 'readonly'],
  emits: ['update:modelValue'],
  setup(props, { emit, attrs }) {
    return () =>
      h('textarea', {
        class: ['textarea-stub', attrs.class].filter(Boolean).join(' '),
        value: props.modelValue ?? '',
        readOnly: props.readonly ?? attrs.readonly ?? false,
        onInput: (event) => emit('update:modelValue', event.target.value)
      })
  }
})

const InputTextStub = defineComponent({
  name: 'InputTextStub',
  props: ['modelValue', 'disabled'],
  emits: ['update:modelValue'],
  setup(props, { emit, attrs }) {
    return () =>
      h('input', {
        class: ['input-stub', attrs.class].filter(Boolean).join(' '),
        value: props.modelValue ?? '',
        disabled: props.disabled ?? attrs.disabled ?? false,
        onInput: (event) => emit('update:modelValue', event.target.value)
      })
  }
})

const TagStub = defineComponent({
  name: 'TagStub',
  props: ['value', 'severity'],
  setup(props) {
    return () =>
      h(
        'span',
        { class: ['tag-stub', props.severity ? `tag-${props.severity}` : ''] },
        props.value
      )
  }
})

const CardStub = defineComponent({
  name: 'CardStub',
  setup(_, { slots }) {
    return () =>
      h('section', { class: 'card-stub' }, [
        slots.title?.(),
        slots.content?.(),
        slots.default?.()
      ])
  }
})

const DialogStub = defineComponent({
  name: 'DialogStub',
  props: ['visible'],
  emits: ['update:visible', 'hide'],
  setup(props, { slots }) {
    return () =>
      props.visible
        ? h('div', { class: 'dialog-stub' }, [slots.default?.(), slots.footer?.()])
        : null
  }
})

const FileUploadStub = defineComponent({
  name: 'FileUploadStub',
  emits: ['select'],
  setup(_, { slots, attrs }) {
    return () => h('div', { class: 'file-upload-stub', ...attrs }, slots.default?.())
  }
})

const MultiSelectStub = defineComponent({
  name: 'MultiSelectStub',
  props: ['modelValue', 'options'],
  emits: ['update:modelValue'],
  setup(props, { emit, attrs }) {
    return () =>
      h(
        'select',
        {
          class: ['multiselect-stub', attrs.class].filter(Boolean).join(' '),
          multiple: true,
          value: props.modelValue || [],
          onChange: (event) => {
            const selected = Array.from(event.target.selectedOptions).map((option) => option.value)
            emit('update:modelValue', selected)
          }
        },
        (props.options || []).map((option) =>
          h(
            'option',
            {
              value: option.value,
              selected: (props.modelValue || []).includes(option.value)
            },
            option.label
          )
        )
      )
  }
})

const InputSwitchStub = defineComponent({
  name: 'InputSwitchStub',
  props: ['modelValue'],
  emits: ['update:modelValue'],
  setup(props, { emit, attrs }) {
    return () =>
      h('input', {
        type: 'checkbox',
        class: ['input-switch-stub', attrs.class].filter(Boolean).join(' '),
        checked: !!props.modelValue,
        onChange: (event) => emit('update:modelValue', event.target.checked)
      })
  }
})

const DividerStub = defineComponent({
  name: 'DividerStub',
  setup() {
    return () => h('hr', { class: 'divider-stub' })
  }
})

const SkeletonStub = defineComponent({
  name: 'SkeletonStub',
  setup() {
    return () => h('div', { class: 'skeleton-stub' })
  }
})

const globalStubs = {
  Card: CardStub,
  Dialog: DialogStub,
  Calendar: CalendarStub,
  Dropdown: DropdownStub,
  Button: ButtonStub,
  Textarea: TextareaStub,
  InputText: InputTextStub,
  Tag: TagStub,
  FileUpload: FileUploadStub,
  MultiSelect: MultiSelectStub,
  InputSwitch: InputSwitchStub,
  Divider: DividerStub,
  Skeleton: SkeletonStub
}

const createTestRouter = async (initialPath = '/work-diaries') => {
  const { createRouter, createMemoryHistory } = await import('vue-router')
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/work-diaries/:date?/:userId?',
        name: 'WorkDiaries',
        component: { template: '<div />' }
      }
    ]
  })
  await router.push(initialPath)
  await router.isReady()
  return router
}

const mountWorkDiary = async ({
  user,
  path = '/work-diaries',
  diaries = [
    {
      id: 'd1',
      title: '日誌 A',
      status: 'submitted',
      author: { _id: 'emp1', name: '一般員工' }
    }
  ],
  detail = {
    id: 'd1',
    title: '日誌 A',
    content: '今日完成任務。',
    status: 'submitted',
    managerComment: { text: '請再補充銷售結果' },
    images: []
  }
}) => {
  listWorkDiariesMock.mockResolvedValueOnce(diaries)

  getWorkDiaryMock.mockResolvedValueOnce(detail)
  updateWorkDiaryMock.mockImplementation((id, payload) =>
    Promise.resolve({ ...detail, id, ...payload })
  )

  const router = await createTestRouter(path)
  const pinia = createPinia()
  setActivePinia(pinia)
  const authStore = useAuthStore()
  authStore.$patch(user)

  const wrapper = mount(WorkDiary, {
    global: {
      plugins: [pinia, router],
      stubs: globalStubs
    }
  })

  await flushPromises()
  await flushPromises()

  return { wrapper, router }
}

describe('WorkDiary.vue', () => {
  beforeEach(() => {
    toastMock.add.mockClear()
    createWorkDiaryMock.mockReset()
    listWorkDiariesMock.mockReset()
    getWorkDiaryMock.mockReset()
    updateWorkDiaryMock.mockReset()
    fetchUsersMock.mockReset()
    fetchUsersMock.mockResolvedValue([])
  })

  afterAll(() => {
    vi.resetModules()
  })

  it('一般員工僅可編輯自身內容且不可調整狀態', async () => {
    const user = {
      token: 'token',
      user: {
        _id: 'emp1',
        name: '一般員工',
        permissions: ['work-diary:manage:self', 'work-diary:read:self'],
        menus: ['work-diaries']
      }
    }

    const { wrapper } = await mountWorkDiary({ user })

    expect(listWorkDiariesMock).toHaveBeenCalled()
    expect(getWorkDiaryMock).toHaveBeenCalledWith('d1')

    const memberDropdown = wrapper.find('.work-diary-toolbar .dropdown-stub')
    expect(memberDropdown.exists()).toBe(false)

    const statusDropdown = wrapper.find('select.status-dropdown')
    expect(statusDropdown.exists()).toBe(false)

    const statusTag = wrapper.find('.status-control .tag-stub')
    expect(statusTag.exists()).toBe(true)
    expect(statusTag.text()).toContain('待審核')

    const supervisorTextarea = wrapper.find('.supervisor-comment textarea')
    expect(supervisorTextarea.exists()).toBe(true)
    expect(supervisorTextarea.element.readOnly).toBe(true)

    const saveButton = wrapper.find('button.save-button')
    expect(saveButton.exists()).toBe(true)
    expect(saveButton.element.disabled).toBe(false)
  })

  it('主管可調整狀態並寫入留言', async () => {
    const user = {
      token: 'token',
      user: {
        _id: 'leader',
        name: '主管',
        permissions: ['work-diary:review', 'work-diary:read:all'],
        menus: ['work-diaries']
      }
    }

    const { wrapper } = await mountWorkDiary({ user, path: '/work-diaries/2024-05-01' })

    await flushPromises()

    const memberDropdown = wrapper.find('.work-diary-toolbar .dropdown-stub')
    expect(memberDropdown.exists()).toBe(true)

    const statusDropdown = wrapper.find('select.status-dropdown')
    expect(statusDropdown.exists()).toBe(true)
    expect(statusDropdown.element.disabled).toBe(false)

    await statusDropdown.setValue('approved')

    const supervisorTextarea = wrapper.find('.supervisor-comment textarea')
    expect(supervisorTextarea.element.readOnly).toBe(false)
    await supervisorTextarea.setValue('辛苦了，保持品質。')

    const saveButton = wrapper.find('button.save-button')
    await saveButton.trigger('click')
    await flushPromises()

    expect(updateWorkDiaryMock).toHaveBeenCalledWith('d1', {
      title: '日誌 A',
      content: '今日完成任務。',
      status: 'approved',
      managerComment: { text: '辛苦了，保持品質。' },
      visibleTo: []
    })
  })

  it('主管可切換顯示全部日誌', async () => {
    const user = {
      token: 'token',
      user: {
        _id: 'leader',
        name: '主管',
        permissions: ['work-diary:review', 'work-diary:read:all'],
        menus: ['work-diaries']
      }
    }

    const { wrapper } = await mountWorkDiary({ user })

    expect(listWorkDiariesMock).toHaveBeenCalled()
    const firstPayload = listWorkDiariesMock.mock.calls[0][0]
    expect(firstPayload).toHaveProperty('date')

    const switchStub = wrapper.find('.input-switch-stub')
    expect(switchStub.exists()).toBe(true)
    await switchStub.setValue(true)
    await flushPromises()

    const latestCall = listWorkDiariesMock.mock.calls.at(-1)[0]
    expect(latestCall).not.toHaveProperty('date')
  })

  it('顯示全部日誌時會依日期顯示群組標題', async () => {
    const user = {
      token: 'token',
      user: {
        _id: 'leader',
        name: '主管',
        permissions: ['work-diary:review', 'work-diary:read:all'],
        menus: ['work-diaries']
      }
    }

    const initialDiaries = [
      {
        id: 'd-newer',
        title: '最新日誌',
        status: 'submitted',
        date: '2024-05-02',
        author: { _id: 'emp1', name: '一般員工' }
      }
    ]

    const allDiaries = [
      ...initialDiaries,
      {
        id: 'd-older',
        title: '前一天日誌',
        status: 'approved',
        date: '2024-05-01',
        author: { _id: 'emp2', name: '第二位員工' }
      }
    ]

    const { wrapper } = await mountWorkDiary({ user, diaries: initialDiaries })

    listWorkDiariesMock.mockResolvedValueOnce(allDiaries)

    const switchStub = wrapper.find('.input-switch-stub')
    await switchStub.setValue(true)
    await flushPromises()

    const groupHeaders = wrapper.findAll('.list-group-header')
    expect(groupHeaders.length).toBe(2)
    expect(groupHeaders.at(0)?.text()).toContain('2024-05-02')
    expect(groupHeaders.at(1)?.text()).toContain('2024-05-01')
  })

  it('缺少 content 欄位時會從 contentBlocks 推導顯示內容', async () => {
    const user = {
      token: 'token',
      user: {
        _id: 'emp1',
        name: '一般員工',
        permissions: ['work-diary:manage:self', 'work-diary:read:self'],
        menus: ['work-diaries']
      }
    }

    const diaries = [
      {
        id: 'd-block',
        title: '日誌區塊',
        status: 'submitted',
        author: { _id: 'emp1', name: '一般員工' },
        contentBlocks: [{ type: 'text', value: '摘要段落', order: 0 }]
      }
    ]

    const detail = {
      id: 'd-block',
      title: '日誌區塊',
      status: 'submitted',
      images: [],
      contentBlocks: [
        { type: 'text', value: '第一段內容', order: 0 },
        { type: 'text', value: '第二段內容', order: 1 }
      ]
    }

    const { wrapper } = await mountWorkDiary({ user, diaries, detail })

    const listPreview = wrapper.find('.list-item .item-preview')
    expect(listPreview.text()).toContain('第一段內容')

    const detailTextarea = wrapper.find('#diary-content')
    expect(detailTextarea.element.value).toBe(`第一段內容
第二段內容`)
  })

  it('可以建立日誌並重新整理列表', async () => {
    const user = {
      token: 'token',
      user: {
        _id: 'emp1',
        name: '一般員工',
        permissions: ['work-diary:manage:self', 'work-diary:read:self'],
        menus: ['work-diaries']
      }
    }

    const { wrapper } = await mountWorkDiary({ user, path: '/work-diaries/2024-05-01' })

    createWorkDiaryMock.mockResolvedValueOnce({
      id: 'd2',
      title: '新日誌',
      status: 'submitted',
      content: '今天完成新功能',
      images: []
    })
    listWorkDiariesMock.mockResolvedValueOnce([
      {
        id: 'd2',
        title: '新日誌',
        status: 'submitted',
        author: { _id: 'emp1', name: '一般員工' }
      },
      {
        id: 'd1',
        title: '日誌 A',
        status: 'submitted',
        author: { _id: 'emp1', name: '一般員工' }
      }
    ])
    getWorkDiaryMock.mockResolvedValueOnce({
      id: 'd2',
      title: '新日誌',
      content: '今天完成新功能',
      status: 'submitted',
      images: []
    })

    await wrapper.find('[data-test="create-diary-button"]').trigger('click')
    await flushPromises()

    const titleInput = wrapper.find('[data-test="create-diary-title-input"]')
    await titleInput.setValue('新日誌')

    const statusSelect = wrapper.find('#create-diary-status')
    await statusSelect.setValue('submitted')

    const contentTextarea = wrapper.find('#create-diary-content')
    await contentTextarea.setValue('今天完成新功能')

    const file = new File(['mock'], 'proof.png', { type: 'image/png' })
    const uploadComponents = wrapper.findAllComponents(FileUploadStub)
    const createUpload = uploadComponents.find((comp) => comp.attributes()['data-test'] === 'create-diary-upload')
    expect(createUpload).toBeTruthy()
    createUpload.vm.$emit('select', { files: [file] })

    await wrapper.find('[data-test="create-diary-submit"]').trigger('click')
    await flushPromises()
    await flushPromises()

    expect(createWorkDiaryMock).toHaveBeenCalledTimes(1)
    const formData = createWorkDiaryMock.mock.calls[0][0]
    expect(formData).toBeInstanceOf(FormData)
    expect(formData.get('title')).toBe('新日誌')
    expect(formData.get('status')).toBe('submitted')
    expect(formData.get('date')).toBe('2024-05-01')
    expect(formData.getAll('images').length).toBe(1)

    expect(listWorkDiariesMock).toHaveBeenCalledTimes(2)

    const listItems = wrapper.findAll('.list-item')
    expect(listItems[0].text()).toContain('新日誌')

    const successToast = toastMock.add.mock.calls.find((call) => call[0].summary === '建立成功')
    expect(successToast).toBeTruthy()
  })

  it('建立日誌權限不足時顯示警告', async () => {
    const user = {
      token: 'token',
      user: {
        _id: 'emp1',
        name: '一般員工',
        permissions: ['work-diary:manage:self', 'work-diary:read:self'],
        menus: ['work-diaries']
      }
    }

    const { wrapper } = await mountWorkDiary({ user })

    createWorkDiaryMock.mockRejectedValueOnce({ response: { status: 403 } })

    await wrapper.find('[data-test="create-diary-button"]').trigger('click')
    await flushPromises()

    const titleInput = wrapper.find('[data-test="create-diary-title-input"]')
    await titleInput.setValue('權限測試日誌')

    await wrapper.find('[data-test="create-diary-submit"]').trigger('click')
    await flushPromises()

    const warnToast = toastMock.add.mock.calls.find((call) => call[0].summary === '權限不足')
    expect(warnToast).toBeTruthy()
  })

  it('建立日誌資料驗證失敗顯示提示', async () => {
    const user = {
      token: 'token',
      user: {
        _id: 'emp1',
        name: '一般員工',
        permissions: ['work-diary:manage:self', 'work-diary:read:self'],
        menus: ['work-diaries']
      }
    }

    const { wrapper } = await mountWorkDiary({ user })

    createWorkDiaryMock.mockRejectedValueOnce({ response: { status: 400 } })

    await wrapper.find('[data-test="create-diary-button"]').trigger('click')
    await flushPromises()

    const titleInput = wrapper.find('[data-test="create-diary-title-input"]')
    await titleInput.setValue('錯誤日誌')

    await wrapper.find('[data-test="create-diary-submit"]').trigger('click')
    await flushPromises()

    const warningToast = toastMock.add.mock.calls.find((call) => call[0].summary === '資料格式錯誤')
    expect(warningToast).toBeTruthy()
  })

  it('沒有權限的使用者僅看到提示訊息', async () => {
    const user = {
      token: 'token',
      user: {
        _id: 'guest',
        name: '訪客',
        permissions: [],
        menus: []
      }
    }

    const { wrapper } = await mountWorkDiary({ user })

    expect(listWorkDiariesMock).not.toHaveBeenCalled()
    expect(wrapper.find('.work-diary-no-access').exists()).toBe(true)
    expect(wrapper.find('.no-access-content').text()).toContain('沒有觀看工作日誌的權限')
  })
})
