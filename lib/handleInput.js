'use strict';

const index = require('..');
const logger = require('./logger')(index.options);

/**
 * Main orchestration function that processes coverage input and sends to Coveralls
 * Coordinates getOptions, convertLcovToCoveralls, and sendToCoveralls in sequence
 * @param {string} input - LCOV format coverage data
 * @param {Object} [userOptions] - Optional user-provided configuration options
 * @returns {Promise<string>} Response body from Coveralls API
 * @throws {Error} If any step fails or HTTP response is >= 400
 */
async function handleInput(input, userOptions) {
  logger.debug(input);
  logger.debug(`user options ${userOptions}`);

  const options = await index.getOptions(userOptions);
  logger.debug(options);

  const postData = await index.convertLcovToCoveralls(input, options);

  logger.info('sending this to coveralls.io: ', JSON.stringify(postData));
  const response = await index.sendToCoveralls(postData);

  if (response.statusCode >= 400) {
    throw new Error(`Bad response: ${response.statusCode} ${response.body}`);
  }

  logger.debug(response.statusCode);
  logger.debug(response.body);
  return response.body;
}

module.exports = handleInput;
