'use strict';

const convertLcovToCoveralls = require('./convertLcovToCoveralls');
const sendToCoveralls = require('./sendToCoveralls');
const { getOptions } = require('./getOptions');
const createLogger = require('./logger');

/**
 * Main orchestration function that processes coverage input and sends to Coveralls
 * Coordinates getOptions, convertLcovToCoveralls, and sendToCoveralls in sequence
 * @param {string} input - LCOV format coverage data
 * @param {Object} [userOptions] - Optional user-provided configuration options
 * @param {Object} [cliOptions] - CLI options (verbose, stdout, etc.)
 * @param {Object} [dependencies] - Injected dependencies for testing
 * @param {Function} [dependencies.getOptions] - Function to get options
 * @param {Function} [dependencies.convertLcovToCoveralls] - Function to convert LCOV
 * @param {Function} [dependencies.sendToCoveralls] - Function to send to Coveralls
 * @param {Function} [dependencies.createLogger] - Function to create logger
 * @returns {Promise<string>} Response body from Coveralls API
 * @throws {Error} If any step fails or HTTP response is >= 400
 */
async function handleInput(input, userOptions, cliOptions = {}, dependencies = {}) {
  const {
    getOptions: getOptionsFn = getOptions,
    convertLcovToCoveralls: convertFn = convertLcovToCoveralls,
    sendToCoveralls: sendFn = sendToCoveralls,
    createLogger: createLoggerFn = createLogger,
  } = dependencies;

  const logger = createLoggerFn(cliOptions);
  logger.debug(input);
  logger.debug(`user options ${userOptions}`);

  const options = await getOptionsFn(userOptions, cliOptions);
  logger.debug(options);

  const postData = await convertFn(input, options, cliOptions);

  logger.info('sending this to coveralls.io: ', JSON.stringify(postData));
  const response = await sendFn(postData, cliOptions);

  if (response.statusCode >= 400) {
    throw new Error(`Bad response: ${response.statusCode} ${response.body}`);
  }

  logger.debug(response.statusCode);
  logger.debug(response.body);
  return response.body;
}

module.exports = handleInput;
