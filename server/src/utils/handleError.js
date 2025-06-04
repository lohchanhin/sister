/**
 * \u5168\u57df\u932f\u8aa4\u8655\u7406
 */
export const notFound = (_, res, next) => {
  const error = new Error(`\ud83d\udd0d \u7121\u6b64\u8def\u7531`)
  error.status = 404
  next(error)
}

export const errorHandler = (err, req, res, _next) => {
  const statusCode = err.status || 500
  res.status(statusCode).json({
    message: err.message || '\u4f3a\u670d\u5668\u5167\u90e8\u932f\u8aa4',
    stack: process.env.NODE_ENV === 'production' ? '\ud83c\udf70' : err.stack
  })
}
