'use strict';

const index = require('..');
const logger = require('./logger')(index.options);

/**
 * Main orchestration function that processes coverage input and sends to Coveralls
 * Coordinates getOptions, convertLcovToCoveralls, and sendToCoveralls in sequence
 * @param {string} input - LCOV format coverage data
 * @param {Function} cb - Callback function (err, responseBody)
 * @param {Object} [userOptions] - Optional user-provided configuration options
 * @returns {void}
 * @throws {Error} Via callback if any step fails or HTTP response is >= 400
 */
function handleInput(input, cb, userOptions) {
  logger.debug(input);
  logger.debug(`user options ${userOptions}`);
  index.getOptions((err, options) => {
    if (err) {
      logger.error('error from getOptions');
      cb(err);
      return;
    }

    logger.debug(options);

    index.convertLcovToCoveralls(input, options, (err, postData) => {
      if (err) {
        logger.error('error from convertLcovToCoveralls');
        cb(err);
        return;
      }

      logger.info('sending this to coveralls.io: ', JSON.stringify(postData));
      index.sendToCoveralls(postData, (err, response) => {
        if (err) {
          cb(err);
          return;
        }

        if (response.statusCode >= 400) {
          cb(new Error(`Bad response: ${response.statusCode} ${response.body}`));
          return;
        }

        logger.debug(response.statusCode);
        logger.debug(response.body);
        cb(null, response.body);
      });
    });
  }, userOptions);
}

module.exports = handleInput;
