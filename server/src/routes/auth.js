/**
 * 认证路由 - 微信登录 + 管理员登录
 */
const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { validate, schemas } = require('../middleware/validator');
const userService = require('../services/userService');
const staffService = require('../services/staffService');
const { success, badRequest, error: errResp } = require('../utils/response');

// ---- 小程序微信登录 ----
router.post('/login',
  validate({ body: schemas.wxLogin }),
  asyncHandler(async (req, res) => {
    const result = await userService.wxLogin(req.body.code);
    success(res, result);
  })
);

// ---- 管理员登录 ----
router.post('/admin/login',
  validate({ body: schemas.adminLogin }),
  asyncHandler(async (req, res) => {
    const result = await staffService.login(req.body.username, req.body.password);
    success(res, result);
  })
);

module.exports = router;
