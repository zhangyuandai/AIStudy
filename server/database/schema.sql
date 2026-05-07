-- ============================================================
--  滑板公社 (SkateClub) 数据库 Schema v1.0
--  引擎: InnoDB / 字符集: utf8mb4 / 排序: utf8mb4_general_ci
--  适用: MySQL 8.0+
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------
--  1. 用户表（学员/会员）
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `sc_user`;
CREATE TABLE `sc_user` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `openid`          VARCHAR(64)     NOT NULL DEFAULT '' COMMENT '微信OpenID',
  `unionid`         VARCHAR(64)     NOT NULL DEFAULT '' COMMENT '微信UnionID',
  `phone`           VARCHAR(20)     NOT NULL DEFAULT '' COMMENT '手机号(加密)',
  `nickname`        VARCHAR(64)     NOT NULL DEFAULT '' COMMENT '昵称',
  `avatar_url`      VARCHAR(512)    NOT NULL DEFAULT '' COMMENT '头像URL',
  `real_name`       VARCHAR(32)     NOT NULL DEFAULT '' COMMENT '真实姓名',
  `gender`          TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '性别 0未知 1男 2女',
  `status`          TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '状态 0禁用 1正常 2注销',
  `is_staff`        TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否店员 0否 1是',
  `inviter_id`      BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '邀请人用户ID',
  `last_login_at`   DATETIME        NULL DEFAULT NULL COMMENT '最后登录时间',
  `created_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`      DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_openid` (`openid`),
  UNIQUE KEY `uk_phone` (`phone`),
  KEY `idx_nickname` (`nickname`),
  KEY `idx_inviter` (`inviter_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='用户表';

-- -----------------------------------------------------------
--  2. 积分账户表
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `sc_points_account`;
CREATE TABLE `sc_points_account` (
  `id`                  BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`             BIGINT UNSIGNED NOT NULL COMMENT '关联用户ID',
  `available_points`    INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '可用积分',
  `frozen_points`       INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '冻结积分(订单待发货)',
  `total_earned`        INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '累计获得',
  `total_spent`         INT UNSIGNED    NOT NULL DEFAULT 0 COMMENT '累计消费',
  `level`               TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '等级 1青铜 2白银 3黄金 4钻石',
  `streak_days`         SMALLINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '连续签到天数',
  `last_checkin_date`   DATE            NULL DEFAULT NULL COMMENT '最后签到日期',
  `created_at`          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`          DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  CONSTRAINT `fk_pa_user` FOREIGN KEY (`user_id`) REFERENCES `sc_user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='积分账户';

-- -----------------------------------------------------------
--  3. 积分流水表（核心审计表）
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `sc_points_record`;
CREATE TABLE `sc_points_record` (
  `id`              BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`         BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `type`            ENUM('income','expense','adjust','expire') NOT NULL COMMENT '流水类型',
  `amount`          INT NOT NULL COMMENT '变动金额(正增负扣)',
  `balance_after`   INT NOT NULL DEFAULT 0 COMMENT '变动后余额',
  `source`          VARCHAR(32)  NOT NULL DEFAULT '' COMMENT '来源枚举',
  `source_detail`   VARCHAR(64)  NOT NULL DEFAULT '' COMMENT '关联业务单号',
  `operator_id`     BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '操作人(0=系统/调账=店员)',
  `remark`          VARCHAR(256) NOT NULL DEFAULT '' COMMENT '备注',
  `created_at`      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_time` (`user_id`, `created_at` DESC),
  KEY `idx_source`   (`source`, `source_detail`),
  CONSTRAINT `fk_pr_user` FOREIGN KEY (`user_id`) REFERENCES `sc_user`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='积分流水';

-- -----------------------------------------------------------
--  4. 商品分类表
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `sc_gift_category`;
CREATE TABLE `sc_gift_category` (
  `id`          TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `code`        VARCHAR(32)  NOT NULL DEFAULT '' COMMENT '分类编码',
  `name`        VARCHAR(32)  NOT NULL DEFAULT '' COMMENT '分类名称',
  `icon_url`    VARCHAR(256) NOT NULL DEFAULT '' COMMENT '分类图标',
  `sort_order`  TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '排序权重',
  `status`      TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1启用 0停用',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='商品分类';

-- -----------------------------------------------------------
--  5. 礼品/商品表
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `sc_gift`;
CREATE TABLE `sc_gift` (
  `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `category_code`     VARCHAR(32)  NOT NULL DEFAULT '' COMMENT '分类编码',
  `name`              VARCHAR(128) NOT NULL DEFAULT '' COMMENT '商品名称',
  `cover_image_url`   VARCHAR(512) NOT NULL DEFAULT '' COMMENT '封面图',
  `detail_images`     JSON          NULL COMMENT '详情图数组JSON',
  `points_price`      INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '积分单价',
  `original_price`    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '原价(分)',
  `stock_count`       INT          NOT NULL DEFAULT 0 COMMENT '库存(-1=无限)',
  `limit_per_user`    TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '每人限兑数量',
  `gift_type`         ENUM('physical','virtual','voucher') NOT NULL DEFAULT 'physical' COMMENT '实物/虚拟/券码',
  `description`       TEXT         NULL COMMENT '商品描述',
  `exchange_notice`   VARCHAR(512) NOT NULL DEFAULT '' COMMENT '兑换须知',
  `exchange_count`    INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '累计兑换次数',
  `status`            TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1上架 0下架',
  `sort_order`        INT          NOT NULL DEFAULT 0 COMMENT '排序',
  `created_at`        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_category_status` (`category_code`, `status`),
  KEY `idx_sort` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='礼品商品';

-- -----------------------------------------------------------
--  6. 订单表
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `sc_order`;
CREATE TABLE `sc_order` (
  `id`                BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `order_no`          VARCHAR(32)  NOT NULL DEFAULT '' COMMENT '订单号(唯一)',
  `user_id`           BIGINT UNSIGNED NOT NULL COMMENT '下单用户',
  `gift_id`           BIGINT UNSIGNED NOT NULL COMMENT '商品ID',
  `gift_snapshot`     JSON          NOT NULL COMMENT '商品快照(JSON,防删改)',
  `points_cost`       INT UNSIGNED NOT NULL COMMENT '消耗积分',
  `status`            TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '0待发货 1已发货 2已完成 3已取消',
  `receiver_name`     VARCHAR(32)  NOT NULL DEFAULT '' COMMENT '收货人',
  `receiver_phone`    VARCHAR(20)  NOT NULL DEFAULT '' COMMENT '收货电话',
  `receiver_address`  VARCHAR(256) NOT NULL DEFAULT '' COMMENT '收货地址',
  `express_company`   VARCHAR(32)  NOT NULL DEFAULT '' COMMENT '快递公司',
  `tracking_number`   VARCHAR(64)  NOT NULL DEFAULT '' COMMENT '运单号',
  `shipped_at`        DATETIME      NULL DEFAULT NULL COMMENT '发货时间',
  `completed_at`      DATETIME      NULL DEFAULT NULL COMMENT '完成时间',
  `remark`            VARCHAR(256) NOT NULL DEFAULT '' COMMENT '买家备注',
  `created_at`        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_user_status` (`user_id`, `status`),
  KEY `idx_created` (`created_at` DESC),
  CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `sc_user`(`id`),
  CONSTRAINT `fk_order_gift` FOREIGN KEY (`gift_id`) REFERENCES `sc_gift`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='兑换订单';

-- -----------------------------------------------------------
--  7. 签到记录表
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `sc_checkin`;
CREATE TABLE `sc_checkin` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`       BIGINT UNSIGNED NOT NULL COMMENT '签到学员',
  `course_name`   VARCHAR(64)  NOT NULL DEFAULT '' COMMENT '课程名(可选填)',
  `operator_id`   BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '操作店员ID(0=自助)',
  `points_earned` INT UNSIGNED NOT NULL DEFAULT 10 COMMENT '本次获得积分',
  `checkin_date`  DATE         NOT NULL COMMENT '签到日期',
  `checkin_time`  TIME         NULL DEFAULT NULL COMMENT '签到时间',
  `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_date` (`user_id`, `checkin_date`) COMMENT '每人每天只能签一次',
  KEY `idx_date` (`checkin_date` DESC),
  KEY `idx_operator` (`operator_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='签到记录';

-- -----------------------------------------------------------
--  8. 店员/管理员表
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `sc_staff`;
CREATE TABLE `sc_staff` (
  `id`            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id`       BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '关联sc_user.id(0=纯后台账号)',
  `username`      VARCHAR(32)  NOT NULL DEFAULT '' COMMENT '登录账号(通常为手机号)',
  `password_hash` VARCHAR(128) NOT NULL DEFAULT '' COMMENT '密码哈希(bcrypt)',
  `real_name`     VARCHAR(32)  NOT NULL DEFAULT '' COMMENT '姓名',
  `avatar_url`    VARCHAR(256) NOT NULL DEFAULT '' COMMENT '头像',
  `role`          ENUM('admin','coach','receptionist') NOT NULL DEFAULT 'receptionist' COMMENT '管理员/教练/前台',
  `status`        TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1启用 0禁用',
  `login_count`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '登录次数',
  `last_login_at` DATETIME      NULL DEFAULT NULL,
  `remark`        VARCHAR(256) NOT NULL DEFAULT '' COMMENT '备注',
  `created_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  KEY `idx_role_status` (`role`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='店员/管理员';

-- -----------------------------------------------------------
--  9. 系统配置表 (KV)
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `sc_system_config`;
CREATE TABLE `sc_system_config` (
  `id`          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `group_key`   VARCHAR(32)  NOT NULL DEFAULT '' COMMENT '配置分组',
  `config_key`  VARCHAR(64)  NOT NULL DEFAULT '' COMMENT '配置键',
  `config_value` TEXT        NOT NULL COMMENT '配置值(JSON或字符串)',
  `remark`      VARCHAR(256) NOT NULL DEFAULT '' COMMENT '说明',
  `updated_by`  BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '最后更新人',
  `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_group_key` (`group_key`, `config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='系统配置(KV)';

-- -----------------------------------------------------------
--  10. 任务配置表
-- -----------------------------------------------------------
DROP TABLE IF EXISTS `sc_task`;
CREATE TABLE `sc_task` (
  `id`              TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `title`           VARCHAR(64)  NOT NULL DEFAULT '' COMMENT '任务标题',
  `desc_text`       VARCHAR(256) NOT NULL DEFAULT '' COMMENT '任务描述',
  `icon`            VARCHAR(16)  NOT NULL DEFAULT '' COMMENT '图标emoji',
  `points_reward`   INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '奖励积分(0表示无奖励)',
  `task_type`       VARCHAR(32)  NOT NULL DEFAULT '' COMMENT '任务类型(用于前端判断完成条件)',
  `trigger_type`    ENUM('daily','once','custom') NOT NULL DEFAULT 'daily' COMMENT '每日/一次性/自定义',
  `sort_order`      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  `status`          TINYINT UNSIGNED NOT NULL DEFAULT 1 COMMENT '1启用 0停用',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='每日任务配置';

-- ============================================================
--  初始数据：分类 + 默认配置 + 默认任务
-- ============================================================

INSERT INTO `sc_gift_category` (`code`,`name`,`icon_url`,`sort_order`) VALUES
  ('equipment',   '装备配件', '', 100),
  ('voucher',     '体验券',   '', 80),
  ('course',      '课程课时', '', 60),
  ('limited',     '限量周边', '', 50);

INSERT INTO `sc_system_config` (`group_key`,`config_key`,`config_value`,`remark`) VALUES
  ('points', 'lesson_checkin',    '10',   '正课签到积分'),
  ('points', 'trial_checkin',     '5',    '体验课签到积分'),
  ('points', 'streak_3_bonus',    '20',   '连续3天额外奖励'),
  ('points', 'streak_7_bonus',    '80',   '连续7天额外奖励'),
  ('points', 'register_reward',   '50',   '新人注册奖励'),
  ('points', 'invite_reward',     '30',   '邀请奖励'),
  ('points', 'first_exchange',    '10',   '首次兑换奖励'),
  ('points', 'max_staff_adjust',  '500',  '店员单次调账上限'),
  ('points', 'expiry_policy',     'never','过期策略: never/yearly/custom'),
  ('points', 'expiry_days',       '365',  '自定义过期天数'),
  ('points', 'level_1_min',       '0',    '青铜门槛'),
  ('points', 'level_2_min',       '500',  '白银门槛'),
  ('points', 'level_3_min',       '2000', '黄金门槛'),
  ('points', 'level_4_min',       '5000', '钻石门槛'),
  ('mall',   'enabled',           'true', '商城开关'),
  ('mall',   'daily_limit',       '5',    '每日兑换上限'),
  ('mall',   'default_shipping',  '0',    '默认运费(分)'),
  ('system', 'store_name',        '滑板公社', '店铺名称'),
  ('system', 'checkin_start',     '08:00', '签到时间范围开始'),
  ('system', 'checkin_end',       '22:00', '签到时间范围结束');

INSERT INTO `sc_task` (`title`,`desc_text`,`icon`,`points_reward`,`task_type`,`trigger_type`) VALUES
  ('完成今日签到',     '到店上课并完成签到可获得积分',    '✅', 10, 'checkin',    'daily'),
  ('浏览积分商城',     '去商城看看有什么好东西吧',         '🛒', 0,  'mall_view',  'daily'),
  ('首次兑换礼品',     '使用积分兑换任意一件礼品',          '🎁', 10, 'first_exchange', 'once');

SET FOREIGN_KEY_CHECKS = 1;
