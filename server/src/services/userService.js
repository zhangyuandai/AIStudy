/**
 * 用户服务 - 注册、登录、信息查询
 */
const db = require('../config/database');
const { signUserToken } = require('../utils/token');
const logger = require('../utils/logger');
const https = require('https');

// 微信错误码映射
const WX_ERROR_MAP = {
  '-1':              { msg: '微信系统繁忙，请稍后重试', retry: true },
  '40013':           { msg: '无效的 AppID', retry: false },
  '40029':           { msg: '无效的 code', retry: false },
  '45011':           { msg: 'API 频率限制，请稍后重试', retry: true },
  '40163':           { msg: 'code 已被使用（重复提交）', retry: false },
  '40226':           { msg: '高风险等级，用户需手机号验证', retry: false },
  '1004':            { msg: '应用已下架', retry: false },
};

class UserService {
  /**
   * 微信登录：code → session_key + openid → 查找或创建用户
   *
   * 流程:
   *   1. 用 code 调用 wx.code2Session 换取 openid (+ session_key)
   *   2. 根据 openid 查找用户，不存在则注册
   *   3. 签发 JWT Token 返回
   *
   * 开发模式：若未配置 WX_APP_ID，自动走模拟登录（方便本地开发）
   */
  async wxLogin(code) {
    if (!code || typeof code !== 'string') {
      throw { message: '缺少登录凭证 code', code: -1, statusCode: 400 };
    }

    const config = require('../config/index').wechat;
    let openid, unionid;

    // ===== 真实微信接口调用 =====
    if (config.appId && config.appSecret) {
      const wxData = await this._callCode2Session(config.appId, config.appSecret, code);
      openid = wxData.openid;
      unionid = wxData.unionid || '';
      logger.info(`[UserService] 微信登录成功 openid=${openid}`);
    } else {
      // ===== 开发模式模拟 =====
      logger.warn('[UserService] ⚠️ 未配置微信 AppID/AppSecret，使用开发模式模拟登录');
      openid = `dev_${Date.now()}_${code.slice(0, 6)}`;
      // 开发模式下每次生成新 openid（方便测试多用户场景）
      // 如需固定测试用户，可用 code === 'test_user_1' 等特殊值
    }

    // 查找或创建用户
    let user = await db.queryOne('SELECT * FROM sc_user WHERE openid = ?', [openid]);

    if (!user) {
      const result = await db.query(
        'INSERT INTO sc_user (openid, nickname, avatar_url) VALUES (?, ?, ?)',
        [openid, `滑板用户${Math.floor(Math.random() * 10000)}`, '']
      );
      user = await db.queryOne('SELECT * FROM sc_user WHERE id = ?', [result.insertId]);
      logger.info(`[UserService] 新用户注册: id=${user.id}, openid=${openid}`);

      // 创建积分账户
      await this._initPointsAccount(user.id);
    } else {
      // 更新最后登录时间
      await db.query('UPDATE sc_user SET last_login_at = NOW() WHERE id = ?', [user.id]);
    }

    const token = signUserToken(user);
    return {
      token,
      user: {
        user_id: String(user.id).padStart(12, 'U'),
        openid: user.openid,
        nickname: user.nickname,
        avatar_url: user.avatar_url,
        phone: user.phone ? `${user.phone.slice(0, 3)}****${user.phone.slice(-4)}` : '',
        real_name: user.real_name,
        level: (await this._getUserLevel(user.id)).level,
        total_points_earned: (await this._getPointsAccount(user.id)).total_earned || 0,
      },
    };
  }

  /**
   * 获取用户完整Profile
   */
  async getProfile(userId) {
    const user = await db.queryOne('SELECT id, openid, nickname, avatar_url, phone, real_name, gender, is_staff, created_at FROM sc_user WHERE id = ?', [userId]);
    if (!user) throw { message: '用户不存在', code: 404 };
    return user;
  }

  /**
   * 绑定手机号
   */
  async bindPhone(userId, phone) {
    // 检查手机号是否已被绑定
    const existing = await db.queryOne('SELECT id FROM sc_user WHERE phone = ? AND id != ?', [phone, userId]);
    if (existing) throw { message: '该手机号已绑定其他账号', code: 409 };

    await db.query('UPDATE sc_user SET phone = ? WHERE id = ?', [phone, userId]);
    logger.info(`[UserService] 用户${userId}绑定手机号: ${phone}`);
    return true;
  }

  /**
   * 更新昵称/头像等基本信息
   */
  async updateProfile(userId, data) {
    const fields = [];
    const values = [];
    if (data.nickname !== undefined) { fields.push('nickname=?'); values.push(data.nickname); }
    if (data.avatar_url !== undefined) { fields.push('avatar_url=?'); values.push(data.avatar_url); }
    if (data.real_name !== undefined) { fields.push('real_name=?'); values.push(data.real_name); }
    if (data.gender !== undefined) { fields.push('gender=?'); values.push(data.gender); }

    if (fields.length > 0) {
      values.push(userId);
      await db.query(`UPDATE sc_user SET ${fields.join(',')} WHERE id=?`, values);
    }
    return this.getProfile(userId);
  }

  /**
   * 初始化积分账户（新用户）
   */
  async _initPointsAccount(userId) {
    const config = await this.getRegisterReward();
    await db.query(
      'INSERT INTO sc_points_account (user_id, available_points, total_earned) VALUES (?, ?, ?)',
      [userId, config.points, config.points]
    );
    // 记录流水
    await db.query(
      'INSERT INTO sc_points_record (user_id, type, amount, balance_after, source, source_detail, remark) VALUES (?, "income", ?, ?, "register_bonus", ?, ?)',
      [userId, config.points, config.points, `REG-${Date.now()}`, '新人注册奖励']
    );
  }

  /**
   * 获取积分账户
   */
  async _getPointsAccount(userId) {
    return await db.queryOne(
      'SELECT * FROM sc_points_account WHERE user_id = ?',
      [userId]
    );
  }

  /**
   * 获取用户等级
   */
  async _getUserLevel(userId) {
    const account = await this._getPointsAccount(userId);
    if (!account) return { level: 1, level_name: '青铜滑手', progress: 0, points_to_next: 500 };

    const levels = [
      { min: 0, name: '青铜滑手' },
      { min: 500, name: '白银骑士' },
      { min: 2000, name: '黄金大神' },
      { min: 5000, name: '钻石传奇' },
    ];
    let lv = 1;
    for (let i = levels.length - 1; i >= 0; i--) {
      if (account.total_earned >= levels[i].min) { lv = i + 1; break; }
    }
    const current = levels[lv - 1];
    const next = levels[lv];
    const range = next ? next.min - current.min : current.min;
    const earnedInLevel = next ? account.total_earned - current.min : 0;

    return {
      level: lv,
      level_name: current.name,
      progress: next ? Math.floor((earnedInLevel / range) * 100) : 100,
      points_to_next: next ? next.min - account.total_earned : 0,
    };
  }

  /** 获取注册奖励配置 */
  async getRegisterReward() {
    const row = await db.queryOne("SELECT CAST(config_value AS UNSIGNED) as points FROM sc_system_config WHERE group_key='points' AND config_key='register_reward'");
    return { points: parseInt(row?.points || 50) };
  }

  /**
   * 调用微信 code2Session 接口
   * @param {string} appid
   * @param {string} secret
   * @param {string} code
   * @returns {{ openid: string, session_key: string, unionid?: string }}
   */
  _callCode2Session(appid, secret, code) {
    const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${encodeURIComponent(appid)}&secret=${encodeURIComponent(secret)}&js_code=${encodeURIComponent(code)}&grant_type=authorization_code`;

    return new Promise((resolve, reject) => {
      https.get(url, { timeout: 10000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            // 微信返回错误
            if (json.errcode) {
              const errInfo = WX_ERROR_MAP[String(json.errcode)] || { msg: json.errmsg || '微信登录失败', retry: false };
              logger.error(`[WX] code2Session 错误: ${json.errcode} - ${errInfo.msg}`);
              reject({
                message: errInfo.msg,
                code: 'WX_' + String(json.errcode),
                statusCode: 400,
                wxErrcode: json.errcode,
                retryable: errInfo.retry,
              });
              return;
            }
            // 正常返回 openid + session_key
            if (!json.openid) {
              logger.error('[WX] code2Session 返回无 openid:', data.slice(0, 200));
              reject({ message: '微信登录失败：未获取到用户标识', code: -1, statusCode: 500 });
              return;
            }
            resolve({
              openid: json.openid,
              session_key: json.session_key,
              unionid: json.unionid || '',
            });
          } catch (e) {
            logger.error('[WX] code2Session 解析失败:', e.message);
            reject({ message: '微信服务异常', code: -1, statusCode: 502 });
          }
        });
      }).on('error', (err) => {
        logger.error('[WX] code2Session 网络请求失败:', err.message);
        reject({ message: '微信服务连接失败', code: -1, statusCode: 503, retryable: true });
      }).on('timeout', () => {
        logger.error('[WX] code2Session 请求超时');
        reject({ message: '微信服务响应超时', code: -1, statusCode: 504, retryable: true });
      });
    });
  }
}

module.exports = new UserService();
