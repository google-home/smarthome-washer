"use strict";

const functions = require('firebase-functions');
const { smarthome } = require('actions-on-google');
const cors = require('cors')({ origin: true });
const util = require('util');
const firebase = require('firebase');
// Initialize Firebase
const config = functions.config().firebase;
firebase.initializeApp(config);

const CLIENT_ID = 'ABC123';
const CLIENT_SECRET = 'DEF456';

exports.fakeauth = functions.https.onRequest((request, response) => {
  let responseurl = util.format('%s?code=%s&state=%s',
    decodeURIComponent(request.query.redirect_uri), 'xxxxxx',
    request.query.state);
  console.log(responseurl);
  return response.redirect(responseurl);
});

exports.faketoken = functions.https.onRequest((request, response) => {
  let grant_type = request.query.grant_type ?
    request.query.grant_type : request.body.grant_type;
  console.log("Grant type", grant_type);
  let obj;
  if (grant_type === 'authorization_code') {
    obj = {
      token_type: "bearer",
      access_token: '123access',
      refresh_token: '123refresh',
      expires_in: 60 * 60 * 24 // 1 day
    };
  } else if (grant_type === 'refresh_token') {
    obj = {
      token_type: "bearer",
      access_token: '123access',
      expires_in: 60 * 60 * 24 // 1 day
    };
  }
  response.status(200)
    .json(obj);
});

const app = smarthome({
  debug: true,
  API_KEY: '<api-key>'
});

app.onSync(() => {
  return {
    requestId: "ff36a3cc-ec34-11e6-b1a0-64510650abcf",
    payload: {
      agentUserId: "123",
      devices: [{
        id: "washer",
        type: "action.devices.types.WASHER",
        traits: [
          "action.devices.traits.OnOff",
          "action.devices.traits.StartStop",
          "action.devices.traits.RunCycle",
          "action.devices.traits.Modes",
          "action.devices.traits.Toggles",
        ],
        name: {
          defaultNames: ["My Washer"],
          name: "Washer",
          nicknames: ["Washer"]
        },
        deviceInfo: {
          manufacturer: "Acme Co",
          model: "acme-washer",
          hwVersion: "1.0",
          swVersion: "1.0.1"
        },
        attributes: {
          dataTypesSupported: [{
            name: "temperature",
            data_type: [
              { type_synonym: ["temperature"], lang: "en" }
            ],
            default_device_unit: "F"
          }],
          availableModes: [{
            name: 'load',
            'name_values': [{
              name_synonym: ['load'],
              lang: 'en'
            }],
            settings: [{
              setting_name: 'small',
              setting_values: [{
                setting_synonym: ['small'],
                lang: 'en'
              }]
            }, {
              setting_name: 'large',
              'setting_values': [{
                setting_synonym: ['large'],
                lang: 'en'
              }]
            }],
            ordered: true
          }],
          availableToggles: [{
            name: 'Turbo',
            name_values: [{
              name_synonym: ['turbo'],
              lang: 'en'
            }]
          }]
        }
      }]
    }
  };
});

function queryFirebase(deviceId) {
  const firebaseRef = firebase.database().ref('/');
  return new Promise((resolve, reject) => {
    firebaseRef.child(deviceId).once('value').then(snapshot => {
      const snapshotVal = snapshot.val();
      resolve({
        on: snapshotVal.OnOff.on,
        isPaused: snapshotVal.StartStop.isPaused,
        isRunning: snapshotVal.StartStop.isRunning,
        load: snapshotVal.Modes.load,
        turbo: snapshotVal.Toggles.Turbo
      });
    })
    .catch((e) => reject(e));
  });
}

app.onQuery(body => {
  const firebaseRef = firebase.database().ref('/');
  const requestId = body.requestId;
  let payload = {
    devices: {}
  };
  return new Promise((resolve, reject) => {
    for (const input of body.inputs) {
      for (const device of input.payload.devices) {
        const deviceId = device.id;
        queryFirebase(deviceId)
          .then(data => {
            payload.devices[deviceId] = {
              on: data.on,
              isPaused: data.isPaused,
              isRunning: data.isRunning,
              currentRunCycle: [{
                currentCycle: "rinse",
                nextCycle: "spin",
                lang: "en"
              }],
              currentTotalRemainingTime: 1212,
              currentCycleRemainingTime: 301,
              currentModeSettings: {
                load: data.load
              },
              currentToggleSettings: {
                Turbo: data.turbo
              }
            };
            resolve({
              requestId: requestId,
              payload: payload
            });
          })
        .catch((e) => reject(e));
      }
    }
  });
});

app.onExecute(body => {
  const firebaseRef = firebase.database().ref('/');
  const requestId = body.requestId;
  let payload = {
    commands: [{
      ids: [],
      status: "SUCCESS",
      states: {
        online: true
      }
    }]
  };
  for (const input of body.inputs) {
    for (const command of input.payload.commands) {
      for (const device of command.devices) {
        const deviceId = device.id;
        payload.commands[k].ids.push(deviceId);
        for (const execution of command.execution) {
          const execCommand = execution.command;
          const params = execution.params;
          switch (execCommand) {
            case "action.devices.commands.OnOff":
              firebaseRef.child(deviceId).child('OnOff').update({
                on: params.on
              });
              payload.commands[0].states.on = params.on;
              break;
            case "action.devices.commands.StartStop":
              firebaseRef.child(deviceId).child('StartStop').update({
                isRunning: params.start
              });
              payload.commands[0].states.isRunning = params.start;
              break;
            case "action.devices.commands.PauseUnpause":
              firebaseRef.child(deviceId).child('StartStop').update({
                isPaused: params.pause
              });
              payload.commands[0].states.isPaused = params.pause;
              break;
            case "action.devices.commands.SetModes":
              firebaseRef.child(deviceId).child('Modes').update({
                load: params.updateModeSettings.load
              });
              break;
            case "action.devices.commands.SetToggles":
              firebaseRef.child(deviceId).child('Toggles').update({
                Turbo: params.updateToggleSettings.Turbo
              });
              break;
          }
        }
      }
    }
  }
  return {
    requestId: requestId,
    payload: payload
  };
});

exports.smarthome = functions.https.onRequest(app);

exports.requestsync = functions.https.onRequest((request, response) => {
  console.info("Request SYNC for user 123");
  const https = require("https");
  const postData = {
    agentUserId: "123" /* Hardcoded user ID */
  };
  return cors(request, response, () => {
    var options = {
      hostname: 'homegraph.googleapis.com',
      port: 443,
      path: `/v1/devices:requestSync?key=${app.API_KEY}`,
      method: 'POST'
    };
    return new Promise(function (resolve, reject) {
      var responseData = '';
      var req = https.request(options, function (res) {
        res.on('data', function (d) {
          responseData += d.toString();
        });
        res.on('end', function () {
          resolve(responseData);
        });
      });
      req.on('error', function (e) {
        reject(e);
      });
      // Write data to request body
      req.write(JSON.stringify(postData));
      req.end();
    }).then(data => {
      console.log("Request sync completed");
      response.json(data);
    }).catch(err => {
      console.error(err);
    });
  });
});

/**
 * Send a REPORT STATE call to the homegraph when data for any device id
 * has been changed.
 */
exports.reportstate = functions.database.ref('{deviceId}').onWrite((event) => {
  console.info("Firebase write event triggered this cloud function");
  const https = require("https");
  const { google } = require('googleapis');
  const key = require('./key.json');
  const jwtClient = new google.auth.JWT(
    key.client_email,
    null,
    key.private_key,
    ['https://www.googleapis.com/auth/homegraph'],
    null
  );

  const snapshotVal = event.data.val();

  const postData = {
    requestId: "ff36a3cc", /* Any unique ID */
    agentUserId: "123", /* Hardcoded user ID */
    payload: {
      devices: {
        states: {
          /* Report the current state of our washer */
          [event.params.deviceId]: {
            on: snapshotVal.OnOff.on,
            isPaused: snapshotVal.StartStop.isPaused,
            isRunning: snapshotVal.StartStop.isRunning,
            currentRunCycle: [{
              currentCycle: "rinse",
              nextCycle: "spin",
              lang: "en"
            }],
            currentTotalRemainingTime: 1212,
            currentCycleRemainingTime: 301,
            currentModeSettings: {
              load: snapshotVal.Modes.load
            },
            currentToggleSettings: {
              Turbo: snapshotVal.Toggles.Turbo
            }
          }
        }
      }
    }
  };

  jwtClient.authorize((err, tokens) => {
    if (err) {
      console.error(err);
      return;
    }
    var options = {
      hostname: 'homegraph.googleapis.com',
      port: 443,
      path: "/v1/devices:reportStateAndNotification",
      method: 'POST',
      headers: {
        Authorization: ` Bearer ${tokens.access_token}`
      }
    };
    return new Promise(function (resolve, reject) {
      var responseData = '';
      var req = https.request(options, function (res) {
        res.on('data', function (d) {
          responseData += d.toString();
        });
        res.on('end', function () {
          resolve(responseData);
        });
      });
      req.on('error', function (e) {
        reject(e);
      });
      // Write data to request body
      req.write(JSON.stringify(postData));
      req.end();
    }).then(data => {
      console.info(data);
    });
  });
});
