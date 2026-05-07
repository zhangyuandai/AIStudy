/**
 * JWT Token 工具
 */
const jwt = require('jsonwebtoken');
const config = require('../config/index');

/**
 * 生成用户Token（小程序端）
 */
function signUserToken(user) {
  return jwt.sign(
    { id: user.id, openid: user.openid, role: user.is_staff ? 'staff' : 'student' },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn, subject: 'user' }
  );
}

/**
 * 生成管理员Token（PC后台）
 */
function signAdminToken(staff) {
  return jwt.sign(
    { id: staff.id, username: staff.username, role: `admin_${staff.role}` },
    config.jwt.secret,
    { expiresIn: config.jwt.adminExpiresIn, subject: 'admin' }
  );
}

/**
 * 验证并解码Token
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, config.jwt.secret);
  } catch (e) {
    if (e.name === 'TokenExpiredError') return { expired: true };
    if (e.name === 'JsonWebTokenError') return { invalid: true };
    throw e;
  }
}

module.exports = { signUserToken, signAdminToken, verifyToken };
