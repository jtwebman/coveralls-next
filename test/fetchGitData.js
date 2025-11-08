'use strict';

require('should');
const proxyquire = require('proxyquire');
const fetchGitData = require('../lib/fetchGitData');
const { getOptions } = require('..');

describe('fetchGitData', () => {
  beforeEach(() => {
    process.env = { PATH: process.env.PATH };
  });

  it('should throw an error when no git context is provided', async () => {
    await fetchGitData(undefined).should.be.rejectedWith(/No options passed/);
  });
  it('should throw an error if no head is provided', async () => {
    await fetchGitData({}).should.be.rejectedWith(/You must provide the head/);
  });
  it('should throw an error if no head.id is provided', async () => {
    await fetchGitData({
      head: {},
    }).should.be.rejectedWith(/You must provide the head.id/);
  });
  it('should return default values', async () => {
    const options = await fetchGitData({
      head: {
        id: 'COMMIT_HASH',
      },
    });
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
  });
  it('should override default values', async () => {
    const options = await fetchGitData({
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
  });
  it('should convert git.branch to a string', async () => {
    const result1 = await fetchGitData({
      head: {
        id: 'COMMIT_HASH',
      },
      branch: {
        covert: 'to a string',
      },
    });
    result1.branch.should.be.String();

    const result2 = await fetchGitData({
      head: {
        id: 'COMMIT_HASH',
      },
      branch: ['convert', 'to', 'a', 'string'],
    });
    result2.branch.should.be.String();
  });
  it('should convert git.remotes to an array', async () => {
    const result1 = await fetchGitData({
      head: {
        id: 'COMMIT_HASH',
      },
      remotes: 'convert from string to an array',
    });
    result1.remotes.should.be.instanceof(Array);

    const result2 = await fetchGitData({
      head: {
        id: 'COMMIT_HASH',
      },
      remotes: {
        convert: 'from object to an array',
      },
    });
    result2.remotes.should.be.instanceof(Array);
  });
  it('should save passed remotes', async () => {
    const options = await fetchGitData({
      head: {
        id: 'COMMIT_HASH',
      },
      remotes: [
        {
          name: 'test',
          url: 'https://my.test.url',
        },
      ],
    });
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
  });
  it('should execute git commands when a valid commit hash is given', async () => {
    process.env.COVERALLS_GIT_COMMIT = 'HEAD';
    process.env.COVERALLS_GIT_BRANCH = 'master';
    const result = await getOptions();
    const options = result.git;
    options.head.should.be.Object();
    options.head.author_name.should.not.equal('Unknown Author');
    options.head.committer_name.should.not.equal('Unknown Committer');
    options.head.message.should.not.equal('Unknown Commit Message');
    options.branch.should.be.String();
    options.should.have.property('remotes');
    options.remotes.should.be.instanceof(Array);
    options.remotes.length.should.be.above(0);
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

  it('should handle detached HEAD state', async () => {
    let callCount = 0;
    const mockExecFileAsync = async (_cmd, _args) => {
      callCount++;
      if (callCount === 1) {
        // First call: git rev-parse --verify HEAD (succeeds)
        return { stdout: '', stderr: '' };
      } else if (callCount === 2) {
        // Second call: git cat-file -p HEAD (succeeds)
        const response =
          '\nauthor Test Author <test@example.com> 1234567890 +0000\n' +
          'committer Test Committer <test@example.com> 1234567890 +0000\n\nTest commit message';
        return { stdout: response, stderr: '' };
      } else if (callCount === 3) {
        // Third call: git branch (returns detached HEAD)
        return { stdout: '* (HEAD detached at abc123)\n  master\n  develop\n', stderr: '' };
      } else if (callCount === 4) {
        // Fourth call: git remote -v
        return { stdout: 'origin\thttps://github.com/user/repo.git (push)\n', stderr: '' };
      }
    };

    const fetchGitDataMocked = proxyquire('../lib/fetchGitData', {
      util: { promisify: () => mockExecFileAsync },
    });

    const git = await fetchGitDataMocked({
      head: {
        id: 'HEAD',
      },
    });
    // Branch will be empty string in detached HEAD state
    git.branch.should.equal('');
  });

  it('should handle when git branch output has no current branch marker', async () => {
    let callCount = 0;
    const mockExecFileAsync = async (_cmd, _args) => {
      callCount++;
      if (callCount === 1) {
        // First call: git rev-parse --verify HEAD (succeeds)
        return { stdout: '', stderr: '' };
      } else if (callCount === 2) {
        // Second call: git cat-file -p HEAD (succeeds)
        const response =
          '\nauthor Test Author <test@example.com> 1234567890 +0000\n' +
          'committer Test Committer <test@example.com> 1234567890 +0000\n\nTest commit message';
        return { stdout: response, stderr: '' };
      } else if (callCount === 3) {
        // Third call: git branch (returns output without * marker)
        return { stdout: '  master\n  develop\n', stderr: '' };
      } else if (callCount === 4) {
        // Fourth call: git remote -v
        return { stdout: 'origin\thttps://github.com/user/repo.git (push)\n', stderr: '' };
      }
    };

    const fetchGitDataMocked = proxyquire('../lib/fetchGitData', {
      util: { promisify: () => mockExecFileAsync },
    });

    const git = await fetchGitDataMocked({
      head: {
        id: 'HEAD',
      },
    });
    // Branch will be empty string when no current branch marker found
    git.branch.should.equal('');
  });

  it('should filter out duplicate remotes from git output', async () => {
    let callCount = 0;
    const mockExecFileAsync = async (_cmd, _args) => {
      callCount++;
      if (callCount === 1) {
        // First call: git rev-parse --verify HEAD (succeeds)
        return { stdout: '', stderr: '' };
      } else if (callCount === 2) {
        // Second call: git cat-file -p HEAD (succeeds)
        const response =
          '\nauthor Test Author <test@example.com> 1234567890 +0000\n' +
          'committer Test Committer <test@example.com> 1234567890 +0000\n\nTest commit message';
        return { stdout: response, stderr: '' };
      } else if (callCount === 3) {
        // Third call: git remote -v (returns duplicates - same remote twice with push)
        const output =
          'origin\thttps://github.com/user/repo.git (fetch)\n' +
          'origin\thttps://github.com/user/repo.git (push)\n' +
          'origin\thttps://github.com/user/repo.git (push)\n' +
          'upstream\thttps://github.com/other/repo.git (fetch)\n' +
          'upstream\thttps://github.com/other/repo.git (push)\n';
        return { stdout: output, stderr: '' };
      }
    };

    const fetchGitDataMocked = proxyquire('../lib/fetchGitData', {
      util: { promisify: () => mockExecFileAsync },
    });

    const git = await fetchGitDataMocked({
      head: {
        id: 'HEAD',
      },
      branch: 'master',
    });
    // Should only have 2 remotes (origin and upstream), not 4
    git.remotes.length.should.equal(2);
    git.remotes[0].name.should.equal('origin');
    git.remotes[0].url.should.equal('https://github.com/user/repo.git');
    git.remotes[1].name.should.equal('upstream');
    git.remotes[1].url.should.equal('https://github.com/other/repo.git');
  });

  it('should handle error when fetching branch fails', async () => {
    let callCount = 0;
    const mockExecFileAsync = async (_cmd, _args) => {
      callCount++;
      if (callCount === 1) {
        // First call: git rev-parse --verify HEAD (succeeds)
        return { stdout: '', stderr: '' };
      } else if (callCount === 2) {
        // Second call: git cat-file -p HEAD (succeeds)
        const response =
          '\nauthor Test Author <test@example.com> 1234567890 +0000\n' +
          'committer Test Committer <test@example.com> 1234567890 +0000\n\nTest commit message';
        return { stdout: response, stderr: '' };
      } else if (callCount === 3) {
        // Third call: git branch (fails)
        throw new Error('git branch failed');
      }
    };

    const fetchGitDataMocked = proxyquire('../lib/fetchGitData', {
      util: { promisify: () => mockExecFileAsync },
    });

    await fetchGitDataMocked({
      head: {
        id: 'HEAD',
      },
    }).should.be.rejectedWith('git branch failed');
  });

  it('should handle error when fetching head details fails', async () => {
    let callCount = 0;
    const mockExecFileAsync = async (_cmd, _args) => {
      callCount++;
      if (callCount === 1) {
        // First call: git rev-parse --verify HEAD (succeeds)
        return { stdout: '', stderr: '' };
      } else if (callCount === 2) {
        // Second call: git cat-file -p HEAD (fails)
        throw new Error('git cat-file failed');
      }
    };

    const fetchGitDataMocked = proxyquire('../lib/fetchGitData', {
      util: { promisify: () => mockExecFileAsync },
    });

    await fetchGitDataMocked({
      head: {
        id: 'HEAD',
      },
      branch: 'master',
    }).should.be.rejectedWith('git cat-file failed');
  });

  it('should handle error when fetching remotes fails', async () => {
    let callCount = 0;
    const mockExecFileAsync = async (_cmd, _args) => {
      callCount++;
      if (callCount === 1) {
        // First call: git rev-parse --verify HEAD (succeeds)
        return { stdout: '', stderr: '' };
      } else if (callCount === 2) {
        // Second call: git cat-file -p HEAD (succeeds)
        const response =
          '\nauthor Test Author <test@example.com> 1234567890 +0000\n' +
          'committer Test Committer <test@example.com> 1234567890 +0000\n\nTest commit message';
        return { stdout: response, stderr: '' };
      } else if (callCount === 3) {
        // Third call: git remote -v (fails)
        throw new Error('git remote failed');
      }
    };

    const fetchGitDataMocked = proxyquire('../lib/fetchGitData', {
      util: { promisify: () => mockExecFileAsync },
    });

    await fetchGitDataMocked({
      head: {
        id: 'HEAD',
      },
      branch: 'master',
    }).should.be.rejectedWith('git remote failed');
  });

  it('should handle malformed git cat-file output', async () => {
    let callCount = 0;
    const mockExecFileAsync = async (_cmd, _args) => {
      callCount++;
      if (callCount === 1) {
        // First call: git rev-parse --verify HEAD (succeeds)
        return { stdout: '', stderr: '' };
      } else if (callCount === 2) {
        // Second call: git cat-file -p HEAD (returns malformed output)
        return { stdout: 'malformed output without proper commit format', stderr: '' };
      }
    };

    const fetchGitDataMocked = proxyquire('../lib/fetchGitData', {
      util: { promisify: () => mockExecFileAsync },
    });

    await fetchGitDataMocked({
      head: {
        id: 'HEAD',
      },
      branch: 'master',
    }).should.be.rejectedWith('Unable to parse commit details from git cat-file output');
  });

});
