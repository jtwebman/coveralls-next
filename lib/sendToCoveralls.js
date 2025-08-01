'use strict';

const index = require('..');

const sendToCoveralls = async (object, cb) => {
  let urlBase = 'https://coveralls.io';
  if (process.env.COVERALLS_ENDPOINT) {
    urlBase = process.env.COVERALLS_ENDPOINT;
  }

  const url = `${urlBase}/api/v1/jobs`;

  if (index.options.stdout) {
    process.stdout.write(JSON.stringify(object));
    cb(null, { statusCode: 200 });
  } else {
    try {
      const formData = new FormData();
      formData.append('json', JSON.stringify(object));
      
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      });

      const bodyText = await response.text();
      
      cb(null, {
        statusCode: response.status,
        body: bodyText,
      });
    } catch (error) {
      // If it's a fetch error wrapping another error, unwrap it
      if (error.message === 'fetch failed' && error.cause) {
        cb(error.cause);
      } else {
        cb(error);
      }
    }
  }
};

module.exports = sendToCoveralls;