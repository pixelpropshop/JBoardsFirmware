#ifndef JBOARD_H
#define JBOARD_H

#include <Arduino.h>
#include <vector>
#include <map>

// Device types
enum JBoardDeviceType {
    DEVICE_SENSOR = 0x01,
    DEVICE_CONTROLLER = 0x02,
    DEVICE_DISPLAY = 0x03,
    DEVICE_RELAY = 0x04,
    DEVICE_GATEWAY = 0x05
};

// Capability flags (bitmask)
#define CAPABILITY_WIFI     0x01
#define CAPABILITY_BLE      0x02
#define CAPABILITY_SENSORS  0x04
#define CAPABILITY_DISPLAY  0x08
#define CAPABILITY_AUDIO    0x10

// Device information
struct JBoardDevice {
    String name;
    String macAddress;  // AA:BB:CC:DD:EE:FF format
    uint8_t macBytes[6];  // MAC address bytes
    String ipAddress;   // IP address (for WiFi/web interface)
    JBoardDeviceType deviceType;
    uint8_t capabilities;
    String firmware;
    int8_t rssi;
    unsigned long lastSeen;
};

// Peer device (connected device)
struct JBoardPeer {
    JBoardDevice device;
    bool isPaired;
};

// Message structure
struct JBoardMessage {
    String id;
    String from;           // MAC address
    String fromName;       // Device name
    String command;
    String data;           // JSON string
    int8_t rssi;
    unsigned long receivedAt;
};

// Message to send
struct JBoardOutgoingMessage {
    String to;             // MAC address (empty for broadcast)
    String command;
    String data;           // JSON string
};

// ESP-NOW message packet (max 250 bytes)
struct __attribute__((packed)) ESPNOWPacket {
    uint8_t version;        // Protocol version
    uint8_t deviceType;     // Device type
    uint8_t capabilities;   // Capability flags
    char name[32];          // Device name
    char firmware[16];      // Firmware version
    char ipAddress[16];     // IP address (e.g., "192.168.1.100")
    char command[32];       // Command name
    char data[134];         // JSON data (adjusted for IP field)
};

// Helper functions
inline String macBytesToString(const uint8_t* mac) {
    char macStr[18];
    snprintf(macStr, sizeof(macStr), "%02X:%02X:%02X:%02X:%02X:%02X",
             mac[0], mac[1], mac[2], mac[3], mac[4], mac[5]);
    return String(macStr);
}

inline bool macStringToBytes(const String& macStr, uint8_t* mac) {
    if (macStr.length() != 17) return false;
    
    int values[6];
    if (sscanf(macStr.c_str(), "%x:%x:%x:%x:%x:%x",
               &values[0], &values[1], &values[2],
               &values[3], &values[4], &values[5]) == 6) {
        for (int i = 0; i < 6; i++) {
            mac[i] = (uint8_t)values[i];
        }
        return true;
    }
    return false;
}

inline String deviceTypeToString(JBoardDeviceType type) {
    switch (type) {
        case DEVICE_SENSOR: return "sensor";
        case DEVICE_CONTROLLER: return "controller";
        case DEVICE_DISPLAY: return "display";
        case DEVICE_RELAY: return "relay";
        case DEVICE_GATEWAY: return "gateway";
        default: return "unknown";
    }
}

inline JBoardDeviceType deviceTypeFromString(const String& type) {
    if (type == "sensor") return DEVICE_SENSOR;
    if (type == "controller") return DEVICE_CONTROLLER;
    if (type == "display") return DEVICE_DISPLAY;
    if (type == "relay") return DEVICE_RELAY;
    if (type == "gateway") return DEVICE_GATEWAY;
    return DEVICE_CONTROLLER; // default
}

#endif // JBOARD_H
