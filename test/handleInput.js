'use strict';

const fs = require('fs');
const sysPath = require('path');
require('should');
const sinon = require('sinon');
const index = require('..');

describe('handleInput', () => {
  afterEach(() => {
    sinon.restore();
  });
  it('returns an error when there\'s an error getting options', async () => {
    sinon.stub(index, 'getOptions').rejects(new Error('some error'));
    const path = sysPath.join(__dirname, './fixtures/onefile.lcov');
    const input = fs.readFileSync(path, 'utf8');
    await index.handleInput(input).should.be.rejectedWith('some error');
  });
  it('returns an error when there\'s an error converting', async () => {
    sinon.stub(index, 'getOptions').resolves({});
    sinon.stub(index, 'convertLcovToCoveralls').rejects(new Error('some error'));
    const path = sysPath.join(__dirname, './fixtures/onefile.lcov');
    const input = fs.readFileSync(path, 'utf8');
    await index.handleInput(input).should.be.rejectedWith('some error');
  });
  it('returns an error when there\'s an error sending', async () => {
    sinon.stub(index, 'getOptions').resolves({});
    sinon.stub(index, 'sendToCoveralls').rejects(new Error('some error'));
    const path = sysPath.join(__dirname, './fixtures/onefile.lcov');
    const input = fs.readFileSync(path, 'utf8');
    await index.handleInput(input).should.be.rejectedWith('some error');
  });
  it('returns an error when there\'s a bad status code', async () => {
    sinon.stub(index, 'getOptions').resolves({});
    sinon.stub(index, 'sendToCoveralls').resolves({ statusCode: 500, body: 'body' });
    const path = sysPath.join(__dirname, './fixtures/onefile.lcov');
    const input = fs.readFileSync(path, 'utf8');
    await index.handleInput(input).should.be.rejectedWith('Bad response: 500 body');
  });
  it('completes successfully when there are no errors', async () => {
    sinon.stub(index, 'getOptions').resolves({});
    sinon.stub(index, 'sendToCoveralls').resolves({ statusCode: 200, body: 'body' });
    const path = sysPath.join(__dirname, './fixtures/onefile.lcov');
    const input = fs.readFileSync(path, 'utf8');
    const body = await index.handleInput(input);
    body.should.equal('body');
  });
});
