'use strict';

const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

/**
 * Fetches and enriches git metadata with information from the local git repository
 * Validates required fields and fills in missing data using git commands
 * Uses parallel git commands for better performance
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
 * @returns {Promise<Object>} Enriched git metadata object
 * @throws {Error} If required fields are missing or git commands fail
 */
async function fetchGitData(git) {
  // -- Malformed/undefined git object
  if (typeof git === 'undefined') {
    throw new Error('No options passed');
  }

  if (!Object.prototype.hasOwnProperty.call(git, 'head')) {
    throw new Error('You must provide the head');
  }

  if (!Object.prototype.hasOwnProperty.call(git.head, 'id')) {
    throw new Error('You must provide the head.id');
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

  // -- Fetch all git data in parallel for better performance
  try {
    // Format: commit_hash\nauthor_name\nauthor_email\ncommitter_name\ncommitter_email\nmessage
    const format = '%H%n%an%n%ae%n%cn%n%ce%n%s';
    const [commitInfo, branchInfo, remotesInfo] = await Promise.all([
      execFileAsync('git', ['log', '-1', `--pretty=format:${format}`, git.head.id]),
      git.branch
        ? Promise.resolve({ stdout: git.branch })
        : execFileAsync('git', ['rev-parse', '--abbrev-ref', 'HEAD']),
      execFileAsync('git', ['remote', '-v']),
    ]);

    // Parse commit info
    const lines = commitInfo.stdout.split('\n');
    git.head.id = lines[0];
    git.head.author_name = lines[1] || '';
    git.head.author_email = lines[2] || '';
    git.head.committer_name = lines[3] || '';
    git.head.committer_email = lines[4] || '';
    git.head.message = lines[5] || '';

    // Parse branch info
    const branch = branchInfo.stdout.trim();
    // 'HEAD' means detached HEAD state, so we don't set the branch
    if (branch && branch !== 'HEAD') {
      git.branch = branch;
    } else {
      git.branch = '';
    }

    // Parse remotes
    const processed = {};
    remotesInfo.stdout.split('\n').forEach(remote => {
      if (!/\s\(push\)$/.test(remote)) {
        return;
      }

      remote = remote.split(/\s+/);
      saveRemote(processed, git, remote[0], remote[1]);
    });

    return git;
  } catch {
    // git is not available or command failed...
    git.head.author_name = git.head.author_name || 'Unknown Author';
    git.head.author_email = git.head.author_email || '';
    git.head.committer_name = git.head.committer_name || 'Unknown Committer';
    git.head.committer_email = git.head.committer_email || '';
    git.head.message = git.head.message || 'Unknown Commit Message';
    return git;
  }
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
