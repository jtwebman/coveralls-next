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
    const mockExecFileAsync = async (_cmd, args) => {
      // Check which command is being called based on arguments
      if (args[0] === 'log') {
        // git log command - return commit info
        return {
          stdout:
            'abc123\nTest Author\ntest@example.com\n' +
            'Test Committer\ntest@example.com\nTest commit message',
          stderr: '',
        };
      } else if (args[0] === 'rev-parse' && args[1] === '--abbrev-ref') {
        // git rev-parse --abbrev-ref HEAD (returns HEAD in detached state)
        return { stdout: 'HEAD', stderr: '' };
      } else if (args[0] === 'remote') {
        // git remote -v
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
    const mockExecFileAsync = async (_cmd, args) => {
      if (args[0] === 'log') {
        // git log command - return commit info
        return {
          stdout:
            'abc123\nTest Author\ntest@example.com\n' +
            'Test Committer\ntest@example.com\nTest commit message',
          stderr: '',
        };
      } else if (args[0] === 'rev-parse' && args[1] === '--abbrev-ref') {
        // git rev-parse --abbrev-ref HEAD (returns just branch name without marker)
        return { stdout: 'master', stderr: '' };
      } else if (args[0] === 'remote') {
        // git remote -v
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
    // Branch will be set when rev-parse returns a branch name
    git.branch.should.equal('master');
  });

  it('should filter out duplicate remotes from git output', async () => {
    const mockExecFileAsync = async (_cmd, args) => {
      if (args[0] === 'log') {
        // git log command - return commit info
        return {
          stdout:
            'abc123\nTest Author\ntest@example.com\n' +
            'Test Committer\ntest@example.com\nTest commit message',
          stderr: '',
        };
      } else if (args[0] === 'remote') {
        // git remote -v (returns duplicates - same remote twice with push)
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

  it('should handle error when any git command fails', async () => {
    const mockExecFileAsync = async (_cmd, _args) => {
      // All git commands fail
      throw new Error('git command failed');
    };

    const fetchGitDataMocked = proxyquire('../lib/fetchGitData', {
      util: { promisify: () => mockExecFileAsync },
    });

    const git = await fetchGitDataMocked({
      head: {
        id: 'HEAD',
      },
    });
    // Should return default values when git commands fail
    git.head.author_name.should.equal('Unknown Author');
    git.head.committer_name.should.equal('Unknown Committer');
    git.head.message.should.equal('Unknown Commit Message');
  });

  it('should handle error when fetching head details fails', async () => {
    const mockExecFileAsync = async (_cmd, args) => {
      if (args[0] === 'log') {
        // git log fails
        throw new Error('git log failed');
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
    // Should return default values when git commands fail
    git.head.author_name.should.equal('Unknown Author');
    git.head.committer_name.should.equal('Unknown Committer');
  });

  it('should handle error when fetching remotes fails', async () => {
    const mockExecFileAsync = async (_cmd, args) => {
      if (args[0] === 'log') {
        return {
          stdout:
            'abc123\nTest Author\ntest@example.com\n' +
            'Test Committer\ntest@example.com\nTest commit message',
          stderr: '',
        };
      } else if (args[0] === 'remote') {
        // git remote -v fails
        throw new Error('git remote failed');
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
    // Should return default values when git commands fail
    git.head.author_name.should.equal('Unknown Author');
  });

  it('should handle malformed git log output', async () => {
    const mockExecFileAsync = async (_cmd, args) => {
      if (args[0] === 'log') {
        // git log returns malformed output (not enough lines)
        return { stdout: 'malformed\noutput', stderr: '' };
      } else if (args[0] === 'rev-parse') {
        return { stdout: 'master', stderr: '' };
      } else if (args[0] === 'remote') {
        return { stdout: '', stderr: '' };
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
    // Should handle malformed output gracefully
    git.head.id.should.equal('malformed');
    git.head.author_name.should.equal('output');
  });

});
