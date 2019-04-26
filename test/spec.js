'use strict';

const test = require('ava');
const nock = require('nock');

const helper = require('../helper.js');

test('calls with success when a handler is sucessful', t => {
  const scope = nock('https://foo.com')
      .put('/success-handler?key=bar', {
        StackId: '123',
        RequestId: '456',
        LogicalResourceId: '789',
        Data: {},
        Reason: '',
        Status: 'SUCCESS',
      })
      .reply(200);

  return new Promise((resolve, reject) => {
    helper(() => Promise.resolve())({
      StackId: '123',
      RequestId: '456',
      LogicalResourceId: '789',
      RequestType: 'Delete',
      ResponseURL: 'https://foo.com/success-handler?key=bar'
    }, {
      getRemainingTimeInMillis: () => 5000
    }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    })
  })
  .then(() => {
    t.true(scope.isDone());
  })
});

test('calls with failed when handler throws', t => {
  const scope = nock('https://foo.com')
      .put('/failed-throw-handler?key=bar', {
        StackId: '567',
        RequestId: '456',
        LogicalResourceId: '789',
        Data: {},
        Reason: 'blahblahblah',
        Status: 'FAILED',
      })
      .reply(200);

  return new Promise((resolve, reject) => {
    helper(() => { throw new Error('blahblahblah') })({
      StackId: '567',
      RequestId: '456',
      LogicalResourceId: '789',
      RequestType: 'Create',
      ResponseURL: 'https://foo.com/failed-throw-handler?key=bar'
    }, {
      getRemainingTimeInMillis: () => 5000
    }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    })
  })
  .then(() => {
    t.true(scope.isDone());
  })
});

test('calls with failed when timed out', t => {
  const scope = nock('https://foo.com')
      .put('/failed-timeout?key=bar', {
        StackId: '555',
        RequestId: '456',
        LogicalResourceId: '789',
        Data: {},
        Reason: 'Lambda function timed out',
        Status: 'FAILED',
      })
      .reply(200);

  return new Promise((resolve, reject) => {
    helper(() => new Promise(resolve => setTimeout(resolve, 5000)))({
      StackId: '555',
      RequestId: '456',
      LogicalResourceId: '789',
      RequestType: 'Create',
      ResponseURL: 'https://foo.com/failed-timeout?key=bar'
    }, {
      getRemainingTimeInMillis: () => 100
    }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    })
  })
  .then(() => {
    t.true(scope.isDone());
  })
});

test('callback with error when response has bad status code', t => {
  const scope = nock('https://foo.com')
      .put('/send-fails?key=bar', {
        StackId: '234',
        RequestId: '456',
        LogicalResourceId: '789',
        Data: {},
        Reason: '',
        Status: 'SUCCESS',
      })
      .reply(500);

  return new Promise((resolve) => {
    helper(() => Promise.resolve())({
      StackId: '234',
      RequestId: '456',
      LogicalResourceId: '789',
      RequestType: 'Create',
      ResponseURL: 'https://foo.com/send-fails?key=bar'
    }, {
      getRemainingTimeInMillis: () => 5000
    }, (err) => {
      resolve(!!err);
    });
  })
  .then((hadError) => {
    t.true(scope.isDone());
    t.true(hadError);
  })
});

test('callback with error when request fails', t => {
  nock('https://foo.com')
      .put('/will-not-match?key=bar', {
        StackId: '234',
        RequestId: '456',
        LogicalResourceId: '789',
        Data: {},
        Reason: '',
        Status: 'SUCCESS',
      })
      .reply(200);

  return new Promise((resolve) => {
    helper(() => Promise.resolve())({
      StackId: '234',
      RequestId: '456 ',
      LogicalResourceId: '789',
      RequestType: 'Create',
      ResponseURL: 'https://foo.com/asdf?key=bar'
    }, {
      getRemainingTimeInMillis: () => 5000
    }, (err) => {
      resolve(!!err);
    });
  })
  .then((hadError) => {
    t.true(hadError);
  })
});
