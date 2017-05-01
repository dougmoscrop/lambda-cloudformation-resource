# lambda-cloudformation-resource

A wrapper for Lambda-backed custom resources in CloudFormation that has no dependencies and handles timeouts for you.

## Usage
```js
const helper = require('lambda-cloudformation-resource');

module.exports.handler = helper((event) => {
  if (event.RequestType === 'Delete') {
    // maybe you do not need to handle Delete
    return;
  }

  // return a promise
  return doSomething();
});
```
