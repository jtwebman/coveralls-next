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

  it('passes on the correct params to fetch', done => {
    const object = { some: 'obj' };
    
    const mockPool = mockAgent.get('https://coveralls.io');
    mockPool
      .intercept({
        path: '/api/v1/jobs',
        method: 'POST',
      })
      .reply(200, 'response');

    index.sendToCoveralls(object, (err, response) => {
      try {
        should(err).be.null();
        response.statusCode.should.equal(200);
        response.body.should.equal('response');
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it('when request rejects pass the error to the callback', done => {
    const mockPool = mockAgent.get('https://coveralls.io');
    mockPool
      .intercept({
        path: '/api/v1/jobs',
        method: 'POST',
      })
      .replyWithError(new Error('test error'));

    const object = { some: 'obj' };

    index.sendToCoveralls(object, (err, response) => {
      try {
        err.message.should.equal('test error');
        should(response).be.undefined();
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it('allows sending to enterprise url', done => {
    process.env.COVERALLS_ENDPOINT = 'https://coveralls-ubuntu.domain.com';
    
    const mockPool = mockAgent.get('https://coveralls-ubuntu.domain.com');
    mockPool
      .intercept({
        path: '/api/v1/jobs',
        method: 'POST',
      })
      .reply(200, 'response');

    const object = { some: 'obj' };

    index.sendToCoveralls(object, (err, response) => {
      try {
        should(err).be.null();
        response.statusCode.should.equal(200);
        response.body.should.equal('response');
        done();
      } catch (error) {
        done(error);
      }
    });
  });

  it('writes output to stdout when --stdout is passed', done => {
    const object = { some: 'obj' };

    // set up mock process.stdout.write temporarily
    const origStdoutWrite = process.stdout.write;
    process.stdout.write = function (...args) {
      if (args[0] === JSON.stringify(object)) {
        process.stdout.write = origStdoutWrite;
        index.options.stdout = false;
        return done();
      }

      origStdoutWrite.apply(this, args);
    };

    index.options.stdout = true;

    index.sendToCoveralls(object, (err, response) => {
      should.not.exist(err);
      response.statusCode.should.equal(200);
    });
  });

  it('when request rejects with error without cause', done => {
    const mockPool = mockAgent.get('https://coveralls.io');
    mockPool
      .intercept({
        path: '/api/v1/jobs',
        method: 'POST',
      })
      .replyWithError(new Error('Network error'));

    const object = { some: 'obj' };

    index.sendToCoveralls(object, (err, response) => {
      should.exist(err);
      err.message.should.equal('Network error');
      should.not.exist(response);
      done();
    });
  });

  it('when fetch throws error with message "fetch failed" and cause, unwraps', done => {
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

    sendToCoverallsMocked(object, (err, response) => {
      global.fetch = originalFetch;
      should.exist(err);
      err.message.should.equal('Connection refused');
      should.not.exist(response);
      done();
    });
  });

  it('when fetch throws error without "fetch failed" message, returns original', done => {
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

    sendToCoverallsMocked(object, (err, response) => {
      global.fetch = originalFetch;
      should.exist(err);
      err.message.should.equal('Custom network error');
      should.not.exist(response);
      done();
    });
  });
});