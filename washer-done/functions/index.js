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
  key: '<api-key>',
  jwt: require('./key.json'),
});

app.onSync(() => {
  return {
    requestId: 'ff36a3cc-ec34-11e6-b1a0-64510650abcf',
    payload: {
      agentUserId: '123',
      devices: [{
        id: 'washer',
        type: 'action.devices.types.WASHER',
        traits: [
          'action.devices.traits.OnOff',
          'action.devices.traits.StartStop',
          'action.devices.traits.RunCycle',
          'action.devices.traits.Modes',
          'action.devices.traits.Toggles',
        ],
        name: {
          defaultNames: ['My Washer'],
          name: 'Washer',
          nicknames: ['Washer'],
        },
        deviceInfo: {
          manufacturer: 'Acme Co',
          model: 'acme-washer',
          hwVersion: '1.0',
          swVersion: '1.0.1',
        },
        attributes: {
          pausable: true,
          availableModes: [{
            name: 'load',
            name_values: [{
              name_synonym: ['load'],
              lang: 'en',
            }],
            settings: [{
              setting_name: 'small',
              setting_values: [{
                setting_synonym: ['small'],
                lang: 'en',
              }],
            }, {
              setting_name: 'large',
              setting_values: [{
                setting_synonym: ['large'],
                lang: 'en',
              }],
            }],
            ordered: true,
          }],
          availableToggles: [{
            name: 'Turbo',
            name_values: [{
              name_synonym: ['turbo'],
              lang: 'en',
            }],
          }],
        },
      }],
    },
  };
});

const queryFirebase = (deviceId) => firebaseRef.child(deviceId).once('value')
  .then((snapshot) => {
    const snapshotVal = snapshot.val();
    return {
      on: snapshotVal.OnOff.on,
      isPaused: snapshotVal.StartStop.isPaused,
      isRunning: snapshotVal.StartStop.isRunning,
      load: snapshotVal.Modes.load,
      turbo: snapshotVal.Toggles.Turbo,
    };
  });

const queryDevice = (deviceId) => queryFirebase(deviceId).then((data) => ({
  on: data.on,
  isPaused: data.isPaused,
  isRunning: data.isRunning,
  currentRunCycle: [{
    currentCycle: 'rinse',
    nextCycle: 'spin',
    lang: 'en',
  }],
  currentTotalRemainingTime: 1212,
  currentCycleRemainingTime: 301,
  currentModeSettings: {
    load: data.load,
  },
  currentToggleSettings: {
    Turbo: data.turbo,
  },
}));

app.onQuery((body) => {
  const {requestId} = body;
  const payload = {
    devices: {},
  };
  const queryPromises = [];
  for (const input of body.inputs) {
    for (const device of input.payload.devices) {
      const deviceId = device.id;
      queryPromises.push(queryDevice(deviceId)
        .then((data) => {
          // Add response to device payload
          payload.devices[deviceId] = data;
        }
        ));
    }
  }
  // Wait for all promises to resolve
  return Promise.all(queryPromises).then((values) => ({
    requestId: requestId,
    payload: payload,
  })
  );
});

app.onExecute((body) => {
  const {requestId} = body;
  const payload = {
    commands: [{
      ids: [],
      status: 'SUCCESS',
      states: {
        online: true,
      },
    }],
  };
  for (const input of body.inputs) {
    for (const command of input.payload.commands) {
      for (const device of command.devices) {
        const deviceId = device.id;
        payload.commands[0].ids.push(deviceId);
        for (const execution of command.execution) {
          const execCommand = execution.command;
          const {params} = execution;
          switch (execCommand) {
            case 'action.devices.commands.OnOff':
              firebaseRef.child(deviceId).child('OnOff').update({
                on: params.on,
              });
              payload.commands[0].states.on = params.on;
              break;
            case 'action.devices.commands.StartStop':
              firebaseRef.child(deviceId).child('StartStop').update({
                isRunning: params.start,
              });
              payload.commands[0].states.isRunning = params.start;
              break;
            case 'action.devices.commands.PauseUnpause':
              firebaseRef.child(deviceId).child('StartStop').update({
                isPaused: params.pause,
              });
              payload.commands[0].states.isPaused = params.pause;
              break;
            case 'action.devices.commands.SetModes':
              firebaseRef.child(deviceId).child('Modes').update({
                load: params.updateModeSettings.load,
              });
              break;
            case 'action.devices.commands.SetToggles':
              firebaseRef.child(deviceId).child('Toggles').update({
                Turbo: params.updateToggleSettings.Turbo,
              });
              break;
          }
        }
      }
    }
  }
  return {
    requestId: requestId,
    payload: payload,
  };
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
      path: `/v1/devices:requestSync?key=${app.key}`,
      method: 'POST',
    };
    return new Promise((resolve, reject) => {
      let responseData = '';
      const req = https.request(options, (res) => {
        res.on('data', (d) => {
          responseData += d.toString();
        });
        res.on('end', () => {
          resolve(responseData);
        });
      });
      req.on('error', (e) => {
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
  const snapshotVal = event.data.val();

  const postData = {
    requestId: 'ff36a3cc', /* Any unique ID */
    agentUserId: '123', /* Hardcoded user ID */
    payload: {
      devices: {
        states: {
          /* Report the current state of our washer */
          [event.params.deviceId]: {
            on: snapshotVal.OnOff.on,
            isPaused: snapshotVal.StartStop.isPaused,
            isRunning: snapshotVal.StartStop.isRunning,
          },
        },
      },
    },
  };

  return reportState(postData, app.jwt)
    .then((data) => {
      console.log('Report state came back');
      console.info(data);
    });
});

const reportState = (url, data, jwt) => {
  console.log(JSON.stringify(data));
  const {google} = require('googleapis');
  const https = require('https');
  const encoding = 'utf8';
  const options = {
    hostname: 'homegraph.googleapis.com',
    port: 443,
    path: '/v1/devices:reportStateAndNotification',
    method: 'POST',
    headers: {},
  };

  const apiCall = (options) => {
    return new Promise((resolve, reject) => {
      const buffers = [];
      const req = https.request(options, (res) => {
        res.on('data', (d) => {
          buffers.push(typeof d === 'string' ? Buffer.from(d, encoding) : d);
        });

        res.on('end', () => {
          resolve(Buffer.concat(buffers).toString(encoding));
        });
      });

      req.on('error', (e) => {
        reject(e);
      });
      // Write data to request body
      req.write(JSON.stringify(data));
      req.end();
    });
  };

  if (jwt) {
    console.info('JWT');
    const jwtClient = new google.auth.JWT(
      jwt.client_email,
      undefined,
      jwt.private_key,
      ['https://www.googleapis.com/auth/homegraph'],
      undefined
    );

    return new Promise((resolve, reject) => {
      jwtClient.authorize((err, tokens) => {
        console.log(err, tokens);
        if (err) {
          reject(err);
        }
        options.headers = {
          Authorization: ` Bearer ${tokens.access_token}`,
        };
        resolve(options);
      });
    }).then((options) => {
      return apiCall(options);
    });
  } else {
    return apiCall(options);
  }
};
