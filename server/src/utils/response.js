/**
 * 统一 API 响应封装
 * 所有接口返回格式: { code, message, data }
 */

const success = (res, data = null, message = 'ok', statusCode = 200) => {
  return res.status(statusCode).json({ code: 0, message, data });
};

const error = (res, message = '服务器内部错误', code = -1, statusCode = 500) => {
  return res.status(statusCode).json({ code, message, data: null });
};

const paginate = (res, list, total, page = 1, pageSize = 20) => {
  return success(res, {
    list,
    pagination: {
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages: Math.ceil(total / pageSize),
    },
  });
};

const notFound = (res, message = '资源不存在') => {
  return error(res, message, 404, 404);
};

const unauthorized = (res, message = '未登录或登录已过期') => {
  return error(res, message, 401, 401);
};

const forbidden = (res, message = '无权限访问此资源') => {
  return error(res, message, 403, 403);
};

const badRequest = (res, message = '请求参数错误') => {
  return error(res, message, 400, 400);
};

module.exports = { success, error, paginate, notFound, unauthorized, forbidden, badRequest };
