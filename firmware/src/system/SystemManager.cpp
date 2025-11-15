#include "SystemManager.h"
#include "../config.h"
#include "../hardware/HardwareManager.h"
#include <WiFi.h>

SystemManager::SystemManager() {
    otaInProgress = false;
    otaSize = 0;
    otaWritten = 0;
    hardwareManager = nullptr;
}

void SystemManager::begin() {
    Serial.println("[SystemManager] Initializing...");
    
    // Initialize preferences
    preferences.begin("system", false);
    
    // Initialize Safe Boot Mode tracking
    initSafeBootMode();
    
    Serial.println("[SystemManager] Initialization complete");
}

void SystemManager::setHardwareManager(HardwareManager* hwMgr) {
    hardwareManager = hwMgr;
}

// System Information
String SystemManager::getSystemInfo() {
    StaticJsonDocument<768> doc;
    
    // Product information (flat structure for Settings page)
    doc["productName"] = BOARD_NAME;
    doc["hostname"] = "jsenseboard"; // TODO: Get from NetworkManager preferences
    doc["firmwareVersion"] = FIRMWARE_VERSION;
    doc["buildDate"] = __DATE__;
    doc["buildTime"] = __TIME__;
    
    // Hardware information (flat structure for Settings page)
    doc["chipModel"] = ESP32_VARIANT;
    doc["chipRevision"] = ESP.getChipRevision();
    doc["flashSize"] = ESP.getFlashChipSize();
    doc["cpuFrequency"] = ESP.getCpuFreqMHz();
    doc["macAddressWiFi"] = WiFi.macAddress();
    doc["macAddressAP"] = WiFi.softAPmacAddress();
    
    // Additional board details (for legacy compatibility)
    doc["boardVariant"] = BOARD_VARIANT;
    doc["numOutputs"] = NUM_PIXEL_OUTPUTS;
    doc["maxPixelsPerOutput"] = MAX_PIXELS_PER_OUTPUT;
    
    // Memory information
    doc["heapTotal"] = ESP.getHeapSize();
    doc["heapFree"] = ESP.getFreeHeap();
    doc["heapMinFree"] = ESP.getMinFreeHeap();
    doc["psramTotal"] = ESP.getPsramSize();
    doc["psramFree"] = ESP.getFreePsram();
    
    // Features
    doc["features"]["sensors"] = FEATURE_SENSORS;
    doc["features"]["rtc"] = FEATURE_RTC;
    doc["features"]["oled"] = FEATURE_OLED;
    doc["features"]["audio"] = FEATURE_AUDIO;
    doc["features"]["jboardNetwork"] = FEATURE_JBOARD_NETWORK;
    doc["features"]["fseq"] = FEATURE_FSEQ;
    
    String result;
    serializeJson(doc, result);
    return result;
}

String SystemManager::getMemoryInfo() {
    StaticJsonDocument<256> doc;
    
    doc["freeHeap"] = ESP.getFreeHeap();
    doc["heapSize"] = ESP.getHeapSize();
    doc["minFreeHeap"] = ESP.getMinFreeHeap();
    doc["psramSize"] = ESP.getPsramSize();
    doc["freePsram"] = ESP.getFreePsram();
    doc["chipRevision"] = ESP.getChipRevision();
    doc["sdkVersion"] = ESP.getSdkVersion();
    
    String result;
    serializeJson(doc, result);
    return result;
}

unsigned long SystemManager::getUptime() {
    return millis();
}

String SystemManager::getFirmwareInfo() {
    StaticJsonDocument<256> doc;
    
    doc["version"] = FIRMWARE_VERSION;
    doc["major"] = FIRMWARE_VERSION_MAJOR;
    doc["minor"] = FIRMWARE_VERSION_MINOR;
    doc["patch"] = FIRMWARE_VERSION_PATCH;
    doc["buildDate"] = __DATE__;
    doc["buildTime"] = __TIME__;
    
    String result;
    serializeJson(doc, result);
    return result;
}

// Firmware Update
bool SystemManager::beginOTAUpdate(size_t size) {
    Serial.println("[OTA] Starting firmware update...");
    Serial.print("[OTA] Size: ");
    Serial.println(size);
    
    if (otaInProgress) {
        Serial.println("[OTA] Update already in progress");
        return false;
    }
    
    // Store current firmware version to NVS before updating
    // This becomes the "backup version" after the update completes
    preferences.putString("backupVersion", FIRMWARE_VERSION);
    Serial.print("[OTA] Stored current version as backup: ");
    Serial.println(FIRMWARE_VERSION);
    
    if (!Update.begin(size)) {
        Serial.println("[OTA] Failed to begin update");
        Update.printError(Serial);
        return false;
    }
    
    otaInProgress = true;
    otaSize = size;
    otaWritten = 0;
    
    Serial.println("[OTA] Update started successfully");
    return true;
}

bool SystemManager::writeOTAChunk(uint8_t* data, size_t len) {
    if (!otaInProgress) {
        Serial.println("[OTA] No update in progress");
        return false;
    }
    
    size_t written = Update.write(data, len);
    if (written != len) {
        Serial.println("[OTA] Write failed");
        Update.printError(Serial);
        return false;
    }
    
    otaWritten += written;
    
    // Print progress every 10%
    if (otaSize > 0) {
        int progress = (otaWritten * 100) / otaSize;
        static int lastProgress = 0;
        if (progress >= lastProgress + 10) {
            Serial.print("[OTA] Progress: ");
            Serial.print(progress);
            Serial.println("%");
            lastProgress = progress;
        }
    }
    
    return true;
}

bool SystemManager::endOTAUpdate() {
    if (!otaInProgress) {
        Serial.println("[OTA] No update in progress");
        return false;
    }
    
    if (!Update.end(true)) {
        Serial.println("[OTA] Update failed");
        Update.printError(Serial);
        otaInProgress = false;
        return false;
    }
    
    Serial.println("[OTA] Update completed successfully");
    Serial.println("[OTA] Restarting...");
    
    otaInProgress = false;
    return true;
}

bool SystemManager::isOTAInProgress() {
    return otaInProgress;
}

size_t SystemManager::getOTAProgress() {
    if (otaSize == 0) return 0;
    return (otaWritten * 100) / otaSize;
}

// System Control
void SystemManager::restart(uint32_t delayMs) {
    Serial.println("[System] Restarting device...");
    Serial.flush();
    delay(delayMs);
    ESP.restart();
}

bool SystemManager::factoryReset() {
    Serial.println("[System] Factory reset initiated...");
    
    // Clear all preferences namespaces
    preferences.begin("network", false);
    preferences.clear();
    preferences.end();
    
    preferences.begin("system", false);
    preferences.clear();
    preferences.end();
    
    // Add other namespaces as they're created in future phases
    
    Serial.println("[System] All settings cleared");
    Serial.println("[System] Device will restart...");
    
    delay(1000);
    ESP.restart();
    
    return true;
}

// Configuration
String SystemManager::exportConfiguration() {
    StaticJsonDocument<4096> doc; // Increased size for RTC/OLED settings
    
    // System settings
    doc["version"] = "1.0";
    doc["exported"] = millis();
    
    // Board info
    doc["board"]["model"] = BOARD_NAME;
    doc["board"]["variant"] = BOARD_VARIANT;
    doc["board"]["mac"] = WiFi.macAddress();
    
    // Network preferences
    Preferences netPrefs;
    netPrefs.begin("network", true); // Read-only
    
    doc["network"]["portalDone"] = netPrefs.getBool("portalDone", false);
    doc["network"]["hostname"] = netPrefs.getString("hostname", "");
    
    int profileCount = netPrefs.getInt("profileCount", 0);
    doc["network"]["profileCount"] = profileCount;
    
    netPrefs.end();
    
    // RTC settings
    Preferences rtcPrefs;
    rtcPrefs.begin("rtc", true); // Read-only
    
    doc["rtc"]["timezone"] = rtcPrefs.getString("timezone", "");
    doc["rtc"]["timeFormat"] = rtcPrefs.getString("timeFormat", "24h");
    doc["rtc"]["dateFormat"] = rtcPrefs.getString("dateFormat", "YYYY-MM-DD");
    doc["rtc"]["syncPriority"] = rtcPrefs.getString("syncPriority", "ntp");
    
    rtcPrefs.end();
    
    // OLED settings
    Preferences oledPrefs;
    oledPrefs.begin("oled", true); // Read-only
    
    doc["oled"]["enabled"] = oledPrefs.getBool("enabled", true);
    doc["oled"]["brightness"] = oledPrefs.getUChar("brightness", 128);
    doc["oled"]["timeout"] = oledPrefs.getUInt("timeout", 30000);
    doc["oled"]["rotation"] = oledPrefs.getUChar("rotation", 0);
    doc["oled"]["defaultScreen"] = oledPrefs.getString("defaultScreen", "rotating");
    doc["oled"]["screenSaver"] = oledPrefs.getBool("screenSaver", true);
    
    oledPrefs.end();
    
    // Note: Passwords are intentionally excluded from export for security
    
    String result;
    serializeJson(doc, result);
    return result;
}

bool SystemManager::importConfiguration(const String& config) {
    StaticJsonDocument<4096> doc; // Increased size for RTC/OLED settings
    DeserializationError error = deserializeJson(doc, config);
    
    if (error) {
        Serial.println("[System] Failed to parse configuration");
        return false;
    }
    
    Serial.println("[System] Importing configuration...");
    
    // Validate version
    if (!doc.containsKey("version")) {
        Serial.println("[System] Invalid configuration format");
        return false;
    }
    
    // Import network settings
    if (doc.containsKey("network")) {
        Preferences netPrefs;
        netPrefs.begin("network", false);
        
        if (doc["network"].containsKey("hostname")) {
            String hostname = doc["network"]["hostname"].as<String>();
            if (hostname.length() > 0) {
                netPrefs.putString("hostname", hostname);
            }
        }
        
        netPrefs.end();
    }
    
    // Import RTC settings
    if (doc.containsKey("rtc")) {
        Preferences rtcPrefs;
        rtcPrefs.begin("rtc", false);
        
        if (doc["rtc"].containsKey("timezone")) {
            rtcPrefs.putString("timezone", doc["rtc"]["timezone"].as<String>());
        }
        if (doc["rtc"].containsKey("timeFormat")) {
            rtcPrefs.putString("timeFormat", doc["rtc"]["timeFormat"].as<String>());
        }
        if (doc["rtc"].containsKey("dateFormat")) {
            rtcPrefs.putString("dateFormat", doc["rtc"]["dateFormat"].as<String>());
        }
        if (doc["rtc"].containsKey("syncPriority")) {
            rtcPrefs.putString("syncPriority", doc["rtc"]["syncPriority"].as<String>());
        }
        
        rtcPrefs.end();
        
        Serial.println("[System] RTC settings imported");
    }
    
    // Import OLED settings
    if (doc.containsKey("oled")) {
        Preferences oledPrefs;
        oledPrefs.begin("oled", false);
        
        if (doc["oled"].containsKey("enabled")) {
            oledPrefs.putBool("enabled", doc["oled"]["enabled"].as<bool>());
        }
        if (doc["oled"].containsKey("brightness")) {
            oledPrefs.putUChar("brightness", doc["oled"]["brightness"].as<uint8_t>());
        }
        if (doc["oled"].containsKey("timeout")) {
            oledPrefs.putUInt("timeout", doc["oled"]["timeout"].as<uint32_t>());
        }
        if (doc["oled"].containsKey("rotation")) {
            oledPrefs.putUChar("rotation", doc["oled"]["rotation"].as<uint8_t>());
        }
        if (doc["oled"].containsKey("defaultScreen")) {
            oledPrefs.putString("defaultScreen", doc["oled"]["defaultScreen"].as<String>());
        }
        if (doc["oled"].containsKey("screenSaver")) {
            oledPrefs.putBool("screenSaver", doc["oled"]["screenSaver"].as<bool>());
        }
        
        oledPrefs.end();
        
        // Apply OLED settings to HardwareManager if available
        if (hardwareManager) {
            // Reload settings in HardwareManager
            // This will be implemented when HardwareManager has preference loading
            Serial.println("[System] OLED settings will take effect after reboot");
        }
        
        Serial.println("[System] OLED settings imported");
    }
    
    Serial.println("[System] Configuration imported successfully");
    return true;
}

// Logs
bool SystemManager::clearLogs() {
    Serial.println("[System] Logs cleared");
    // TODO: Implement SD card log file deletion when log system is added
    return true;
}

String SystemManager::getLastLog(int lines) {
    // TODO: Implement SD card log reading when log system is added
    return "{\"message\":\"Log system not yet implemented\"}";
}

void SystemManager::clearAllPreferences() {
    // This is called during factory reset
    // Clear all known preference namespaces
    const char* namespaces[] = {"network", "system", "pixels", "effects", "sensors"};
    
    for (const char* ns : namespaces) {
        Preferences prefs;
        prefs.begin(ns, false);
        prefs.clear();
        prefs.end();
    }
}

// Safe Boot Mode Implementation
void SystemManager::initSafeBootMode() {
    Serial.println("[SafeBoot] Initializing crash detection...");
    
    // Increment boot count
    incrementBootCount();
    
    // Check if we're in a crash loop
    bool crashLoop = detectRepeatedCrashes();
    
    if (crashLoop) {
        Serial.println("[SafeBoot] *** CRASH LOOP DETECTED ***");
        Serial.println("[SafeBoot] Device has crashed multiple times within 60 seconds");
        Serial.println("[SafeBoot] Entering SAFE BOOT MODE");
        Serial.println("[SafeBoot] WiFi connection attempts will be DISABLED");
        Serial.println("[SafeBoot] Device will operate in AP-only mode");
        Serial.println("[SafeBoot] To clear Safe Boot Mode:");
        Serial.println("[SafeBoot]   1. Check WiFi credentials are correct");
        Serial.println("[SafeBoot]   2. Use API endpoint: DELETE /api/system/safe-boot");
        Serial.println("[SafeBoot]   3. Device will restart normally");
        
        preferences.putBool("safeBootMode", true);
    } else {
        // Check if we successfully stayed up for 60 seconds on last boot
        unsigned long lastBootTime = preferences.getULong("lastBootTime", 0);
        unsigned long currentTime = millis();
        
        if (lastBootTime > 0 && (currentTime > 60000)) {
            // We've been running for more than 60 seconds, consider this a successful boot
            Serial.println("[SafeBoot] Boot successful, clearing crash counters");
            preferences.putInt("bootCount", 0);
            preferences.putULong("bootTimestamp", 0);
            preferences.putBool("safeBootMode", false);
        }
    }
    
    preferences.putULong("lastBootTime", millis());
}

void SystemManager::incrementBootCount() {
    int bootCount = preferences.getInt("bootCount", 0);
    unsigned long lastBootTimestamp = preferences.getULong("bootTimestamp", 0);
    unsigned long currentTimestamp = millis() + (esp_timer_get_time() / 1000); // Rough timestamp
    
    // If last boot was more than 60 seconds ago, reset counter
    if (lastBootTimestamp > 0 && (currentTimestamp - lastBootTimestamp) > 60000) {
        Serial.println("[SafeBoot] Last boot was >60s ago, resetting counter");
        bootCount = 0;
    }
    
    bootCount++;
    preferences.putInt("bootCount", bootCount);
    preferences.putULong("bootTimestamp", currentTimestamp);
    
    Serial.print("[SafeBoot] Boot count: ");
    Serial.println(bootCount);
}

bool SystemManager::detectRepeatedCrashes() {
    int bootCount = preferences.getInt("bootCount", 0);
    unsigned long bootTimestamp = preferences.getULong("bootTimestamp", 0);
    unsigned long currentTimestamp = millis() + (esp_timer_get_time() / 1000);
    
    // If we've booted 4+ times within 60 seconds, we're in a crash loop
    if (bootCount >= 4 && bootTimestamp > 0) {
        unsigned long timeSinceFirstBoot = currentTimestamp - bootTimestamp;
        if (timeSinceFirstBoot < 60000) {
            Serial.print("[SafeBoot] Detected ");
            Serial.print(bootCount);
            Serial.print(" boots within ");
            Serial.print(timeSinceFirstBoot);
            Serial.println("ms - CRASH LOOP");
            return true;
        }
    }
    
    return false;
}

bool SystemManager::isSafeBootMode() {
    return preferences.getBool("safeBootMode", false);
}

void SystemManager::recordSuccessfulBoot() {
    // This should be called after the system has been running successfully for a period
    Serial.println("[SafeBoot] Recording successful boot");
    preferences.putInt("bootCount", 0);
    preferences.putULong("bootTimestamp", 0);
    preferences.putBool("safeBootMode", false);
}

void SystemManager::clearSafeBootMode() {
    Serial.println("[SafeBoot] Clearing Safe Boot Mode");
    preferences.putBool("safeBootMode", false);
    preferences.putInt("bootCount", 0);
    preferences.putULong("bootTimestamp", 0);
}

String SystemManager::getSafeBootInfo() {
    StaticJsonDocument<256> doc;
    
    doc["safeBootMode"] = preferences.getBool("safeBootMode", false);
    doc["bootCount"] = preferences.getInt("bootCount", 0);
    doc["bootTimestamp"] = preferences.getULong("bootTimestamp", 0);
    doc["lastBootTime"] = preferences.getULong("lastBootTime", 0);
    
    if (doc["safeBootMode"].as<bool>()) {
        doc["message"] = "Device is in Safe Boot Mode due to repeated crashes. WiFi connection attempts are disabled.";
        doc["recovery"] = "Clear Safe Boot Mode via DELETE /api/system/safe-boot, then restart device.";
    } else {
        doc["message"] = "Device is operating normally";
    }
    
    String result;
    serializeJson(doc, result);
    return result;
}
