export const baseSpec = [
  { field: 'date',        type: '文字 / 日期', sample: '2025-06-01' },
  { field: 'spent',       type: '數字',         sample: '1200'      },
  { field: 'enquiries',   type: '數字',         sample: '10'        },
  { field: 'reach',       type: '數字',         sample: '500'       },
  { field: 'impressions', type: '數字',         sample: '800'       },
  { field: 'clicks',      type: '數字',         sample: '23'        }
]

export const buildExcelSpec = customFields => [
  ...baseSpec,
  ...customFields.map(c => ({ field: c, type: '文字', sample: '' }))
]

export const buildTemplateRow = customFields => {
  const row = {
    date: '2025-06-01',
    spent: 1200,
    enquiries: 10,
    reach: 500,
    impressions: 800,
    clicks: 23
  }
  customFields.forEach(c => {
    row[c] = ''
  })
  return row
}

export const normalizeRows = (arr, customFields) => arr
  .map(r => {
    const obj = {
      date:        r.date || r.日期,
      spent:       +(r.spent || r.花費 || 0),
      enquiries:   +(r.enquiries || r.詢問 || 0),
      reach:       +(r.reach || r.觸及 || 0),
      impressions: +(r.impressions || r.曝光 || 0),
      clicks:      +(r.clicks || r.點擊 || 0)
    }
    const extra = {}
    customFields.forEach(c => {
      if (r[c] !== undefined) extra[c] = r[c]
    })
    const ignore = new Set([
      'date','日期','spent','花費','enquiries','詢問','reach','觸及',
      'impressions','曝光','clicks','點擊',
      ...customFields
    ])
    for (const [k, v] of Object.entries(r)) {
      if (!ignore.has(k)) extra[k] = v
    }
    if (Object.keys(extra).length) obj.extraData = extra
    return obj
  })
  .filter(r => r.date)

export const buildExportRows = (dailyData, customFields, dateFmt) =>
  dailyData.map(r => {
    const obj = {
      日期: dateFmt(r),
      花費: r.spent,
      詢問: r.enquiries,
      平均成本: r.avgCost,
      觸及: r.reach,
      曝光: r.impressions,
      點擊: r.clicks
    }
    customFields.forEach(c => {
      obj[c] = r.extraData?.[c] || ''
    })
    return obj
  })
