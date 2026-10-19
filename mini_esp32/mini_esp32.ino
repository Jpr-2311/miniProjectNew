#include <Wire.h>
#include <MPU6050.h>
#include <WiFi.h>
#include <HTTPClient.h>

MPU6050 mpu;

// Wi-Fi and server settings live in secrets.h, which is git-ignored.
// Copy secrets.example.h to secrets.h and fill in your own values.
#include "secrets.h"

const char* ssid = WIFI_SSID;
const char* password = WIFI_PASSWORD;

// ===== SERVER =====
const char* serverURL = ALERT_SERVER_URL;

int buzzerPin = 23;

unsigned long lastApiCall = 0;
int alertState = 0;

void setup() {
  Serial.begin(115200);

  Wire.begin(21, 22);
  mpu.initialize();

  pinMode(buzzerPin, OUTPUT);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }

  Serial.println("✅ WiFi Connected");
}

void loop() {

  // ===== FAST SENSOR READ =====
  int16_t ax, ay, az;
  mpu.getAcceleration(&ax, &ay, &az);

  float ax_g = ax / 16384.0;
  float ay_g = ay / 16384.0;
  float az_g = az / 16384.0;

  Serial.print(ax_g, 6);
  Serial.print(",");
  Serial.print(ay_g, 6);
  Serial.print(",");
  Serial.println(az_g, 6);

  // ===== SLOW API CALL (every 1.5 sec) =====
  if (millis() - lastApiCall > 1500) {

    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(serverURL);

      int code = http.GET();

      if (code == 200) {
        String payload = http.getString();

        if (payload.indexOf("true") > 0) {
          alertState = 1;
        } else {
          alertState = 0;
        }
      }

      http.end();
    }

    lastApiCall = millis();
  }

  // ===== BUZZER CONTROL =====
  digitalWrite(buzzerPin, alertState ? HIGH : LOW);

  // FAST LOOP
  delay(20);  // 50 Hz
}