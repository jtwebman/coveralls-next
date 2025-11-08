'use strict';

/**
 * Creates a logger instance with configurable log level
 * Log level determined by --verbose flag or NODE_COVERALLS_DEBUG environment variable
 * @param {Object} [options] - Optional configuration options
 * @param {boolean} [options.verbose] - Enable verbose/debug logging
 * @returns {Object} Logger object with error, warn, info, debug methods and level property
 * @returns {string} returns.level - Current log level ('error', 'warn', 'info', or 'debug')
 * @returns {Function} returns.error - Logs error messages (always enabled)
 * @returns {Function} returns.warn - Logs warnings (enabled at warn level and above)
 * @returns {Function} returns.info - Logs info messages (enabled at info level and above)
 * @returns {Function} returns.debug - Logs debug messages (only enabled at debug level)
 */
module.exports = (options = {}) => {
  const level = getLogLevel(options);
  const levels = { error: 0, warn: 1, info: 2, debug: 3 };
  const currentLevel = levels[level] || 0;

  return {
    level,
    error: (...args) => currentLevel >= 0 && console.error(...args),
    warn: (...args) => currentLevel >= 1 && console.warn(...args),
    info: (...args) => currentLevel >= 2 && console.info(...args),
    debug: (...args) => currentLevel >= 3 && console.log(...args),
  };
};

/**
 * Determines the appropriate log level based on options and environment
 * @param {Object} options - Configuration options
 * @param {boolean} [options.verbose] - Enable verbose/debug logging
 * @returns {string} Log level: 'debug' if verbose mode enabled, otherwise 'error'
 * @private
 */
function getLogLevel(options) {
  if (
    options.verbose ||
    process.env.NODE_COVERALLS_DEBUG === 1 ||
    process.env.NODE_COVERALLS_DEBUG === '1'
  ) {
    return 'debug';
  }

  return 'error';
}
