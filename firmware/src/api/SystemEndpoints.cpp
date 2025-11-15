// JSense Board ESP32-S3 Firmware
// Phase 3: System Management Endpoints
// Implementation of 14 system management API endpoints

#include "SystemEndpoints.h"
#include "../config.h"
#include <ArduinoJson.h>
#include <Update.h>
#include <esp_ota_ops.h>
#include <esp_partition.h>

// ============================================================================
// System Endpoints Setup
// ============================================================================

void setupSystemEndpoints(AsyncWebServer& server, SystemManager& systemManager, PixelManager& pixelManager, EffectsManager& effectsManager, SequenceManager& sequenceManager) {
  
  // ============================================================================
  // GET /api/system/stats - Get combined system statistics (Dashboard)
  // Endpoint 59
  // Returns combined info, health, channels, and now playing for dashboard
  // ============================================================================
  server.on("/api/system/stats", HTTP_GET, [&systemManager, &pixelManager, &effectsManager, &sequenceManager](AsyncWebServerRequest *request) {
    StaticJsonDocument<4096> doc;
    
    // System info
    JsonObject info = doc.createNestedObject("info");
    info["productName"] = "JSense Board";
    info["hostname"] = "jsenseboard";
    info["firmwareVersion"] = FIRMWARE_VERSION;
    info["buildDate"] = __DATE__;
    info["buildTime"] = __TIME__;
    info["chipModel"] = ESP32_VARIANT;
    info["chipRevision"] = ESP.getChipRevision();
    info["flashSize"] = ESP.getFlashChipSize();
    info["cpuFrequency"] = ESP.getCpuFreqMHz();
    
    // System health
    JsonObject health = doc.createNestedObject("health");
    health["uptimeSeconds"] = systemManager.getUptime() / 1000;
    
    // Internal SRAM Heap
    health["heapTotal"] = ESP.getHeapSize();
    health["heapFree"] = ESP.getFreeHeap();
    health["heapUsed"] = ESP.getHeapSize() - ESP.getFreeHeap();
    health["heapMaxAlloc"] = ESP.getMaxAllocHeap();
    
    // PSRAM - Use constant from config.h due to ESP.getPsramSize() bug with OPI PSRAM
    #ifdef BOARD_HAS_PSRAM
    size_t psramTotal = PSRAM_SIZE_MB * 1024 * 1024;  // Convert MB to bytes
    size_t psramFree = ESP.getFreePsram();
    health["psramTotal"] = psramTotal;
    health["psramFree"] = psramFree;
    health["psramUsed"] = psramTotal - psramFree;
    #else
    health["psramTotal"] = 0;
    health["psramFree"] = 0;
    health["psramUsed"] = 0;
    #endif
    
    // CPU Temperature (ESP32-S3 internal sensor)
    health["cpuTemperature"] = temperatureRead();
    
    // LED Channels - integrate PixelManager data
    JsonArray channels = doc.createNestedArray("ledChannels");
    for (int i = 1; i <= pixelManager.getOutputCount(); i++) {
      PixelOutput* output = pixelManager.getOutput(i);
      if (output != nullptr) {
        JsonObject ch = channels.createNestedObject();
        ch["id"] = output->id;
        ch["name"] = output->name;
        ch["enabled"] = output->enabled;
        ch["pixelCount"] = output->pixelCount;
        ch["pixelType"] = output->pixelType;
        ch["dataPin"] = output->gpio;
        ch["fps"] = 60; // Default FPS, could be tracked in PixelOutput
        ch["status"] = output->status;
        
        // Add current effect if active
        if (output->status == "active") {
          EffectState currentState = effectsManager.getCurrentState();
          if (currentState.power) {
            // Get effect type names
            const char* effectNames[] = {
              "Solid", "Rainbow", "Chase", "Breathe", "Sparkle", "Fire",
              "Color Flow", "Strobe", "Bars", "Wave", "Confetti", "Meteor",
              "Noise", "Matrix", "Police", "Aurora"
            };
            if (currentState.type >= 0 && currentState.type < 16) {
              ch["currentEffect"] = effectNames[currentState.type];
            }
          }
        }
      }
    }
    
    // Now Playing - integrate EffectsManager and SequenceManager
    JsonObject nowPlaying = doc.createNestedObject("nowPlaying");
    
    // Check if sequence is playing first
    if (sequenceManager.isPlaying()) {
      PlaybackState playbackState = sequenceManager.getPlaybackState();
      Sequence* currentSeq = sequenceManager.getSequence(playbackState.sequenceId);
      
      if (currentSeq != nullptr) {
        nowPlaying["type"] = "sequence";
        nowPlaying["name"] = currentSeq->name;
        nowPlaying["id"] = currentSeq->id;
        nowPlaying["loop"] = currentSeq->loop;
        
        // Calculate total duration from steps
        uint32_t totalDuration = 0;
        for (const auto& step : currentSeq->steps) {
          totalDuration += step.duration;
        }
        nowPlaying["duration"] = totalDuration / 1000; // Convert to seconds
        nowPlaying["elapsed"] = playbackState.totalElapsed / 1000; // Convert to seconds
        
        // Add channel assignments if available
        JsonArray chArray = nowPlaying.createNestedArray("channels");
        // Sequences typically use all enabled channels
        for (int i = 1; i <= pixelManager.getOutputCount(); i++) {
          PixelOutput* output = pixelManager.getOutput(i);
          if (output != nullptr && output->enabled) {
            chArray.add(output->id);
          }
        }
      } else {
        // Sequence ID not found, mark as idle
        nowPlaying["type"] = "idle";
      }
    } 
    // Otherwise check if effect is playing
    else {
      EffectState currentState = effectsManager.getCurrentState();
      if (currentState.power) {
        nowPlaying["type"] = "effect";
        
        // Get effect name
        const char* effectNames[] = {
          "Solid", "Rainbow", "Chase", "Breathe", "Sparkle", "Fire",
          "Color Flow", "Strobe", "Bars", "Wave", "Confetti", "Meteor",
          "Noise", "Matrix", "Police", "Aurora"
        };
        if (currentState.type >= 0 && currentState.type < 16) {
          nowPlaying["name"] = effectNames[currentState.type];
        } else {
          nowPlaying["name"] = "Unknown Effect";
        }
        
        nowPlaying["id"] = (int)currentState.type;
        nowPlaying["loop"] = true; // Effects loop by default
        
        // Add channel assignments
        JsonArray chArray = nowPlaying.createNestedArray("channels");
        for (int i = 1; i <= pixelManager.getOutputCount(); i++) {
          PixelOutput* output = pixelManager.getOutput(i);
          if (output != nullptr && output->enabled && output->status == "active") {
            chArray.add(output->id);
          }
        }
      } else {
        // Nothing playing
        nowPlaying["type"] = "idle";
      }
    }
    
    String response;
    serializeJson(doc, response);
    request->send(200, "application/json", response);
  });
  
  // ============================================================================
  // GET /api/system/info - Get detailed system information
  // Endpoint 60
  // ============================================================================
  server.on("/api/system/info", HTTP_GET, [&systemManager](AsyncWebServerRequest *request) {
    String response = systemManager.getSystemInfo();
    request->send(200, "application/json", response);
  });
  
  // ============================================================================
  // GET /api/system/memory - Get memory information
  // Endpoint 61
  // ============================================================================
  server.on("/api/system/memory", HTTP_GET, [&systemManager](AsyncWebServerRequest *request) {
    String response = systemManager.getMemoryInfo();
    request->send(200, "application/json", response);
  });
  
  // ============================================================================
  // GET /api/system/uptime - Get system uptime
  // Endpoint 62
  // ============================================================================
  server.on("/api/system/uptime", HTTP_GET, [&systemManager](AsyncWebServerRequest *request) {
    StaticJsonDocument<256> doc;
    
    unsigned long uptimeMs = systemManager.getUptime();
    doc["uptimeMs"] = uptimeMs;
    doc["uptimeSeconds"] = uptimeMs / 1000;
    doc["uptimeMinutes"] = uptimeMs / 60000;
    doc["uptimeHours"] = uptimeMs / 3600000;
    doc["uptimeDays"] = uptimeMs / 86400000;
    
    // Human readable format
    unsigned long seconds = uptimeMs / 1000;
    unsigned long days = seconds / 86400;
    unsigned long hours = (seconds % 86400) / 3600;
    unsigned long minutes = (seconds % 3600) / 60;
    unsigned long secs = seconds % 60;
    
    char readable[64];
    snprintf(readable, sizeof(readable), "%lud %luh %lum %lus", days, hours, minutes, secs);
    doc["readable"] = readable;
    
    String response;
    serializeJson(doc, response);
    request->send(200, "application/json", response);
  });
  
  // ============================================================================
  // GET /api/system/firmware/ota-status - Get OTA partition and boot status
  // For Settings page - shows current partition, backup partition, rollback availability
  // MUST BE REGISTERED BEFORE /api/system/firmware (more specific route first)
  // ============================================================================
  server.on("/api/system/firmware/ota-status", HTTP_GET, [](AsyncWebServerRequest *request) {
    StaticJsonDocument<512> doc;
    
    const esp_partition_t* running = esp_ota_get_running_partition();
    const esp_partition_t* boot = esp_ota_get_boot_partition();
    const esp_partition_t* next = esp_ota_get_next_update_partition(NULL);
    
    if (running) {
      doc["currentPartition"] = running->label;
      doc["currentVersion"] = FIRMWARE_VERSION;
    }
    
    if (next) {
      doc["backupPartition"] = next->label;
      
      // Read backup version from NVS (stored during OTA update)
      Preferences prefs;
      prefs.begin("system", true); // Read-only
      String backupVersion = prefs.getString("backupVersion", "unknown");
      prefs.end();
      
      doc["backupVersion"] = backupVersion;
    }
    
    // Boot diagnostics
    esp_ota_img_states_t ota_state;
    if (esp_ota_get_state_partition(running, &ota_state) == ESP_OK) {
      if (ota_state == ESP_OTA_IMG_PENDING_VERIFY) {
        doc["lastBootSuccess"] = false;
        doc["safeBoot"] = true;
      } else {
        doc["lastBootSuccess"] = true;
        doc["safeBoot"] = false;
      }
    }
    
    doc["rollbackAvailable"] = Update.canRollBack();
    doc["bootCount"] = 1; // TODO: Track boot count in NVS
    
    String response;
    serializeJson(doc, response);
    request->send(200, "application/json", response);
  });
  
  // ============================================================================
  // GET /api/system/firmware - Get firmware information
  // Endpoint 63
  // MUST BE REGISTERED AFTER more specific /firmware/* routes
  // ============================================================================
  server.on("/api/system/firmware", HTTP_GET, [&systemManager](AsyncWebServerRequest *request) {
    String response = systemManager.getFirmwareInfo();
    request->send(200, "application/json", response);
  });
  
  // ============================================================================
  // POST /api/system/firmware/mark-valid - Mark current firmware as valid
  // Confirms the current boot is working correctly (prevents auto-rollback)
  // ============================================================================
  server.on("/api/system/firmware/mark-valid", HTTP_POST, [](AsyncWebServerRequest *request) {
    StaticJsonDocument<256> doc;
    
    const esp_partition_t* running = esp_ota_get_running_partition();
    esp_ota_img_states_t ota_state;
    
    if (esp_ota_get_state_partition(running, &ota_state) == ESP_OK) {
      if (ota_state == ESP_OTA_IMG_PENDING_VERIFY) {
        // Mark as valid
        esp_err_t err = esp_ota_mark_app_valid_cancel_rollback();
        if (err == ESP_OK) {
          doc["success"] = true;
          doc["message"] = "Firmware marked as valid";
        } else {
          doc["success"] = false;
          doc["error"] = "Failed to mark firmware as valid";
        }
      } else {
        doc["success"] = true;
        doc["message"] = "Firmware already marked as valid";
      }
    } else {
      doc["success"] = false;
      doc["error"] = "Could not get OTA state";
    }
    
    String response;
    serializeJson(doc, response);
    request->send(doc["success"] ? 200 : 500, "application/json", response);
  });
  
  // ============================================================================
  // GET /api/system/safe-boot - Get Safe Boot Mode status
  // Returns crash detection status and Safe Boot Mode information
  // ============================================================================
  server.on("/api/system/safe-boot", HTTP_GET, [&systemManager](AsyncWebServerRequest *request) {
    String response = systemManager.getSafeBootInfo();
    request->send(200, "application/json", response);
  });
  
  // ============================================================================
  // DELETE /api/system/safe-boot - Clear Safe Boot Mode
  // Clears the Safe Boot Mode flag and crash counters
  // Device will attempt normal WiFi connection on next restart
  // ============================================================================
  server.on("/api/system/safe-boot", HTTP_DELETE, [&systemManager](AsyncWebServerRequest *request) {
    StaticJsonDocument<256> doc;
    
    systemManager.clearSafeBootMode();
    
    doc["success"] = true;
    doc["message"] = "Safe Boot Mode cleared. Device will restart normally.";
    doc["note"] = "You may want to restart the device for changes to take effect.";
    
    String response;
    serializeJson(doc, response);
    request->send(200, "application/json", response);
  });
  
  // ============================================================================
  // POST /api/system/firmware/upload - Upload new firmware (OTA update)
  // Endpoint 65
  // Handles multipart file upload for OTA updates
  // ============================================================================
  server.on("/api/system/firmware/upload", HTTP_POST,
    // onRequest - called after upload completes
    [&systemManager](AsyncWebServerRequest *request) {
      bool success = systemManager.endOTAUpdate();
      
      StaticJsonDocument<256> doc;
      if (success) {
        doc["success"] = true;
        doc["message"] = "Firmware uploaded successfully. Restarting in 3 seconds...";
        
        String response;
        serializeJson(doc, response);
        request->send(200, "application/json", response);
        
        // Schedule restart after response is sent
        delay(100);
        ESP.restart();
      } else {
        doc["success"] = false;
        doc["error"] = "OTA update failed";
        doc["message"] = Update.errorString();
        
        String response;
        serializeJson(doc, response);
        request->send(500, "application/json", response);
      }
    },
    // onUpload - called for each chunk of data
    [&systemManager](AsyncWebServerRequest *request, String filename, size_t index, uint8_t *data, size_t len, bool final) {
      if (index == 0) {
        Serial.printf("[OTA] Starting firmware update: %s\n", filename.c_str());
        // Calculate expected size from content length header
        size_t contentLen = request->contentLength();
        if (!systemManager.beginOTAUpdate(contentLen)) {
          Serial.println("[OTA] Failed to begin OTA update");
          request->send(500, "application/json", "{\"error\":\"Failed to begin OTA update\"}");
          return;
        }
      }
      
      // Write chunk
      if (!systemManager.writeOTAChunk(data, len)) {
        Serial.println("[OTA] Failed to write chunk");
        request->send(500, "application/json", "{\"error\":\"Failed to write firmware chunk\"}");
        return;
      }
      
      // Progress reporting
      if (index % 10240 == 0 || final) {
        Serial.printf("[OTA] Progress: %u bytes\n", index + len);
      }
      
      if (final) {
        Serial.printf("[OTA] Upload complete: %u bytes\n", index + len);
      }
    }
  );
  
  // ============================================================================
  // POST /api/system/firmware/update - Alias for /upload (for Settings page)
  // ============================================================================
  server.on("/api/system/firmware/update", HTTP_POST,
    [&systemManager](AsyncWebServerRequest *request) {
      bool success = systemManager.endOTAUpdate();
      
      StaticJsonDocument<256> doc;
      if (success) {
        doc["success"] = true;
        doc["message"] = "Firmware uploaded successfully. Restarting in 3 seconds...";
        
        String response;
        serializeJson(doc, response);
        request->send(200, "application/json", response);
        
        delay(100);
        ESP.restart();
      } else {
        doc["success"] = false;
        doc["error"] = "OTA update failed";
        doc["message"] = Update.errorString();
        
        String response;
        serializeJson(doc, response);
        request->send(500, "application/json", response);
      }
    },
    [&systemManager](AsyncWebServerRequest *request, String filename, size_t index, uint8_t *data, size_t len, bool final) {
      if (index == 0) {
        Serial.printf("[OTA] Starting firmware update: %s\n", filename.c_str());
        size_t contentLen = request->contentLength();
        if (!systemManager.beginOTAUpdate(contentLen)) {
          Serial.println("[OTA] Failed to begin OTA update");
          request->send(500, "application/json", "{\"error\":\"Failed to begin OTA update\"}");
          return;
        }
      }
      
      if (!systemManager.writeOTAChunk(data, len)) {
        Serial.println("[OTA] Failed to write chunk");
        request->send(500, "application/json", "{\"error\":\"Failed to write firmware chunk\"}");
        return;
      }
      
      if (index % 10240 == 0 || final) {
        Serial.printf("[OTA] Progress: %u bytes\n", index + len);
      }
      
      if (final) {
        Serial.printf("[OTA] Upload complete: %u bytes\n", index + len);
      }
    }
  );
  
  // ============================================================================
  // POST /api/system/restart - Restart the system
  // Endpoint 66
  // ============================================================================
  server.on("/api/system/restart", HTTP_POST, [&systemManager](AsyncWebServerRequest *request) {
    StaticJsonDocument<256> doc;
    doc["success"] = true;
    doc["message"] = "System restarting in 3 seconds...";
    
    String response;
    serializeJson(doc, response);
    request->send(200, "application/json", response);
    
    // Schedule restart after response is sent
    delay(100);
    systemManager.restart();
  });
  
  // ============================================================================
  // POST /api/system/factory-reset - Factory reset (clear all settings)
  // Endpoint 67
  // ============================================================================
  server.on("/api/system/factory-reset", HTTP_POST, [&systemManager](AsyncWebServerRequest *request) {
    bool success = systemManager.factoryReset();
    
    StaticJsonDocument<256> doc;
    if (success) {
      doc["success"] = true;
      doc["message"] = "Factory reset complete. System restarting in 3 seconds...";
      
      String response;
      serializeJson(doc, response);
      request->send(200, "application/json", response);
      
      // Schedule restart after response is sent
      delay(100);
      ESP.restart();
    } else {
      doc["success"] = false;
      doc["error"] = "Factory reset failed";
      
      String response;
      serializeJson(doc, response);
      request->send(500, "application/json", response);
    }
  });
  
  // ============================================================================
  // GET /api/system/config/export - Export all configuration
  // Endpoint 68
  // Returns all system configuration as JSON
  // ============================================================================
  server.on("/api/system/config/export", HTTP_GET, [&systemManager](AsyncWebServerRequest *request) {
    String response = systemManager.exportConfiguration();
    
    // Set headers for file download
    AsyncWebServerResponse *downloadResponse = request->beginResponse(200, "application/json", response);
    downloadResponse->addHeader("Content-Disposition", "attachment; filename=\"jsenseboard-config.json\"");
    request->send(downloadResponse);
  });
  
  // ============================================================================
  // GET /api/system/export-config - Alias for /config/export (for Settings page)
  // ============================================================================
  server.on("/api/system/export-config", HTTP_GET, [&systemManager](AsyncWebServerRequest *request) {
    String response = systemManager.exportConfiguration();
    
    // Set headers for file download
    AsyncWebServerResponse *downloadResponse = request->beginResponse(200, "application/json", response);
    downloadResponse->addHeader("Content-Disposition", "attachment; filename=\"jsenseboard-config.json\"");
    request->send(downloadResponse);
  });
  
  // ============================================================================
  // POST /api/system/config/import - Import configuration
  // Endpoint 69
  // Accepts JSON configuration and applies it
  // ============================================================================
  server.on("/api/system/config/import", HTTP_POST,
    [](AsyncWebServerRequest *request) {
      // This will be called after the body handler processes the data
    },
    NULL,
    [&systemManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
      // Body handler - receives POST data
      if (index == 0) {
        // First chunk
        Serial.println("[Config] Receiving configuration import...");
      }
      
      if (index + len == total) {
        // Last chunk - process the complete JSON as a string
        String configJson = String((char*)data);
        configJson = configJson.substring(0, len);
        
        StaticJsonDocument<256> response;
        
        if (systemManager.importConfiguration(configJson)) {
          response["success"] = true;
          response["message"] = "Configuration imported successfully. Restart required for some changes to take effect.";
          
          String responseStr;
          serializeJson(response, responseStr);
          request->send(200, "application/json", responseStr);
        } else {
          response["success"] = false;
          response["error"] = "Failed to import configuration";
          
          String responseStr;
          serializeJson(response, responseStr);
          request->send(500, "application/json", responseStr);
        }
      }
    }
  );
  
  // ============================================================================
  // GET /api/system/logs - Get system logs
  // Endpoint 70
  // Returns recent log entries
  // ============================================================================
  server.on("/api/system/logs", HTTP_GET, [&systemManager](AsyncWebServerRequest *request) {
    StaticJsonDocument<512> doc;
    
    // Get last log entry
    String lastLog = systemManager.getLastLog();
    
    // For now, return basic log info
    // In a full implementation, this would retrieve stored logs
    doc["lastLog"] = lastLog;
    doc["message"] = "Full log storage not yet implemented";
    doc["uptime"] = systemManager.getUptime();
    
    String response;
    serializeJson(doc, response);
    request->send(200, "application/json", response);
  });
  
  // ============================================================================
  // DELETE /api/system/logs - Clear system logs
  // Endpoint 71
  // ============================================================================
  server.on("/api/system/logs", HTTP_DELETE, [&systemManager](AsyncWebServerRequest *request) {
    bool success = systemManager.clearLogs();
    
    StaticJsonDocument<256> doc;
    if (success) {
      doc["success"] = true;
      doc["message"] = "Logs cleared successfully";
    } else {
      doc["success"] = false;
      doc["error"] = "Failed to clear logs";
    }
    
    String response;
    serializeJson(doc, response);
    request->send(success ? 200 : 500, "application/json", response);
  });
  
  // ============================================================================
  // POST /api/system/clear-logs - Alias for DELETE /logs (for Settings page)
  // ============================================================================
  server.on("/api/system/clear-logs", HTTP_POST, [&systemManager](AsyncWebServerRequest *request) {
    bool success = systemManager.clearLogs();
    
    StaticJsonDocument<256> doc;
    if (success) {
      doc["success"] = true;
      doc["message"] = "Logs cleared successfully";
    } else {
      doc["success"] = false;
      doc["error"] = "Failed to clear logs";
    }
    
    String response;
    serializeJson(doc, response);
    request->send(success ? 200 : 500, "application/json", response);
  });
  
  // ============================================================================
  // GET /api/system/firmware/status - Get firmware update status
  // Endpoint 72
  // ============================================================================
  server.on("/api/system/firmware/status", HTTP_GET, [](AsyncWebServerRequest *request) {
    StaticJsonDocument<512> doc;
    
    if (Update.isRunning()) {
      doc["updating"] = true;
      doc["progress"] = Update.progress();
      doc["total"] = Update.size();
      doc["percentage"] = (Update.progress() * 100) / Update.size();
    } else {
      doc["updating"] = false;
      doc["lastError"] = Update.hasError() ? Update.errorString() : "none";
    }
    
    String response;
    serializeJson(doc, response);
    request->send(200, "application/json", response);
  });
  
  // ============================================================================
  // POST /api/system/firmware/rollback - Rollback to previous firmware
  // Endpoint 73
  // ============================================================================
  server.on("/api/system/firmware/rollback", HTTP_POST, [&systemManager](AsyncWebServerRequest *request) {
    StaticJsonDocument<256> doc;
    
    // ESP32 supports rollback via boot partition switching
    bool canRollback = Update.canRollBack();
    
    if (canRollback) {
      doc["success"] = true;
      doc["message"] = "Rolling back to previous firmware. Restarting in 3 seconds...";
      
      String response;
      serializeJson(doc, response);
      request->send(200, "application/json", response);
      
      delay(100);
      Update.rollBack();
      ESP.restart();
    } else {
      doc["success"] = false;
      doc["error"] = "No previous firmware available for rollback";
      
      String response;
      serializeJson(doc, response);
      request->send(400, "application/json", response);
    }
  });
  
  // ============================================================================
  // GET /api/system/health - Advanced health check with component status
  // Endpoint 74
  // ============================================================================
  server.on("/api/system/health", HTTP_GET, [&systemManager](AsyncWebServerRequest *request) {
    StaticJsonDocument<1024> doc;
    
    doc["status"] = "ok";
    doc["uptime"] = systemManager.getUptime();
    
    // Memory health
    JsonObject memory = doc.createNestedObject("memory");
    size_t freeHeap = ESP.getFreeHeap();
    size_t totalHeap = ESP.getHeapSize();
    memory["free"] = freeHeap;
    memory["total"] = totalHeap;
    memory["usage"] = ((totalHeap - freeHeap) * 100) / totalHeap;
    memory["status"] = (freeHeap > 50000) ? "healthy" : (freeHeap > 20000) ? "warning" : "critical";
    
    // CPU health
    JsonObject cpu = doc.createNestedObject("cpu");
    cpu["frequency"] = ESP.getCpuFreqMHz();
    cpu["status"] = "healthy";
    
    // WiFi health
    JsonObject wifi = doc.createNestedObject("wifi");
    wifi["connected"] = WiFi.status() == WL_CONNECTED;
    wifi["rssi"] = WiFi.RSSI();
    wifi["status"] = (WiFi.status() == WL_CONNECTED) ? "healthy" : "disconnected";
    
    // Overall status
    bool isHealthy = (freeHeap > 20000) && (WiFi.status() == WL_CONNECTED || WiFi.getMode() == WIFI_AP);
    doc["overall"] = isHealthy ? "healthy" : "degraded";
    
    String response;
    serializeJson(doc, response);
    request->send(200, "application/json", response);
  });
  
  Serial.println("[API] System endpoints registered:");
  Serial.println("  - GET    /api/system/info");
  Serial.println("  - GET    /api/system/memory");
  Serial.println("  - GET    /api/system/uptime");
  Serial.println("  - GET    /api/system/firmware");
  Serial.println("  - GET    /api/system/firmware/ota-status");
  Serial.println("  - POST   /api/system/firmware/mark-valid");
  Serial.println("  - GET    /api/system/safe-boot");
  Serial.println("  - DELETE /api/system/safe-boot");
  Serial.println("  - POST   /api/system/firmware/upload");
  Serial.println("  - POST   /api/system/firmware/update");
  Serial.println("  - POST   /api/system/restart");
  Serial.println("  - POST   /api/system/factory-reset");
  Serial.println("  - GET    /api/system/config/export");
  Serial.println("  - GET    /api/system/export-config");
  Serial.println("  - POST   /api/system/config/import");
  Serial.println("  - GET    /api/system/logs");
  Serial.println("  - DELETE /api/system/logs");
  Serial.println("  - POST   /api/system/clear-logs");
  Serial.println("  - GET    /api/system/firmware/status");
  Serial.println("  - POST   /api/system/firmware/rollback");
  Serial.println("  - GET    /api/system/health");
}
