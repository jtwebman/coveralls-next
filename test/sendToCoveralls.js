'use strict';

const should = require('should');
const { MockAgent, setGlobalDispatcher } = require('undici');
const index = require('..');

describe('sendToCoveralls', () => {
  let realCoverallsHost;
  let mockAgent;
  let originalDispatcher;

  beforeEach(() => {
    realCoverallsHost = process.env.COVERALLS_ENDPOINT;
    mockAgent = new MockAgent();
    originalDispatcher = setGlobalDispatcher(mockAgent);
  });

  afterEach(() => {
    if (mockAgent) {
      mockAgent.close();
    }
    if (originalDispatcher) {
      setGlobalDispatcher(originalDispatcher);
    }
    if (realCoverallsHost !== undefined) {
      process.env.COVERALLS_ENDPOINT = realCoverallsHost;
    } else {
      delete process.env.COVERALLS_ENDPOINT;
    }
  });

  it('passes on the correct params to fetch', async () => {
    const object = { some: 'obj' };

    const mockPool = mockAgent.get('https://coveralls.io');
    mockPool
      .intercept({
        path: '/api/v1/jobs',
        method: 'POST',
      })
      .reply(200, 'response');

    const response = await index.sendToCoveralls(object);
    response.statusCode.should.equal(200);
    response.body.should.equal('response');
  });

  it('when request rejects pass the error to the callback', async () => {
    const mockPool = mockAgent.get('https://coveralls.io');
    mockPool
      .intercept({
        path: '/api/v1/jobs',
        method: 'POST',
      })
      .replyWithError(new Error('test error'));

    const object = { some: 'obj' };

    await index.sendToCoveralls(object).should.be.rejectedWith('test error');
  });

  it('allows sending to enterprise url', async () => {
    process.env.COVERALLS_ENDPOINT = 'https://coveralls-ubuntu.domain.com';

    const mockPool = mockAgent.get('https://coveralls-ubuntu.domain.com');
    mockPool
      .intercept({
        path: '/api/v1/jobs',
        method: 'POST',
      })
      .reply(200, 'response');

    const object = { some: 'obj' };

    const response = await index.sendToCoveralls(object);
    response.statusCode.should.equal(200);
    response.body.should.equal('response');
  });

  it('writes output to stdout when --stdout is passed', async () => {
    const object = { some: 'obj' };

    // set up mock process.stdout.write temporarily
    const origStdoutWrite = process.stdout.write;
    let outputWritten = false;
    process.stdout.write = function (...args) {
      if (args[0] === JSON.stringify(object)) {
        outputWritten = true;
        process.stdout.write = origStdoutWrite;
        index.options.stdout = false;
        return true;
      }

      return origStdoutWrite.apply(this, args);
    };

    index.options.stdout = true;

    const response = await index.sendToCoveralls(object);
    should.not.exist(response.error);
    response.statusCode.should.equal(200);
    outputWritten.should.be.true();
  });

  it('when request rejects with error without cause', async () => {
    const mockPool = mockAgent.get('https://coveralls.io');
    mockPool
      .intercept({
        path: '/api/v1/jobs',
        method: 'POST',
      })
      .replyWithError(new Error('Network error'));

    const object = { some: 'obj' };

    await index.sendToCoveralls(object).should.be.rejectedWith('Network error');
  });

  it('when fetch throws error with message "fetch failed" and cause, unwraps', async () => {
    const proxyquire = require('proxyquire');
    const causeError = new Error('Connection refused');
    const fetchError = new Error('fetch failed');
    fetchError.cause = causeError;

    const mockFetch = async () => {
      throw fetchError;
    };

    const sendToCoverallsMocked = proxyquire('../lib/sendToCoveralls', {
      '@global': true,
      '@noCallThru': true,
    });

    // Temporarily replace global fetch
    const originalFetch = global.fetch;
    global.fetch = mockFetch;

    const object = { some: 'obj' };

    await sendToCoverallsMocked(object).should.be.rejectedWith('Connection refused');
    global.fetch = originalFetch;
  });

  it('when fetch throws error without "fetch failed" message, returns original', async () => {
    const proxyquire = require('proxyquire');
    const customError = new Error('Custom network error');

    const mockFetch = async () => {
      throw customError;
    };

    const sendToCoverallsMocked = proxyquire('../lib/sendToCoveralls', {
      '@global': true,
      '@noCallThru': true,
    });

    // Temporarily replace global fetch
    const originalFetch = global.fetch;
    global.fetch = mockFetch;

    const object = { some: 'obj' };

    await sendToCoverallsMocked(object).should.be.rejectedWith('Custom network error');
    global.fetch = originalFetch;
  });
});