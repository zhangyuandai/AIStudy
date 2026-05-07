/**
 * 参数校验中间件
 * 使用 Joi schema 进行请求体/查询参数校验
 */

const Joi = require('joi');
const { badRequest } = require('../utils/response');

/**
 * 创建验证中间件
 * @param {Object} schema - { body?, query?, params? }
 * @param {Object} options - Joi options
 */
function validate(schema, options = {}) {
  return (req, res, next) => {
    let errors = [];

    if (schema.body) {
      const { error } = schema.body.validate(req.body, { abortEarly: false, ...options });
      if (error) errors.push(...error.details.map(d => `${d.path.join('.')}: ${d.message}`));
    }
    if (schema.query) {
      const { error } = schema.query.validate(req.query, { abortEarly: false, ...options });
      if (error) errors.push(...error.details.map(d => `${d.path.join('.')}: ${d.message}`));
    }
    if (schema.params) {
      const { error } = schema.params.validate(req.params, { abortEarly: false, ...options });
      if (error) errors.push(...error.details.map(d => `${d.path.join('.')}: ${d.message}`));
    }

    if (errors.length > 0) {
      return badRequest(res, errors.join('; '));
    }
    next();
  };
}

// 常用校验规则复用
const schemas = {
  // 分页
  pagination: Joi.object({
    page: Joi.number().min(1).default(1),
    pageSize: Joi.number().min(1).max(100).default(20),
  }),

  // 微信登录
  wxLogin: Joi.object({
    code: Joi.string().required().messages({ 'any.required': '缺少code参数' }),
  }),

  // 管理员登录
  adminLogin: Joi.object({
    username: Joi.string().required(),
    password: Joi.string().min(4).max(64).required(),
  }),

  // 签到
  checkin: Joi.object({
    student_id: Joi.number().positive().required().messages({ 'any.required': '缺少学员ID' }),
    course_name: Joi.string().max(64).allow('').default(''),
  }),

  // 调账
  adjustPoints: Joi.object({
    student_id: Joi.number().positive().required(),
    amount: Joi.number().not(0).required().messages({ 'any.required': '调账金额不能为0' }),
    reason: Joi.string().min(5).max(256).required().messages({ 'any.required': '原因说明至少5个字' }),
  }),

  // 创建订单
  createOrder: Joi.object({
    gift_id: Joi.number().positive().required(),
    receiver_name: Joi.string().max(32).required(),
    receiver_phone: Joi.string().pattern(/^1\d{10}$/).required().messages({ 'string.pattern.base': '手机号格式不正确' }),
    receiver_address: Joi.string().max(256).allow('').default(''),
    remark: Joi.string().max(256).allow('').default(''),
  }),

  // 发货
  shipOrder: Joi.object({
    order_no: Joi.string().max(32).required(),
    express_company: Joi.string().max(32).required(),
    tracking_number: Joi.string().max(64).required(),
  }),

  // 礼品CRUD
  giftForm: Joi.object({
    name: Joi.string().max(128).required(),
    category_code: Joi.string().max(32).required(),
    points_price: Joi.number().min(0).required(),
    original_price: Joi.number().min(0).default(0),
    stock_count: Joi.number().min(-1).default(0),
    limit_per_user: Joi.number().min(1).default(1),
    gift_type: Joi.string().valid('physical','virtual','voucher').default('physical'),
    description: Joi.string().allow('', null).default(''),
    exchange_notice: Joi.string().max(512).allow('').default(''),
    cover_image_url: Joi.string().max(512).allow('').default(''),
    status: Joi.number().valid(0, 1).default(1),
    sort_order: Joi.number().default(0),
  }),

  // 店员管理
  staffForm: Joi.object({
    real_name: Joi.string().max(32).required(),
    phone: Joi.string().pattern(/^1\d{10}$/).required(),
    role: Joi.string().valid('admin','coach','receptionist').default('receptionist'),
    remark: Joi.string().max(256).allow('').default(''),
  }),
};

module.exports = { validate, schemas };
