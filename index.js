'use strict';

const { parseArgs } = require('node:util');

const convertLcovToCoveralls = require('./lib/convertLcovToCoveralls');
const sendToCoveralls = require('./lib/sendToCoveralls');
const { getBaseOptions, getOptions: getOptionsInternal } = require('./lib/getOptions');
const handleInput = require('./lib/handleInput');
const logger = require('./lib/logger');

// Parse CLI arguments
const { values, positionals } = parseArgs({
  options: {
    verbose: { type: 'boolean', short: 'v' },
    stdout: { type: 'boolean', short: 's' },
  },
  strict: false,
  args: process.argv.slice(2),
});

const cliOptions = {
  ...values,
  _: positionals,
};

// Wrapper for getOptions that includes CLI options
const getOptions = async userOptions => {
  return getOptionsInternal(userOptions, cliOptions);
};

module.exports = {
  convertLcovToCoveralls,
  sendToCoveralls: obj => sendToCoveralls(obj, cliOptions),
  getBaseOptions,
  getOptions,
  handleInput: (input, userOptions) => handleInput(input, userOptions, cliOptions),
  logger,
  // Expose CLI options for backward compatibility with tests
  options: cliOptions,
};
