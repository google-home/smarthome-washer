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
#define Clr_Address Bri_Address + sizeof(int)

//Firebase Database URL and KEY
#define FIREBASE_DATABASE_URL "ENTER YOUR FIREBASE DATABASE URL HERE"
#define FIREBASE_KEY "ENTER YOUR FIREBASE KEY HERE"

//Set the ID to the device id used in the index.json file
static const String STRMDEVID =  "1";

//Temperature in K
int Temperature[111] = {1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700, 1800, 1900, 2000, 2100, 2200, 2300, 2400, 2500, 2600, 2700, 2800, 2900, 3000, 3100, 3200, 3300, 3400, 3500, 3600, 3700, 3800, 3900, 4000, 4100, 4200, 4300, 4400, 4500, 4600, 4700, 4800, 4900, 5000, 5100, 5200, 5300, 5400, 5500, 5600, 5700, 5800, 5900, 6000, 6100, 6200, 6300, 6400, 6500, 6600, 6700, 6800, 6900, 7000, 7100, 7200, 7300, 7400, 7500, 7600, 7700, 7800, 7900, 8000, 8100, 8200, 8300, 8400, 8500, 8600, 8700, 8800, 8900, 9000, 9100, 9200, 9300, 9400, 9500, 9600, 9700, 9800, 9900, 10000, 10100, 10200, 10300, 10400, 10500, 10600, 10700, 10800, 10900, 11000, 11100, 11200, 11300, 11400, 11500, 11600, 11700, 11800, 11900, 12000};
//Correspodning Hexcolor
unsigned long Hexcolor[111] = {0xFF3800, 0xFF4700, 0xFF5300, 0xFF5D00, 0xFF6500, 0xFF6D00, 0xFF7300, 0xFF7900, 0xFF7E00, 0xFF8300, 0xFF8A12, 0xFF8E21, 0xFF932C, 0xFF9836, 0xFF9D3F, 0xFFA148, 0xFFA54F, 0xFFA957, 0xFFAD5E, 0xFFB165, 0xFFB46B, 0xFFB872, 0xFFBB78, 0xFFBE7E, 0xFFC184, 0xFFC489, 0xFFC78F, 0xFFC994, 0xFFCC99, 0xFFCE9F, 0xFFD1A3, 0xFFD3A8, 0xFFD5AD, 0xFFD7B1, 0xFFD9B6, 0xFFDBBA, 0xFFDDBE, 0xFFDFC2, 0xFFE1C6, 0xFFE3CA, 0xFFE4CE, 0xFFE6D2, 0xFFE8D5, 0xFFE9D9, 0xFFEBDC, 0xFFECE0, 0xFFEEE3, 0xFFEFE6, 0xFFF0E9, 0xFFF2EC, 0xFFF3EF, 0xFFF4F2, 0xFFF5F5, 0xFFF6F7, 0xFFF8FB, 0xFFF9FD, 0xFEF9FF, 0xFCF7FF, 0xF9F6FF, 0xF7F5FF, 0xF5F3FF, 0xF3F2FF, 0xF0F1FF, 0xEFF0FF, 0xEDEFFF, 0xEBEEFF, 0xE9EDFF, 0xE7ECFF, 0xE6EBFF, 0xE4EAFF, 0xE3E9FF, 0xE1E8FF, 0xE0E7FF, 0xDEE6FF, 0xDDE6FF, 0xDCE5FF, 0xDAE5FF, 0xD9E3FF, 0xD8E3FF, 0xD7E2FF, 0xD6E1FF, 0xD4E1FF, 0xD3E0FF, 0xD2DFFF, 0xD1DFFF, 0xD0DEFF, 0xCFDDFF, 0xCFDDFF, 0xCEDCFF, 0xCDDCFF, 0xCFDAFF, 0xCFDAFF, 0xCED9FF, 0xCDD9FF, 0xCCD8F, 0xCCD8FF, 0xCBD7F, 0xCAD7F, 0xCAD6FF, 0xC9D6FF, 0xC8D5FF, 0xC7D4FF, 0xC6D4FF, 0xC6D4FF, 0xC5D3FF, 0xC5D3FF, 0xC5D2FF, 0xC4D2FF, 0xC3D2FF, 0xC3D1FF};

//Variables for brightness and color
int bri;
int clr;

void setup() {

  Serial.begin(115200);
  EEPROM.begin(256);
  EEPROM.get(Bri_Address, bri);
  EEPROM.get(Clr_Address, clr);
  //Neopixel Initialization
  strip.begin();
  strip.fill(clr);
  strip.setBrightness(bri);
  strip.show();
  Serial.println("Current values: "+String(bri)+","+String(clr));

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
          EEPROM.get(Clr_Address, clr);
          EEPROM.get(Bri_Address, bri);
          strip.fill(clr);
          strip.setBrightness(bri);
          strip.show();
        }
        Serial.println(lightstatus);
      }
      else if (path == "/ColorSetting") {
        String colorname = Firebase.getString("/" + STRMDEVID + "/1/ColorSetting/color/name");
        Serial.println(colorname);
        String colors = event.getJsonVariant("data");
        if (colors.indexOf("temperature") != -1) {
          int colortemp = Firebase.getInt("/" + STRMDEVID + "/1/ColorSetting/color/temperature");
          for (int i = 1; i <= 111; i++) {
            if (colortemp == Temperature[i]) {
            int colorhex = Hexcolor[i];
            clr = colorhex;
            strip.fill(clr);
            strip.show();
            EEPROM.put(Clr_Address, clr);
            EEPROM.commit();
            EEPROM.end();
              break;
            }
          }
          Serial.println(clr);
        } else if (colors.indexOf("spectrumRGB") != -1) {
          int colordec = Firebase.getInt("/" + STRMDEVID + "/ColorSetting/color/spectrumRGB");
          clr = colordec;
          strip.fill(clr);
          strip.show();
          EEPROM.put(Clr_Address, clr);
          EEPROM.commit();
          EEPROM.end();
          Serial.println(clr);
        }
      }
    }
  }
}
