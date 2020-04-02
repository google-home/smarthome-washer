//************************Written by Sid for Sid's E Classroom*****************************
//**********************https://www.youtube.com/c/SidsEClassroom***************************
//*************************https://github.com/shivasiddharth*******************************
//*************************Do not modify or remove this part*******************************
//************If you are modifying or re-using the code, credit the the author*************
//thermostat sketch created by Aandroide

#include <FirebaseArduino.h>
#include <ESP8266WiFi.h>
#include <DNSServer.h>
#include <ESP8266WebServer.h>
#include <WiFiManager.h>

// On a Trinket or Gemma we suggest changing this to 1:
//Pin is set for Wemos. If using any other board, change it accordingly.
#define SWITCH_PIN 2 //= D4 wemos this pin have a resistor pullup internal 

//Firebase Database URL and KEY
#define FIREBASE_DATABASE_URL "ENTER YOUR FIREBASE DATABASE URL HERE"
#define FIREBASE_KEY "ENTER YOUR FIREBASE KEY HERE"

//Set the ID to the device id used in the index.json file
static const String STRMDEVID =  "4";

//Variables for OnOffvalue
bool SensorUpdate;
int temperature;
int humidity;
String thermostat_mode = "off";
float set_point_temperature = 18;

void setup() {
  Serial.begin(115200);
  pinMode(SWITCH_PIN, OUTPUT);
  digitalWrite(SWITCH_PIN, LOW);

  //WiFi Manager
  WiFiManager wifiManager;
  wifiManager.autoConnect();
  Serial.println("Connected..");

  //Firebase Declaration
  Firebase.begin(FIREBASE_DATABASE_URL, FIREBASE_KEY);
  Firebase.stream(STRMDEVID);

  //Firebase adds the settings to be able to control the thermostat
  Firebase.setString("/" + STRMDEVID + "/TemperatureSetting/thermostatMode", thermostat_mode);
  Firebase.setFloat("/" + STRMDEVID + "/TemperatureSetting/thermostatTemperatureSetpoint", set_point_temperature);

  //Change or remove it if you want
  SensorUpdate = true;
  temperature = 10;
  humidity = 95;

}

void loop() {

  //Check Firebase connection
  if (Firebase.failed()) {
    Serial.println("Streaming Error");
    Serial.println(Firebase.error());
  }

  // get value
  float temperature_set = (Firebase.getFloat("/" + STRMDEVID + "/TemperatureSetting/thermostatTemperatureSetpoint"));
  Serial.print("temperature set: ");
  Serial.println(temperature_set);
  delay(1000);
  if (temperature_set == 20.00) {
    digitalWrite(SWITCH_PIN, HIGH);
    Serial.println("accendo");
  }
  if (temperature_set == 18.00) {
    digitalWrite(SWITCH_PIN, LOW);
    Serial.println("spengo");
  }

  String set_mode = (Firebase.getString("/" + STRMDEVID + "/TemperatureSetting/thermostatMode"));
  Serial.print("termostat mode: ");
  Serial.println(set_mode);
  delay(1000);
  if (set_mode == "heat") {
    Serial.println("heating mode activated");
  }
  if (set_mode == "cool") {
    Serial.println("cooling mode activated");
  }
  if (set_mode == "on") {
    Serial.println("thermostat on");
  }
  if (set_mode == "off") {
    Serial.println("thermostat off");
  }

  if (SensorUpdate == true) {
    Firebase.setInt("/" + STRMDEVID + "/TemperatureSetting/thermostatTemperatureAmbient", temperature);
    Firebase.setInt("/" + STRMDEVID + "/TemperatureSetting/thermostatHumidityAmbient", humidity);

    delay(60000);//1 minuto

    //This will increase the temperature every minute
    temperature = temperature + 0, 5;
  }
}
