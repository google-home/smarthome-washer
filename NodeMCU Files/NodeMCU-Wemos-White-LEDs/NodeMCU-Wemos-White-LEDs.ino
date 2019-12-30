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
#include <Adafruit_NeoPixel.h>
#include <EEPROM.h>

// On a Trinket or Gemma we suggest changing this to 1:
//Pin is set for Wemos. If using any other board, change it accordingly.
#define LED_PIN D6

// How many NeoPixels are attached to the Arduino?
#define LED_COUNT 12

// Declare NeoPixel strip object:
Adafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB + NEO_KHZ800);
// Argument 1 = Number of pixels in NeoPixel strip
// Argument 2 = Arduino pin number (most are valid)
// Argument 3 = Pixel type flags, add together as needed:
//   NEO_KHZ800  800 KHz bitstream (most NeoPixel products w/WS2812 LEDs)
//   NEO_KHZ400  400 KHz (classic 'v1' (not v2) FLORA pixels, WS2811 drivers)
//   NEO_GRB     Pixels are wired for GRB bitstream (most NeoPixel products)
//   NEO_RGB     Pixels are wired for RGB bitstream (v1 FLORA pixels, not v2)
//   NEO_RGBW    Pixels are wired for RGBW bitstream (NeoPixel RGBW products)

//EEPROM address definition
#define Start_Address 0
#define Bri_Address Start_Address + sizeof(int)

//Firebase Database URL and KEY
#define FIREBASE_DATABASE_URL "ENTER YOUR FIREBASE DATABASE URL HERE"
#define FIREBASE_KEY "ENTER YOUR FIREBASE KEY HERE"

//Set the ID to the device id used in the index.json file
static const String STRMDEVID =  "2";

//Variables for brightness and color
int bri;

void setup() {

  Serial.begin(115200);
  EEPROM.begin(256);
  EEPROM.get(Bri_Address, bri);
  strip.begin();
  strip.fill(0xFFFFFF);
  strip.setBrightness(bri);
  strip.show();
  Serial.println("Current value: "+String(bri));

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
      if (path == "/Brightness") {
        int bright = Firebase.getInt("/" + STRMDEVID + "/Brightness/brightness");
        strip.setBrightness(bright);
        strip.show();
        bri = bright;
        EEPROM.put(Bri_Address, bri);
        EEPROM.commit();
        EEPROM.end();
        Serial.println(bri);
      }
      else if (path == "/OnOff") {
        bool lightstatus = Firebase.getBool("/" + STRMDEVID + "/OnOff/on");
        if (lightstatus == 0) {
          strip.fill();
          strip.show();
        } else if (lightstatus == 1) {
          EEPROM.get(Bri_Address, bri);
          strip.fill(0xFFFFFF);
          strip.setBrightness(bri);
          strip.show();
        }
        Serial.println(lightstatus);
      }
    }
  }
}

