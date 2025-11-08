'use strict';

const { parseArgs } = require('node:util');

// this needs to go before the other require()s so that
// the other files can already use index.options
const { values, positionals } = parseArgs({
  options: {
    verbose: { type: 'boolean', short: 'v' },
    stdout: { type: 'boolean', short: 's' },
  },
  strict: false,
  args: process.argv.slice(2),
});

// Maintain compatibility with minimist API
module.exports.options = {
  ...values,
  _: positionals,
};

module.exports.convertLcovToCoveralls = require('./lib/convertLcovToCoveralls');
module.exports.sendToCoveralls = require('./lib/sendToCoveralls');
module.exports.getBaseOptions = require('./lib/getOptions').getBaseOptions;
module.exports.getOptions = require('./lib/getOptions').getOptions;
module.exports.handleInput = require('./lib/handleInput');
module.exports.logger = require('./lib/logger');
