/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

const functions = require('firebase-functions');
const {smarthome} = require('actions-on-google');
const cors = require('cors')({origin: true});
const util = require('util');
const firebase = require('firebase');
// Initialize Firebase
const config = functions.config().firebase;
firebase.initializeApp(config);
// eslint-disable-next-line no-unused-vars
const firebaseRef = firebase.database().ref('/');

exports.fakeauth = functions.https.onRequest((request, response) => {
  const responseurl = util.format('%s?code=%s&state=%s',
    decodeURIComponent(request.query.redirect_uri), 'xxxxxx',
    request.query.state);
  console.log(responseurl);
  return response.redirect(responseurl);
});

exports.faketoken = functions.https.onRequest((request, response) => {
  const grantType = request.query.grant_type
    ? request.query.grant_type : request.body.grant_type;
  const secondsInDay = 86400; // 60 * 60 * 24
  const HTTP_STATUS_OK = 200;
  console.log(`Grant type ${grantType}`);

  let obj;
  if (grantType === 'authorization_code') {
    obj = {
      token_type: 'bearer',
      access_token: '123access',
      refresh_token: '123refresh',
      expires_in: secondsInDay,
    };
  } else if (grantType === 'refresh_token') {
    obj = {
      token_type: 'bearer',
      access_token: '123access',
      expires_in: secondsInDay,
    };
  }
  response.status(HTTP_STATUS_OK)
    .json(obj);
});

const app = smarthome({
  debug: true,
  API_KEY: '<api-key>',
});

app.onSync((body) => {
  // TODO: Implement SYNC response
  return {
    requestId: 'ff36a3cc-ec34-11e6-b1a0-64510650abcf',
    payload: {
      agentUserId: '123',
      devices: [],
    },

  };
//  return {};
});

const queryFirebase = (deviceId) => firebaseRef.child(deviceId).once('value')
  .then((snapshot) => {
    const snapshotVal = snapshot.val();
    return {
      on: snapshotVal.OnOff.on,
      isPaused: snapshotVal.StartStop.isPaused,
      isRunning: snapshotVal.StartStop.isRunning,
    };
  });

const queryDevice = (deviceId) => queryFirebase(deviceId).then((data) => ({
  on: data.on,
  isPaused: data.isPaused,
  isRunning: data.isRunning,
}));

app.onQuery((body) => {
  // TODO: Implement QUERY response
  return {};
});

app.onExecute((body) => {
  // TODO: Implement EXECUTE response
  return {};
});

exports.smarthome = functions.https.onRequest(app);

exports.requestsync = functions.https.onRequest((request, response) => {
  console.info('Request SYNC for user 123');
  const https = require('https');
  const postData = {
    agentUserId: '123', /* Hardcoded user ID */
  };
  return cors(request, response, () => {
    const options = {
      hostname: 'homegraph.googleapis.com',
      port: 443,
      path: `/v1/devices:requestSync?key=${app.API_KEY}`,
      method: 'POST',
    };
    return new Promise(function(resolve, reject) {
      let responseData = '';
      const req = https.request(options, function(res) {
        res.on('data', function(d) {
          responseData += d.toString();
        });
        res.on('end', function() {
          resolve(responseData);
        });
      });
      req.on('error', function(e) {
        reject(e);
      });
      // Write data to request body
      req.write(JSON.stringify(postData));
      req.end();
    }).then((data) => {
      console.log('Request sync completed');
      response.json(data);
    }).catch((err) => {
      console.error(err);
    });
  });
});

/**
 * Send a REPORT STATE call to the homegraph when data for any device id
 * has been changed.
 */
exports.reportstate = functions.database.ref('{deviceId}').onWrite((event) => {
  console.info('Firebase write event triggered this cloud function');
});
