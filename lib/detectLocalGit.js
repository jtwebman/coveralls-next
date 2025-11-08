'use strict';

const fs = require('fs');
const path = require('path');

// branch naming only has a few excluded characters, see git-check-ref-format(1)
const REGEX_BRANCH = /^ref: refs\/heads\/([^?*[\\~^:]+)$/;

/**
 * Detects local git repository information from the file system
 * Searches up the directory tree from the current working directory to find .git folder
 * @returns {Object|undefined} Git info object with git_commit and optionally git_branch, or undefined if not a git repo
 * @returns {string} returns.git_commit - The commit hash (SHA-1)
 * @returns {string} [returns.git_branch] - The branch name (only if not detached HEAD)
 * @throws {Error} If .git/HEAD or packed-refs cannot be read
 */
function detectLocalGit() {
  let dir = process.cwd();
  let gitDir;

  while (path.resolve('/') !== dir) {
    gitDir = path.join(dir, '.git');
    if (fs.existsSync(path.join(gitDir, 'HEAD'))) {
      break;
    }

    dir = path.dirname(dir);
  }

  if (path.resolve('/') === dir) {
    return;
  }

  try {
    const head = fs.readFileSync(path.join(dir, '.git', 'HEAD'), 'utf-8').trim();
    const branch = (head.match(REGEX_BRANCH) || [])[1];
    if (!branch) {
      return { git_commit: head };
    }

    const commit = _parseCommitHashFromRef(dir, branch);

    return {
      git_commit: commit,
      git_branch: branch,
    };
  } catch {
    // If we can't read git data, return undefined
    return;
  }
}

/**
 * Parses the commit hash for a given branch from git refs
 * First checks refs/heads/{branch}, falls back to packed-refs if not found
 * @param {string} dir - Directory containing .git folder
 * @param {string} branch - Branch name to look up
 * @returns {string} Commit hash (SHA-1)
 * @throws {Error} If refs file or packed-refs cannot be read
 * @private
 */
function _parseCommitHashFromRef(dir, branch) {
  const ref = path.join(dir, '.git', 'refs', 'heads', branch);
  if (fs.existsSync(ref)) {
    return fs.readFileSync(ref, 'utf-8').trim();
  }

  // ref does not exist; get it from packed-refs
  let commit = '';
  const packedRefs = path.join(dir, '.git', 'packed-refs');
  const packedRefsText = fs.readFileSync(packedRefs, 'utf-8');
  packedRefsText.split('\n').forEach(line => {
    if (line.match(`refs/heads/${branch}`)) {
      commit = line.split(' ')[0];
    }
  });
  return commit;
}

module.exports = detectLocalGit;
