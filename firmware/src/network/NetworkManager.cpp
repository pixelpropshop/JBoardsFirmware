#include "NetworkManager.h"
#include "../config.h"
#include "../system/SystemManager.h"
#include "JBoardNetworkManager.h"
#include <nvs_flash.h>

NetworkManager::NetworkManager() {
    wifiConnected = false;
    apActive = false;
    lastReconnectAttempt = 0;
    reconnectAttempts = 0;
    autoReconnect = true;
    maxReconnectAttempts = 5;
    reconnectInterval = 5000;
    currentHostname = DEFAULT_HOSTNAME;
    profileCount = 0;
    systemManager = nullptr;
    jboardNetworkManager = nullptr;
}

void NetworkManager::begin() {
    Serial.println("[NetworkManager] Initializing...");
    
    // Initialize NVS (required by WiFi library)
    Serial.println("[NetworkManager] Initializing NVS...");
    esp_err_t err = nvs_flash_init();
    if (err == ESP_ERR_NVS_NO_FREE_PAGES || err == ESP_ERR_NVS_NEW_VERSION_FOUND) {
        Serial.println("[NetworkManager] NVS partition was truncated, erasing and re-initializing...");
        ESP_ERROR_CHECK(nvs_flash_erase());
        err = nvs_flash_init();
    }
    if (err != ESP_OK) {
        Serial.print("[NetworkManager] NVS init failed: ");
        Serial.println(err);
    } else {
        Serial.println("[NetworkManager] NVS initialized successfully");
    }
    
    // Initialize preferences
    preferences.begin("network", false);
    
    // Load saved profiles
    loadProfiles();
    
    // Disable WiFi persistence to prevent NVS conflicts
    Serial.println("[NetworkManager] Disabling WiFi persistence...");
    WiFi.persistent(false);
    
    // Allow WiFi subsystem time to stabilize (especially on first boot)
    Serial.println("[NetworkManager] Waiting for WiFi subsystem...");
    delay(1000);  // Reasonable delay for WiFi calibration
    
    // Set WiFi mode directly to AP+STA
    Serial.println("[NetworkManager] Setting WiFi mode to AP+STA...");
    if (!WiFi.mode(WIFI_AP_STA)) {
        Serial.println("[NetworkManager] WARNING: WiFi mode set returned false, continuing anyway...");
    }
    delay(100);  // Brief settling time
    
    // Generate hostname with MAC address
    uint8_t mac[6];
    WiFi.macAddress(mac);
    currentHostname = String(DEFAULT_HOSTNAME) + "-" + 
                     String(mac[4], HEX) + String(mac[5], HEX);
    WiFi.setHostname(currentHostname.c_str());
    
    Serial.print("[NetworkManager] Hostname: ");
    Serial.println(currentHostname);
    
    // ALWAYS start AP mode on boot as a safety net
    // This ensures the device is always accessible even if WiFi connection fails
    String apSSID = currentHostname;
    Serial.print("[NetworkManager] Starting AP mode: ");
    Serial.println(apSSID);
    startAP(apSSID, DEFAULT_AP_PASSWORD);
    
    // Check for Safe Boot Mode - skip WiFi connection if in safe mode
    if (systemManager && systemManager->isSafeBootMode()) {
        Serial.println("[NetworkManager] *** SAFE BOOT MODE ACTIVE ***");
        Serial.println("[NetworkManager] Skipping WiFi connection attempts");
        Serial.println("[NetworkManager] Device will operate in AP-only mode");
        Serial.println("[NetworkManager] To exit Safe Boot Mode:");
        Serial.println("[NetworkManager]   1. Connect to AP and access web interface");
        Serial.println("[NetworkManager]   2. Use DELETE /api/system/safe-boot endpoint");
        Serial.println("[NetworkManager]   3. Device will restart normally");
        return;
    }
    
    // Try to connect using fallback strategy
    Serial.println("[NetworkManager] Attempting to connect using fallback strategy...");
    bool connected = tryConnectWithFallback();
    if (connected) {
        Serial.println("[NetworkManager] WiFi connected successfully");
    } else {
        Serial.println("[NetworkManager] WiFi connection failed, AP mode remains active");
    }
}

void NetworkManager::update() {
    if (autoReconnect) {
        handleAutoReconnect();
    }
}

// WiFi Station Management
bool NetworkManager::connectToWiFi(const String& ssid, const String& password) {
    Serial.print("[WiFi] Connecting to: ");
    Serial.println(ssid);
    
    WiFi.begin(ssid.c_str(), password.c_str());
    
    unsigned long startAttempt = millis();
    while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < WIFI_CONNECT_TIMEOUT) {
        delay(100);
    }
    
    wifiConnected = (WiFi.status() == WL_CONNECTED);
    
    if (wifiConnected) {
        Serial.print("[WiFi] Connected! IP: ");
        Serial.println(WiFi.localIP());
        reconnectAttempts = 0;
        
        // Save credentials to NVS for retrieval later
        Preferences prefs;
        prefs.begin("wifi_config", false);
        prefs.putString("ssid", ssid);
        prefs.putString("password", password);
        prefs.putBool("dhcp", true);
        prefs.end();
        Serial.println("[WiFi] Credentials saved to NVS");
    } else {
        Serial.println("[WiFi] Connection failed");
    }
    
    return wifiConnected;
}

bool NetworkManager::connectToWiFi(const String& ssid, const String& password,
                                   IPAddress ip, IPAddress gateway, IPAddress subnet,
                                   IPAddress dns1, IPAddress dns2) {
    Serial.print("[WiFi] Connecting to: ");
    Serial.print(ssid);
    Serial.println(" (static IP)");
    
    if (!WiFi.config(ip, gateway, subnet, dns1, dns2)) {
        Serial.println("[WiFi] Static IP configuration failed");
        return false;
    }
    
    bool result = connectToWiFi(ssid, password);
    
    if (result) {
        // Save static IP config to NVS
        Preferences prefs;
        prefs.begin("wifi_config", false);
        prefs.putString("ip", ip.toString());
        prefs.putString("gateway", gateway.toString());
        prefs.putString("subnet", subnet.toString());
        prefs.putString("dns", dns1.toString());
        prefs.putBool("dhcp", false);
        prefs.end();
        Serial.println("[WiFi] Static IP config saved to NVS");
    }
    
    return result;
}

void NetworkManager::disconnectWiFi() {
    Serial.println("[WiFi] Disconnecting...");
    WiFi.disconnect();
    wifiConnected = false;
}

bool NetworkManager::isConnected() {
    wifiConnected = (WiFi.status() == WL_CONNECTED);
    return wifiConnected;
}

// Access Point Management
bool NetworkManager::startAP(const String& ssid, const String& password, 
                            int channel, bool hidden, int maxConnections) {
    Serial.print("[AP] Starting Access Point: ");
    Serial.println(ssid);
    
    apActive = WiFi.softAP(ssid.c_str(), password.c_str(), channel, hidden, maxConnections);
    
    if (apActive) {
        Serial.print("[AP] IP Address: ");
        Serial.println(WiFi.softAPIP());
        
        // Save AP config to NVS
        Preferences prefs;
        prefs.begin("ap_config", false);
        prefs.putString("ssid", ssid);
        prefs.putString("password", password);
        prefs.putInt("channel", channel);
        prefs.putBool("hidden", hidden);
        prefs.putInt("maxClients", maxConnections);
        prefs.end();
        Serial.println("[AP] Configuration saved to NVS");
    } else {
        Serial.println("[AP] Failed to start");
    }
    
    return apActive;
}

void NetworkManager::stopAP() {
    Serial.println("[AP] Stopping Access Point...");
    
    WiFi.softAPdisconnect(true);
    apActive = false;
}

bool NetworkManager::isAPActive() {
    return apActive;
}

int NetworkManager::getAPClientCount() {
    return WiFi.softAPgetStationNum();
}

// Network Status
String NetworkManager::getStatus() {
    if (WiFi.status() == WL_CONNECTED) {
        return "connected";
    } else if (WiFi.status() == WL_DISCONNECTED) {
        return "disconnected";
    } else if (WiFi.status() == WL_CONNECT_FAILED) {
        return "failed";
    } else if (WiFi.status() == WL_CONNECTION_LOST) {
        return "lost";
    } else {
        return "idle";
    }
}

int NetworkManager::getRSSI() {
    if (WiFi.status() == WL_CONNECTED) {
        return WiFi.RSSI();
    }
    return 0;
}

IPAddress NetworkManager::getIP() {
    return WiFi.localIP();
}

IPAddress NetworkManager::getAPIP() {
    return WiFi.softAPIP();
}

String NetworkManager::getMAC() {
    return WiFi.macAddress();
}

String NetworkManager::getAPMAC() {
    return WiFi.softAPmacAddress();
}

// WiFi Scanning
int NetworkManager::scanNetworks() {
    Serial.println("[WiFi] Scanning networks...");
    // Use async scan to avoid blocking
    return WiFi.scanNetworks(false, false);
}

String NetworkManager::getScanResults() {
    StaticJsonDocument<4096> doc;
    JsonArray networks = doc.createNestedArray("networks");
    
    int n = WiFi.scanComplete();
    
    if (n == WIFI_SCAN_FAILED) {
        Serial.println("[WiFi] Scan failed");
        return "{\"networks\":[],\"error\":\"Scan failed\"}";
    } else if (n == WIFI_SCAN_RUNNING) {
        Serial.println("[WiFi] Scan still running");
        return "{\"networks\":[],\"status\":\"scanning\"}";
    }
    
    Serial.print("[WiFi] Found ");
    Serial.print(n);
    Serial.println(" networks");
    
    for (int i = 0; i < n; i++) {
        JsonObject network = networks.createNestedObject();
        network["ssid"] = WiFi.SSID(i);
        network["rssi"] = WiFi.RSSI(i);
        network["channel"] = WiFi.channel(i);
        network["encryption"] = (WiFi.encryptionType(i) == WIFI_AUTH_OPEN) ? "open" : "encrypted";
        network["bssid"] = WiFi.BSSIDstr(i);
    }
    
    WiFi.scanDelete();
    
    String result;
    serializeJson(doc, result);
    return result;
}

// Hostname & mDNS
bool NetworkManager::setHostname(const String& hostname) {
    currentHostname = hostname;
    WiFi.setHostname(hostname.c_str());
    preferences.putString("hostname", hostname);
    return true;
}

String NetworkManager::getHostname() {
    return currentHostname;
}

bool NetworkManager::startMDNS(const String& hostname) {
    if (MDNS.begin(hostname.c_str())) {
        Serial.print("[mDNS] Started: ");
        Serial.print(hostname);
        Serial.println(".local");
        MDNS.addService("http", "tcp", 80);
        return true;
    }
    Serial.println("[mDNS] Failed to start");
    return false;
}

// WiFi Profiles
bool NetworkManager::saveProfile(const WiFiProfile& profile) {
    // Check if profile already exists
    int existingIndex = -1;
    for (int i = 0; i < profileCount; i++) {
        if (profiles[i].ssid == profile.ssid) {
            existingIndex = i;
            break;
        }
    }
    
    if (existingIndex >= 0) {
        // Update existing profile
        profiles[existingIndex] = profile;
    } else {
        // Add new profile
        if (profileCount >= 10) {
            Serial.println("[Profiles] Maximum profiles reached");
            return false;
        }
        profiles[profileCount] = profile;
        profileCount++;
    }
    
    saveProfilesToNVS();
    Serial.print("[Profiles] Saved: ");
    Serial.println(profile.ssid);
    return true;
}

bool NetworkManager::deleteProfile(const String& ssid) {
    int index = -1;
    for (int i = 0; i < profileCount; i++) {
        if (profiles[i].ssid == ssid) {
            index = i;
            break;
        }
    }
    
    if (index < 0) {
        return false;
    }
    
    // Shift profiles
    for (int i = index; i < profileCount - 1; i++) {
        profiles[i] = profiles[i + 1];
    }
    profileCount--;
    
    saveProfilesToNVS();
    Serial.print("[Profiles] Deleted: ");
    Serial.println(ssid);
    return true;
}

WiFiProfile* NetworkManager::getProfile(const String& ssid) {
    for (int i = 0; i < profileCount; i++) {
        if (profiles[i].ssid == ssid) {
            return &profiles[i];
        }
    }
    return nullptr;
}

String NetworkManager::getAllProfiles() {
    StaticJsonDocument<2048> doc;
    JsonArray profilesArray = doc.createNestedArray("profiles");
    
    for (int i = 0; i < profileCount; i++) {
        JsonObject p = profilesArray.createNestedObject();
        p["ssid"] = profiles[i].ssid;
        p["name"] = profiles[i].name;
        p["priority"] = profiles[i].priority;
        p["useStaticIP"] = profiles[i].useStaticIP;
        if (profiles[i].useStaticIP) {
            p["staticIP"] = profiles[i].staticIP.toString();
            p["gateway"] = profiles[i].gateway.toString();
            p["subnet"] = profiles[i].subnet.toString();
        }
    }
    
    String result;
    serializeJson(doc, result);
    return result;
}

int NetworkManager::getProfileCount() {
    return profileCount;
}

bool NetworkManager::updateProfilePriority(const String& ssid, int newPriority) {
    Serial.print("[Profiles] updateProfilePriority called: ssid=");
    Serial.print(ssid);
    Serial.print(", newPriority=");
    Serial.println(newPriority);
    
    // Validate priority is in valid range
    if (newPriority < 1 || newPriority > profileCount) {
        Serial.println("[Profiles] Invalid priority value");
        return false;
    }
    
    // Find the profile with the given SSID
    int targetIndex = -1;
    for (int i = 0; i < profileCount; i++) {
        if (profiles[i].ssid == ssid) {
            targetIndex = i;
            break;
        }
    }
    
    if (targetIndex < 0) {
        Serial.println("[Profiles] Profile not found for priority update");
        return false;
    }
    
    WiFiProfile targetProfile = profiles[targetIndex];
    int oldPriority = targetProfile.priority;
    
    Serial.print("[Profiles] Moving profile '");
    Serial.print(targetProfile.ssid);
    Serial.print("' from priority ");
    Serial.print(oldPriority);
    Serial.print(" to ");
    Serial.println(newPriority);
    
    // Sort profiles by current priority to get the correct order
    WiFiProfile sortedProfiles[10];
    for (int i = 0; i < profileCount; i++) {
        sortedProfiles[i] = profiles[i];
    }
    
    // Simple bubble sort by priority (ascending)
    for (int i = 0; i < profileCount - 1; i++) {
        for (int j = 0; j < profileCount - i - 1; j++) {
            if (sortedProfiles[j].priority > sortedProfiles[j + 1].priority) {
                WiFiProfile temp = sortedProfiles[j];
                sortedProfiles[j] = sortedProfiles[j + 1];
                sortedProfiles[j + 1] = temp;
            }
        }
    }
    
    // Find target profile in sorted array
    int currentPos = -1;
    for (int i = 0; i < profileCount; i++) {
        if (sortedProfiles[i].ssid == ssid) {
            currentPos = i;
            break;
        }
    }
    
    // Calculate new position (priority is 1-based, array is 0-based)
    int newPos = newPriority - 1;
    
    Serial.print("[Profiles] Current position: ");
    Serial.print(currentPos);
    Serial.print(", New position: ");
    Serial.println(newPos);
    
    // If position hasn't changed, nothing to do
    if (currentPos == newPos) {
        Serial.println("[Profiles] Position unchanged");
        return true;
    }
    
    // Remove profile from current position
    WiFiProfile temp = sortedProfiles[currentPos];
    
    // Shift profiles to make room at new position
    if (newPos < currentPos) {
        // Moving up - shift profiles down
        for (int i = currentPos; i > newPos; i--) {
            sortedProfiles[i] = sortedProfiles[i - 1];
        }
    } else {
        // Moving down - shift profiles up
        for (int i = currentPos; i < newPos; i++) {
            sortedProfiles[i] = sortedProfiles[i + 1];
        }
    }
    
    // Insert profile at new position
    sortedProfiles[newPos] = temp;
    
    // Renumber all priorities sequentially
    for (int i = 0; i < profileCount; i++) {
        sortedProfiles[i].priority = i + 1;
    }
    
    // Copy sorted profiles back to main array
    for (int i = 0; i < profileCount; i++) {
        profiles[i] = sortedProfiles[i];
    }
    
    // Save to NVS
    saveProfilesToNVS();
    
    // Log all current priorities for debugging
    Serial.println("[Profiles] Updated priorities:");
    for (int i = 0; i < profileCount; i++) {
        Serial.print("  #");
        Serial.print(profiles[i].priority);
        Serial.print(": ");
        Serial.println(profiles[i].ssid);
    }
    
    return true;
}

bool NetworkManager::connectToSavedProfile() {
    WiFiProfile* profile = findHighestPriorityProfile();
    if (profile == nullptr) {
        Serial.println("[Profiles] No profiles available");
        return false;
    }
    
    Serial.print("[Profiles] Connecting to: ");
    Serial.println(profile->ssid);
    
    if (profile->useStaticIP) {
        return connectToWiFi(profile->ssid, profile->password,
                           profile->staticIP, profile->gateway, profile->subnet,
                           profile->dns1, profile->dns2);
    } else {
        return connectToWiFi(profile->ssid, profile->password);
    }
}

// Auto-Reconnect
void NetworkManager::enableAutoReconnect(bool enable, int maxAttempts, int interval) {
    autoReconnect = enable;
    maxReconnectAttempts = maxAttempts;
    reconnectInterval = interval;
    Serial.print("[AutoReconnect] ");
    Serial.println(enable ? "Enabled" : "Disabled");
}

bool NetworkManager::isAutoReconnectEnabled() {
    return autoReconnect;
}

// Private Methods
void NetworkManager::loadProfiles() {
    profileCount = preferences.getInt("profileCount", 0);
    
    for (int i = 0; i < profileCount && i < 10; i++) {
        String prefix = "p" + String(i) + "_";
        profiles[i].ssid = preferences.getString((prefix + "ssid").c_str(), "");
        profiles[i].password = preferences.getString((prefix + "pass").c_str(), "");
        profiles[i].name = preferences.getString((prefix + "name").c_str(), "");
        profiles[i].priority = preferences.getInt((prefix + "prio").c_str(), 0);
        profiles[i].useStaticIP = preferences.getBool((prefix + "static").c_str(), false);
        
        if (profiles[i].useStaticIP) {
            String ip = preferences.getString((prefix + "ip").c_str(), "");
            String gw = preferences.getString((prefix + "gw").c_str(), "");
            String sn = preferences.getString((prefix + "sn").c_str(), "");
            profiles[i].staticIP.fromString(ip);
            profiles[i].gateway.fromString(gw);
            profiles[i].subnet.fromString(sn);
        }
    }
    
    // Normalize priorities to ensure they're sequential (1, 2, 3, ...)
    // This fixes issues where all profiles have the same priority
    normalizePriorities();
    
    Serial.print("[Profiles] Loaded ");
    Serial.print(profileCount);
    Serial.println(" profiles");
}

void NetworkManager::saveProfilesToNVS() {
    Serial.println("[Profiles] Saving to NVS...");
    
    // Close and reopen preferences to ensure a clean write
    preferences.end();
    preferences.begin("network", false);
    
    preferences.putInt("profileCount", profileCount);
    Serial.print("[Profiles] Saved profileCount: ");
    Serial.println(profileCount);
    
    for (int i = 0; i < profileCount; i++) {
        String prefix = "p" + String(i) + "_";
        preferences.putString((prefix + "ssid").c_str(), profiles[i].ssid);
        preferences.putString((prefix + "pass").c_str(), profiles[i].password);
        preferences.putString((prefix + "name").c_str(), profiles[i].name);
        preferences.putInt((prefix + "prio").c_str(), profiles[i].priority);
        preferences.putBool((prefix + "static").c_str(), profiles[i].useStaticIP);
        
        Serial.print("[Profiles] Saved profile ");
        Serial.print(i);
        Serial.print(": ");
        Serial.print(profiles[i].ssid);
        Serial.print(" with priority ");
        Serial.println(profiles[i].priority);
        
        if (profiles[i].useStaticIP) {
            preferences.putString((prefix + "ip").c_str(), profiles[i].staticIP.toString());
            preferences.putString((prefix + "gw").c_str(), profiles[i].gateway.toString());
            preferences.putString((prefix + "sn").c_str(), profiles[i].subnet.toString());
        }
    }
    
    Serial.println("[Profiles] NVS save complete");
}

void NetworkManager::normalizePriorities() {
    if (profileCount == 0) {
        return;
    }
    
    Serial.println("[Profiles] Normalizing priorities...");
    
    // Sort profiles by priority (descending - higher priority first)
    for (int i = 0; i < profileCount - 1; i++) {
        for (int j = 0; j < profileCount - i - 1; j++) {
            if (profiles[j].priority < profiles[j + 1].priority) {
                WiFiProfile temp = profiles[j];
                profiles[j] = profiles[j + 1];
                profiles[j + 1] = temp;
            }
        }
    }
    
    // Assign sequential priorities (1 = highest, 2, 3, etc.)
    for (int i = 0; i < profileCount; i++) {
        int oldPriority = profiles[i].priority;
        profiles[i].priority = i + 1;
        Serial.print("[Profiles] ");
        Serial.print(profiles[i].ssid);
        Serial.print(": ");
        Serial.print(oldPriority);
        Serial.print(" -> ");
        Serial.println(profiles[i].priority);
    }
    
    // Save normalized priorities to NVS
    saveProfilesToNVS();
    
    Serial.println("[Profiles] Priorities normalized");
}

WiFiProfile* NetworkManager::findHighestPriorityProfile() {
    if (profileCount == 0) {
        return nullptr;
    }
    
    int highestIndex = 0;
    int highestPriority = profiles[0].priority;
    
    for (int i = 1; i < profileCount; i++) {
        if (profiles[i].priority > highestPriority) {
            highestPriority = profiles[i].priority;
            highestIndex = i;
        }
    }
    
    return &profiles[highestIndex];
}

void NetworkManager::handleAutoReconnect() {
    // Skip auto-reconnect if in Safe Boot Mode
    if (systemManager && systemManager->isSafeBootMode()) {
        return;
    }
    
    if (!wifiConnected && WiFi.status() != WL_CONNECTED) {
        unsigned long now = millis();
        
        if (now - lastReconnectAttempt > reconnectInterval) {
            lastReconnectAttempt = now;
            
            if (reconnectAttempts < maxReconnectAttempts) {
                reconnectAttempts++;
                Serial.print("[AutoReconnect] Attempt ");
                Serial.print(reconnectAttempts);
                Serial.print("/");
                Serial.println(maxReconnectAttempts);
                
                tryConnectWithFallback();
            } else if (reconnectAttempts == maxReconnectAttempts) {
                // Only log once when max attempts reached
                Serial.println("[AutoReconnect] Max attempts reached, falling back to AP mode");
                if (!apActive) {
                    startAP(DEFAULT_AP_SSID, DEFAULT_AP_PASSWORD);
                }
                reconnectAttempts++; // Increment to prevent repeated logging
            }
        }
    } else if (WiFi.status() == WL_CONNECTED) {
        // Track if we just connected to avoid log spam
        static bool wasConnected = false;
        
        if (!wasConnected) {
            wifiConnected = true;
            reconnectAttempts = 0;
            
            // Auto-disable AP when WiFi connects (unless keepActive is set OR ESP-NOW is enabled)
            if (apActive) {
                Preferences prefs;
                prefs.begin("ap_config", true);
                bool keepActive = prefs.getBool("keepActive", false);
                prefs.end();
                
                // Keep AP active if:
                // 1. User has set keepActive preference
                // 2. JBoard Network (ESP-NOW) is enabled (requires AP mode)
                bool espNowActive = false;
                #if FEATURE_JBOARD_NETWORK
                if (jboardNetworkManager != nullptr) {
                    espNowActive = jboardNetworkManager->isEnabled();
                }
                #endif
                
                if (!keepActive && !espNowActive) {
                    Serial.println("[NetworkManager] WiFi connected, waiting before disabling AP mode...");
                    delay(1000);  // Give WiFi time to stabilize before stopping AP
                    Serial.println("[NetworkManager] Disabling AP mode");
                    stopAP();
                } else if (espNowActive) {
                    Serial.println("[NetworkManager] Keeping AP active (required for JBoard Network/ESP-NOW)");
                }
            }
            
            wasConnected = true;
        }
        
        wifiConnected = true;
    } else {
        // Reset connection tracking when WiFi is not connected
        static bool wasConnected = false;
        wasConnected = false;
    }
}

void NetworkManager::setSystemManager(SystemManager* sysMgr) {
    systemManager = sysMgr;
}

void NetworkManager::setJBoardNetworkManager(JBoardNetworkManager* jboardMgr) {
    jboardNetworkManager = jboardMgr;
}

// New WiFi Connection Strategy
bool NetworkManager::tryConnectWithFallback() {
    Serial.println("[WiFi] Starting connection with fallback strategy...");
    
    // Step 1: Try WiFi Station config first (highest priority)
    if (tryWiFiStationConfig()) {
        Serial.println("[WiFi] Connected using WiFi Station config");
        return true;
    }
    
    // Step 2: Try all profiles in priority order
    if (tryAllProfiles()) {
        Serial.println("[WiFi] Connected using a saved profile");
        return true;
    }
    
    // Step 3: All connection attempts failed
    Serial.println("[WiFi] All connection attempts failed");
    return false;
}

bool NetworkManager::tryWiFiStationConfig() {
    Serial.println("[WiFi] Attempting WiFi Station config from NVS...");
    
    Preferences prefs;
    prefs.begin("wifi_config", true); // Read-only
    
    String ssid = prefs.getString("ssid", "");
    String password = prefs.getString("password", "");
    bool dhcp = prefs.getBool("dhcp", true);
    
    if (ssid.length() == 0) {
        Serial.println("[WiFi] No WiFi Station config found in NVS");
        prefs.end();
        return false;
    }
    
    Serial.print("[WiFi] Found WiFi Station config: ");
    Serial.println(ssid);
    
    // IMPORTANT: Set hostname BEFORE WiFi.begin() for it to be used in DHCP request
    WiFi.setHostname(currentHostname.c_str());
    Serial.print("[WiFi] Setting hostname: ");
    Serial.println(currentHostname);
    
    bool connected = false;
    
    if (dhcp) {
        // Use DHCP
        Serial.println("[WiFi] Using DHCP");
        WiFi.begin(ssid.c_str(), password.c_str());
        
        unsigned long startAttempt = millis();
        while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < WIFI_CONNECT_TIMEOUT) {
            delay(100);
        }
        
        connected = (WiFi.status() == WL_CONNECTED);
    } else {
        // Use static IP
        Serial.println("[WiFi] Using static IP");
        String ip = prefs.getString("ip", "");
        String gateway = prefs.getString("gateway", "");
        String subnet = prefs.getString("subnet", "");
        String dns = prefs.getString("dns", "");
        
        IPAddress staticIP, gw, sn, dns1;
        staticIP.fromString(ip);
        gw.fromString(gateway);
        sn.fromString(subnet);
        dns1.fromString(dns);
        
        if (!WiFi.config(staticIP, gw, sn, dns1)) {
            Serial.println("[WiFi] Static IP configuration failed");
            prefs.end();
            return false;
        }
        
        WiFi.begin(ssid.c_str(), password.c_str());
        
        unsigned long startAttempt = millis();
        while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < WIFI_CONNECT_TIMEOUT) {
            delay(100);
        }
        
        connected = (WiFi.status() == WL_CONNECTED);
    }
    
    prefs.end();
    
    if (connected) {
        Serial.print("[WiFi] WiFi Station config connected! IP: ");
        Serial.println(WiFi.localIP());
        wifiConnected = true;
        reconnectAttempts = 0;
        return true;
    } else {
        Serial.println("[WiFi] WiFi Station config connection failed");
        return false;
    }
}

bool NetworkManager::tryAllProfiles() {
    if (profileCount == 0) {
        Serial.println("[WiFi] No profiles available to try");
        return false;
    }
    
    Serial.print("[WiFi] Trying all ");
    Serial.print(profileCount);
    Serial.println(" profiles in priority order...");
    
    // Sort profiles by priority (highest first)
    WiFiProfile sortedProfiles[10];
    for (int i = 0; i < profileCount; i++) {
        sortedProfiles[i] = profiles[i];
    }
    
    // Simple bubble sort by priority (descending)
    for (int i = 0; i < profileCount - 1; i++) {
        for (int j = 0; j < profileCount - i - 1; j++) {
            if (sortedProfiles[j].priority < sortedProfiles[j + 1].priority) {
                WiFiProfile temp = sortedProfiles[j];
                sortedProfiles[j] = sortedProfiles[j + 1];
                sortedProfiles[j + 1] = temp;
            }
        }
    }
    
    // Try each profile once
    for (int i = 0; i < profileCount; i++) {
        Serial.print("[WiFi] Trying profile ");
        Serial.print(i + 1);
        Serial.print("/");
        Serial.print(profileCount);
        Serial.print(": ");
        Serial.print(sortedProfiles[i].ssid);
        Serial.print(" (priority: ");
        Serial.print(sortedProfiles[i].priority);
        Serial.println(")");
        
        bool connected = false;
        
        // IMPORTANT: Set hostname BEFORE WiFi.begin() for it to be used in DHCP request
        WiFi.setHostname(currentHostname.c_str());
        
        if (sortedProfiles[i].useStaticIP) {
            // Configure static IP
            if (!WiFi.config(sortedProfiles[i].staticIP, sortedProfiles[i].gateway, 
                           sortedProfiles[i].subnet, sortedProfiles[i].dns1, sortedProfiles[i].dns2)) {
                Serial.println("[WiFi] Static IP configuration failed, skipping...");
                continue;
            }
        }
        
        WiFi.begin(sortedProfiles[i].ssid.c_str(), sortedProfiles[i].password.c_str());
        
        unsigned long startAttempt = millis();
        while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < WIFI_CONNECT_TIMEOUT) {
            delay(100);
        }
        
        connected = (WiFi.status() == WL_CONNECTED);
        
        if (connected) {
            Serial.print("[WiFi] Profile connected! IP: ");
            Serial.println(WiFi.localIP());
            wifiConnected = true;
            reconnectAttempts = 0;
            return true;
        } else {
            Serial.println("[WiFi] Profile connection failed");
        }
    }
    
    Serial.println("[WiFi] All profiles failed to connect");
    return false;
}
