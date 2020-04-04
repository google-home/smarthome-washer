//************************Written by Sid for Sid's E Classroom*****************************
//**********************https://www.youtube.com/c/SidsEClassroom***************************
//*************************https://github.com/shivasiddharth*******************************
//*************************Do not modify or remove this part*******************************
//************If you are modifying or re-using the code, credit the the author*************
//This sketch has been adapted from Aandroide

#include <FirebaseArduino.h>
#include <ESP8266WiFi.h>
#include <DNSServer.h>
#include <ESP8266WebServer.h>
#include <WiFiManager.h>

// On a Trinket or Gemma we suggest changing this to 1:
//Pin is set for Wemos d1 mini. If using any other board, change it accordingly.
#define RELAY_PIN D5

//Firebase Database URL and KEY
#define FIREBASE_DATABASE_URL "ENTER YOUR FIREBASE DATABASE URL HERE"
#define FIREBASE_KEY "ENTER YOUR FIREBASE KEY HERE"

//Set the ID to the device id used in the index.json file
static const String STRMDEVID =  "4";

//Variables
int temperature;
int humidity;
unsigned long previousMillis = 0;
const long interval = 10000; // interval to refresh temp from sensor (10 seconds)
const long fbupdateinterval = 60000; // interval to update temperature in firebase (1 minute)
unsigned Millis = 0;

void setup() {

  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);

  //WiFi Manager
  WiFiManager wifiManager;
  wifiManager.autoConnect();
  Serial.println("Connected..");

  //Firebase Declaration
  Firebase.begin(FIREBASE_DATABASE_URL, FIREBASE_KEY);
  Firebase.stream(STRMDEVID);

  //Create json segments in firebase to make the thermostat controllable
  Firebase.setFloat("/" + STRMDEVID + "/TemperatureSetting/thermostatTemperatureSetpoint", 18);
  Firebase.setString("/" + STRMDEVID + "/TemperatureSetting/thermostatMode", "off");
}

void loop() {

  unsigned long currentMillis = millis();
  if (currentMillis - previousMillis >= interval) {
    // save the last time you updated the temp values
    previousMillis = currentMillis;

    // Insert your code to get temperature from sensor

  }
  
  //Check Firebase connection
  if (Firebase.failed()) {
    Serial.println("Streaming Error");
    Serial.println(Firebase.error());
  }
  if (Firebase.available()) {
    FirebaseObject event = Firebase.readEvent();
    String eventType = event.getString("type");
    eventType.toLowerCase();
    Serial.println(eventType);
    String path = event.getString("path");
    Serial.println(path);

   if (eventType == "patch" || eventType == "put" ) {
     unsigned long currentMilliss = millis();
    if (currentMilliss - Millis >= fbupdateinterval) {
      Millis = currentMilliss;
      
        if (path == "/thermostatTemperatureSetpoint/", "") {
          float temperature_set = Firebase.getFloat("/" + STRMDEVID + "/TemperatureSetting/thermostatTemperatureSetpoint/");
          Serial.print("temp set to: ");
          Serial.print(temperature_set);
          Serial.println(" C°");
          
          //example:
          if (temperature_set < 19.00) {
            digitalWrite(RELAY_PIN, HIGH);
          }
          if (temperature_set > 20.00) {
            digitalWrite(RELAY_PIN, LOW);
          }
        }

        if (path == "/thermostatMode/", "") {
          String set_mode = (Firebase.getString("/" + STRMDEVID + "/TemperatureSetting/thermostatMode"));
          Serial.print("termostat mode: ");
          Serial.println(set_mode);
        }
      }
    }
  }
}
