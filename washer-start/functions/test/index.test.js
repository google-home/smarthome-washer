const assert = require('assert');
const myFunctions = require('../index.js');

describe('Cloud Functions', () => {
  it('should export login function', () => {
    assert.ok(myFunctions.login);
  });
  it('should export fakeauth function', () => {
    assert.ok(myFunctions.fakeauth);
  });
  it('should export faketoken function', () => {
    assert.ok(myFunctions.faketoken);
  });
  it('should export smarthome function', () => {
    assert.ok(myFunctions.smarthome);
  });
  it('should export requestsync function', () => {
    assert.ok(myFunctions.requestsync);
  });
  it('should export reportstate function', () => {
    assert.ok(myFunctions.reportstate);
  });
});
