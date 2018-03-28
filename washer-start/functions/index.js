"use strict";

const functions = require('firebase-functions');
const { smarthome } = require('actions-on-google');
const cors = require('cors')({origin: true});
const util = require('util');
const firebase = require('firebase');
// Initialize Firebase
const config = {
  apiKey: "XXX",
  authDomain: "<project-id>.firebaseapp.com",
  databaseURL: "https://<project-id>.firebaseio.com",
  projectId: "<project-id>",
  storageBucket: "<project-id>.appspot.com",
  messagingSenderId: "YYY"
};
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
  if (grant_type == 'authorization_code') {
    obj = {
      token_type: "bearer",
      access_token: '123access',
      refresh_token: '123refresh',
      expires_in: 60 * 60 * 24 // 1 day
    };
  } else if (grant_type == 'refresh_token') {
    obj = {
      token_type: "bearer",
      access_token: '123access',
      expires_in: 60 * 60 * 24 // 1 day
    }
  }
  response.status(200)
  .json(obj);
});

const app = smarthome({
  debug: true,
  API_KEY: '<api-key>'
})

app.onSync(body => {
  // TODO: Implement SYNC response
  return {
"requestId": "ff36a3cc-ec34-11e6-b1a0-64510650abcf",
    "payload": {
      "agentUserId": "123",
      "devices": []
    }

  };
//  return {};
});

app.onQuery(body => {
  // TODO: Implement QUERY response
  return {};
});

app.onExecute(body => {
  // TODO: Implement EXECUTE response
  return {};
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
});
