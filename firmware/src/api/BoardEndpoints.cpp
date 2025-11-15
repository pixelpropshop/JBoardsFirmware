#include "BoardEndpoints.h"
#include <ArduinoJson.h>
#include "config.h"

void setupBoardEndpoints(AsyncWebServer& server) {
    // GET /api/board/info - Get board information
    server.on("/api/board/info", HTTP_GET, [](AsyncWebServerRequest *request) {
        StaticJsonDocument<256> doc;
        
        doc["model"] = "jsense";
        doc["hardware"] = ESP32_VARIANT;
        doc["firmware"] = FIRMWARE_VERSION;
        doc["variant"] = BOARD_NAME;
        doc["outputs"] = NUM_PIXEL_OUTPUTS;
        doc["maxPixelsPerOutput"] = MAX_PIXELS_PER_OUTPUT;
        
        // Features
        JsonObject features = doc.createNestedObject("features");
        features["sensors"] = FEATURE_SENSORS;
        features["rtc"] = FEATURE_RTC;
        features["oled"] = FEATURE_OLED;
        features["audio"] = FEATURE_AUDIO;
        features["jboardNetwork"] = FEATURE_JBOARD_NETWORK;
        features["fseq"] = FEATURE_FSEQ;
        
        String response;
        serializeJson(doc, response);
        
        request->send(200, "application/json", response);
    });
}
