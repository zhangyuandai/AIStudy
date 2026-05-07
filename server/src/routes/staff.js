/**
 * 店员端路由 - 签到/调账/发货/工作台
 */
const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth'); // 店员也用admin token（或可用userAuth + is_staff判断）
const { asyncHandler } = require('../middleware/errorHandler');
const { validate, schemas } = require('../middleware/validator');
const checkinService = require('../services/checkinService');
const staffService = require('../services/staffService');
const orderService = require('../services/orderService');
const pointsService = require('../services/pointsService');
const { success } = require('../utils/response');

// ---- 工作台统计 ----
router.get('/dashboard/stats', adminAuth,
  asyncHandler(async (req, res) => {
    const stats = await staffService.dashboardStats();
    success(res, stats);
  })
);

// ---- 学员搜索 ----
router.get('/student/list', adminAuth,
  asyncHandler(async (req, res) => {
    const data = await checkinService.searchStudents(req.query.keyword, req.query.page, req.query.pageSize);
    success(res, data);
  })
);

// ---- 执行签到 ----
router.post('/checkin', adminAuth,
  validate({ body: schemas.checkin }),
  asyncHandler(async (req, res) => {
    const result = await checkinService.checkIn(
      req.body.student_id, req.body.course_name, req.admin.id
    );
    success(res, result);
  })
);

// ---- 今日签到记录 ----
router.get('/checkin/today', adminAuth,
  asyncHandler(async (req, res) => {
    const data = await checkinService.getTodayList(req.query);
    success(res, data);
  })
);

// ---- 手动调账 ----
router.post('/points/adjust', adminAuth,
  validate({ body: schemas.adjustPoints }),
  asyncHandler(async (req, res) => {
    const result = await pointsService.adjustByStaff(
      req.admin.id, req.body.student_id, req.body.amount, req.body.reason
    );
    success(res, result);
  })
);

// ---- 待处理订单 ----
router.get('/order/pending', adminAuth,
  asyncHandler(async (req, res) => {
    const data = await orderService.getPending(req.query);
    success(res, data);
  })
);

// ---- 发货 ----
router.post('/order/ship', adminAuth,
  validate({ body: schemas.shipOrder }),
  asyncHandler(async (req, res) => {
    const result = await orderService.ship(req.body.order_no, req.body.express_company, req.body.tracking_number);
    success(res, result);
  })
);

module.exports = router;
