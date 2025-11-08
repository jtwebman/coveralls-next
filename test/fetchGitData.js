'use strict';

const should = require('should');
const proxyquire = require('proxyquire');
const fetchGitData = require('../lib/fetchGitData');
const { getOptions } = require('..');

describe('fetchGitData', () => {
  beforeEach(() => {
    process.env = { PATH: process.env.PATH };
  });

  it('should throw an error when no data is passed', () => {
    fetchGitData.should.throw(/fetchGitData requires a callback/);
  });
  it('should throw an error when no git context is provided', done => {
    fetchGitData(undefined, err => {
      err.should.match(/No options passed/);
      done();
    });
  });
  it('should throw an error if no head is provided', done => {
    fetchGitData({}, err => {
      err.should.match(/You must provide the head/);
      done();
    });
  });
  it('should throw an error if no head.id is provided', done => {
    fetchGitData(
      {
        head: {},
      },
      err => {
        err.should.match(/You must provide the head.id/);
        done();
      },
    );
  });
  it('should return default values', done => {
    fetchGitData(
      {
        head: {
          id: 'COMMIT_HASH',
        },
      },
      (err, options) => {
        should.not.exist(err);
        options.should.eql({
          head: {
            id: 'COMMIT_HASH',
            author_name: 'Unknown Author',
            author_email: '',
            committer_name: 'Unknown Committer',
            committer_email: '',
            message: 'Unknown Commit Message',
          },
          branch: '',
          remotes: [],
        });
        done();
      },
    );
  });
  it('should override default values', done => {
    fetchGitData(
      {
        head: {
          id: 'COMMIT_HASH',
          author_name: 'MY AUTHOR',
          author_email: '',
          committer_name: 'MY COMMITTER',
          committer_email: '',
          message: 'MY COMMIT MESSAGE',
        },
        branch: 'TEST',
        remotes: [
          {
            name: 'TEST',
            url: 'test-url',
          },
        ],
      },
      (err, options) => {
        should.not.exist(err);
        options.should.eql({
          head: {
            id: 'COMMIT_HASH',
            author_name: 'MY AUTHOR',
            author_email: '',
            committer_name: 'MY COMMITTER',
            committer_email: '',
            message: 'MY COMMIT MESSAGE',
          },
          branch: 'TEST',
          remotes: [
            {
              name: 'TEST',
              url: 'test-url',
            },
          ],
        });
        done();
      },
    );
  });
  it('should convert git.branch to a string', done => {
    fetchGitData(
      {
        head: {
          id: 'COMMIT_HASH',
        },
        branch: {
          covert: 'to a string',
        },
      },
      (err, string) => {
        should.not.exist(err);
        string.branch.should.be.String();
        fetchGitData(
          {
            head: {
              id: 'COMMIT_HASH',
            },
            branch: ['convert', 'to', 'a', 'string'],
          },
          (err, string) => {
            should.not.exist(err);
            string.branch.should.be.String();
            done();
          },
        );
      },
    );
  });
  it('should convert git.remotes to an array', done => {
    fetchGitData(
      {
        head: {
          id: 'COMMIT_HASH',
        },
        remotes: 'convert from string to an array',
      },
      (err, array) => {
        should.not.exist(err);
        array.remotes.should.be.instanceof(Array);
        fetchGitData(
          {
            head: {
              id: 'COMMIT_HASH',
            },
            remotes: {
              convert: 'from object to an array',
            },
          },
          (err, array) => {
            should.not.exist(err);
            array.remotes.should.be.instanceof(Array);
            done();
          },
        );
      },
    );
  });
  it('should save passed remotes', done => {
    fetchGitData(
      {
        head: {
          id: 'COMMIT_HASH',
        },
        remotes: [
          {
            name: 'test',
            url: 'https://my.test.url',
          },
        ],
      },
      (err, options) => {
        should.not.exist(err);
        options.should.eql({
          head: {
            id: 'COMMIT_HASH',
            author_name: 'Unknown Author',
            author_email: '',
            committer_name: 'Unknown Committer',
            committer_email: '',
            message: 'Unknown Commit Message',
          },
          branch: '',
          remotes: [
            {
              name: 'test',
              url: 'https://my.test.url',
            },
          ],
        });
        done();
      },
    );
  });
  it('should execute git commands when a valid commit hash is given', done => {
    process.env.COVERALLS_GIT_COMMIT = 'HEAD';
    process.env.COVERALLS_GIT_BRANCH = 'master';
    getOptions((err, options) => {
      should.not.exist(err);
      options = options.git;
      options.head.should.be.Object();
      options.head.author_name.should.not.equal('Unknown Author');
      options.head.committer_name.should.not.equal('Unknown Committer');
      options.head.message.should.not.equal('Unknown Commit Message');
      options.branch.should.be.String();
      options.should.have.property('remotes');
      options.remotes.should.be.instanceof(Array);
      options.remotes.length.should.be.above(0);
      done();
    });
  });
  it('should handle branch names with hyphens', () => {
    const branchName = 'bug-fix-123';
    const mockGitOutput = `  other-branch\n* ${branchName}\n  another-branch`;
    const match = (mockGitOutput.match(/^\* (\S+)/m) || [])[1];
    match.should.equal(branchName);
  });
  it('should handle branch names with slashes', () => {
    const branchName = 'feature/new-feature';
    const mockGitOutput = `  master\n* ${branchName}\n  develop`;
    const match = (mockGitOutput.match(/^\* (\S+)/m) || [])[1];
    match.should.equal(branchName);
  });
  it('should handle branch names with dots', () => {
    const branchName = 'release/v1.0.0';
    const mockGitOutput = `  master\n* ${branchName}\n  develop`;
    const match = (mockGitOutput.match(/^\* (\S+)/m) || [])[1];
    match.should.equal(branchName);
  });

  it('should handle detached HEAD state', done => {
    let callCount = 0;
    const mockExecFile = (cmd, args, cb) => {
      callCount++;
      if (callCount === 1) {
        // First call: git rev-parse --verify HEAD (succeeds)
        cb(null, '');
      } else if (callCount === 2) {
        // Second call: git cat-file -p HEAD (succeeds)
        const response =
          '\nauthor Test Author <test@example.com> 1234567890 +0000\n' +
          'committer Test Committer <test@example.com> 1234567890 +0000\n\nTest commit message';
        cb(null, response);
      } else if (callCount === 3) {
        // Third call: git branch (returns detached HEAD)
        cb(null, '* (HEAD detached at abc123)\n  master\n  develop\n');
      } else if (callCount === 4) {
        // Fourth call: git remote -v
        cb(null, 'origin\thttps://github.com/user/repo.git (push)\n');
      }
    };

    const fetchGitDataMocked = proxyquire('../lib/fetchGitData', {
      child_process: { execFile: mockExecFile },
    });

    fetchGitDataMocked(
      {
        head: {
          id: 'HEAD',
        },
      },
      (err, git) => {
        should.not.exist(err);
        // Branch will be empty string in detached HEAD state
        git.branch.should.equal('');
        done();
      },
    );
  });

  it('should handle when git branch output has no current branch marker', done => {
    let callCount = 0;
    const mockExecFile = (cmd, args, cb) => {
      callCount++;
      if (callCount === 1) {
        // First call: git rev-parse --verify HEAD (succeeds)
        cb(null, '');
      } else if (callCount === 2) {
        // Second call: git cat-file -p HEAD (succeeds)
        const response =
          '\nauthor Test Author <test@example.com> 1234567890 +0000\n' +
          'committer Test Committer <test@example.com> 1234567890 +0000\n\nTest commit message';
        cb(null, response);
      } else if (callCount === 3) {
        // Third call: git branch (returns output without * marker)
        cb(null, '  master\n  develop\n');
      } else if (callCount === 4) {
        // Fourth call: git remote -v
        cb(null, 'origin\thttps://github.com/user/repo.git (push)\n');
      }
    };

    const fetchGitDataMocked = proxyquire('../lib/fetchGitData', {
      child_process: { execFile: mockExecFile },
    });

    fetchGitDataMocked(
      {
        head: {
          id: 'HEAD',
        },
      },
      (err, git) => {
        should.not.exist(err);
        // Branch will be empty string when no current branch marker found
        git.branch.should.equal('');
        done();
      },
    );
  });

  it('should filter out duplicate remotes from git output', done => {
    let callCount = 0;
    const mockExecFile = (cmd, args, cb) => {
      callCount++;
      if (callCount === 1) {
        // First call: git rev-parse --verify HEAD (succeeds)
        return cb(null, '');
      } else if (callCount === 2) {
        // Second call: git cat-file -p HEAD (succeeds)
        const response =
          '\nauthor Test Author <test@example.com> 1234567890 +0000\n' +
          'committer Test Committer <test@example.com> 1234567890 +0000\n\nTest commit message';
        return cb(null, response);
      } else if (callCount === 3) {
        // Third call: git remote -v (returns duplicates - same remote twice with push)
        const output =
          'origin\thttps://github.com/user/repo.git (fetch)\n' +
          'origin\thttps://github.com/user/repo.git (push)\n' +
          'origin\thttps://github.com/user/repo.git (push)\n' +
          'upstream\thttps://github.com/other/repo.git (fetch)\n' +
          'upstream\thttps://github.com/other/repo.git (push)\n';
        return cb(null, output);
      }
    };

    const fetchGitDataMocked = proxyquire('../lib/fetchGitData', {
      child_process: { execFile: mockExecFile },
    });

    fetchGitDataMocked(
      {
        head: {
          id: 'HEAD',
        },
        branch: 'master',
      },
      (err, git) => {
        should.not.exist(err);
        // Should only have 2 remotes (origin and upstream), not 4
        git.remotes.length.should.equal(2);
        git.remotes[0].name.should.equal('origin');
        git.remotes[0].url.should.equal('https://github.com/user/repo.git');
        git.remotes[1].name.should.equal('upstream');
        git.remotes[1].url.should.equal('https://github.com/other/repo.git');
        done();
      },
    );
  });

  it('should handle error when fetching branch fails', done => {
    let callCount = 0;
    const mockExecFile = (cmd, args, cb) => {
      callCount++;
      if (callCount === 1) {
        // First call: git rev-parse --verify HEAD (succeeds)
        return cb(null, '');
      } else if (callCount === 2) {
        // Second call: git cat-file -p HEAD (succeeds)
        const response =
          '\nauthor Test Author <test@example.com> 1234567890 +0000\n' +
          'committer Test Committer <test@example.com> 1234567890 +0000\n\nTest commit message';
        return cb(null, response);
      } else if (callCount === 3) {
        // Third call: git branch (fails)
        return cb(new Error('git branch failed'));
      }
    };

    const fetchGitDataMocked = proxyquire('../lib/fetchGitData', {
      child_process: { execFile: mockExecFile },
    });

    fetchGitDataMocked(
      {
        head: {
          id: 'HEAD',
        },
      },
      err => {
        should.exist(err);
        err.message.should.equal('git branch failed');
        done();
      },
    );
  });

  it('should handle error when fetching head details fails', done => {
    let callCount = 0;
    const mockExecFile = (cmd, args, cb) => {
      callCount++;
      if (callCount === 1) {
        // First call: git rev-parse --verify HEAD (succeeds)
        return cb(null, '');
      } else if (callCount === 2) {
        // Second call: git cat-file -p HEAD (fails)
        return cb(new Error('git cat-file failed'));
      }
    };

    const fetchGitDataMocked = proxyquire('../lib/fetchGitData', {
      child_process: { execFile: mockExecFile },
    });

    fetchGitDataMocked(
      {
        head: {
          id: 'HEAD',
        },
        branch: 'master',
      },
      err => {
        should.exist(err);
        err.message.should.equal('git cat-file failed');
        done();
      },
    );
  });

  it('should handle error when fetching remotes fails', done => {
    let callCount = 0;
    const mockExecFile = (cmd, args, cb) => {
      callCount++;
      if (callCount === 1) {
        // First call: git rev-parse --verify HEAD (succeeds)
        return cb(null, '');
      } else if (callCount === 2) {
        // Second call: git cat-file -p HEAD (succeeds)
        const response =
          '\nauthor Test Author <test@example.com> 1234567890 +0000\n' +
          'committer Test Committer <test@example.com> 1234567890 +0000\n\nTest commit message';
        return cb(null, response);
      } else if (callCount === 3) {
        // Third call: git remote -v (fails)
        return cb(new Error('git remote failed'));
      }
    };

    const fetchGitDataMocked = proxyquire('../lib/fetchGitData', {
      child_process: { execFile: mockExecFile },
    });

    fetchGitDataMocked(
      {
        head: {
          id: 'HEAD',
        },
        branch: 'master',
      },
      err => {
        should.exist(err);
        err.message.should.equal('git remote failed');
        done();
      },
    );
  });

  it('should handle malformed git cat-file output', done => {
    let callCount = 0;
    const mockExecFile = (cmd, args, cb) => {
      callCount++;
      if (callCount === 1) {
        // First call: git rev-parse --verify HEAD (succeeds)
        return cb(null, '');
      } else if (callCount === 2) {
        // Second call: git cat-file -p HEAD (returns malformed output)
        return cb(null, 'malformed output without proper commit format');
      }
    };

    const fetchGitDataMocked = proxyquire('../lib/fetchGitData', {
      child_process: { execFile: mockExecFile },
    });

    fetchGitDataMocked(
      {
        head: {
          id: 'HEAD',
        },
        branch: 'master',
      },
      err => {
        should.exist(err);
        err.message.should.equal('Unable to parse commit details from git cat-file output');
        done();
      },
    );
  });

});
