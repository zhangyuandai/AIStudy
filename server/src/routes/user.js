/**
 * 用户路由 - 个人信息、积分账户、排行榜、任务
 */
const express = require('express');
const router = express.Router();
const { userAuth } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');
const userService = require('../services/userService');
const pointsService = require('../services/pointsService');
const db = require('../config/database');
const { success, notFound } = require('../utils/response');
const dayjs = require('dayjs');

// ---- 个人信息 ----
router.get('/profile', userAuth,
  asyncHandler(async (req, res) => {
    const profile = await userService.getProfile(req.user.id);
    // 拼接等级信息
    const account = await pointsService.getAccount(req.user.id);
    success(res, { ...profile, ...{ level: account.level, total_points_earned: account.total_earned } });
  })
);

// 更新个人信息
router.put('/profile', userAuth,
  asyncHandler(async (req, res) => {
    const updated = await userService.updateProfile(req.user.id, req.body);
    success(res, updated);
  })
);

// ---- 积分账户 ----
router.get('/points/account', userAuth,
  asyncHandler(async (req, res) => {
    const account = await pointsService.getAccount(req.user.id);
    success(res, account);
  })
);

// ---- 积分流水 ----
router.get('/points/history', userAuth,
  asyncHandler(async (req, res) => {
    const data = await pointsService.getHistory(req.user.id, req.query);
    success(res, data);
  })
);

// ---- 排行榜（公开，无需登录）----
router.get('/ranking/list',
  asyncHandler(async (req, res) => {
    const list = await db.query(
      `SELECT u.id as user_id, u.nickname, u.avatar_url,
              p.total_earned as total_points, p.level
       FROM sc_points_account p JOIN sc_user u ON p.user_id = u.id
       WHERE u.status=1 ORDER BY p.total_earned DESC LIMIT 50`
    );
    const levelNames = { 1:'青铜滑手',2:'白银骑士',3:'黄金大神',4:'钻石传奇' };
    let myRank = null;
    const enriched = list.map((row, idx) => ({
      rank: idx + 1,
      nickname: row.nickname,
      avatar: row.avatar_url || '/assets/icons/default-avatar.png',
      total_points: row.total_earned,
      level: row.level,
      level_name: levelNames[row.level] ?? '未知',
      is_me: row.user_id === req?.user?.id,
    }));
    if (req.user) {
      myRank = list.findIndex(r => r.user_id === req.user.id) + 1 || null;
      if (!myRank && req.user.id) {
        const me = await db.queryOne(
          'SELECT COUNT(*)+1 as rank FROM sc_points_account WHERE total_earned > (SELECT total_earned FROM sc_points_account WHERE user_id=?)',
          [req.user.id]
        );
        myRank = me?.rank;
      }
    }
    success(res, { list: enriched, my_rank: myRank });
  })
);

// ---- 今日任务 ----
router.get('/task/today', userAuth,
  asyncHandler(async (req, res) => {
    const today = dayjs().format('YYYY-MM-DD');
    const tasks = await db.query(
      'SELECT * FROM sc_task WHERE status = 1 ORDER BY sort_order'
    );
    const checkinDone = !!(await db.queryOne(
      'SELECT id FROM sc_checkin WHERE user_id = ? AND checkin_date = ?', [req.user.id, today]
    ));
    const processed = tasks.map(t => ({
      task_id: t.id,
      title: t.title,
      desc: t.desc_text,
      icon: t.icon,
      points_reward: t.points_reward,
      is_completed: t.task_type === 'checkin' ? checkinDone : false,
    }));
    success(res, processed);
  })
);

// ---- 绑定手机号 ----
router.post('/bind-phone', userAuth,
  asyncHandler(async (req, res) => {
    const { phone } = req.body;
    if (!/^1\d{10}$/.test(phone)) return notFound(res, '手机号格式不正确');
    await userService.bindPhone(req.user.id, phone);
    success(res, true);
  })
);

module.exports = router;
