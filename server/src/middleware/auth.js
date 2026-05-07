/**
 * 认证中间件
 * 支持 Bearer Token 验证，区分用户端和管理员端
 */
const { verifyToken } = require('../utils/token');
const { unauthorized, forbidden } = require('../utils/response');
const db = require('../config/database');

/**
 * 用户认证（小程序端）
 * 解析Token后将 user 信息挂到 req.user
 */
function userAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(res);
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (payload.expired) return unauthorized(res, '登录已过期，请重新登录');
  if (payload.invalid) return unauthorized(res, '无效的登录凭证');
  if (payload.sub !== 'user') return forbidden(res, '凭证类型不匹配');

  req.user = payload;
  next();
}

/**
 * 管理员认证（PC后台）
 */
function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized(res);
  }

  const token = authHeader.slice(7);
  const payload = verifyToken(token);

  if (payload.expired) return unauthorized(res, '管理员登录已过期');
  if (payload.invalid) return unauthorized(res, '无效的管理员凭证');
  if (!payload.role?.startsWith('admin_')) return forbidden(res, '非管理员账号');

  req.admin = payload;
  next();
}

/**
 * 角色权限校验
 * @param {...string} allowedRoles - 允许的角色列表，如 'admin_admin', 'admin_coach'
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.admin) return unauthorized(res);
    if (!allowedRoles.includes(req.admin?.role)) {
      return forbidden(res, '需要更高权限');
    }
    next();
  };
}

/**
 * 可选认证（有Token就解析，没有也放行）
 * 用于首页等不需要登录但登录后有个性化内容的场景
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = verifyToken(token);
    if (!payload.expired && !payload.invalid && payload.id) {
      req.user = payload;
    }
  }
  next();
}

module.exports = { userAuth, adminAuth, requireRole, optionalAuth };
