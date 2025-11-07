import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import AssetDeletionLogList from './AssetDeletionLogList.vue'
import { fetchAssetDeletionLogs } from '../../services/assets'

vi.mock('../../services/assets', () => ({
  fetchAssetDeletionLogs: vi.fn()
}))

describe('AssetDeletionLogList', () => {
  beforeEach(() => {
    fetchAssetDeletionLogs.mockReset()
  })

  it('renders deletion logs returned by API', async () => {
    fetchAssetDeletionLogs.mockResolvedValue({
      data: [
        {
          id: '1',
          originalFilename: 'demo.mp4',
          method: 'manual-single',
          deletedAt: '2024-01-01T10:00:00.000Z',
          deletedBy: { name: '管理員' }
        }
      ],
      pagination: { total: 1, page: 1, limit: 10 }
    })

    const wrapper = mount(AssetDeletionLogList, {
      props: { visible: true }
    })

    await flushPromises()

    expect(fetchAssetDeletionLogs).toHaveBeenCalled()
    expect(wrapper.text()).toContain('demo.mp4')
    expect(wrapper.text()).toContain('手動刪除')
    expect(wrapper.text()).toContain('管理員')
  })
})
