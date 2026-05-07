/**
 * 简易日志工具（生产可用，开发友好）
 */
const config = require('../config');

const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const levelNum = levels[config.logLevel] ?? levels.info;

function log(level, ...args) {
  if (levels[level] <= levelNum) {
    const ts = new Date().toLocaleString('zh-CN', { hour12: false });
    const prefix = `[${ts}] [${level.toUpperCase()}]`;
    switch (level) {
      case 'error': console.error(prefix, ...args); break;
      case 'warn':  console.warn(prefix, ...args); break;
      default:     console.log(prefix, ...args); break;
    }
  }
}

module.exports = {
  error: (...a) => log('error', ...a),
  warn:  (...a) => log('warn', ...a),
  info:  (...a) => log('info', ...a),
  debug: (...a) => log('debug', ...a),
};
