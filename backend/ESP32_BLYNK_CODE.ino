/*
  Smart Dustbin: ESP32 + HC-SR04 + 10 LEDs + Blynk Integration
  - 10 LEDs show fill in 10% steps
  - Sends data to Blynk cloud
  - At >=90% -> sends warning status to Blynk
  - At >=100% -> sends full status to Blynk
  - No GPS; uses fixed location label
*/

#define BLYNK_TEMPLATE_ID "TMPL3ha6B5e7d"
#define BLYNK_TEMPLATE_NAME "tarun choudaruy"
#define BLYNK_AUTH_TOKEN "vvxZw6IiQg1ErbDNfDlhYyfq-Ed5Mlm7"

#include <WiFi.h>
#include <BlynkSimpleEsp32.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

//
// -------------------- CONFIG (replace these) --------------------
//
const char* WIFI_SSID = "S123";
const char* WIFI_PASS = "Babayaga";

// Twilio config (optional - for SMS alerts)
const char* TWILIO_ACCOUNT_SID = "AC45a9bfc48aec97af3c52d1252def1009";
const char* TWILIO_AUTH_TOKEN  = "95275e79cc213e54d796d663de851225";
const char* TWILIO_FROM = "+14789003797";
const char* TWILIO_TO   = "+917052352272";

const char* DUSTBIN_LABEL = "Dustbin D40 (Sector 3, Phagwara)"; // fixed location label
//
// -----------------------------------------------------------------
//

// Blynk Virtual Pins
#define V0_FILL_PERCENTAGE  0  // Fill percentage (0-100)
#define V1_DISTANCE         1  // Distance in cm
#define V2_STATUS           2  // Status (0=empty, 1=warning, 2=full)
#define V3_TIMESTAMP        3  // Last update timestamp
#define V4_LOCATION         4  // Location label

// Hardware Pins
const int trigPin = 5;
const int echoPin = 18;
const int ledPins[10] = {13, 12, 14, 27, 26, 25, 33, 32, 35, 34};

const float binHeightCm = 80.0;    // dustbin height in cm
const int numLEDs = 10;
const unsigned long readDelayMs = 2000; // Read every 2 seconds

// Alert control
bool sent90 = false;
bool sent100 = false;
const float warnThreshold = 90.0;
const float fullThreshold = 100.0;
const float resetThreshold = 80.0; // drop below this to reset sent flags

// Smoothing readings
const int SMOOTH_COUNT = 5;
float lastDistances[SMOOTH_COUNT];
int smoothIndex = 0;
bool bufferFilled = false;

void setup() {
  Serial.begin(115200);
  delay(100);

  // Pins
  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  for (int i = 0; i < numLEDs; i++) {
    pinMode(ledPins[i], OUTPUT);
    digitalWrite(ledPins[i], LOW);
  }

  // Initialize smoothing buffer
  for (int i = 0; i < SMOOTH_COUNT; i++) lastDistances[i] = binHeightCm;

  Serial.println();
  Serial.println("Smart Dustbin - Starting...");
  connectWiFi();
  
  // Initialize Blynk
  Blynk.begin(BLYNK_AUTH_TOKEN, WIFI_SSID, WIFI_PASS);
  
  // Send initial location to Blynk
  Blynk.virtualWrite(V4_LOCATION, DUSTBIN_LABEL);
}

void loop() {
  Blynk.run(); // Keep Blynk connection alive
  
  // read ultrasonic distance (cm)
  float distance = getSmoothedDistance();
  // compute fill percentage
  float fill = ((binHeightCm - distance) / binHeightCm) * 100.0;
  if (fill < 0.0) fill = 0.0;
  if (fill > 200.0) fill = 200.0; // just in case wildly wrong reading

  Serial.print("Distance: ");
  Serial.print(distance, 2);
  Serial.print(" cm | Fill: ");
  Serial.print(fill, 1);
  Serial.println(" %");

  // Update Blynk with current values
  Blynk.virtualWrite(V0_FILL_PERCENTAGE, fill);
  Blynk.virtualWrite(V1_DISTANCE, distance);
  Blynk.virtualWrite(V3_TIMESTAMP, millis() / 1000); // seconds since boot

  // LEDs mapping (0-100% -> 0-10 LEDs)
  int ledsToGlow = map((int)round(constrain(fill, 0.0, 100.0)), 0, 100, 0, numLEDs);
  updateLEDs(ledsToGlow);

  // Determine status and update Blynk
  int status = 0; // 0 = empty, 1 = warning, 2 = full
  if (fill >= fullThreshold) {
    status = 2;
  } else if (fill >= warnThreshold) {
    status = 1;
  }
  Blynk.virtualWrite(V2_STATUS, status);

  // Alert logic
  if (!sent90 && fill >= warnThreshold && fill < fullThreshold) {
    // send 90% warning
    String msg = String("⚠️ ") + String(DUSTBIN_LABEL) + " is almost full (" + String((int)fill) + "%). Please schedule cleaning soon.";
    bool ok = sendSMS(msg);
    if (ok) {
      sent90 = true;
      Serial.println("90% warning SMS sent.");
    } else {
      Serial.println("Failed to send 90% SMS.");
    }
  }

  if (!sent100 && fill >= fullThreshold) {
    // send full message
    String msg = String("🚮 ") + String(DUSTBIN_LABEL) + " is FULL. Please empty it now.";
    bool ok = sendSMS(msg);
    if (ok) {
      sent100 = true;
      Serial.println("100% full SMS sent.");
    } else {
      Serial.println("Failed to send 100% SMS.");
    }
  }

  // Reset logic to allow new alerts after emptying
  if ((fill < resetThreshold) && (sent90 || sent100)) {
    Serial.println("Fill dropped below reset threshold — resetting alert flags.");
    sent90 = false;
    sent100 = false;
  }

  delay(readDelayMs);
}

// --------------------------- Helpers ---------------------------

float singleDistanceRead() {
  // standard HC-SR04 reading
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  // pulseIn timeout to avoid blocking too long: 30000 us => ~5 meters
  long duration = pulseIn(echoPin, HIGH, 30000);
  if (duration == 0) {
    // timeout - return large distance
    return binHeightCm + 10.0;
  }
  float distCm = (duration * 0.0343) / 2.0;
  return distCm;
}

float getSmoothedDistance() {
  float d = singleDistanceRead();
  lastDistances[smoothIndex] = d;
  smoothIndex++;
  if (smoothIndex >= SMOOTH_COUNT) {
    smoothIndex = 0;
    bufferFilled = true;
  }

  int count = bufferFilled ? SMOOTH_COUNT : smoothIndex;
  float sum = 0;
  for (int i = 0; i < count; i++) sum += lastDistances[i];
  return sum / max(1, count);
}

void updateLEDs(int countOn) {
  for (int i = 0; i < numLEDs; i++) {
    digitalWrite(ledPins[i], (i < countOn) ? HIGH : LOW);
  }
}

String urlEncode(const String &str) {
  String encoded = "";
  char c;
  char buf[4];
  for (size_t i = 0; i < str.length(); i++) {
    c = str[i];
    if (isalnum(c) || c == '-' || c == '_' || c == '.' || c == '~') {
      encoded += c;
    } else if (c == ' ') {
      encoded += "%20";
    } else {
      sprintf(buf, "%%%02X", (unsigned char)c);
      encoded += buf;
    }
  }
  return encoded;
}

bool sendSMS(const String &message) {
  // Build Twilio URL
  String url = String("https://api.twilio.com/2010-04-01/Accounts/") + TWILIO_ACCOUNT_SID + "/Messages.json";
  WiFiClientSecure client;
  client.setInsecure(); // NOTE: for prototyping only
  HTTPClient http;
  http.begin(client, url);
  // Basic auth using account SID and auth token
  http.setAuthorization(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
  http.addHeader("Content-Type", "application/x-www-form-urlencoded");

  // Build POST data (URL encoded)
  String body = "To=" + urlEncode(String(TWILIO_TO)) + "&From=" + urlEncode(String(TWILIO_FROM)) + "&Body=" + urlEncode(message);

  int httpCode = http.POST(body);
  if (httpCode > 0) {
    String payload = http.getString();
    Serial.printf("Twilio HTTP code: %d\n", httpCode);
    Serial.println("Twilio response: " + payload);
    http.end();
    // 201 Created means success
    return (httpCode == 201 || httpCode == 200);
  } else {
    Serial.printf("Twilio POST failed, error: %s\n", http.errorToString(httpCode).c_str());
    http.end();
    return false;
  }
}

void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("WiFi connected. IP: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("Failed to connect to WiFi. Check credentials.");
  }
}

