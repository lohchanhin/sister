import { buildExcelSpec, buildTemplateRow, normalizeRows, buildExportRows, baseSpec } from '../../client/src/utils/adData.js'
import dayjs from 'dayjs'

describe('adData helpers', () => {
  const fields = [
    { name: 'foo', slug: 'foo', type: 'number' },
    { name: 'bar', slug: 'bar', type: 'text' },
    { name: 'baz', slug: 'baz', type: 'date' },
    { name: 'calc', slug: 'calc', type: 'formula', formula: 'foo * 2' }
  ]

  test('excel spec and template order', () => {
    const spec = buildExcelSpec(fields)
    expect(spec.map(s => s.field)).toEqual([
      ...baseSpec.map(b => b.field),
      ...fields.map(f => f.name)
    ])

    const sample = buildTemplateRow(fields)
    expect(Object.keys(sample)).toEqual([
      ...baseSpec.map(b => b.field),
      ...fields.map(f => f.name)
    ])
  })

  test('normalizeRows keeps field order', () => {
    const rows = normalizeRows([
      { date:'2025-06-02', foo:'A', bar:'B', baz:'2025-06-01', calc:5, spent:100 }
    ], fields)
    expect(Object.keys(rows[0].extraData)).toEqual(fields.filter(f => f.type !== 'formula').map(f => f.slug))
  })

  test('export rows follow field order', () => {
    const daily = [{ date:'2025-06-01', spent:100, enquiries:1, reach:10, impressions:20, clicks:5, avgCost:'100.00', extraData:{ foo:'X', bar:'Y', baz:'2025-06-03', calc:2 } }]
    const rows = buildExportRows(
      daily,
      fields,
      r => dayjs(r.date).format('YYYY-MM-DD')
    )
    expect(Object.keys(rows[0])).toEqual([
      '日期','花費','詢問','平均成本','觸及','曝光','點擊',
      ...fields.map(f => f.name)
    ])
  })
})
