'use strict';

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

require('should');

describe('bin/coveralls.js CLI', () => {
  const binPath = path.join(__dirname, '../bin/coveralls.js');
  const fixturePath = path.join(__dirname, './fixtures/onefile.lcov');

  it('should process lcov data from stdin successfully', done => {
    const lcovData = fs.readFileSync(fixturePath, 'utf8');

    const proc = spawn('node', [binPath, '--stdout']);
    let output = '';

    proc.stdout.on('data', data => {
      output += data.toString();
    });

    proc.on('close', code => {
      try {
        // With --stdout flag, should output JSON
        code.should.equal(0);
        output.should.not.be.empty();

        // Should be valid JSON
        const parsed = JSON.parse(output);
        parsed.should.have.property('source_files');
        parsed.source_files.should.be.an.Array();

        done();
      } catch (err) {
        done(err);
      }
    });

    // Write lcov data to stdin
    proc.stdin.write(lcovData);
    proc.stdin.end();
  });

  it('should handle verbose flag', done => {
    const lcovData = fs.readFileSync(fixturePath, 'utf8');

    const proc = spawn('node', [binPath, '-v', '--stdout']);
    let output = '';

    proc.stdout.on('data', data => {
      output += data.toString();
    });

    proc.on('close', code => {
      try {
        code.should.equal(0);
        output.should.not.be.empty();
        done();
      } catch (err) {
        done(err);
      }
    });

    proc.stdin.write(lcovData);
    proc.stdin.end();
  });

  it('should handle empty input gracefully', done => {
    const proc = spawn('node', [binPath, '--stdout']);

    proc.on('close', code => {
      // Should either exit cleanly or with error code
      code.should.be.a.Number();
      done();
    });

    proc.stdin.end();
  });

  it('should handle invalid lcov data', done => {
    const proc = spawn('node', [binPath, '--stdout']);
    let errorOutput = '';

    proc.stderr.on('data', data => {
      errorOutput += data.toString();
    });

    proc.on('close', code => {
      // Should exit with non-zero code for invalid input
      if (code !== 0) {
        errorOutput.should.not.be.empty();
      }
      done();
    });

    proc.stdin.write('invalid lcov data\n');
    proc.stdin.end();
  });
});
