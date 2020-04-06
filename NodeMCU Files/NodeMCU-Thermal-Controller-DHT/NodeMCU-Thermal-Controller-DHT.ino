//************************Written by Sid for Sid's E Classroom*****************************
//**********************https://www.youtube.com/c/SidsEClassroom***************************
//*************************https://github.com/shivasiddharth*******************************
//*************************Do not modify or remove this part*******************************
//************If you are modifying or re-using the code, credit the the author*************
//**********************This sketch has been adapted from Aandroide************************

#include <FirebaseArduino.h>
#include <ESP8266WiFi.h>
#include <DNSServer.h>
#include <ESP8266WebServer.h>
#include <WiFiManager.h>
#include <DHT.h>

// On a Trinket or Gemma we suggest changing this to 1:
//Pin is set for Wemos d1 mini. If using any other board, change it accordingly.
#define RELAY_PIN D6
#define DHTPIN 2 //connected to pin D4 which already has a pull up resistance
#define PWRSENSOR D5 //pin to be connected to the + of the sensor temperature

// Uncomment the type of sensor in use:
//#define DHTTYPE    DHT11     // DHT 11
#define DHTTYPE    DHT22     // DHT 22 (AM2302)
//#define DHTTYPE    DHT21     // DHT 21 (AM2301)

DHT dht(DHTPIN, DHTTYPE);

//Firebase Database URL and KEY
#define FIREBASE_DATABASE_URL "ENTER YOUR FIREBASE DATABASE URL HERE"
#define FIREBASE_KEY "ENTER YOUR FIREBASE KEY HERE"

//Set the ID to the device id used in the index.json file
static const String STRMDEVID =  "4";

//Variables
float temperature;
float humidity;
unsigned long previousMillis = 0;
const long interval = 10000; // interval to refresh temp from sensor (10 seconds)

void setup() {

  Serial.begin(115200);
  dht.begin();
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, LOW);
  pinMode(PWRSENSOR, OUTPUT);
  digitalWrite(PWRSENSOR, HIGH);

  //WiFi Manager
  WiFiManager wifiManager;
  wifiManager.autoConnect();
  Serial.println("Connected..");

  //Firebase Declaration
  Firebase.begin(FIREBASE_DATABASE_URL, FIREBASE_KEY);
  Firebase.stream(STRMDEVID);
}

void loop() {

  unsigned long currentMillis = millis();
  if (currentMillis - previousMillis >= interval) {
    // save the last time you updated the temp values
    previousMillis = currentMillis;

    // Read temperature as Celsius (the default)
    float newT = dht.readTemperature();
    if (isnan(newT)) {
      Serial.println("Failed to read from DHT sensor!");
    }
    else {
      temperature = newT - 2.00;
      Serial.print("temperature detected: ");
      Serial.print(temperature);
      Serial.println(" C°");
      Firebase.setFloat("/" + STRMDEVID + "/TemperatureSetting/thermostatTemperatureAmbient", temperature);
    }

    // Read Humidity
    float newH = dht.readHumidity();
    // if humidity read failed, don't change h value
    if (isnan(newH)) {
      Serial.println("Failed to read from DHT sensor!");
    }
    else {
      humidity = newH ;
      Serial.print("humidity: ");
      Serial.print(humidity);
      Serial.println(" %");
      Firebase.setFloat("/" + STRMDEVID + "/TemperatureSetting/thermostatHumidityAmbient", humidity);
    }
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
      if (path == "/thermostatTemperatureSetpoint/", "") {
        float temperature_set = Firebase.getFloat("/" + STRMDEVID + "/TemperatureSetting/thermostatTemperatureSetpoint/");
        Serial.print("temp set to: ");
        Serial.print(temperature_set);
        Serial.println(" C°");

        if (temperature < temperature_set) {
          digitalWrite(RELAY_PIN, HIGH);
        }
        if (temperature > temperature_set) {
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
