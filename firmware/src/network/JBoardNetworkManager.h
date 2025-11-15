#ifndef JBOARD_NETWORK_MANAGER_H
#define JBOARD_NETWORK_MANAGER_H

#include <Arduino.h>
#include <esp_now.h>
#include <WiFi.h>
#include <Preferences.h>
#include <vector>
#include <map>
#include "../types/JBoard.h"

#define MAX_PEERS 20
#define MAX_MESSAGES 100

class JBoardNetworkManager {
public:
    JBoardNetworkManager();
    
    // Initialization
    void begin();
    void update();
    
    // Enable/Disable control
    bool isEnabled();
    void setEnabled(bool enabled);
    
    // Device information
    JBoardDevice getThisDevice();
    void setDeviceName(const String& name);
    void setDeviceType(JBoardDeviceType type);
    void setCapabilities(uint8_t capabilities);
    
    // Peer management
    std::vector<JBoardPeer> getPeers();
    JBoardPeer* getPeer(const String& macAddress);
    bool addPeer(const String& macAddress, const String& name);
    bool removePeer(const String& macAddress);
    bool isPaired(const String& macAddress);
    
    // Scanning
    bool startScan();
    std::vector<JBoardDevice> getScannedDevices();
    
    // Messaging
    bool sendMessage(const String& to, const String& command, const String& data);
    bool broadcastMessage(const String& command, const String& data);
    std::vector<JBoardMessage> getReceivedMessages(int limit = 50);
    void clearMessages();
    
    // ESP-NOW callbacks
    static void onDataReceive(const uint8_t* mac, const uint8_t* data, int len);
    static void onDataSent(const uint8_t* mac, esp_now_send_status_t status);
    
private:
    JBoardDevice _thisDevice;
    std::map<String, JBoardPeer> _peers;
    std::vector<JBoardDevice> _scannedDevices;
    std::vector<JBoardMessage> _receivedMessages;
    Preferences _prefs;
    bool _initialized;
    bool _enabled;
    bool _scanning;
    unsigned long _scanStartTime;
    
    // Internal helpers
    void initThisDevice();
    void loadPeers();
    void savePeers();
    bool addESPNOWPeer(const uint8_t* macBytes);
    void removeESPNOWPeer(const uint8_t* macBytes);
    String generateMessageId();
    void processIncomingMessage(const uint8_t* mac, const ESPNOWPacket* packet, int8_t rssi);
    
    // Static instance for callbacks
    static JBoardNetworkManager* _instance;
};

#endif // JBOARD_NETWORK_MANAGER_H
