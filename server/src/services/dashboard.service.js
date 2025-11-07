const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 50

export const resolveSummaryPagination = (query = {}) => {
  const page = Math.max(parseInt(query.page, 10) || DEFAULT_PAGE, 1)
  const requestedPageSize = parseInt(query.pageSize, 10) || DEFAULT_PAGE_SIZE
  const pageSize = Math.min(Math.max(requestedPageSize, 1), MAX_PAGE_SIZE)
  const skip = (page - 1) * pageSize

  return { page, pageSize, skip, limit: pageSize }
}

export const buildSummaryCacheKey = (userId, page, pageSize) =>
  `dashboard:${userId}:p${page}:s${pageSize}`

export const buildProductAccessFilter = (userId) => ({
  type: 'edited',
  $or: [
    { allowedUsers: { $exists: false } },
    { allowedUsers: { $eq: [] } },
    { allowedUsers: null },
    { allowedUsers: userId }
  ]
})

