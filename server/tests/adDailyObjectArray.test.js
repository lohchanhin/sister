import { jest, describe, it, expect } from '@jest/globals';

jest.unstable_mockModule('../src/models/adDaily.model.js', () => ({
  default: {
    find: jest.fn().mockResolvedValue({
      date: ['2024-01-01', '2024-01-02'],
      clicks: [5, 10]
    }),
    updateOne: jest.fn()
  }
}));

jest.unstable_mockModule('../src/models/platform.model.js', () => ({
  default: {
    findById: jest.fn().mockResolvedValue({ fields: [] })
  }
}));

const setCache = jest.fn().mockResolvedValue();
const getCache = jest.fn().mockResolvedValue(null);

jest.unstable_mockModule('../src/utils/cache.js', () => ({
  setCache,
  getCache
}));

describe('getAdDaily 物件陣列轉換', () => {
  it('將含多陣列欄位的物件轉為列陣列', async () => {
    const { getAdDaily } = await import('../src/controllers/adDaily.controller.js');
    const req = { params: { clientId: 'c', platformId: 'p' }, query: {} };
    const res = { json: jest.fn() };

    await getAdDaily(req, res);

    expect(res.json).toHaveBeenCalledWith([
      { date: '2024-01-01', clicks: 5 },
      { date: '2024-01-02', clicks: 10 }
    ]);
  });
});
