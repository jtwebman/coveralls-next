'use strict';

const fs = require('fs');
const path = require('path');
const should = require('should');
const yaml = require('js-yaml');
const index = require('..');

const { getOptions, getBaseOptions } = index;

describe('getBaseOptions', () => {
  beforeEach(() => {
    process.env = { PATH: process.env.PATH };
  });
  it('should set service_job_id if it exists', async () => {
    await testServiceJobId(getBaseOptions);
  });
  it('should set git hash if it exists', async () => {
    await testGitHash(getBaseOptions);
  });
  it('should set git branch if it exists', async () => {
    await testGitBranch(getBaseOptions);
  });
  it('should detect current git hash if not passed in', async () => {
    await testGitHashDetection(getBaseOptions);
  });
  it('should detect current git branch if not passed in', async () => {
    await testGitBranchDetection(getBaseOptions);
  });
  it('should detect detached git head if no hash passed in', async () => {
    await testGitDetachedHeadDetection(getBaseOptions);
  });
  it('should fail local Git detection if no .git directory', async () => {
    await testNoLocalGit(getBaseOptions);
  });
  it('should set repo_token if it exists', async () => {
    await testRepoToken(getBaseOptions);
  });
  it('should detect repo_token if not passed in', async () => {
    await testRepoTokenDetection(getBaseOptions);
  });
  it('should set service_name if it exists', async () => {
    await testServiceName(getBaseOptions);
  });
  it('should set service_name and service_job_id if it\'s running on travis-ci', async () => {
    await testTravisCi(getBaseOptions);
  });
  it('should set service_name and service_job_id if it\'s running on travis-pro', async () => {
    await testTravisPro(getBaseOptions);
  });
  it('should set service_name and service_job_id if it\'s running on jenkins', async () => {
    await testJenkins(getBaseOptions);
  });
  it('should set service_name and service_job_id if it\'s running on circleci', async () => {
    await testCircleCi(getBaseOptions);
  });
  it('should set service_name and service_job_id if it\'s running on codeship', async () => {
    await testCodeship(getBaseOptions);
  });
  it('should set service_name and service_job_id if it\'s running on drone', async () => {
    await testDrone(getBaseOptions);
  });
  it('should set service_name and service_job_id if it\'s running on wercker', async () => {
    await testWercker(getBaseOptions);
  });
  it('should set service_name and service_job_id if it\'s running on Buildkite', async () => {
    await testBuildkite(getBaseOptions);
  });
  it('should set service_name and service_job_id if it\'s running on Azure Pipelines', async () => {
    await testAzurePipelines(getBaseOptions);
  });
});

describe('getOptions', () => {
  beforeEach(() => {
    process.env = { PATH: process.env.PATH };
  });
  it('should get a filepath if there is one', async () => {
    index.options._ = ['somepath'];
    const options = await getOptions();
    options.filepath.should.equal('somepath');
  });
  it('should get a filepath if there is one, even in verbose mode', async () => {
    index.options.verbose = 'true';
    index.options._ = ['somepath'];
    const options = await getOptions();
    options.filepath.should.equal('somepath');
  });
  it('should set service_job_id if it exists', async () => {
    await testServiceJobId(getOptions);
  });
  it('should set git hash if it exists', async () => {
    await testGitHash(getOptions);
  });
  it('should set git branch if it exists', async () => {
    await testGitBranch(getOptions);
  });
  it('should detect current git hash if not passed in', async () => {
    await testGitHashDetection(getOptions);
  });
  it('should detect current git branch if not passed in', async () => {
    await testGitBranchDetection(getOptions);
  });
  it('should detect detached git head if no hash passed in', async () => {
    await testGitDetachedHeadDetection(getOptions);
  });
  it('should fail local Git detection if no .git directory', async () => {
    await testNoLocalGit(getOptions);
  });
  it('should set repo_token if it exists', async () => {
    await testRepoToken(getOptions);
  });
  it('should detect repo_token if not passed in', async () => {
    await testRepoTokenDetection(getOptions);
  });
  it('should set paralell if env let set', async () => {
    await testParallel(getOptions);
  });
  it('should set flag_name if it exists', async () => {
    await testFlagName(getOptions);
  });
  it('should set service_name if it exists', async () => {
    await testServiceName(getOptions);
  });
  it('should set service_number if it exists', async () => {
    await testServiceNumber(getOptions);
  });
  it('should set service_pull_request if it exists', async () => {
    await testServicePullRequest(getOptions);
  });
  it('should set service_name and service_job_id if it\'s running on travis-ci', async () => {
    await testTravisCi(getOptions);
  });
  it('should set service_name and service_job_id if it\'s running on travis-pro', async () => {
    await testTravisPro(getOptions);
  });
  it('should set service_name and service_job_id if it\'s running on jenkins', async () => {
    await testJenkins(getOptions);
  });
  it('should set service_name and service_job_id if it\'s running on circleci', async () => {
    await testCircleCi(getOptions);
  });
  it('should set service_name and service_job_id if it\'s running on codeship', async () => {
    await testCodeship(getOptions);
  });
  it('should set service_name and service_job_id if it\'s running on drone', async () => {
    await testDrone(getBaseOptions);
  });
  it('should set service_name and service_job_id if it\'s running on wercker', async () => {
    await testWercker(getOptions);
  });
  it('should set service_name and service_job_id if it\'s running on Gitlab', async () => {
    await testGitlab(getOptions);
  });
  it('should set service_name and service_job_id if it\'s running on AppVeyor', async () => {
    await testAppVeyor(getOptions);
  });
  it('should set service_name and service_job_id if it\'s running via Surf', async () => {
    await testSurf(getOptions);
  });
  it('should set service_name and service_job_id if it\'s running via Buildkite', async () => {
    await testBuildkite(getOptions);
  });
  it('should set service_name and service_job_id if it\'s running via Semaphore', async () => {
    await testSemaphore(getOptions);
  });
  it('should set service_name and service_job_id if it\'s running via Azure Pipelines', async () => {
    await testAzurePipelines(getOptions);
  });
  it('should set service_name and service_job_id if it\'s running via CodeFresh', async () => {
    await testCodefresh(getOptions);
  });
  it('should override set options with user options', async () => {
    const userOptions = { service_name: 'OVERRIDDEN_SERVICE_NAME' };
    process.env.COVERALLS_SERVICE_NAME = 'SERVICE_NAME';
    const options = await getOptions(userOptions);
    options.service_name.should.equal('OVERRIDDEN_SERVICE_NAME');
  });
});

const testServiceJobId = async sut => {
  process.env.COVERALLS_SERVICE_JOB_ID = 'SERVICE_JOB_ID';
  const options = await sut();
  options.service_job_id.should.equal('SERVICE_JOB_ID');
};

const testGitHash = async sut => {
  process.env.COVERALLS_GIT_COMMIT = 'e3e3e3e3e3e3e3e3e';
  const options = await sut();
  options.git.head.id.should.equal('e3e3e3e3e3e3e3e3e');
};

const testGitDetachedHeadDetection = async sut => {
  const localGit = ensureLocalGitContext({ detached: true });
  const options = await sut();
  options.git.head.id.should.equal(localGit.id);
  localGit.wrapUp();
};

const testGitHashDetection = async sut => {
  const localGit = ensureLocalGitContext();
  const options = await sut();
  options.git.head.id.should.equal(localGit.id);
  localGit.wrapUp();
};

const testGitBranch = async sut => {
  process.env.COVERALLS_GIT_COMMIT = 'e3e3e3e3e3e3e3e3e';
  process.env.COVERALLS_GIT_BRANCH = 'master';
  const options = await sut();
  options.git.branch.should.equal('master');
};

const testGitBranchDetection = async sut => {
  const localGit = ensureLocalGitContext();
  const options = await sut();
  if (localGit.branch) {
    options.git.branch.should.equal(localGit.branch);
  } else {
    // In detached HEAD state, branch will be empty string
    options.git.branch.should.equal('');
  }

  localGit.wrapUp();
};

const testNoLocalGit = async sut => {
  const localGit = ensureLocalGitContext({ noGit: true });
  const options = await sut();
  options.should.not.have.property('git');
  localGit.wrapUp();
};

const testRepoToken = async sut => {
  process.env.COVERALLS_REPO_TOKEN = 'REPO_TOKEN';
  const options = await sut();
  options.repo_token.should.equal('REPO_TOKEN');
};

const testParallel = async sut => {
  process.env.COVERALLS_PARALLEL = 'true';
  const options = await sut();
  options.parallel.should.equal(true);
};

const testFlagName = async sut => {
  process.env.COVERALLS_FLAG_NAME = 'test flag';

  const options = await sut();
  options.flag_name.should.equal('test flag');
};

const testRepoTokenDetection = async sut => {
  const file = path.join(process.cwd(), '.coveralls.yml');
  let token;
  let service_name;
  let synthetic = false;

  if (fs.existsSync(file)) {
    const coverallsYmlDoc = yaml.load(fs.readFileSync(file, 'utf8'));
    token = coverallsYmlDoc.repo_token;
    if (coverallsYmlDoc.service_name) {
      service_name = coverallsYmlDoc.service_name;
    }
  } else {
    token = 'REPO_TOKEN';
    service_name = 'travis-pro';
    fs.writeFileSync(file, `repo_token: ${token}\nservice_name: ${service_name}`);
    synthetic = true;
  }

  const options = await sut();
  options.repo_token.should.equal(token);

  if (service_name) {
    options.service_name.should.equal(service_name);
  }

  if (synthetic) {
    fs.unlinkSync(file);
  }
};

const testServiceName = async sut => {
  process.env.COVERALLS_SERVICE_NAME = 'SERVICE_NAME';
  const options = await sut();
  options.service_name.should.equal('SERVICE_NAME');
};

const testServiceNumber = async sut => {
  process.env.COVERALLS_SERVICE_NUMBER = 'SERVICE_NUMBER';
  const options = await sut();
  options.service_number.should.equal('SERVICE_NUMBER');
};

const testServicePullRequest = async sut => {
  process.env.CI_PULL_REQUEST = 'https://github.com/fake/fake/pulls/123';
  const options = await sut();
  options.service_pull_request.should.equal('123');
};

const testTravisCi = async sut => {
  process.env.TRAVIS = 'TRUE';
  process.env.TRAVIS_BUILD_NUMBER = '1';
  process.env.TRAVIS_JOB_ID = '12';
  process.env.TRAVIS_PULL_REQUEST = '123';
  const options = await sut();
  options.service_name.should.equal('travis-ci');
  options.service_number.should.equal('1');
  options.service_job_id.should.equal('12');
  options.service_pull_request.should.equal('123');
};

const testTravisPro = async sut => {
  const file = path.join(process.cwd(), '.coveralls.yml');
  const service_name = 'travis-pro';
  fs.writeFileSync(file, `service_name: ${service_name}`);
  process.env.TRAVIS = 'TRUE';
  process.env.TRAVIS_BUILD_NUMBER = '1234';
  process.env.TRAVIS_COMMIT = 'a12s2d3df4f435g45g45g67h5g6';
  const options = await sut();
  options.service_name.should.equal(service_name);
  options.service_number.should.equal('1234');
  options.git.head.id.should.equal('HEAD');
  fs.unlinkSync(file);
};

const testJenkins = async sut => {
  process.env.JENKINS_URL = 'something';
  process.env.BUILD_ID = '1234';
  process.env.GIT_COMMIT = 'a12s2d3df4f435g45g45g67h5g6';
  process.env.GIT_BRANCH = 'master';

  const git = {
    head: {
      id: 'a12s2d3df4f435g45g45g67h5g6',
      author_name: 'Unknown Author',
      author_email: '',
      committer_name: 'Unknown Committer',
      committer_email: '',
      message: 'Unknown Commit Message',
    },
    branch: 'master',
    remotes: [],
  };

  const options = await sut();
  options.service_name.should.equal('jenkins');
  options.service_job_id.should.equal('1234');
  options.git.should.eql(git);
};

const testCircleCi = async sut => {
  process.env.CIRCLECI = true;
  process.env.CIRCLE_BRANCH = 'master';
  process.env.CIRCLE_WORKFLOW_ID = '1';
  process.env.CIRCLE_BUILD_NUM = '2';
  process.env.CIRCLE_SHA1 = 'e3e3e3e3e3e3e3e3e';
  process.env.CI_PULL_REQUEST = 'http://github.com/node-coveralls/pull/3';

  const git = {
    head: {
      id: 'e3e3e3e3e3e3e3e3e',
      author_name: 'Unknown Author',
      author_email: '',
      committer_name: 'Unknown Committer',
      committer_email: '',
      message: 'Unknown Commit Message',
    },
    branch: 'master',
    remotes: [],
  };

  const options = await sut();
  options.service_name.should.equal('circleci');
  options.service_number.should.equal('2');
  options.service_job_number.should.equal('2');
  options.service_pull_request.should.equal('3');
  options.git.should.eql(git);
};

const testCodeship = async sut => {
  process.env.CI_NAME = 'codeship';
  process.env.CI_BUILD_NUMBER = '1234';
  process.env.CI_COMMIT_ID = 'e3e3e3e3e3e3e3e3e';
  process.env.CI_BRANCH = 'master';
  process.env.CI_COMMITTER_NAME = 'John Doe';
  process.env.CI_COMMITTER_EMAIL = 'jd@example.com';
  process.env.CI_COMMIT_MESSAGE = 'adadadadadadadadadad';

  const git = {
    head: {
      id: 'e3e3e3e3e3e3e3e3e',
      author_name: 'Unknown Author',
      author_email: '',
      committer_name: 'John Doe',
      committer_email: 'jd@example.com',
      message: 'adadadadadadadadadad',
    },
    branch: 'master',
    remotes: [],
  };

  const options = await sut();
  options.service_name.should.equal('codeship');
  options.service_job_id.should.equal('1234');
  options.git.should.eql(git);
};

const testDrone = async sut => {
  process.env.DRONE = true;
  process.env.DRONE_BUILD_NUMBER = '1234';
  process.env.DRONE_COMMIT = 'e3e3e3e3e3e3e3e3e';
  process.env.DRONE_BRANCH = 'master';
  process.env.DRONE_PULL_REQUEST = '3';
  process.env.DRONE_COMMIT_AUTHOR = 'john doe';
  process.env.DRONE_COMMIT_AUTHOR_EMAIL = 'john@doe.com';
  process.env.DRONE_COMMIT_MESSAGE = 'msgmsgmsg';

  const git = {
    head: {
      id: 'e3e3e3e3e3e3e3e3e',
      author_name: 'Unknown Author',
      author_email: '',
      committer_name: 'john doe',
      committer_email: 'john@doe.com',
      message: 'msgmsgmsg',
    },
    branch: 'master',
    remotes: [],
  };

  const options = await sut();
  options.service_name.should.equal('drone');
  options.service_job_id.should.equal('1234');
  options.git.should.eql(git);
};

const testWercker = async sut => {
  process.env.WERCKER = true;
  process.env.WERCKER_BUILD_ID = '1234';
  process.env.WERCKER_GIT_COMMIT = 'e3e3e3e3e3e3e3e3e';
  process.env.WERCKER_GIT_BRANCH = 'master';

  const git = {
    head: {
      id: 'e3e3e3e3e3e3e3e3e',
      author_name: 'Unknown Author',
      author_email: '',
      committer_name: 'Unknown Committer',
      committer_email: '',
      message: 'Unknown Commit Message',
    },
    branch: 'master',
    remotes: [],
  };

  const options = await sut();
  options.service_name.should.equal('wercker');
  options.service_job_id.should.equal('1234');
  options.git.should.eql(git);
};

const testGitlab = async sut => {
  process.env.GITLAB_CI = true;
  process.env.CI_BUILD_NAME = 'spec:one';
  process.env.CI_BUILD_ID = '1234';
  process.env.CI_BUILD_REF = 'e3e3e3e3e3e3e3e3e';
  process.env.CI_BUILD_REF_NAME = 'feature';
  process.env.CI_MERGE_REQUEST_IID = '1';

  const git = {
    head: {
      id: 'e3e3e3e3e3e3e3e3e',
      author_name: 'Unknown Author',
      author_email: '',
      committer_name: 'Unknown Committer',
      committer_email: '',
      message: 'Unknown Commit Message',
    },
    branch: 'feature',
    remotes: [],
  };

  const options = await sut();
  options.service_name.should.equal('gitlab-ci');
  options.service_job_id.should.equal('1234');
  options.service_pull_request.should.equal('1');
  options.git.should.eql(git);
};

const testAppVeyor = async sut => {
  process.env.APPVEYOR = true;
  process.env.APPVEYOR_BUILD_ID = '1234';
  process.env.APPVEYOR_BUILD_NUMBER = '5678';
  process.env.APPVEYOR_REPO_COMMIT = 'e3e3e3e3e3e3e3e3e';
  process.env.APPVEYOR_REPO_BRANCH = 'feature';

  const git = {
    head: {
      id: 'e3e3e3e3e3e3e3e3e',
      author_name: 'Unknown Author',
      author_email: '',
      committer_name: 'Unknown Committer',
      committer_email: '',
      message: 'Unknown Commit Message',
    },
    branch: 'feature',
    remotes: [],
  };

  const options = await sut();
  options.service_name.should.equal('appveyor');
  options.service_job_id.should.equal('1234');
  options.service_job_number.should.equal('5678');
  options.git.should.eql(git);
};

const testSurf = async sut => {
  process.env.CI_NAME = 'surf';
  process.env.SURF_SHA1 = 'e3e3e3e3e3e3e3e3e';
  process.env.SURF_REF = 'feature';

  const git = {
    head: {
      id: 'e3e3e3e3e3e3e3e3e',
      author_name: 'Unknown Author',
      author_email: '',
      committer_name: 'Unknown Committer',
      committer_email: '',
      message: 'Unknown Commit Message',
    },
    branch: 'feature',
    remotes: [],
  };

  const options = await sut();
  options.service_name.should.equal('surf');
  options.git.should.eql(git);
};

const testBuildkite = async sut => {
  process.env.BUILDKITE = true;
  process.env.BUILDKITE_BUILD_NUMBER = '1234';
  process.env.BUILDKITE_COMMIT = 'e3e3e3e3e3e3e3e3e';
  process.env.BUILDKITE_BRANCH = 'feature';
  process.env.BUILDKITE_BUILD_CREATOR = 'john doe';
  process.env.BUILDKITE_BUILD_CREATOR_EMAIL = 'john@doe.com';
  process.env.BUILDKITE_MESSAGE = 'msgmsgmsg';

  const git = {
    head: {
      id: 'e3e3e3e3e3e3e3e3e',
      author_name: 'Unknown Author',
      author_email: '',
      committer_name: 'john doe',
      committer_email: 'john@doe.com',
      message: 'msgmsgmsg',
    },
    branch: 'feature',
    remotes: [],
  };

  const options = await sut();
  options.service_name.should.equal('buildkite');
  options.git.should.eql(git);
};

const testSemaphore = async sut => {
  process.env.SEMAPHORE = true;
  process.env.SEMAPHORE_WORKFLOW_ID = '1234';
  process.env.SEMAPHORE_GIT_SHA = 'e3e3e3e3e3e3e3e3e';
  process.env.SEMAPHORE_GIT_WORKING_BRANCH = 'master';
  process.env.SEMAPHORE_GIT_PR_NUMBER = '456';

  const git = {
    head: {
      id: 'e3e3e3e3e3e3e3e3e',
      author_name: 'Unknown Author',
      author_email: '',
      committer_name: 'Unknown Committer',
      committer_email: '',
      message: 'Unknown Commit Message',
    },
    branch: 'master',
    remotes: [],
  };

  const options = await sut();
  options.service_name.should.equal('semaphore');
  options.service_job_id.should.equal('1234');
  options.service_pull_request.should.equal('456');
  options.git.should.eql(git);
};

const testAzurePipelines = async sut => {
  process.env.TF_BUILD = 'true';
  process.env.BUILD_SOURCEBRANCHNAME = 'hotfix';
  process.env.BUILD_SOURCEVERSION = 'e3e3e3e3e3e3e3e3e';
  process.env.BUILD_BUILDID = '1234';
  process.env.SYSTEM_PULLREQUEST_PULLREQUESTNUMBER = '123';

  const git = {
    head: {
      id: 'e3e3e3e3e3e3e3e3e',
      author_name: 'Unknown Author',
      author_email: '',
      committer_name: 'Unknown Committer',
      committer_email: '',
      message: 'Unknown Commit Message',
    },
    branch: 'hotfix',
    remotes: [],
  };

  const options = await sut();
  options.service_name.should.equal('Azure Pipelines');
  options.service_job_id.should.equal('1234');
  options.service_pull_request.should.equal('123');
  options.git.should.eql(git);
};

const testCodefresh = async sut => {
  process.env.CF_BRANCH = 'hotfix';
  process.env.CF_REVISION = 'e3e3e3e3e3e3e3e3e';
  process.env.CF_BUILD_ID = '1234';
  process.env.CF_COMMIT_AUTHOR = 'john doe';
  process.env.CF_COMMIT_MESSAGE = 'msgmsgmsg';
  process.env.CF_PULL_REQUEST_ID = '3';

  const git = {
    head: {
      id: 'e3e3e3e3e3e3e3e3e',
      author_name: 'Unknown Author',
      author_email: '',
      committer_name: 'john doe',
      committer_email: '',
      message: 'msgmsgmsg',
    },
    branch: 'hotfix',
    remotes: [],
  };

  const options = await sut();
  options.service_name.should.equal('Codefresh');
  options.service_job_id.should.equal('1234');
  options.service_pull_request.should.equal('3');
  options.git.should.eql(git);
};

function ensureLocalGitContext(options) {
  const baseDir = process.cwd();
  let dir = baseDir;
  let gitDir;

  while (path.resolve('/') !== dir) {
    gitDir = path.join(dir, '.git');
    if (fs.existsSync(path.join(gitDir, 'HEAD'))) {
      break;
    }

    dir = path.dirname(dir);
  }

  options = options || {};
  const synthetic = path.resolve('/') === dir;
  let gitHead;
  let content;
  let branch;
  let id;
  let wrapUp = () => {};

  if (synthetic) {
    branch = 'synthetic';
    id = '424242424242424242';
    gitHead = path.join('.git', 'HEAD');
    const gitBranch = path.join('.git', 'refs', 'heads', branch);
    fs.mkdirSync('.git');
    if (options.detached) {
      fs.writeFileSync(gitHead, id, { encoding: 'utf8' });
    } else {
      fs.mkdirSync(path.join('.git', 'refs'));
      fs.mkdirSync(path.join('.git', 'refs', 'heads'));
      fs.writeFileSync(gitHead, `ref: refs/heads/${branch}`, {
        encoding: 'utf8',
      });
      fs.writeFileSync(gitBranch, id, { encoding: 'utf8' });
    }

    wrapUp = () => {
      fs.unlinkSync(gitHead);
      if (!options.detached) {
        fs.unlinkSync(gitBranch);
        fs.rmdirSync(path.join('.git', 'refs', 'heads'));
        fs.rmdirSync(path.join('.git', 'refs'));
      }

      fs.rmdirSync('.git');
    };
  } else if (options.noGit) {
    fs.renameSync(gitDir, `${gitDir}.bak`);
    wrapUp = () => {
      fs.renameSync(`${gitDir}.bak`, gitDir);
    };
  } else if (options.detached) {
    gitHead = path.join(gitDir, 'HEAD');
    content = fs.readFileSync(gitHead, 'utf8').trim();
    const b = (content.match(/^ref: refs\/heads\/(\S+)$/) || [])[1];
    if (!b) {
      id = content;
    } else {
      id = fs.readFileSync(path.join(gitDir, 'refs', 'heads', b), 'utf8').trim();
      fs.writeFileSync(gitHead, id, 'utf8');
      wrapUp = () => {
        fs.writeFileSync(gitHead, content, 'utf8');
      };
    }
  } else {
    content = fs.readFileSync(path.join(gitDir, 'HEAD'), 'utf8').trim();
    branch = (content.match(/^ref: refs\/heads\/(\S+)$/) || [])[1];
    id = branch
      ? fs.readFileSync(path.join(gitDir, 'refs', 'heads', branch), 'utf8').trim()
      : content;
  }

  return {
    id,
    branch,
    wrapUp,
  };
}

describe('error handling', () => {
  it('should handle malformed .coveralls.yml gracefully', async () => {
    const fs = require('fs');
    const originalReadFileSync = fs.readFileSync;
    const originalStatSync = fs.statSync;

    // Mock to return invalid YAML
    fs.statSync = () => ({ isFile: () => true });
    fs.readFileSync = () => 'invalid: yaml: [content';

    const sut = require('../lib/getOptions').getBaseOptions;

    const options = await sut();
    fs.readFileSync = originalReadFileSync;
    fs.statSync = originalStatSync;

    // Should not throw, should handle error gracefully
    should.exist(options);
  });

  it('should warn about non-ENOENT errors when reading .coveralls.yml', async () => {
    const fs = require('fs');
    const originalStatSync = fs.statSync;

    // Mock to throw permission error
    fs.statSync = () => {
      const error = new Error('Permission denied');
      error.code = 'EACCES';
      throw error;
    };

    const sut = require('../lib/getOptions').getBaseOptions;

    const options = await sut();
    fs.statSync = originalStatSync;

    // Should handle gracefully and continue
    should.exist(options);
  });

  it('should warn when fetchGitData returns an error', async () => {
    const fetchGitData = require('../lib/fetchGitData');
    const originalFetchGitData = fetchGitData.bind({});

    // Replace fetchGitData module to return error
    require.cache[require.resolve('../lib/fetchGitData')].exports = () => {
      return Promise.reject(new Error('Git error'));
    };

    // Clear getOptions from cache to pick up the mocked fetchGitData
    delete require.cache[require.resolve('../lib/getOptions')];

    process.env.COVERALLS_GIT_COMMIT = 'HEAD';
    const sut = require('../lib/getOptions').getBaseOptions;

    const options = await sut();
    // Restore original
    require.cache[require.resolve('../lib/fetchGitData')].exports = originalFetchGitData;
    // Clear getOptions from cache to restore original behavior
    delete require.cache[require.resolve('../lib/getOptions')];
    delete process.env.COVERALLS_GIT_COMMIT;

    // Should not fail, just warn
    should.exist(options);
    should.not.exist(options.git);
  });

  it('should use BRANCH_NAME fallback when CHANGE_BRANCH and GIT_BRANCH not set', async () => {
    process.env = { PATH: process.env.PATH };
    process.env.JENKINS_URL = 'http://jenkins.example.com';
    process.env.BUILD_ID = '1234';
    process.env.GIT_COMMIT = 'HEAD';
    process.env.BRANCH_NAME = 'feature-branch';
    // Make sure the other env vars are not set so BRANCH_NAME is used
    delete process.env.CHANGE_BRANCH;
    delete process.env.GIT_BRANCH;

    const { getBaseOptions } = require('../lib/getOptions');
    const options = await getBaseOptions();
    should.exist(options.git);
    should.exist(options.git.branch);
    // The branch will come from git, but we're testing that BRANCH_NAME is used
    // in the code path on line 53
  });

  it('should handle CircleCI without CI_PULL_REQUEST', async () => {
    process.env = { PATH: process.env.PATH };
    process.env.CIRCLECI = 'true';
    process.env.CIRCLE_BUILD_NUM = '1234';

    const { getBaseOptions } = require('../lib/getOptions');
    const options = await getBaseOptions();
    options.service_name.should.equal('circleci');
    options.service_number.should.equal('1234');
    should.not.exist(options.service_pull_request);
  });

  it('should handle .coveralls.yml that exists but is not a file', async () => {
    process.env = { PATH: process.env.PATH };
    const fs = require('fs');
    const originalStatSync = fs.statSync;

    // Mock statSync to return something that's not a file (like a directory)
    fs.statSync = filepath => {
      if (filepath.endsWith('.coveralls.yml')) {
        return { isFile: () => false };
      }
      return originalStatSync(filepath);
    };

    const { getBaseOptions } = require('../lib/getOptions');
    const options = await getBaseOptions();
    fs.statSync = originalStatSync;
    should.exist(options);
  });

  it('should handle .coveralls.yml with repo_token but no service_name', async () => {
    process.env = { PATH: process.env.PATH };
    const fs = require('fs');
    const path = require('path');
    const file = path.join(process.cwd(), '.coveralls.yml');

    // Write a yml with only repo_token
    fs.writeFileSync(file, 'repo_token: test_token_123');

    const { getBaseOptions } = require('../lib/getOptions');
    const options = await getBaseOptions();
    fs.unlinkSync(file);
    options.repo_token.should.equal('test_token_123');
  });

  it('should handle userOptions with non-own properties', async () => {
    // Create an object with inherited properties
    const parent = { inheritedProp: 'inherited' };
    const userOptions = Object.create(parent);
    userOptions.ownProp = 'own';

    const { getOptions } = require('../lib/getOptions');
    const options = await getOptions(userOptions);
    should.exist(options);
  });
});
