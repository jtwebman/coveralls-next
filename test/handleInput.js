'use strict';

const fs = require('fs');
const sysPath = require('path');
require('should');
const handleInput = require('../lib/handleInput');

// Mock logger that does nothing
const mockLogger = {
  debug: () => {},
  info: () => {},
  warn: () => {},
  error: () => {},
};

describe('handleInput', () => {
  it('returns an error when there\'s an error getting options', async () => {
    const path = sysPath.join(__dirname, './fixtures/onefile.lcov');
    const input = fs.readFileSync(path, 'utf8');

    const dependencies = {
      getOptions: () => Promise.reject(new Error('some error')),
      createLogger: () => mockLogger,
    };

    await handleInput(input, {}, {}, dependencies).should.be.rejectedWith('some error');
  });

  it('returns an error when there\'s an error converting', async () => {
    const path = sysPath.join(__dirname, './fixtures/onefile.lcov');
    const input = fs.readFileSync(path, 'utf8');

    const dependencies = {
      getOptions: () => Promise.resolve({}),
      convertLcovToCoveralls: () => Promise.reject(new Error('some error')),
      createLogger: () => mockLogger,
    };

    await handleInput(input, {}, {}, dependencies).should.be.rejectedWith('some error');
  });

  it('returns an error when there\'s an error sending', async () => {
    const path = sysPath.join(__dirname, './fixtures/onefile.lcov');
    const input = fs.readFileSync(path, 'utf8');

    const dependencies = {
      getOptions: () => Promise.resolve({}),
      convertLcovToCoveralls: () => Promise.resolve({}),
      sendToCoveralls: () => Promise.reject(new Error('some error')),
      createLogger: () => mockLogger,
    };

    await handleInput(input, {}, {}, dependencies).should.be.rejectedWith('some error');
  });

  it('returns an error when there\'s a bad status code', async () => {
    const path = sysPath.join(__dirname, './fixtures/onefile.lcov');
    const input = fs.readFileSync(path, 'utf8');

    const dependencies = {
      getOptions: () => Promise.resolve({}),
      convertLcovToCoveralls: () => Promise.resolve({}),
      sendToCoveralls: () => Promise.resolve({ statusCode: 500, body: 'body' }),
      createLogger: () => mockLogger,
    };

    await handleInput(input, {}, {}, dependencies).should.be.rejectedWith('Bad response: 500 body');
  });

  it('completes successfully when there are no errors', async () => {
    const path = sysPath.join(__dirname, './fixtures/onefile.lcov');
    const input = fs.readFileSync(path, 'utf8');

    const dependencies = {
      getOptions: () => Promise.resolve({}),
      convertLcovToCoveralls: () => Promise.resolve({}),
      sendToCoveralls: () => Promise.resolve({ statusCode: 200, body: 'body' }),
      createLogger: () => mockLogger,
    };

    const body = await handleInput(input, {}, {}, dependencies);
    body.should.equal('body');
  });

  it('uses default parameters when called directly', async () => {
    const path = sysPath.join(__dirname, './fixtures/onefile.lcov');
    const input = fs.readFileSync(path, 'utf8');

    // Call handleInput directly (not through index wrapper) to test default parameters
    // This covers the cliOptions = {} and dependencies = {} default parameters
    try {
      const body = await handleInput(input);
      // If it succeeds, body should be a string
      body.should.be.type('string');
    } catch (error) {
      // If it fails, it should be a "Bad response" error from Coveralls
      error.message.should.match(/Bad response: 422/);
    }
  });
});
