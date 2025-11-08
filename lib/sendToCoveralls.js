'use strict';

const index = require('..');

/**
 * Sends coverage data to Coveralls API or writes to stdout
 * Uses native fetch API to POST coverage data as multipart/form-data
 * @param {Object} object - Coverage data object in Coveralls format
 * @param {Array<Object>} object.source_files - Array of source file coverage data
 * @param {string} [object.repo_token] - Repository token for authentication
 * @param {string} [object.service_name] - CI service name
 * @param {string} [object.service_job_id] - CI job ID
 * @param {Object} [object.git] - Git metadata
 * @returns {Promise<Object>} Response object with statusCode and body properties
 * @returns {number} response.statusCode - HTTP status code
 * @returns {string} [response.body] - Response body text
 */
const sendToCoveralls = async object => {
  let urlBase = 'https://coveralls.io';
  if (process.env.COVERALLS_ENDPOINT) {
    urlBase = process.env.COVERALLS_ENDPOINT;
  }

  const url = `${urlBase}/api/v1/jobs`;

  if (index.options.stdout) {
    process.stdout.write(JSON.stringify(object));
    return { statusCode: 200 };
  }

  try {
    const formData = new FormData();
    formData.append('json', JSON.stringify(object));

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    const bodyText = await response.text();

    return {
      statusCode: response.status,
      body: bodyText,
    };
  } catch (error) {
    // If it's a fetch error wrapping another error, unwrap it
    if (error.message === 'fetch failed' && error.cause) {
      throw error.cause;
    }
    throw error;
  }
};

module.exports = sendToCoveralls;