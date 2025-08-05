import { PassThrough } from 'stream'
import { jest, describe, test, expect } from '@jest/globals'

describe('gcs utils', () => {
  beforeEach(() => {
    jest.resetModules()
  })

  test('uses default credentials when GCS_KEY_FILE is not provided', async () => {
    const originalEnv = process.env.NODE_ENV
    const originalProject = process.env.GCS_PROJECT_ID
    const originalBucket = process.env.GCS_BUCKET
    const originalKeyFile = process.env.GCS_KEY_FILE

    process.env.GCS_PROJECT_ID = 'proj'
    process.env.GCS_BUCKET = 'bucket'
    delete process.env.GCS_KEY_FILE
    process.env.NODE_ENV = 'production'

    const storageOptions = {}

    jest.unstable_mockModule('@google-cloud/storage', () => {
      return {
        Storage: class {
          constructor(options) {
            Object.assign(storageOptions, options)
          }
          bucket() {
            return {
              file: () => ({
                createWriteStream: () => new PassThrough(),
                getSignedUrl: async () => ['https://signed.url']
              })
            }
          }
        }
      }
    })

    const { uploadStream, getSignedUrl } = await import('../src/utils/gcs.js')

    const buffer = Buffer.from('test')
    const dest = 'path/file.txt'
    await expect(uploadStream(buffer, dest, 'text/plain')).resolves.toBe(dest)

    expect(storageOptions).toEqual({ projectId: 'proj' })

    const url = await getSignedUrl(dest)
    expect(url).toBe('https://signed.url')

    process.env.NODE_ENV = originalEnv
    process.env.GCS_PROJECT_ID = originalProject
    process.env.GCS_BUCKET = originalBucket
    process.env.GCS_KEY_FILE = originalKeyFile
  })
})
