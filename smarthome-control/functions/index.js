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
const util = require('util');
const admin = require('firebase-admin');
// Initialize Firebase
admin.initializeApp();
const firebaseRef = admin.database().ref('/');

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

let jwt
try {
  jwt = require('./smart-home-key.json')
} catch (e) {
  console.warn('Service account key is not found')
  console.warn('Report state and Request sync will be unavailable')
}

const app = smarthome({
  jwt: jwt,
  debug: true,
})

const devicesitems = [{
  id: '1',
  type: 'action.devices.types.LIGHT',
  traits: [
    'action.devices.traits.OnOff',
    'action.devices.traits.Brightness',
    'action.devices.traits.ColorSetting',
  ],
  name: {
    defaultNames: ['My Test Light1'],
    name: 'Light 1',
    nicknames: ['Patio Light'],
  },
  deviceInfo: {
    manufacturer: 'Siddhy Co',
    model: 'Siddhys RGB Bulb',
    hwVersion: '1.0',
    swVersion: '1.0.1',
  },
  willReportState: true,
  attributes: {
    commandOnlyOnOff: false,
    commandOnlyColorSetting: false,
    commandOnlyBrightness: false,
    colorModel: 'rgb',
    colorTemperatureRange: {
      temperatureMinK: 2000,
      temperatureMaxK: 6500
    }
  }
},
{
  id: '2',
  type: 'action.devices.types.LIGHT',
  traits: [
    'action.devices.traits.OnOff',
    'action.devices.traits.Brightness',
  ],
  name: {
    defaultNames: ['My Test Light2'],
    name: 'Light 2',
    nicknames: ['Corridor Light'],
  },
  deviceInfo: {
    manufacturer: 'Siddhy Co',
    model: 'Siddhys LED Bulb',
    hwVersion: '2.0',
    swVersion: '2.0.1',
  },
  willReportState: true,
  attributes: {
    commandOnlyOnOff: false,
    commandOnlyBrightness: false,
  }
},
{
  id: '3',
  type: 'action.devices.types.FAN',
  traits: [
    'action.devices.traits.OnOff',
    'action.devices.traits.Toggles',
  ],
  name: {
    defaultNames: ['My Fan'],
    name: 'Fan1',
    nicknames: ['Ceiling Fan'],
  },
  deviceInfo: {
    manufacturer: 'Siddhy Co',
    model: 'Siddhys High Effeciency Fan',
    hwVersion: '3.0',
    swVersion: '4.0.1',
  },
  willReportState: true,
  attributes: {
    commandOnlyOnOff: false,
    commandOnlyFanSpeed: false,
    availableFanSpeeds: [{
      speeds: [{
        speed_name: "S1",
        speed_values: [{
          speed_synonym: ["low", "speed 1"],
          lang: "en"
        }]
      }, {
        speed_name: "S2",
        speed_values: [{
          speed_synonym: ["high", "speed 2"],
          lang: "en"
        }]
      }],
      ordered: true,
    }],
    reversible: true,
  }
},
{
  id: '4',
  type: 'action.devices.types.THERMOSTAT',
  traits: [
    'action.devices.traits.TemperatureSetting'
  ],
  name: {
    defaultNames: ['Temp Control'],
    name: 'Temperature Controller ',
    nicknames: ['Thermal Controller'],
  },
  deviceInfo: {
    manufacturer: 'Siddhy Co',
    model: 'Siddhys Thermostat',
    hwVersion: '4.0',
    swVersion: '5.0.1',
  },
  willReportState: true,
  attributes: {
    availableThermostatModes: 'off,on,heat,cool,heatcool',
    queryOnlyTemperatureSetting: false,
    thermostatTemperatureUnit: 'C',
    commandOnlyTemperatureSetting: true
  },
},
{
  id: '5',
  type: 'action.devices.types.THERMOSTAT',
  traits: [
    'action.devices.traits.TemperatureSetting'
  ],
  name: {
    defaultNames: ['Temp Sensor'],
    name: 'Room Temperature Sensor',
    nicknames: ['Ambient Temperature Sensor'],
  },
  deviceInfo: {
    manufacturer: 'Siddhy Co',
    model: 'Siddhys Temperature Sensor',
    hwVersion: '5.0',
    swVersion: '6.0.1',
  },
  willReportState: true,
  attributes: {
    queryOnlyTemperatureSetting: true,
    thermostatTemperatureUnit: 'C'
  },
},
{
  id: '6',
  type: 'action.devices.types.SWITCH',
  traits: [
    'action.devices.traits.OnOff'
  ],
  name: {
    defaultNames: ['Plug Socket'],
    name: 'Smart Switch',
    nicknames: ['New Switch'],
  },
  deviceInfo: {
    manufacturer: 'Siddhy Co',
    model: 'Siddhys On/Off Switch',
    hwVersion: '6.0',
    swVersion: '7.0.1',
  },
  willReportState: true,
  attributes: {
    commandOnlyOnOff: false
  },
}]

app.onSync((body) => {
  return {
    requestId: body.requestId,
    payload: {
      agentUserId: '123',
      devices: devicesitems
    },
  };
});


const queryFirebase = async (deviceId) => {
  const snapshot = await firebaseRef.child(deviceId).once('value');
  const snapshotVal = snapshot.val();
  if (deviceId == '1') {
    return {
      on: snapshotVal.OnOff.on,
      brightness: snapshotVal.Brightness.brightness,
      color: snapshotVal.ColorSetting.color
    };
  } else if (deviceId == '2') {
    return {
      on: snapshotVal.OnOff.on,
      brightness: snapshotVal.Brightness.brightness
    };
  } else if (deviceId == '3') {
    return {
      on: snapshotVal.OnOff.on,
      //currentFanSpeedSetting: snapshotVal.FanSpeed.currentFanSpeedSetting
    };
  } else if (deviceId == '4') {
    return {
      thermostatMode: snapshotVal.TemperatureSetting.thermostatMode,
      thermostatTemperatureSetpoint: snapshotVal.TemperatureSetting.thermostatTemperatureSetpoint,
      thermostatTemperatureAmbient: snapshotVal.TemperatureSetting.thermostatTemperatureAmbient,
      thermostatHumidityAmbient: snapshotVal.TemperatureSetting.thermostatHumidityAmbient,
      thermostatTemperatureSetpointLow: snapshotVal.TemperatureSetting.thermostatTemperatureSetpointLow,
      thermostatTemperatureSetpointHigh: snapshotVal.TemperatureSetting.thermostatTemperatureSetpointHigh
    };
  } else if (deviceId == '5') {
    return {
      thermostatTemperatureAmbient: snapshotVal.TemperatureSetting.thermostatTemperatureAmbient,
      thermostatHumidityAmbient: snapshotVal.TemperatureSetting.thermostatHumidityAmbient
    };
  } else if (deviceId == '6') {
    return {
      on: snapshotVal.OnOff.on
    };
  }
}

const queryDevice = async (deviceId) => {
  const data = await queryFirebase(deviceId);
  if (deviceId == '1') {
    return {
      on: data.on,
      brightness: data.brightness,
      color: data.color
    };
  } else if (deviceId == '2') {
    return {
      on: data.on,
      brightness: data.brightness
    };
  } else if (deviceId == '3') {
    return {
      on: data.on,
      //currentFanSpeedSetting: data.currentFanSpeedSetting
    };
  } else if (deviceId == '4') {
    return {
      thermostatMode: data.thermostatMode,
      thermostatTemperatureSetpoint: data.thermostatTemperatureSetpoint,
      thermostatTemperatureAmbient: data.thermostatTemperatureAmbient,
      thermostatHumidityAmbient: data.thermostatHumidityAmbient,
      thermostatTemperatureSetpointLow: data.thermostatTemperatureSetpointLow,
      thermostatTemperatureSetpointHigh: data.thermostatTemperatureSetpointHigh
    };
  } else if (deviceId == '5') {
    return {
      thermostatTemperatureAmbient: data.thermostatTemperatureAmbient,
      thermostatHumidityAmbient: data.thermostatHumidityAmbient
    };
  } else if (deviceId == '6') {
    return {
      on: data.on
    };
  }
}

app.onQuery(async (body) => {
  const {requestId} = body;
  const payload = {
    devices: {},
  };

  const queryPromises = [];
  const intent = body.inputs[0];
  for (const device of intent.payload.devices) {
    const deviceId = device.id;
    queryPromises.push(queryDevice(deviceId)
      .then((data) => {
        // Add response to device payload
        payload.devices[deviceId] = data;
      }
    ));
  }
  // Wait for all promises to resolve
  await Promise.all(queryPromises)
  return {
    requestId: requestId,
    payload: payload,
  };
});

const updateDevice = async (execution,deviceId) => {
  const {params,command} = execution;
  let state, ref;
  switch (command) {
    case 'action.devices.commands.OnOff':
      state = {on: params.on};
      ref = firebaseRef.child(deviceId).child('OnOff');
      break;
    case 'action.devices.commands.BrightnessAbsolute':
      state = {brightness: params.brightness};
      ref = firebaseRef.child(deviceId).child('Brightness');
      break;
    case 'action.devices.commands.ColorAbsolute':
      state = {color: params.color};
      ref = firebaseRef.child(deviceId).child('ColorSetting');
      break;
    case 'action.devices.commands.SetFanSpeed':
      state = {currentFanSpeedSetting: params.fanSpeed};
      ref = firebaseRef.child(deviceId).child('FanSpeed');
      break;
    case 'action.devices.commands.ThermostatTemperatureSetpoint':
      state = {thermostatTemperatureSetpoint: params.thermostatTemperatureSetpoint};
      ref = firebaseRef.child(deviceId).child('TemperatureSetting');
      break;
    case 'action.devices.commands.ThermostatSetMode':
      state = {thermostatMode: params.thermostatMode};
      ref = firebaseRef.child(deviceId).child('TemperatureSetting');
      break;
    case 'action.devices.commands.ThermostatTemperatureSetRange':
      state = {thermostatTemperatureSetpointLow: params.thermostatTemperatureSetpointLow,thermostatTemperatureSetpointHigh: params.thermostatTemperatureSetpointHigh};
      ref = firebaseRef.child(deviceId).child('TemperatureSetting');
  }
  return ref.update(state)
    .then(() => state);
};

app.onExecute(async (body) => {
  const {requestId} = body;
  // Execution results are grouped by status
  const result = {
    ids: [],
    status: 'SUCCESS',
    states: {
      online: true,
    },
  };

  const executePromises = [];
  const intent = body.inputs[0];
  for (const command of intent.payload.commands) {
    for (const device of command.devices) {
      for (const execution of command.execution) {
        executePromises.push(
          updateDevice(execution,device.id)
            .then((data) => {
              result.ids.push(device.id);
              Object.assign(result.states, data);
            })
            .catch(() => console.error(`Unable to update ${device.id}`))
        );
      }
    }
  }

  await Promise.all(executePromises)
  return {
    requestId: requestId,
    payload: {
      commands: [result],
    },
  };
});


exports.smarthome = functions.https.onRequest(app);

exports.requestsync = functions.https.onRequest(async (request, response) => {
  response.set('Access-Control-Allow-Origin', '*');
  console.info('Request SYNC for user 123');
  try {
    const res = await app.requestSync('123');
    console.log('Request sync completed');
    response.json(res.data);
  } catch (err) {
    console.error(err);
    response.status(500).send(`Error requesting sync: ${err}`)
  }
});

/**
 * Send a REPORT STATE call to the homegraph when data for any device id
 * has been changed.
 */
exports.reportstate = functions.database.ref('{deviceId}').onWrite(async (change, context) => {
  console.info('Firebase write event triggered this cloud function');
  if (!app.jwt) {
    console.warn('Service account key is not configured');
    console.warn('Report state is unavailable');
    return;
  }
  const snapshot = change.after.val();
  if (deviceId == '1') {
    var load = {
      on: snapshot.OnOff.on,
      brightness: snapshot.Brightness.brightness,
      color: snapshot.ColorSetting.color
    };
  } else if (deviceId == '2') {
    var load = {
      on: snapshot.OnOff.on,
      brightness: snapshot.Brightness.brightness
    };
  } else if (deviceId == '3') {
    var load = {
      on: snapshot.OnOff.on,
      //currentFanSpeedSetting: snapshot.FanSpeed.currentFanSpeedSetting
    };
  } else if (deviceId == '4') {
    var load = {
      thermostatMode: snapshot.thermostatMode,
      thermostatTemperatureSetpoint: snapshot.thermostatTemperatureSetpoint,
      thermostatTemperatureAmbient: snapshot.thermostatTemperatureAmbient,
      thermostatHumidityAmbient: snapshot.thermostatHumidityAmbient,
      thermostatTemperatureSetpointLow: snapshot.thermostatTemperatureSetpointLow,
      thermostatTemperatureSetpointHigh: snapshot.thermostatTemperatureSetpointHigh
    };
  } else if (deviceId == '5') {
    var load = {
      thermostatTemperatureAmbient: snapshot.thermostatTemperatureAmbient,
      thermostatHumidityAmbient: snapshot.thermostatHumidityAmbient
    };
  } else if (deviceID == '6') {
    var load = {
      on: snapshot.OnOff.on
    };
  }

  const postData = {
    requestId: 'ff36a3ccsiddhy', /* Any unique ID */
    agentUserId: '123', /* Hardcoded user ID */
    payload: {
      devices: {
        states: {
          /* Report the current state of our light */
          [context.params.deviceId]: {
            load,
          },
        },
      },
    },
  };

  const data = await app.reportState(postData);
  console.log('Report state came back');
  console.info(data);
});
