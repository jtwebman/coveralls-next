'use strict';

const { execFile } = require('child_process');

/**
 * Fetches and enriches git metadata with information from the local git repository
 * Validates required fields and fills in missing data using git commands
 * @param {Object} git - Git metadata object to enrich
 * @param {Object} git.head - Commit head information
 * @param {string} git.head.id - Commit hash (can be 'HEAD' or specific SHA)
 * @param {string} [git.head.author_name] - Commit author name
 * @param {string} [git.head.author_email] - Commit author email
 * @param {string} [git.head.committer_name] - Committer name
 * @param {string} [git.head.committer_email] - Committer email
 * @param {string} [git.head.message] - Commit message
 * @param {string} [git.branch] - Branch name
 * @param {Array<{name: string, url: string}>} [git.remotes] - Git remotes
 * @param {Function} cb - Callback function (err, enrichedGit)
 * @returns {void}
 * @throws {Error} Via callback if required fields are missing or git commands fail
 */
function fetchGitData(git, cb) {
  if (!cb) {
    throw new Error('fetchGitData requires a callback');
  }

  // -- Malformed/undefined git object
  if (typeof git === 'undefined') {
    return cb(new Error('No options passed'));
  }

  if (!Object.prototype.hasOwnProperty.call(git, 'head')) {
    return cb(new Error('You must provide the head'));
  }

  if (!Object.prototype.hasOwnProperty.call(git.head, 'id')) {
    return cb(new Error('You must provide the head.id'));
  }

  // -- Set required properties of git if they weren"t provided
  if (!Object.prototype.hasOwnProperty.call(git, 'branch')) {
    git.branch = '';
  }

  if (!Object.prototype.hasOwnProperty.call(git, 'remotes')) {
    git.remotes = [];
  }

  // -- Assert the property types
  if (typeof git.branch !== 'string') {
    git.branch = '';
  }

  if (!Array.isArray(git.remotes)) {
    git.remotes = [];
  }

  // -- Use git?
  execFile('git', ['rev-parse', '--verify', git.head.id], err => {
    if (err) {
      // git is not available...
      git.head.author_name = git.head.author_name || 'Unknown Author';
      git.head.author_email = git.head.author_email || '';
      git.head.committer_name = git.head.committer_name || 'Unknown Committer';
      git.head.committer_email = git.head.committer_email || '';
      git.head.message = git.head.message || 'Unknown Commit Message';
      return cb(null, git);
    }

    fetchHeadDetails(git, cb);
  });
}

/**
 * Fetches the current branch name using git branch command
 * Sets git.branch if a valid branch is detected (excludes detached HEAD states)
 * @param {Object} git - Git metadata object to update
 * @param {Function} cb - Callback function (err, git)
 * @returns {void}
 * @private
 */
function fetchBranch(git, cb) {
  execFile('git', ['branch'], (err, branches) => {
    if (err) {
      return cb(err);
    }

    git.branch = (branches.match(/^\* ([\w./-]+)/m) || [])[1] ?? '';
    fetchRemotes(git, cb);
  });
}

const REGEX_COMMIT_DETAILS =
  /\nauthor (.+?) <([^>]*)>.+\ncommitter (.+?) <([^>]*)>.+[\S\s]*?\n\n(.*)/m;

/**
 * Fetches detailed commit information using git cat-file
 * Populates author, committer, and message fields in git.head
 * @param {Object} git - Git metadata object to update
 * @param {Function} cb - Callback function (err, git)
 * @returns {void}
 * @private
 */
function fetchHeadDetails(git, cb) {
  execFile('git', ['cat-file', '-p', git.head.id], (err, response) => {
    if (err) {
      return cb(err);
    }

    const match = response.match(REGEX_COMMIT_DETAILS);
    if (!match) {
      return cb(new Error('Unable to parse commit details from git cat-file output'));
    }

    const items = match.slice(1);
    const fields = ['author_name', 'author_email', 'committer_name', 'committer_email', 'message'];
    fields.forEach((field, index) => {
      git.head[field] = items[index];
    });

    if (git.branch) {
      fetchRemotes(git, cb);
    } else {
      fetchBranch(git, cb);
    }
  });
}

/**
 * Fetches git remotes using git remote -v command
 * Filters to only include push remotes and deduplicates entries
 * @param {Object} git - Git metadata object to update
 * @param {Function} cb - Callback function (err, git)
 * @returns {void}
 * @private
 */
function fetchRemotes(git, cb) {
  execFile('git', ['remote', '-v'], (err, remotes) => {
    if (err) {
      return cb(err);
    }

    const processed = {};
    remotes.split('\n').forEach(remote => {
      if (!/\s\(push\)$/.test(remote)) {
        return;
      }

      remote = remote.split(/\s+/);
      saveRemote(processed, git, remote[0], remote[1]);
    });
    cb(null, git);
  });
}

/**
 * Saves a remote to the git.remotes array if not already processed
 * Uses a processed map to deduplicate remotes by name-url combination
 * @param {Object} processed - Map of already processed remotes (key: "name-url")
 * @param {Object} git - Git metadata object to update
 * @param {string} name - Remote name (e.g., "origin")
 * @param {string} url - Remote URL
 * @returns {void}
 * @private
 */
function saveRemote(processed, git, name, url) {
  const key = `${name}-${url}`;
  if (Object.prototype.hasOwnProperty.call(processed, key)) {
    return;
  }

  processed[key] = true;
  git.remotes.push({ name, url });
}

module.exports = fetchGitData;
