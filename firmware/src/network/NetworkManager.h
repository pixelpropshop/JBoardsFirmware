#ifndef NETWORK_MANAGER_H
#define NETWORK_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>
#include <ESPmDNS.h>
#include <Preferences.h>
#include <ArduinoJson.h>

// Forward declarations
class SystemManager;
class JBoardNetworkManager;

// WiFi profile structure
struct WiFiProfile {
    String name;        // User-friendly name for the profile
    String ssid;
    String password;
    int priority;
    bool useStaticIP;
    IPAddress staticIP;
    IPAddress gateway;
    IPAddress subnet;
    IPAddress dns1;
    IPAddress dns2;
};

class NetworkManager {
public:
    NetworkManager();
    
    // Initialization
    void begin();
    void update();
    
    // WiFi Station Management
    bool connectToWiFi(const String& ssid, const String& password);
    bool connectToWiFi(const String& ssid, const String& password, 
                      IPAddress ip, IPAddress gateway, IPAddress subnet, 
                      IPAddress dns1 = IPAddress(0,0,0,0), IPAddress dns2 = IPAddress(0,0,0,0));
    void disconnectWiFi();
    bool isConnected();
    
    // Access Point Management
    bool startAP(const String& ssid, const String& password, int channel = 6, bool hidden = false, int maxConnections = 4);
    void stopAP();
    bool isAPActive();
    int getAPClientCount();
    
    // Network Status
    String getStatus();
    int getRSSI();
    IPAddress getIP();
    IPAddress getAPIP();
    String getMAC();
    String getAPMAC();
    
    // WiFi Scanning
    int scanNetworks();
    String getScanResults();
    
    // Hostname & mDNS
    bool setHostname(const String& hostname);
    String getHostname();
    bool startMDNS(const String& hostname);
    
    // WiFi Profiles
    bool saveProfile(const WiFiProfile& profile);
    bool deleteProfile(const String& ssid);
    bool updateProfilePriority(const String& ssid, int newPriority);
    WiFiProfile* getProfile(const String& ssid);
    String getAllProfiles();
    int getProfileCount();
    bool connectToSavedProfile();
    
    // Auto-Reconnect
    void enableAutoReconnect(bool enable, int maxAttempts = 5, int interval = 5000);
    bool isAutoReconnectEnabled();
    
    // Safe Boot Mode support
    void setSystemManager(SystemManager* sysMgr);
    
    // JBoard Network support
    void setJBoardNetworkManager(JBoardNetworkManager* jboardMgr);
    
private:
    Preferences preferences;
    
    // WiFi state
    bool wifiConnected;
    bool apActive;
    unsigned long lastReconnectAttempt;
    int reconnectAttempts;
    
    // Auto-reconnect settings
    bool autoReconnect;
    int maxReconnectAttempts;
    int reconnectInterval;
    
    // Hostname
    String currentHostname;
    
    // WiFi profiles
    WiFiProfile profiles[10];  // Support up to 10 profiles
    int profileCount;
    
    // System manager reference for Safe Boot Mode
    SystemManager* systemManager;
    
    // JBoard network manager reference
    JBoardNetworkManager* jboardNetworkManager;
    
    // Private methods
    void loadProfiles();
    void saveProfilesToNVS();
    void normalizePriorities();    // Ensure priorities are sequential (1, 2, 3, ...)
    WiFiProfile* findHighestPriorityProfile();
    void handleAutoReconnect();
    bool tryConnectWithFallback(); // Try WiFi Station config first, then all profiles
    bool tryWiFiStationConfig();   // Try the main WiFi Station config
    bool tryAllProfiles();          // Try all profiles in priority order
};

#endif // NETWORK_MANAGER_H
