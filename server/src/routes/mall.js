/**
 * 商城路由 - 礼品列表/详情/下单/订单
 */
const express = require('express');
const router = express.Router();
const { userAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const { validate, schemas } = require('../middleware/validator');
const giftService = require('../services/giftService');
const orderService = require('../services/orderService');
const { success, notFound } = require('../utils/response');

// ---- 礼品列表（可公开访问）----
router.get('/gift/list',
  asyncHandler(async (req, res) => {
    const data = await giftService.getList(req.query);
    success(res, data);
  })
);

// ---- 礼品详情 ----
router.get('/gift/detail',
  asyncHandler(async (req, res) => {
    const id = parseInt(req.query.id);
    if (!id) return notFound(res, '缺少礼品ID');
    const detail = await giftService.getDetail(id);
    success(res, detail);
  })
);

// ---- 创建兑换订单（需登录）----
router.post('/order/create', userAuth,
  validate({ body: schemas.createOrder }),
  asyncHandler(async (req, res) => {
    const order = await orderService.create(req.user.id, req.body);
    success(res, order);
  })
);

// ---- 我的订单 ----
router.get('/order/list', userAuth,
  asyncHandler(async (req, res) => {
    const data = await orderService.getUserOrders(req.user.id, req.query);
    success(res, data);
  })
);

module.exports = router;
