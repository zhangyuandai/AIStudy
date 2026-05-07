/**
 * 系统配置服务
 */
const db = require('../config/database');

class ConfigService {
  /**
   * 按分组获取所有配置
   */
  async getByGroup(groupKey) {
    const rows = await db.query(
      'SELECT config_key, config_value, remark FROM sc_system_config WHERE group_key = ? ORDER BY id',
      [groupKey]
    );
    const obj = {};
    rows.forEach(r => { obj[r.config_key] = r.config_value; });
    return obj;
  }

  /**
   * 获取单个配置值
   */
  async get(groupKey, configKey) {
    const row = await db.queryOne(
      'SELECT config_value FROM sc_system_config WHERE group_key = ? AND config_key = ?',
      [groupKey, configKey]
    );
    return row?.config_value ?? null;
  }

  /**
   * 批量更新配置
   * @param {Array<{group_key, config_key, config_value}>} configs
   */
  async batchUpdate(configs, operatorId = 0) {
    for (const cfg of configs) {
      await db.query(
        'UPDATE sc_system_config SET config_value = ?, updated_by = ?, updated_at = NOW() WHERE group_key = ? AND config_key = ?',
        [cfg.config_value, operatorId, cfg.group_key, cfg.config_key]
      );
    }
  }

  /**
   * 获取全部配置（用于管理后台设置页）
   */
  async getAllConfig() {
    const groups = {};
    const rows = await db.query(
      'SELECT group_key, config_key, config_value, remark, updated_at FROM sc_system_config ORDER BY group_key, id'
    );
    rows.forEach(r => {
      if (!groups[r.group_key]) groups[r.group_key] = [];
      groups[r.group_key].push({
        key: r.config_key,
        value: r.config_value,
        remark: r.remark,
        updated_at: r.updated_at,
      });
    });
    return groups;
  }
}

module.exports = new ConfigService();
