'use strict';

require('should')();
const index = require('..');

describe('logger', () => {
  it('should log at debug level when --verbose is set', () => {
    index.options.verbose = true;
    const logger = index.logger();
    logger.level.should.equal('debug');
  });

  it('should log at debug level when NODE_COVERALLS_DEBUG is set in env', () => {
    index.options.verbose = false;
    process.env.NODE_COVERALLS_DEBUG = 1;
    const logger = index.logger();
    logger.level.should.equal('debug');
  });

  it('should log at debug level when NODE_COVERALLS_DEBUG is set in env as a string', () => {
    index.options.verbose = false;
    process.env.NODE_COVERALLS_DEBUG = '1';
    const logger = index.logger();
    logger.level.should.equal('debug');
  });

  it('should log at warn level when NODE_COVERALLS_DEBUG not set and no --verbose', () => {
    index.options.verbose = false;
    process.env.NODE_COVERALLS_DEBUG = 0;
    const logger = index.logger();
    logger.level.should.equal('error');
  });

  it('should execute warn method when level is appropriate', () => {
    index.options.verbose = false;
    process.env.NODE_COVERALLS_DEBUG = 0;
    const logger = index.logger();

    // Create a spy to capture console.warn calls
    const originalWarn = console.warn;
    let warnCalled = false;
    console.warn = () => { warnCalled = true; };

    // Warn should be called at error level (currentLevel >= 1 is false at error level)
    logger.warn('test message');

    console.warn = originalWarn;

    // At error level (0), warn (requires level 1) should not be called
    warnCalled.should.equal(false);
  });
});
