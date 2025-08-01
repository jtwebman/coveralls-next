'use strict';

const should = require('should');
const sinon = require('sinon');
const logDriver = require('log-driver');
const { MockAgent, setGlobalDispatcher } = require('undici');
const index = require('..');

logDriver({ level: false });

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
    sinon.restore();
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
});