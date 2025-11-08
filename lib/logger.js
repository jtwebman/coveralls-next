'use strict';

const index = require('..');

module.exports = () => {
  const level = getLogLevel();
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

function getLogLevel() {
  if (
    index.options.verbose ||
    process.env.NODE_COVERALLS_DEBUG === 1 ||
    process.env.NODE_COVERALLS_DEBUG === '1'
  ) {
    return 'debug';
  }

  return 'error';
}
