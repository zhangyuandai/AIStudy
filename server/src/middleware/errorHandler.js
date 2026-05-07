/**
 * 全局错误处理 + 404兜底
 */
const { error: errorResp } = require('../utils/response');

// 异步错误捕获包装器
function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

// 全局错误处理器
function globalErrorHandler(err, req, res, _next) {
  console.error('[ERROR]', new Date().toISOString(), err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // 已知业务错误
  if (err.code) {
    return errorResp(res, err.message, err.code, err.statusCode || 400);
  }
  // Joi 校验错误
  if (err.isJoi) {
    return errorResp(res, err.details?.[0]?.message || '参数校验失败', -1, 422);
  }
  // MySQL 错误
  if (err.code === 'ER_DUP_ENTRY') {
    return errorResp(res, '数据重复', -1, 409);
  }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    return errorResp(res, '关联数据不存在', -1, 400);
  }

  // 兜底500
  errorResp(res,
    process.env.NODE_ENV === 'development' ? err.message : '服务器内部错误',
    -1, 500
  );
}

// 404兜底
function notFoundHandler(_req, res) {
  errorResp(res, `API不存在: ${_req.method} ${_req.originalUrl}`, -1, 404);
}

module.exports = { asyncHandler, globalErrorHandler, notFoundHandler };
