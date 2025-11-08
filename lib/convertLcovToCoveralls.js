'use strict';

const fs = require('fs');
const path = require('path');
const lcovParse = require('lcov-parse');
const { promisify } = require('util');
const nodeCrypto = require('crypto');
const createLogger = require('./logger');

const lcovParseAsync = promisify(lcovParse);

/**
 * Converts line hit details from LCOV format to Coveralls coverage array format
 * @param {number} length - Total number of lines in the source file
 * @param {Array<{line: number, hit: number}>} details - Array of line coverage details from LCOV
 * @returns {Array<number|null>} Coverage array where each index represents a line (hit count or null)
 * @private
 */
const detailsToCoverage = (length, details) => {
  const coverage = new Array(length);

  details.forEach(object => {
    coverage[object.line - 1] = object.hit;
  });

  return coverage;
};

/**
 * Converts branch coverage details from LCOV format to Coveralls branch array format
 * @param {Array<{line: number, block: number, branch: number, taken: number}>} details
 *   Branch coverage details from LCOV
 * @returns {Array<number>} Flat array of branch data [line, block, branch, taken, ...]
 * @private
 */
const detailsToBranches = details => {
  const branches = [];

  details.forEach(object => {
    ['line', 'block', 'branch', 'taken'].forEach(key => {
      branches.push(object[key] || 0);
    });
  });

  return branches;
};

/**
 * Converts a single LCOV file object to Coveralls source file format
 * @param {Object} file - LCOV parsed file object with coverage data
 * @param {string} filepath - Base filepath for resolving relative paths
 * @returns {Object} Coveralls source file object with name, source, coverage, branches, and source_digest
 * @throws {Error} If source file cannot be read
 * @private
 */
const convertLcovFileObject = (file, filepath) => {
  const rootpath = filepath;
  filepath = path.resolve(rootpath, file.file);
  const source = fs.readFileSync(filepath, 'utf8');
  const md5 = nodeCrypto.createHash('md5').update(source).digest('hex');
  const lines = source.split('\n');
  const coverage = detailsToCoverage(lines.length, file.lines.details);
  const branches = detailsToBranches(file.branches.details);

  return {
    name: path.relative(rootpath, path.resolve(rootpath, file.file)).split(path.sep).join('/'),
    source_digest: md5,
    source,
    coverage,
    branches,
  };
};

/**
 * Cleans file paths by removing loader prefixes (e.g., webpack loader syntax)
 * Handles paths with '!' character used by build tools to specify loaders
 * @param {string} file - File path that may contain loader syntax
 * @returns {string} Cleaned file path without loader prefixes
 * @private
 */
const cleanFilePath = file => {
  if (file.includes('!')) {
    const regex = /^(.*!)(.*)$/g;
    const matches = regex.exec(file);
    return matches[matches.length - 1];
  }

  return file;
};

/**
 * Converts LCOV coverage data to Coveralls API format
 * @param {string} input - LCOV format string or file path containing coverage data
 * @param {Object} options - Configuration options for the conversion
 * @param {string} [options.filepath=''] - Base path for resolving source file paths
 * @param {string} [options.flag_name] - Flag name to differentiate coverage runs
 * @param {Object} [options.git] - Git metadata (commit, branch, remotes)
 * @param {string} [options.git.head.id] - Commit SHA (also used for commit_sha field)
 * @param {string} [options.run_at] - ISO 8601 timestamp of when tests were run
 * @param {string} [options.service_name] - CI service name (e.g., 'travis-ci', 'github-actions')
 * @param {string} [options.service_number] - CI build number
 * @param {string} [options.service_job_id] - CI job ID
 * @param {string} [options.service_job_number] - CI job number
 * @param {string} [options.service_pull_request] - Pull request number
 * @param {string} [options.repo_token] - Coveralls repository token
 * @param {boolean} [options.parallel] - Whether this is a parallel build
 * @param {Object} [cliOptions] - CLI options
 * @returns {Promise<Object>} Coveralls formatted coverage data
 * @throws {Error} If LCOV parsing fails or source files cannot be read
 */
const convertLcovToCoveralls = async (input, options, cliOptions = {}) => {
  const logger = createLogger(cliOptions);
  let filepath = options.filepath || '';
  logger.debug('in: ', filepath);
  filepath = path.resolve(process.cwd(), filepath);

  try {
    const parsed = await lcovParseAsync(input);

    const postJson = {
      source_files: [],
    };

    if (options.flag_name) {
      postJson.flag_name = options.flag_name;
    }

    if (options.git) {
      postJson.git = options.git;
    }

    if (options.run_at) {
      postJson.run_at = options.run_at;
    }

    if (options.service_name) {
      postJson.service_name = options.service_name;
    }

    if (options.service_number) {
      postJson.service_number = options.service_number;
    }

    if (options.service_job_id) {
      postJson.service_job_id = options.service_job_id;
    }

    if (options.service_job_number) {
      postJson.service_job_number = options.service_job_number;
    }

    if (options.service_pull_request) {
      postJson.service_pull_request = options.service_pull_request;
    }

    if (options.repo_token) {
      postJson.repo_token = options.repo_token;
    }

    if (options.parallel) {
      postJson.parallel = options.parallel;
    }

    if (options.git?.head?.id) {
      postJson.commit_sha = options.git.head.id;
    }

    parsed.forEach(file => {
      file.file = cleanFilePath(file.file);
      const currentFilePath = path.resolve(filepath, file.file);
      if (fs.existsSync(currentFilePath)) {
        postJson.source_files.push(convertLcovFileObject(file, filepath));
      }
    });

    return postJson;
  } catch (err) {
    logger.error('error from lcovParse: ', err);
    logger.error('input: ', input);
    throw err;
  }
};

module.exports = convertLcovToCoveralls;

/* example coveralls json file

{
  "service_job_id": "1234567890",
  "service_name": "travis-ci",
  "source_files": [
    {
      "name": "example.rb",
      "source": "def four\n  4\nend",
      "coverage": [null, 1, null]
    },
    {
      "name": "two.rb",
      "source": "def seven\n  eight\n  nine\nend",
      "coverage": [null, 1, 0, null]
    }
  ]
}

example output from lcov parser:

[
  {
    "file": "index.js",
    "lines": {
      "found": 0,
      "hit": 0,
      "details": [
        {
          "line": 1,
          "hit": 1
        },
        {
          "line": 2,
          "hit": 1
        },
        {
          "line": 3,
          "hit": 1
        },
        {
          "line": 5,
          "hit": 1
        }
      ]
    }
  }
]

*/
