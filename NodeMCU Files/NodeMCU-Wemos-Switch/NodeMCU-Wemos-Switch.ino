//************************Written by Sid for Sid's E Classroom*****************************
//**********************https://www.youtube.com/c/SidsEClassroom***************************
//*************************https://github.com/shivasiddharth*******************************
//*************************Do not modify or remove this part*******************************
//************If you are modifying or re-using the code, credit the the author*************

#include <FirebaseArduino.h>
#include <ESP8266WiFi.h>
#include <DNSServer.h>
#include <ESP8266WebServer.h>
#include <WiFiManager.h>
#include <EEPROM.h>

// On a Trinket or Gemma we suggest changing this to 1:
//Pin is set for Wemos. If using any other board, change it accordingly.
#define SWITCH_PIN D4

//EEPROM address definition
#define Start_Address 0
#define OnOff_Address Start_Address + sizeof(int)

//Firebase Database URL and KEY
#define FIREBASE_DATABASE_URL "ENTER YOUR FIREBASE DATABASE URL HERE"
#define FIREBASE_KEY "ENTER YOUR FIREBASE KEY HERE"

//Set the ID to the device id used in the index.json file
static const String STRMDEVID =  "6";

//Variables for OnOffvalue
bool OnOffvalue;

void setup() {

  pinMode(SWITCH_PIN, OUTPUT);
  Serial.begin(115200);
  EEPROM.begin(256);
  EEPROM.get(OnOff_Address, OnOffvalue);
  digitalWrite(SWITCH_PIN, OnOffvalue);

  //WiFi Manager
  WiFiManager wifiManager;
  wifiManager.autoConnect();
  Serial.println("Connected..");

  //Firebase Declaration
  Firebase.begin(FIREBASE_DATABASE_URL, FIREBASE_KEY);
  Firebase.stream(STRMDEVID);
}


void loop() {

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
    if (eventType == "patch" || eventType == "put") {
      if (path == "/OnOff") {
        bool OnOffvalue = Firebase.getBool("/" + STRMDEVID + "/OnOff/on");
        Serial.println(OnOffvalue);
        digitalWrite(SWITCH_PIN, OnOffvalue);
        EEPROM.put(OnOff_Address, OnOffvalue);
        EEPROM.commit();
        EEPROM.end();
      }      
    }
  }
}

