#include "JBoardNetworkManager.h"
#include "../config.h"

// Static instance for callbacks
JBoardNetworkManager* JBoardNetworkManager::_instance = nullptr;

JBoardNetworkManager::JBoardNetworkManager() {
    _initialized = false;
    _enabled = true;  // Default to enabled
    _scanning = false;
    _scanStartTime = 0;
}

void JBoardNetworkManager::begin() {
    #if FEATURE_JBOARD_NETWORK
    
    _instance = this;
    
    // Try to open preferences - if it fails, we'll just use defaults
    bool prefsOk = _prefs.begin("jboard", false);
    if (!prefsOk) {
        Serial.println("[JBoard] Warning: Failed to open preferences, using defaults");
    }
    
    // Load enabled state from preferences (default to true)
    if (prefsOk) {
        _enabled = _prefs.getBool("enabled", true);
    }
    
    // If not enabled, skip initialization
    if (!_enabled) {
        Serial.println("[JBoard] JBoard Network is disabled");
        if (prefsOk) {
            _prefs.end();
        }
        return;
    }
    
    // Initialize this device
    initThisDevice();
    
    // Close preferences if we opened them
    if (prefsOk) {
        _prefs.end();
    }
    
    // Initialize ESP-NOW
    // Only change WiFi mode if not already in STA or STA+AP mode
    wifi_mode_t currentMode = WiFi.getMode();
    if (currentMode != WIFI_STA && currentMode != WIFI_AP_STA) {
        WiFi.mode(WIFI_STA);
    }
    
    if (esp_now_init() != ESP_OK) {
        Serial.println("[JBoard] ESP-NOW init failed");
        return;
    }
    
    Serial.println("[JBoard] ESP-NOW initialized");
    
    // Register callbacks
    esp_now_register_recv_cb(onDataReceive);
    esp_now_register_send_cb(onDataSent);
    
    // Load saved peers only if preferences are working
    if (prefsOk) {
        _prefs.begin("jboard", false);
        loadPeers();
        _prefs.end();
    }
    
    _initialized = true;
    Serial.println("[JBoard] Network manager initialized");
    
    #else
    Serial.println("[JBoard] Feature disabled in config");
    #endif
}

void JBoardNetworkManager::update() {
    if (!_initialized) return;
    
    // Update IP address if WiFi is connected
    if (WiFi.status() == WL_CONNECTED) {
        String currentIP = WiFi.localIP().toString();
        if (currentIP != "0.0.0.0" && currentIP != _thisDevice.ipAddress) {
            _thisDevice.ipAddress = currentIP;
        }
    }
    
    // Check for scan timeout (10 seconds)
    if (_scanning && (millis() - _scanStartTime > 10000)) {
        _scanning = false;
    }
    
    // Update peer last seen times
    unsigned long now = millis();
    for (auto& pair : _peers) {
        JBoardPeer& peer = pair.second;
        // Mark as offline if not seen in 30 seconds
        if (now - peer.device.lastSeen > 30000) {
            peer.device.rssi = -127; // Indicate offline
        }
    }
}

JBoardDevice JBoardNetworkManager::getThisDevice() {
    return _thisDevice;
}

void JBoardNetworkManager::setDeviceName(const String& name) {
    _thisDevice.name = name;
    if (_prefs.begin("jboard", false)) {
        _prefs.putString("deviceName", name);
        _prefs.end();
    }
}

void JBoardNetworkManager::setDeviceType(JBoardDeviceType type) {
    _thisDevice.deviceType = type;
    if (_prefs.begin("jboard", false)) {
        _prefs.putUChar("deviceType", (uint8_t)type);
        _prefs.end();
    }
}

void JBoardNetworkManager::setCapabilities(uint8_t capabilities) {
    _thisDevice.capabilities = capabilities;
    if (_prefs.begin("jboard", false)) {
        _prefs.putUChar("capabilities", capabilities);
        _prefs.end();
    }
}

std::vector<JBoardPeer> JBoardNetworkManager::getPeers() {
    std::vector<JBoardPeer> peers;
    for (const auto& pair : _peers) {
        peers.push_back(pair.second);
    }
    return peers;
}

JBoardPeer* JBoardNetworkManager::getPeer(const String& macAddress) {
    auto it = _peers.find(macAddress);
    if (it != _peers.end()) {
        return &it->second;
    }
    return nullptr;
}

bool JBoardNetworkManager::addPeer(const String& macAddress, const String& name) {
    if (_peers.size() >= MAX_PEERS) {
        return false;
    }
    
    uint8_t macBytes[6];
    if (!macStringToBytes(macAddress, macBytes)) {
        return false;
    }
    
    // Add to ESP-NOW
    if (!addESPNOWPeer(macBytes)) {
        return false;
    }
    
    // Create peer
    JBoardPeer peer;
    peer.device.name = name;
    peer.device.macAddress = macAddress;
    memcpy(peer.device.macBytes, macBytes, 6);
    peer.device.ipAddress = "";  // Will be filled in when device responds
    peer.device.deviceType = DEVICE_CONTROLLER;
    peer.device.capabilities = 0;
    peer.device.firmware = "";
    peer.device.rssi = 0;
    peer.device.lastSeen = millis();
    peer.isPaired = true;
    
    _peers[macAddress] = peer;
    savePeers();
    
    return true;
}

bool JBoardNetworkManager::removePeer(const String& macAddress) {
    auto it = _peers.find(macAddress);
    if (it == _peers.end()) {
        return false;
    }
    
    // Remove from ESP-NOW
    removeESPNOWPeer(it->second.device.macBytes);
    
    // Remove from map
    _peers.erase(it);
    savePeers();
    
    return true;
}

bool JBoardNetworkManager::isPaired(const String& macAddress) {
    auto it = _peers.find(macAddress);
    return (it != _peers.end() && it->second.isPaired);
}

bool JBoardNetworkManager::startScan() {
    if (!_initialized) return false;
    
    _scanning = true;
    _scanStartTime = millis();
    _scannedDevices.clear();
    
    // Broadcast a discovery message
    broadcastMessage("discover", "{}");
    
    return true;
}

std::vector<JBoardDevice> JBoardNetworkManager::getScannedDevices() {
    return _scannedDevices;
}

bool JBoardNetworkManager::sendMessage(const String& to, const String& command, const String& data) {
    if (!_initialized) return false;
    
    uint8_t macBytes[6];
    if (!macStringToBytes(to, macBytes)) {
        return false;
    }
    
    // Create packet
    ESPNOWPacket packet;
    packet.version = 1;
    packet.deviceType = (uint8_t)_thisDevice.deviceType;
    packet.capabilities = _thisDevice.capabilities;
    strncpy(packet.name, _thisDevice.name.c_str(), sizeof(packet.name) - 1);
    strncpy(packet.firmware, _thisDevice.firmware.c_str(), sizeof(packet.firmware) - 1);
    strncpy(packet.ipAddress, _thisDevice.ipAddress.c_str(), sizeof(packet.ipAddress) - 1);
    strncpy(packet.command, command.c_str(), sizeof(packet.command) - 1);
    strncpy(packet.data, data.c_str(), sizeof(packet.data) - 1);
    
    // Send via ESP-NOW
    esp_err_t result = esp_now_send(macBytes, (uint8_t*)&packet, sizeof(packet));
    
    return (result == ESP_OK);
}

bool JBoardNetworkManager::broadcastMessage(const String& command, const String& data) {
    if (!_initialized) return false;
    
    // Create packet
    ESPNOWPacket packet;
    packet.version = 1;
    packet.deviceType = (uint8_t)_thisDevice.deviceType;
    packet.capabilities = _thisDevice.capabilities;
    strncpy(packet.name, _thisDevice.name.c_str(), sizeof(packet.name) - 1);
    strncpy(packet.firmware, _thisDevice.firmware.c_str(), sizeof(packet.firmware) - 1);
    strncpy(packet.ipAddress, _thisDevice.ipAddress.c_str(), sizeof(packet.ipAddress) - 1);
    strncpy(packet.command, command.c_str(), sizeof(packet.command) - 1);
    strncpy(packet.data, data.c_str(), sizeof(packet.data) - 1);
    
    // Broadcast address
    uint8_t broadcastMac[6] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF};
    
    // Send via ESP-NOW
    esp_err_t result = esp_now_send(broadcastMac, (uint8_t*)&packet, sizeof(packet));
    
    return (result == ESP_OK);
}

std::vector<JBoardMessage> JBoardNetworkManager::getReceivedMessages(int limit) {
    if (limit > (int)_receivedMessages.size()) {
        return _receivedMessages;
    }
    
    // Return last N messages
    std::vector<JBoardMessage> messages;
    int start = _receivedMessages.size() - limit;
    for (int i = start; i < (int)_receivedMessages.size(); i++) {
        messages.push_back(_receivedMessages[i]);
    }
    return messages;
}

void JBoardNetworkManager::clearMessages() {
    _receivedMessages.clear();
}

bool JBoardNetworkManager::isEnabled() {
    return _enabled;
}

void JBoardNetworkManager::setEnabled(bool enabled) {
    #if FEATURE_JBOARD_NETWORK
    
    if (_enabled == enabled) {
        return;  // No change
    }
    
    _enabled = enabled;
    
    // Save to preferences
    if (_prefs.begin("jboard", false)) {
        _prefs.putBool("enabled", enabled);
        _prefs.end();
        Serial.print("[JBoard] Network ");
        Serial.println(enabled ? "enabled" : "disabled");
    }
    
    if (enabled) {
        // Re-initialize ESP-NOW
        if (!_initialized) {
            begin();
        }
    } else {
        // Deinitialize ESP-NOW
        if (_initialized) {
            Serial.println("[JBoard] Deinitializing ESP-NOW...");
            esp_now_deinit();
            _initialized = false;
            _peers.clear();
            _scannedDevices.clear();
            _receivedMessages.clear();
        }
    }
    
    #endif
}

// ESP-NOW callbacks
void JBoardNetworkManager::onDataReceive(const uint8_t* mac, const uint8_t* data, int len) {
    if (_instance == nullptr || len != sizeof(ESPNOWPacket)) {
        return;
    }
    
    const ESPNOWPacket* packet = (const ESPNOWPacket*)data;
    
    // Get RSSI (not available in ESP-NOW, use -50 as default)
    int8_t rssi = -50;
    
    _instance->processIncomingMessage(mac, packet, rssi);
}

void JBoardNetworkManager::onDataSent(const uint8_t* mac, esp_now_send_status_t status) {
    // Message sent callback
    if (status == ESP_NOW_SEND_SUCCESS) {
        // Success
    } else {
        // Failed
    }
}

// Private helper functions

void JBoardNetworkManager::initThisDevice() {
    // Get MAC address
    WiFi.macAddress(_thisDevice.macBytes);
    _thisDevice.macAddress = macBytesToString(_thisDevice.macBytes);
    
    // Get IP address
    _thisDevice.ipAddress = WiFi.localIP().toString();
    
    // Set defaults first
    _thisDevice.name = "JSense Board";
    _thisDevice.deviceType = DEVICE_CONTROLLER;
    _thisDevice.capabilities = CAPABILITY_WIFI;
    _thisDevice.firmware = FIRMWARE_VERSION;
    _thisDevice.rssi = 0;
    _thisDevice.lastSeen = millis();
    
    // Try to load from preferences if available (already opened in begin())
    // Note: _prefs should already be opened by begin() if it succeeded
    // We don't call begin() here to avoid nested begin/end calls
}

void JBoardNetworkManager::loadPeers() {
    // Load peer count
    int peerCount = _prefs.getInt("peerCount", 0);
    
    for (int i = 0; i < peerCount && i < MAX_PEERS; i++) {
        String key = "peer" + String(i);
        String macAddress = _prefs.getString(key.c_str(), "");
        String name = _prefs.getString((key + "n").c_str(), "");
        
        if (macAddress.length() > 0) {
            addPeer(macAddress, name);
        }
    }
}

void JBoardNetworkManager::savePeers() {
    if (!_prefs.begin("jboard", false)) {
        Serial.println("[JBoard] Failed to save peers - preferences not available");
        return;
    }
    
    // Save peer count
    _prefs.putInt("peerCount", _peers.size());
    
    // Save each peer
    int index = 0;
    for (const auto& pair : _peers) {
        String key = "peer" + String(index);
        _prefs.putString(key.c_str(), pair.second.device.macAddress);
        _prefs.putString((key + "n").c_str(), pair.second.device.name);
        index++;
    }
    
    _prefs.end();
}

bool JBoardNetworkManager::addESPNOWPeer(const uint8_t* macBytes) {
    esp_now_peer_info_t peerInfo = {};
    memcpy(peerInfo.peer_addr, macBytes, 6);
    peerInfo.channel = 0;
    peerInfo.encrypt = false;
    
    esp_err_t result = esp_now_add_peer(&peerInfo);
    return (result == ESP_OK);
}

void JBoardNetworkManager::removeESPNOWPeer(const uint8_t* macBytes) {
    esp_now_del_peer(macBytes);
}

String JBoardNetworkManager::generateMessageId() {
    return "msg-" + String(millis());
}

void JBoardNetworkManager::processIncomingMessage(const uint8_t* mac, const ESPNOWPacket* packet, int8_t rssi) {
    String fromMac = macBytesToString(mac);
    
    // Update or add device to scanned devices
    if (_scanning) {
        JBoardDevice device;
        device.name = String(packet->name);
        device.macAddress = fromMac;
        memcpy(device.macBytes, mac, 6);
        device.ipAddress = String(packet->ipAddress);
        device.deviceType = (JBoardDeviceType)packet->deviceType;
        device.capabilities = packet->capabilities;
        device.firmware = String(packet->firmware);
        device.rssi = rssi;
        device.lastSeen = millis();
        
        // Check if already in list
        bool found = false;
        for (auto& dev : _scannedDevices) {
            if (dev.macAddress == fromMac) {
                dev = device;
                found = true;
                break;
            }
        }
        if (!found) {
            _scannedDevices.push_back(device);
        }
    }
    
    // Update peer if it exists
    auto it = _peers.find(fromMac);
    if (it != _peers.end()) {
        it->second.device.name = String(packet->name);
        it->second.device.ipAddress = String(packet->ipAddress);
        it->second.device.deviceType = (JBoardDeviceType)packet->deviceType;
        it->second.device.capabilities = packet->capabilities;
        it->second.device.firmware = String(packet->firmware);
        it->second.device.rssi = rssi;
        it->second.device.lastSeen = millis();
    }
    
    // Store message
    JBoardMessage message;
    message.id = generateMessageId();
    message.from = fromMac;
    message.fromName = String(packet->name);
    message.command = String(packet->command);
    message.data = String(packet->data);
    message.rssi = rssi;
    message.receivedAt = millis();
    
    _receivedMessages.push_back(message);
    
    // Limit message history
    if (_receivedMessages.size() > MAX_MESSAGES) {
        _receivedMessages.erase(_receivedMessages.begin());
    }
}
