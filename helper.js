'use strict';

const https = require('https');
const url = require('url');

function send(event, params) {
  const responseBody = Object.assign({
    StackId: event.StackId,
		RequestId: event.RequestId,
    LogicalResourceId: event.LogicalResourceId,
    Data: {},
    Reason: ''
  }, params);

	const json = JSON.stringify(responseBody);

	const parsedUrl = url.parse(event.ResponseURL);
	const options = {
		hostname: parsedUrl.hostname,
		port: 443,
		path: parsedUrl.path,
		method: 'PUT',
		headers: {
			'content-type': '',
			'content-length': json.length
		}
	};

	return new Promise((resolve, reject) => {
		const request = https.request(options, function(response) {
			if (response.statusCode < 300) {
				resolve(response);
			} else {
				reject(response);
			}
		});

		request.on('error', function(error) {
			reject(error);
		});

		request.write(json);
		request.end();
	});
}

module.exports = function customResourceHelper(fn) {
  return function handler(event, context, callback) {
    let finished = false;

    const delay = Math.max(context.getRemainingTimeInMillis() - 1000, 0);
    const timeout = setTimeout(() => {
      if (finished) {
        return;
      }

      finished = true;

      const result = {
        Status: 'FAILED',
        Reason: 'Lambda function timed out'
      };

      send(event, result)
        .then(() => callback())
        .catch(e => callback(e));
    }, delay);

    Promise.resolve()
      .then(() => {
        if (typeof fn === 'function') {
          return fn(event, context);
        }
      })
      .then(data => {
        return {
          Status: 'SUCCESS',
          Data: data || {}
        };
      })
      .catch(e => {
        return {
          Status: 'FAILED',
          Reason: e.message
        };
      })
      .then(result => {
        if (finished) {
          return;
        }

        finished = true;

        clearTimeout(timeout);

        return send(event, result).then(() => callback())
      })
      .catch(e => callback(e));
  };
};
