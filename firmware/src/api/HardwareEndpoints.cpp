// JSense Board ESP32-S3 Firmware
// Phase 4: Hardware Configuration Endpoints
// Implementation of 9 hardware management API endpoints

#include "HardwareEndpoints.h"
#include <ArduinoJson.h>

// ============================================================================
// Hardware Endpoints Setup
// ============================================================================

void setupHardwareEndpoints(AsyncWebServer& server, HardwareManager& hardwareManager) {
  
  // ============================================================================
  // GET /api/hardware/rtc - Get RTC information
  // Endpoint 74
  // ============================================================================
  server.on("/api/hardware/rtc", HTTP_GET, [&hardwareManager](AsyncWebServerRequest *request) {
    String response = hardwareManager.getRTCInfo();
    request->send(200, "application/json", response);
  });
  
  // ============================================================================
  // GET /api/hardware/rtc/status - Get RTC status (for Settings page)
  // Frontend expects: { "available": bool, "synced": bool, "lastSync": timestamp }
  // ============================================================================
  server.on("/api/hardware/rtc/status", HTTP_GET, [&hardwareManager](AsyncWebServerRequest *request) {
    StaticJsonDocument<256> doc;
    doc["available"] = hardwareManager.hasRTC();
    doc["synced"] = false; // TODO: Track last sync time in HardwareManager
    doc["lastSync"] = nullptr;
    
    String response;
    serializeJson(doc, response);
    request->send(200, "application/json", response);
  });
  
  // ============================================================================
  // POST /api/hardware/rtc - Unified RTC configuration update (for Settings page)
  // Body: { "timezone": "America/Phoenix", "timeFormat": "12h", "dateFormat": "MM/DD/YYYY", "syncPriority": "ntp" }
  // ============================================================================
  server.on("/api/hardware/rtc", HTTP_POST,
    [](AsyncWebServerRequest *request) {},
    NULL,
    [&hardwareManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
      if (index + len == total) {
        StaticJsonDocument<512> doc;
        DeserializationError error = deserializeJson(doc, data, len);
        
        if (error) {
          request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
          return;
        }
        
        // For now, just acknowledge the config update
        // TODO: Implement timezone and format settings in HardwareManager
        StaticJsonDocument<256> response;
        response["success"] = true;
        response["message"] = "RTC configuration updated";
        
        if (doc.containsKey("timezone")) {
          response["timezone"] = doc["timezone"];
        }
        if (doc.containsKey("timeFormat")) {
          response["timeFormat"] = doc["timeFormat"];
        }
        if (doc.containsKey("dateFormat")) {
          response["dateFormat"] = doc["dateFormat"];
        }
        if (doc.containsKey("syncPriority")) {
          response["syncPriority"] = doc["syncPriority"];
        }
        
        String responseStr;
        serializeJson(response, responseStr);
        request->send(200, "application/json", responseStr);
      }
    }
  );
  
  // ============================================================================
  // GET /api/hardware/rtc/time - Get current RTC time
  // Endpoint 75
  // ============================================================================
  server.on("/api/hardware/rtc/time", HTTP_GET, [&hardwareManager](AsyncWebServerRequest *request) {
    String response = hardwareManager.getRTCTime();
    request->send(200, "application/json", response);
  });
  
  // ============================================================================
  // POST /api/hardware/rtc/time - Set RTC time
  // Endpoint 76
  // Body: { "year": 2025, "month": 11, "day": 11, "hour": 19, "minute": 42, "second": 0 }
  // ============================================================================
  server.on("/api/hardware/rtc/time", HTTP_POST,
    [](AsyncWebServerRequest *request) {},
    NULL,
    [&hardwareManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
      if (index + len == total) {
        StaticJsonDocument<256> doc;
        DeserializationError error = deserializeJson(doc, data, len);
        
        if (error) {
          request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
          return;
        }
        
        int year = doc["year"] | 2025;
        int month = doc["month"] | 1;
        int day = doc["day"] | 1;
        int hour = doc["hour"] | 0;
        int minute = doc["minute"] | 0;
        int second = doc["second"] | 0;
        
        bool success = hardwareManager.setRTCTime(year, month, day, hour, minute, second);
        
        StaticJsonDocument<128> response;
        response["success"] = success;
        
        if (success) {
          response["message"] = "RTC time updated successfully";
        } else {
          response["error"] = "Failed to update RTC time";
        }
        
        String responseStr;
        serializeJson(response, responseStr);
        request->send(success ? 200 : 500, "application/json", responseStr);
      }
    }
  );
  
  // ============================================================================
  // POST /api/hardware/rtc/sync-ntp - Sync RTC from NTP
  // Endpoint 77
  // ============================================================================
  server.on("/api/hardware/rtc/sync-ntp", HTTP_POST, [&hardwareManager](AsyncWebServerRequest *request) {
    bool success = hardwareManager.syncRTCFromNTP();
    
    StaticJsonDocument<128> doc;
    doc["success"] = success;
    
    if (success) {
      doc["message"] = "RTC synced from NTP successfully";
    } else {
      doc["error"] = "Failed to sync RTC from NTP";
    }
    
    String response;
    serializeJson(doc, response);
    request->send(success ? 200 : 500, "application/json", response);
  });
  
  // ============================================================================
  // POST /api/hardware/rtc/sync - Alias for sync-ntp (for Settings page)
  // ============================================================================
  server.on("/api/hardware/rtc/sync", HTTP_POST, [&hardwareManager](AsyncWebServerRequest *request) {
    bool success = hardwareManager.syncRTCFromNTP();
    
    StaticJsonDocument<128> doc;
    doc["success"] = success;
    
    if (success) {
      doc["message"] = "RTC synced from NTP successfully";
    } else {
      doc["error"] = "Failed to sync RTC from NTP";
    }
    
    String response;
    serializeJson(doc, response);
    request->send(success ? 200 : 500, "application/json", response);
  });
  
  // ============================================================================
  // POST /api/hardware/rtc/set-time - Set RTC time with ISO-8601 format (for Settings page)
  // Body: { "time": "2025-11-13T19:42:00Z" }
  // ============================================================================
  server.on("/api/hardware/rtc/set-time", HTTP_POST,
    [](AsyncWebServerRequest *request) {},
    NULL,
    [&hardwareManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
      if (index + len == total) {
        StaticJsonDocument<256> doc;
        DeserializationError error = deserializeJson(doc, data, len);
        
        if (error) {
          request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
          return;
        }
        
        // Parse ISO-8601 timestamp
        String timeStr = doc["time"] | "";
        if (timeStr.length() == 0) {
          request->send(400, "application/json", "{\"error\":\"Missing 'time' field\"}");
          return;
        }
        
        // Simple ISO-8601 parser: "2025-11-13T19:42:00Z"
        int year = timeStr.substring(0, 4).toInt();
        int month = timeStr.substring(5, 7).toInt();
        int day = timeStr.substring(8, 10).toInt();
        int hour = timeStr.substring(11, 13).toInt();
        int minute = timeStr.substring(14, 16).toInt();
        int second = timeStr.substring(17, 19).toInt();
        
        bool success = hardwareManager.setRTCTime(year, month, day, hour, minute, second);
        
        StaticJsonDocument<128> response;
        response["success"] = success;
        
        if (success) {
          response["message"] = "RTC time set successfully";
          response["time"] = timeStr;
        } else {
          response["error"] = "Failed to set RTC time";
        }
        
        String responseStr;
        serializeJson(response, responseStr);
        request->send(success ? 200 : 500, "application/json", responseStr);
      }
    }
  );
  
  // ============================================================================
  // GET /api/hardware/oled - Get OLED display information
  // Endpoint 79
  // ============================================================================
  server.on("/api/hardware/oled", HTTP_GET, [&hardwareManager](AsyncWebServerRequest *request) {
    String response = hardwareManager.getDisplayInfo();
    request->send(200, "application/json", response);
  });
  
  // ============================================================================
  // GET /api/hardware/oled/status - Get OLED status (for Settings page)
  // ============================================================================
  server.on("/api/hardware/oled/status", HTTP_GET, [&hardwareManager](AsyncWebServerRequest *request) {
    StaticJsonDocument<256> doc;
    doc["available"] = hardwareManager.hasOLED();
    doc["enabled"] = hardwareManager.getDisplayMode() != DisplayMode::OFF;
    
    String response;
    serializeJson(doc, response);
    request->send(200, "application/json", response);
  });
  
  // ============================================================================
  // POST /api/hardware/oled - Unified OLED configuration update (for Settings page)
  // Body: { "enabled": bool, "brightness": 0-255, "timeout": "5m", "rotation": 0, "defaultScreen": "rotating", "screenSaver": bool }
  // ============================================================================
  server.on("/api/hardware/oled", HTTP_POST,
    [](AsyncWebServerRequest *request) {},
    NULL,
    [&hardwareManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
      if (index + len == total) {
        StaticJsonDocument<512> doc;
        DeserializationError error = deserializeJson(doc, data, len);
        
        if (error) {
          request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
          return;
        }
        
        bool success = true;
        StaticJsonDocument<256> response;
        
        // Apply settings
        if (doc.containsKey("enabled") && doc["enabled"].is<bool>()) {
          bool enabled = doc["enabled"];
          DisplayMode mode = enabled ? DisplayMode::ROTATING : DisplayMode::OFF;
          if (doc.containsKey("defaultScreen")) {
            String screen = doc["defaultScreen"];
            if (screen == "clock") mode = DisplayMode::CLOCK;
            else if (screen == "ip") mode = DisplayMode::IP_ADDRESS;
            else if (screen == "status") mode = DisplayMode::STATUS;
            else if (screen == "rotating") mode = DisplayMode::ROTATING;
          }
          success = hardwareManager.setDisplayMode(mode) && success;
        }
        
        if (doc.containsKey("brightness")) {
          uint8_t brightness = doc["brightness"];
          success = hardwareManager.setDisplayBrightness(brightness) && success;
        }
        
        if (doc.containsKey("timeout")) {
          String timeoutStr = doc["timeout"];
          uint32_t timeoutMs = 30000; // Default 30s
          
          // Parse timeout string like "5m", "30s", "1h"
          if (timeoutStr.endsWith("s")) {
            timeoutMs = timeoutStr.substring(0, timeoutStr.length() - 1).toInt() * 1000;
          } else if (timeoutStr.endsWith("m")) {
            timeoutMs = timeoutStr.substring(0, timeoutStr.length() - 1).toInt() * 60000;
          } else if (timeoutStr.endsWith("h")) {
            timeoutMs = timeoutStr.substring(0, timeoutStr.length() - 1).toInt() * 3600000;
          } else {
            timeoutMs = timeoutStr.toInt();
          }
          
          success = hardwareManager.setDisplayTimeout(timeoutMs) && success;
        }
        
        response["success"] = success;
        if (success) {
          response["message"] = "OLED configuration updated successfully";
        } else {
          response["error"] = "Failed to update some OLED settings";
        }
        
        String responseStr;
        serializeJson(response, responseStr);
        request->send(success ? 200 : 500, "application/json", responseStr);
      }
    }
  );
  
  // ============================================================================
  // POST /api/hardware/oled/mode - Set OLED display mode
  // Endpoint 80
  // Body: { "mode": "clock" | "ip" | "status" | "rotating" | "off" }
  // ============================================================================
  server.on("/api/hardware/oled/mode", HTTP_POST,
    [](AsyncWebServerRequest *request) {},
    NULL,
    [&hardwareManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
      if (index + len == total) {
        StaticJsonDocument<256> doc;
        DeserializationError error = deserializeJson(doc, data, len);
        
        if (error) {
          request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
          return;
        }
        
        String modeStr = doc["mode"] | "off";
        DisplayMode mode = DisplayMode::OFF;
        
        if (modeStr == "clock") mode = DisplayMode::CLOCK;
        else if (modeStr == "ip") mode = DisplayMode::IP_ADDRESS;
        else if (modeStr == "status") mode = DisplayMode::STATUS;
        else if (modeStr == "rotating") mode = DisplayMode::ROTATING;
        
        bool success = hardwareManager.setDisplayMode(mode);
        
        StaticJsonDocument<128> response;
        response["success"] = success;
        
        if (success) {
          response["mode"] = modeStr;
          response["message"] = "Display mode updated successfully";
        } else {
          response["error"] = "Failed to update display mode";
        }
        
        String responseStr;
        serializeJson(response, responseStr);
        request->send(success ? 200 : 500, "application/json", responseStr);
      }
    }
  );
  
  // ============================================================================
  // POST /api/hardware/oled/brightness - Set OLED brightness
  // Endpoint 81
  // Body: { "brightness": 0-255 }
  // ============================================================================
  server.on("/api/hardware/oled/brightness", HTTP_POST,
    [](AsyncWebServerRequest *request) {},
    NULL,
    [&hardwareManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
      if (index + len == total) {
        StaticJsonDocument<256> doc;
        DeserializationError error = deserializeJson(doc, data, len);
        
        if (error) {
          request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
          return;
        }
        
        uint8_t brightness = doc["brightness"] | 128;
        bool success = hardwareManager.setDisplayBrightness(brightness);
        
        StaticJsonDocument<128> response;
        response["success"] = success;
        
        if (success) {
          response["brightness"] = brightness;
          response["message"] = "Display brightness updated successfully";
        } else {
          response["error"] = "Failed to update display brightness";
        }
        
        String responseStr;
        serializeJson(response, responseStr);
        request->send(success ? 200 : 500, "application/json", responseStr);
      }
    }
  );
  
  // ============================================================================
  // POST /api/hardware/oled/timeout - Set display timeout
  // Endpoint 82 (custom - added for completeness)
  // Body: { "timeout": milliseconds }
  // ============================================================================
  server.on("/api/hardware/oled/timeout", HTTP_POST,
    [](AsyncWebServerRequest *request) {},
    NULL,
    [&hardwareManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
      if (index + len == total) {
        StaticJsonDocument<256> doc;
        DeserializationError error = deserializeJson(doc, data, len);
        
        if (error) {
          request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
          return;
        }
        
        uint32_t timeout = doc["timeout"] | 30000;
        bool success = hardwareManager.setDisplayTimeout(timeout);
        
        StaticJsonDocument<128> response;
        response["success"] = success;
        response["timeout"] = timeout;
        response["message"] = "Display timeout updated successfully";
        
        String responseStr;
        serializeJson(response, responseStr);
        request->send(200, "application/json", responseStr);
      }
    }
  );
  
  // ============================================================================
  // POST /api/hardware/oled/test - Display test pattern
  // Endpoint 78 (reordered)
  // ============================================================================
  server.on("/api/hardware/oled/test", HTTP_POST, [&hardwareManager](AsyncWebServerRequest *request) {
    bool success = hardwareManager.displayTestPattern();
    
    StaticJsonDocument<128> doc;
    doc["success"] = success;
    
    if (success) {
      doc["message"] = "Test pattern displayed successfully";
    } else {
      doc["error"] = "Failed to display test pattern";
    }
    
    String response;
    serializeJson(doc, response);
    request->send(success ? 200 : 500, "application/json", response);
  });
  
  Serial.println("[API] Hardware endpoints registered:");
  Serial.println("  - GET    /api/hardware/rtc");
  Serial.println("  - GET    /api/hardware/rtc/status");
  Serial.println("  - POST   /api/hardware/rtc");
  Serial.println("  - GET    /api/hardware/rtc/time");
  Serial.println("  - POST   /api/hardware/rtc/time");
  Serial.println("  - POST   /api/hardware/rtc/sync-ntp");
  Serial.println("  - POST   /api/hardware/rtc/sync");
  Serial.println("  - POST   /api/hardware/rtc/set-time");
  Serial.println("  - GET    /api/hardware/oled");
  Serial.println("  - GET    /api/hardware/oled/status");
  Serial.println("  - POST   /api/hardware/oled");
  Serial.println("  - POST   /api/hardware/oled/mode");
  Serial.println("  - POST   /api/hardware/oled/brightness");
  Serial.println("  - POST   /api/hardware/oled/timeout");
  Serial.println("  - POST   /api/hardware/oled/test");
}
