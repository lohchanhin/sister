import { jest, describe, it, expect } from '@jest/globals';

const setupMocks = async (downloadReject = false) => {
  jest.resetModules();

  const outputHandlers = {};
  const createWriteStream = jest.fn(() => ({
    on: (event, handler) => {
      if (event === 'close') outputHandlers.close = handler;
    }
  }));

  const archive = {
    pipe: jest.fn(),
    file: jest.fn(),
    on: jest.fn((event, handler) => {
      if (event === 'error') archive._error = handler;
    }),
    finalize: jest.fn(() => {
      if (outputHandlers.close) outputHandlers.close();
    })
  };

  const download = downloadReject
    ? jest.fn().mockRejectedValue(new Error('download error'))
    : jest.fn().mockResolvedValue();
  const bucket = { file: jest.fn(() => ({ download })) };

  const setCache = jest.fn().mockResolvedValue();
  const getCache = jest.fn().mockResolvedValue({});
  const logger = { error: jest.fn() };

  jest.unstable_mockModule('archiver', () => ({ default: () => archive }));
  jest.unstable_mockModule('node:fs', () => ({ createWriteStream }));
  jest.unstable_mockModule('../src/utils/gcs.js', () => ({ default: bucket }));
  jest.unstable_mockModule('../src/utils/cache.js', () => ({ setCache, getCache }));
  jest.unstable_mockModule('../src/config/logger.js', () => ({ default: logger }));

  const { archiveProducts } = await import('../src/controllers/product.controller.js');

  return { archiveProducts, setCache, logger };
};

describe('archiveProducts', () => {
  it('resolves and updates progress on success', async () => {
    const { archiveProducts, setCache } = await setupMocks();
    const products = [{ path: 'p', filename: 'f', title: 't' }];
    const result = await archiveProducts(products, '/tmp', 'key', '/tmp/z.zip');
    expect(result).toBe('/tmp/z.zip');
    expect(setCache).toHaveBeenCalledWith('key', { percent: 100, url: null, error: null }, 600);
  });

  it('logs error and continues when download fails', async () => {
    const { archiveProducts, setCache, logger } = await setupMocks(true);
    const products = [{ path: 'p', filename: 'f', title: 't' }];
    const result = await archiveProducts(products, '/tmp', 'key', '/tmp/z.zip');
    expect(result).toBe('/tmp/z.zip');
    expect(logger.error).toHaveBeenCalled();
    expect(setCache).toHaveBeenCalledWith('key', { error: expect.stringContaining('無法處理') }, 600);
  });
});
