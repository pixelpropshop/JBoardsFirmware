# JSense Board API Specification

This document describes the REST API endpoints that the ESP32 firmware needs to implement for the network functionality.

## Base URL

All endpoints are relative to the root of the ESP32 web server (e.g., `/api/...`)

## Network API Endpoints

### 1. Get WiFi Configuration

**Endpoint:** `GET /api/network/wifi`

**Description:** Retrieve the current WiFi Station configuration.

**Response:**
```json
{
  "ssid": "MyNetwork",
  "password": "",
  "ip": "192.168.1.100",
  "gateway": "192.168.1.1",
  "subnet": "255.255.255.0",
  "dns": "8.8.8.8",
  "dhcp": true
}
```

**Notes:**
- Password field can be empty or masked for security
- If DHCP is enabled, static IP fields may be ignored by the frontend

---

### 2. Update WiFi Configuration

**Endpoint:** `POST /api/network/wifi`

**Description:** Update WiFi Station configuration and attempt to connect.

**Request Body:**
```json
{
  "ssid": "MyNetwork",
  "password": "mypassword123",
  "ip": "192.168.1.100",
  "gateway": "192.168.1.1",
  "subnet": "255.255.255.0",
  "dns": "8.8.8.8",
  "dhcp": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "WiFi configuration saved. Device will reconnect..."
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Failed to connect to WiFi network"
}
```

**Notes:**
- If password is empty, keep the existing password
- After saving, the ESP32 should attempt to connect to the new WiFi network
- Consider implementing a fallback mechanism if connection fails

---

### 3. Get Access Point Configuration

**Endpoint:** `GET /api/network/ap`

**Description:** Retrieve the current Access Point configuration.

**Response:**
```json
{
  "ssid": "JSense-AP",
  "password": "",
  "ip": "192.168.4.1",
  "channel": 6,
  "hidden": false,
  "maxClients": 4
}
```

**Notes:**
- Password field should be empty or masked for security

---

### 4. Update Access Point Configuration

**Endpoint:** `POST /api/network/ap`

**Description:** Update Access Point configuration.

**Request Body:**
```json
{
  "ssid": "JSense-AP",
  "password": "myappassword",
  "ip": "192.168.4.1",
  "channel": 6,
  "hidden": false,
  "maxClients": 4
}
```

**Response:**
```json
{
  "success": true,
  "message": "Access Point configuration saved successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid channel number"
}
```

**Notes:**
- If password is empty, keep the existing password
- Changes may require AP restart to take effect

---

### 5. Get Network Status

**Endpoint:** `GET /api/network/status`

**Description:** Get current network connection status.

**Response:**
```json
{
  "wifiConnected": true,
  "wifiRSSI": -45,
  "wifiIP": "192.168.1.100",
  "apActive": true,
  "apClients": 1
}
```

**Notes:**
- This endpoint can be polled for real-time status updates
- Consider implementing WebSocket for live updates instead

---

### 6. Scan WiFi Networks

**Endpoint:** `GET /api/network/scan`

**Description:** Scan for available WiFi networks.

**Response:**
```json
[
  {
    "ssid": "MyNetwork",
    "rssi": -45,
    "secure": true
  },
  {
    "ssid": "Neighbor_WiFi",
    "rssi": -67,
    "secure": true
  },
  {
    "ssid": "Public_Hotspot",
    "rssi": -72,
    "secure": false
  }
]
```

**Notes:**
- Scanning may take a few seconds
- Sort results by RSSI (signal strength) for better UX
- `secure` indicates if the network uses encryption (WPA/WPA2)

---

## CORS Configuration

For development testing, the ESP32 web server should include CORS headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

In production (when the React app is served from the ESP32), CORS is not needed.

---

## Error Handling

All endpoints should return appropriate HTTP status codes:

- `200 OK` - Successful request
- `400 Bad Request` - Invalid input data
- `500 Internal Server Error` - Server-side error

Error responses should include a message:

```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

---

## Security Considerations

1. **Password Handling:**
   - Never return actual passwords in GET requests
   - Return empty string or masked value
   - Only accept passwords in POST requests

2. **Input Validation:**
   - Validate SSID length (1-32 characters)
   - Validate password length (8-63 characters for WPA/WPA2)
   - Validate IP address format
   - Validate channel range (1-13)

3. **Rate Limiting:**
   - Consider rate limiting network scan requests
   - Prevent rapid configuration changes

4. **Connection Safety:**
   - Implement fallback to AP mode if WiFi connection fails
   - Keep AP mode active during WiFi changes to allow recovery

---

## Frontend Implementation Details

### Mock Data Fallback

The frontend automatically falls back to mock data if API calls fail. This allows:
- Development without ESP32 hardware
- Graceful degradation if backend is unavailable
- Easier UI testing and development

### Form Validation

The frontend validates all input before sending to the API:
- SSID: 1-32 characters
- Password: 8-63 characters (or empty to keep current)
- IP addresses: Valid IPv4 format
- Channel: 1-13
- Max clients: 1-8

### Confirmation Dialogs

Users must confirm changes to:
- WiFi settings (may disconnect)
- AP settings (may affect connected clients)

This prevents accidental configuration errors.

---

## Example ESP32 Implementation (Pseudo-code)

```cpp
// WiFi GET endpoint
server.on("/api/network/wifi", HTTP_GET, [](AsyncWebServerRequest *request){
  StaticJsonDocument<256> doc;
  doc["ssid"] = WiFi.SSID();
  doc["password"] = ""; // Never return actual password
  doc["ip"] = WiFi.localIP().toString();
  doc["gateway"] = WiFi.gatewayIP().toString();
  doc["subnet"] = WiFi.subnetMask().toString();
  doc["dns"] = WiFi.dnsIP().toString();
  doc["dhcp"] = true; // Or read from config
  
  String response;
  serializeJson(doc, response);
  request->send(200, "application/json", response);
});

// WiFi POST endpoint
server.on("/api/network/wifi", HTTP_POST, [](AsyncWebServerRequest *request){
  // Parse JSON body
  // Validate input
  // Save configuration
  // Attempt WiFi connection
  
  StaticJsonDocument<128> doc;
  doc["success"] = true;
  doc["message"] = "WiFi configuration saved";
  
  String response;
  serializeJson(doc, response);
  request->send(200, "application/json", response);
});
```

---

## Testing

### Development Mode Testing

1. **Without ESP32** (default):
   ```bash
   npm run dev
   # Uses mock data automatically
   ```

2. **With ESP32**:
   - Edit `.env.development`
   - Uncomment and set: `VITE_API_BASE_URL=http://192.168.1.100`
   - Ensure ESP32 has CORS enabled
   - Run: `npm run dev`

### Production Build

```bash
npm run build
# Upload dist folder contents to ESP32 flash storage
# Access via ESP32 IP address
```

---

### 7. Get Hostname Configuration

**Endpoint:** `GET /api/network/hostname`

**Description:** Retrieve the current hostname and mDNS configuration.

**Response:**
```json
{
  "hostname": "jsenseboard",
  "mdnsEnabled": true
}
```

**Notes:**
- Hostname is used for mDNS discovery (hostname.local)
- Must be alphanumeric and hyphens only, 1-63 characters

---

### 8. Update Hostname Configuration

**Endpoint:** `POST /api/network/hostname`

**Description:** Update hostname and mDNS configuration.

**Request Body:**
```json
{
  "hostname": "jsenseboard",
  "mdnsEnabled": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Hostname configuration saved successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid hostname format"
}
```

**Notes:**
- Hostname must be 1-63 characters, alphanumeric and hyphens only
- Cannot start or end with hyphen
- Changes take effect after restart or can be applied immediately

---

### 9. Get WiFi Profiles

**Endpoint:** `GET /api/network/profiles`

**Description:** Retrieve all saved WiFi profiles.

**Response:**
```json
[
  {
    "id": "1",
    "name": "Home Network",
    "ssid": "MyNetwork",
    "password": "",
    "ip": "192.168.1.100",
    "gateway": "192.168.1.1",
    "subnet": "255.255.255.0",
    "dns": "8.8.8.8",
    "dhcp": true,
    "priority": 1
  },
  {
    "id": "2",
    "name": "Office WiFi",
    "ssid": "OfficeNet",
    "password": "",
    "ip": "10.0.0.100",
    "gateway": "10.0.0.1",
    "subnet": "255.255.255.0",
    "dns": "8.8.8.8",
    "dhcp": true,
    "priority": 2
  }
]
```

**Notes:**
- Password field should be empty or masked for security
- Priority determines auto-connect order (lower number = higher priority)
- Profiles sorted by priority

---

### 10. Save WiFi Profile

**Endpoint:** `POST /api/network/profiles`

**Description:** Create or update a WiFi profile.

**Request Body:**
```json
{
  "name": "Home Network",
  "ssid": "MyNetwork",
  "password": "mypassword123",
  "ip": "192.168.1.100",
  "gateway": "192.168.1.1",
  "subnet": "255.255.255.0",
  "dns": "8.8.8.8",
  "dhcp": true,
  "priority": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "WiFi profile saved successfully",
  "id": "3"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Profile name already exists"
}
```

**Notes:**
- If editing existing profile, include id in request body
- Empty password means keep existing password (for edits)
- Priority can be auto-assigned if not provided

---

### 11. Delete WiFi Profile

**Endpoint:** `DELETE /api/network/profiles/{id}`

**Description:** Delete a saved WiFi profile.

**Response:**
```json
{
  "success": true,
  "message": "WiFi profile deleted successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Profile not found"
}
```

---

### 12. Connect to WiFi Profile

**Endpoint:** `POST /api/network/profiles/{id}/connect`

**Description:** Connect to a saved WiFi profile.

**Response:**
```json
{
  "success": true,
  "message": "Connecting to WiFi profile..."
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Failed to connect to network"
}
```

**Notes:**
- Applies the profile settings and attempts connection
- Similar behavior to updating WiFi config directly

---

### 13. Update Profile Priority

**Endpoint:** `POST /api/network/profiles/{id}/priority`

**Description:** Update the priority of a WiFi profile (for auto-connect order).

**Request Body:**
```json
{
  "priority": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile priority updated"
}
```

**Notes:**
- Lower priority number = higher priority
- Used for automatic connection attempt order
- May require re-ordering other profiles

---

### 14. Get Auto-Reconnect Configuration

**Endpoint:** `GET /api/network/autoreconnect`

**Description:** Retrieve the auto-reconnect configuration.

**Response:**
```json
{
  "enabled": true,
  "maxAttempts": 5,
  "attemptInterval": 30,
  "fallbackToAP": true
}
```

**Notes:**
- maxAttempts: 0 = unlimited, 1-100 = specific number
- attemptInterval: seconds between reconnection attempts (5-300)
- fallbackToAP: enable AP mode after max attempts reached

---

### 15. Update Auto-Reconnect Configuration

**Endpoint:** `POST /api/network/autoreconnect`

**Description:** Update auto-reconnect configuration.

**Request Body:**
```json
{
  "enabled": true,
  "maxAttempts": 5,
  "attemptInterval": 30,
  "fallbackToAP": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Auto-reconnect configuration saved successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid configuration"
}
```

**Notes:**
- When enabled, device will automatically attempt to reconnect on WiFi disconnection
- Retry interval should be between 5-300 seconds
- Max attempts: 0 = unlimited, 1-100 = specific limit
- Fallback to AP enables the Access Point after exhausting all retry attempts

---

### 16. Get Captive Portal Status

**Endpoint:** `GET /api/captive/status`

**Description:** Retrieve the current captive portal status.

**Response:**
```json
{
  "isActive": false,
  "isCompleted": true,
  "apOnlyMode": false,
  "completedAt": "2025-01-10T10:30:00Z"
}
```

**Notes:**
- isActive: Whether the captive portal should be shown
- isCompleted: Whether user has completed the initial setup
- apOnlyMode: Whether user chose to use device in AP-only mode
- completedAt: ISO timestamp of when setup was completed (null if not completed)

---

### 17. Complete Captive Portal Setup

**Endpoint:** `POST /api/captive/complete`

**Description:** Mark the captive portal setup as complete.

**Request Body:**
```json
{
  "apOnlyMode": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Captive portal setup completed"
}
```

**Notes:**
- apOnlyMode: true if user chose to use device in AP-only mode
- After completion, portal should not be shown again unless reset
- Save completion timestamp and mode preference

---

### 18. Reset Captive Portal

**Endpoint:** `POST /api/captive/reset`

**Description:** Reset the captive portal to show again on next connection.

**Response:**
```json
{
  "success": true,
  "message": "Captive portal reset successfully"
}
```

**Notes:**
- Clears the completion flag
- Portal will show again when user connects to AP
- Useful for reconfiguring device or testing

---

## Captive Portal Behavior

### Implementation Flow

1. **First Boot / Unconfigured Device:**
   - Device boots in AP mode
   - User connects to device's AP
   - Captive portal auto-opens (DNS redirect)
   - User chooses: "Connect to WiFi" or "AP-only mode"

2. **User Chooses WiFi Setup:**
   - Shows network scan
   - User selects network and enters password
   - Device connects to WiFi
   - Marks captive portal as complete
   - Redirects to main application

3. **User Chooses AP-Only Mode:**
   - Marks captive portal as complete with apOnlyMode=true
   - Keeps device in AP mode
   - Redirects to main application

4. **Subsequent Connections:**
   - If portal is completed, bypass portal
   - Go directly to main application
   - User can reset portal from Network Settings if needed

### DNS Captive Portal Setup

For true captive portal behavior on the ESP32:

```cpp
// Redirect all DNS queries to ESP32 IP
DNSServer dnsServer;
dnsServer.start(53, "*", apIP);

// In loop()
dnsServer.processNextRequest();
```

This makes the portal auto-open when users connect to the AP.

---

## JBoard Network API Endpoints

The JBoard Network system enables ESP32-based boards to communicate peer-to-peer using ESP-NOW protocol without requiring a central master device.

### 19. Get This Device Information

**Endpoint:** `GET /api/jboard/device`

**Description:** Retrieve information about the current device.

**Response:**
```json
{
  "name": "JSense Board #1",
  "macAddress": "AA:BB:CC:DD:EE:01",
  "deviceType": 1,
  "capabilities": 31,
  "firmware": "1.2.0"
}
```

**Notes:**
- deviceType: 0x01=Sensor, 0x02=Controller, 0x03=Display, 0x04=Relay, 0x05=Gateway
- capabilities: Bitmask (0x01=WiFi, 0x02=BLE, 0x04=Sensors, 0x08=Display, 0x10=Audio)
- macAddress: Device's MAC address for ESP-NOW identification

---

### 20. Get Connected Peers

**Endpoint:** `GET /api/jboard/peers`

**Description:** Retrieve list of paired JBoard devices.

**Response:**
```json
[
  {
    "name": "LED Controller #2",
    "macAddress": "AA:BB:CC:DD:EE:02",
    "deviceType": 2,
    "capabilities": 17,
    "rssi": -45,
    "lastSeen": "2025-01-10T11:30:00Z",
    "firmware": "1.1.0"
  },
  {
    "name": "Display Panel #3",
    "macAddress": "AA:BB:CC:DD:EE:03",
    "deviceType": 3,
    "capabilities": 25,
    "rssi": -52,
    "lastSeen": "2025-01-10T11:29:55Z",
    "firmware": "1.0.5"
  }
]
```

**Notes:**
- rssi: Signal strength in dBm (-30 to -90)
- lastSeen: ISO timestamp of last communication
- Devices not seen for >5 minutes may be marked as offline

---

### 21. Start Device Scan

**Endpoint:** `POST /api/jboard/scan`

**Description:** Scan for nearby unpaired JBoard devices.

**Response:**
```json
{
  "success": true,
  "message": "Scan started",
  "devices": [
    {
      "name": "Sensor Module #5",
      "macAddress": "AA:BB:CC:DD:EE:05",
      "deviceType": 1,
      "capabilities": 21,
      "rssi": -38,
      "firmware": "1.3.0"
    },
    {
      "name": "Relay Board #7",
      "macAddress": "AA:BB:CC:DD:EE:07",
      "deviceType": 4,
      "capabilities": 1,
      "rssi": -65,
      "firmware": "1.2.1"
    }
  ]
}
```

**Notes:**
- Scan duration typically 5-10 seconds
- Only shows unpaired devices in pairing mode
- Results sorted by RSSI (strongest first)

---

### 22. Pair with Device

**Endpoint:** `POST /api/jboard/pair`

**Description:** Add a device to the paired devices list.

**Request Body:**
```json
{
  "macAddress": "AA:BB:CC:DD:EE:05",
  "name": "Sensor Module #5"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Device paired successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Device not found or already paired"
}
```

**Notes:**
- Establishes ESP-NOW peer connection
- Name can be customized during pairing
- Max peers limited by ESP-NOW (typically 20 devices)

---

### 23. Unpair Device

**Endpoint:** `DELETE /api/jboard/peers/{macAddress}`

**Description:** Remove a device from paired devices list.

**Response:**
```json
{
  "success": true,
  "message": "Device unpaired successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Device not found"
}
```

**Notes:**
- Removes ESP-NOW peer connection
- Device can be re-paired later
- Does not affect the device itself, only removes from this device's peer list

---

### 24. Send Message to Device

**Endpoint:** `POST /api/jboard/message`

**Description:** Send a command/message to a specific paired device.

**Request Body:**
```json
{
  "to": "AA:BB:CC:DD:EE:02",
  "command": "set_brightness",
  "data": {
    "value": 75
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Device not paired or unreachable"
}
```

**Notes:**
- to: MAC address of target device
- command: String identifier for the action
- data: JSON object with command parameters (max 250 bytes total)
- ESP-NOW has no delivery confirmation, success means message was queued

---

### 25. Broadcast Message

**Endpoint:** `POST /api/jboard/broadcast`

**Description:** Send a command/message to all paired devices.

**Request Body:**
```json
{
  "command": "sync_time",
  "data": {
    "timestamp": 1704902400
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Broadcast sent to 3 devices"
}
```

**Notes:**
- Sends to all currently paired devices
- Same data format as single message
- Useful for synchronized actions across multiple devices

---

### 26. Get Received Messages

**Endpoint:** `GET /api/jboard/messages`

**Description:** Retrieve messages received from other JBoard devices.

**Query Parameters:**
- limit: Maximum number of messages to return (default: 50, max: 100)
- since: ISO timestamp to get messages after (optional)

**Response:**
```json
[
  {
    "id": "msg-001",
    "from": "AA:BB:CC:DD:EE:02",
    "fromName": "LED Controller #2",
    "command": "status_update",
    "data": {
      "brightness": 80,
      "color": "#FF5500"
    },
    "rssi": -48,
    "receivedAt": "2025-01-10T11:35:20Z"
  },
  {
    "id": "msg-002",
    "from": "AA:BB:CC:DD:EE:03",
    "fromName": "Display Panel #3",
    "command": "button_press",
    "data": {
      "button": 1
    },
    "rssi": -51,
    "receivedAt": "2025-01-10T11:35:15Z"
  }
]
```

**Notes:**
- Messages sorted by receivedAt (newest first)
- Consider implementing automatic cleanup of old messages
- RSSI measured at time of reception

---

## JBoard Network Device Types

| Value | Name       | Description                    |
|-------|------------|--------------------------------|
| 0x01  | Sensor     | Sensor monitoring board        |
| 0x02  | Controller | LED/device controller          |
| 0x03  | Display    | Display/output board           |
| 0x04  | Relay      | Relay/switching board          |
| 0x05  | Gateway    | Gateway/bridge board           |

---

## JBoard Network Capabilities Bitmask

| Bit | Value | Name    | Description                |
|-----|-------|---------|----------------------------|
| 0   | 0x01  | WiFi    | WiFi connectivity          |
| 1   | 0x02  | BLE     | Bluetooth Low Energy       |
| 2   | 0x04  | Sensors | Has sensor inputs          |
| 3   | 0x08  | Display | Has display output         |
| 4   | 0x10  | Audio   | Has audio capabilities     |

**Example:** A device with WiFi + Sensors + Audio = 0x01 | 0x04 | 0x10 = 0x15 (21 decimal)

---

## JBoard Network Architecture

### Peer-to-Peer Design

- **No Master Device:** All devices are equal peers
- **Direct Communication:** Devices communicate directly via ESP-NOW
- **Mesh Capability:** Messages can be relayed through intermediate devices
- **Discovery:** Devices broadcast their presence for discovery
- **Pairing:** Users manually pair devices through web interface

### ESP-NOW Implementation

```cpp
// Initialize ESP-NOW
esp_now_init();
esp_now_register_recv_cb(onDataReceive);
esp_now_register_send_cb(onDataSent);

// Add peer
esp_now_peer_info_t peerInfo;
memcpy(peerInfo.peer_addr, targetMAC, 6);
peerInfo.channel = 0;
peerInfo.encrypt = false;
esp_now_add_peer(&peerInfo);

// Send data
esp_now_send(targetMAC, data, dataLength);
```

### Security Considerations

1. **Pairing Process:**
   - Devices must be in "pairing mode" to be discovered
   - User confirmation required on both devices (optional)
   - MAC address filtering

2. **Message Encryption:**
   - ESP-NOW supports encryption (optional)
   - Shared key exchange during pairing
   - Consider AES encryption for sensitive commands

3. **Access Control:**
   - Only paired devices can send commands
   - Command validation on receiving device
   - Rate limiting to prevent spam

---

## Board Configuration API

### 27. Get Board Information

**Endpoint:** `GET /api/board/info`

**Description:** Retrieve information about the current board model and capabilities.

**Response:**
```json
{
  "model": "jsense",
  "hardware": "ESP32-S3",
  "firmware": "1.0.0"
}
```

**Notes:**
- model: Board model identifier (jsense, led-controller, sensor-hub, audio-reactive, effects-controller)
- hardware: Hardware platform (ESP32, ESP32-S3, etc.)
- firmware: Current firmware version
- Frontend merges this with preset configurations for features and UI

---

## Board Models and Configurations

| Model | Name | Hardware | Features |
|-------|------|----------|----------|
| jsense | JSense Board | ESP32-S3 | Full-featured: 8 outputs, 4096 pixels, all protocols |
| led-controller | LED Controller | ESP32 | Basic: 2 outputs, 1024 pixels, E1.31/DDP/ArtNet |
| sensor-hub | Sensor Hub | ESP32 | Sensors only, no pixel control |
| audio-reactive | Audio Reactive | ESP32-S3 | Audio + pixels: 4 outputs, 2048 pixels, E1.31/DDP |
| effects-controller | Effects Controller | ESP32 | Effects: 4 outputs, 2048 pixels, E1.31/DDP/DMX |

---

## LED Effects API Endpoints

### 28. Get Available Effects

**Endpoint:** `GET /api/effects`

**Description:** Retrieve all available LED effects.

**Response:**
```json
[
  {
    "id": "solid",
    "name": "Solid Color",
    "category": "Solid",
    "description": "Display a single solid color",
    "icon": "🎨",
    "parameters": [
      {
        "id": "color",
        "name": "Color",
        "type": "color",
        "value": "#ff0000"
      }
    ]
  },
  {
    "id": "rainbow",
    "name": "Rainbow",
    "category": "Animated",
    "description": "Smooth rainbow color cycle",
    "icon": "🌈",
    "parameters": [
      {
        "id": "speed",
        "name": "Speed",
        "type": "slider",
        "value": 50,
        "min": 1,
        "max": 100,
        "step": 1,
        "unit": "%"
      }
    ]
  }
]
```

**Notes:**
- category: Solid, Animated, Pattern, Reactive, Custom
- parameter types: slider, color, toggle, select, number
- icon: Emoji or icon identifier for UI display

---

### 29. Get LED State

**Endpoint:** `GET /api/led/state`

**Description:** Get current LED power, brightness, and active effect.

**Response:**
```json
{
  "power": true,
  "brightness": 80,
  "activeEffect": "rainbow",
  "activeParameters": {
    "speed": 50
  }
}
```

**Notes:**
- power: Boolean indicating LED power state
- brightness: 0-100 percentage
- activeEffect: ID of currently running effect (null if none)
- activeParameters: Current parameter values for active effect

---

### 30. Set LED Power

**Endpoint:** `POST /api/led/power`

**Description:** Turn LED power on or off.

**Request Body:**
```json
{
  "power": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "LED power on"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Failed to set power state"
}
```

---

### 31. Set LED Brightness

**Endpoint:** `POST /api/led/brightness`

**Description:** Set LED brightness level.

**Request Body:**
```json
{
  "brightness": 75
}
```

**Response:**
```json
{
  "success": true,
  "message": "Brightness set to 75%"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid brightness value"
}
```

**Notes:**
- brightness: Integer value 0-100
- Validates range before applying

---

### 32. Apply Effect

**Endpoint:** `POST /api/effects/apply`

**Description:** Apply an effect with specified parameters.

**Request Body:**
```json
{
  "effectId": "rainbow",
  "parameters": {
    "speed": 75
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Effect applied successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Effect not found or invalid parameters"
}
```

**Notes:**
- effectId: Must match an available effect ID
- parameters: Object with parameter IDs as keys
- Validates parameter types and ranges
- Immediately applies effect to LEDs

---

### 33. Get Effect Presets

**Endpoint:** `GET /api/effects/presets`

**Description:** Retrieve all saved effect presets.

**Response:**
```json
[
  {
    "id": "preset-1",
    "name": "Warm Sunset",
    "effectId": "gradient",
    "parameters": {
      "color1": "#ff6b35",
      "color2": "#f7931e",
      "animate": true
    },
    "createdAt": "2025-01-09T10:30:00Z"
  },
  {
    "id": "preset-2",
    "name": "Ocean Waves",
    "effectId": "wave",
    "parameters": {
      "color1": "#00d4ff",
      "color2": "#0047ab",
      "speed": 30,
      "width": 25
    },
    "createdAt": "2025-01-08T14:20:00Z"
  }
]
```

**Notes:**
- Presets stored in device flash memory
- Sorted by creation date or custom order
- Maximum preset count device-dependent

---

### 34. Save Effect Preset

**Endpoint:** `POST /api/effects/presets`

**Description:** Save current effect and parameters as a preset.

**Request Body:**
```json
{
  "name": "My Custom Effect",
  "effectId": "sparkle",
  "parameters": {
    "color": "#ffffff",
    "density": 60,
    "speed": 50
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Preset saved successfully",
  "preset": {
    "id": "preset-3",
    "name": "My Custom Effect",
    "effectId": "sparkle",
    "parameters": {
      "color": "#ffffff",
      "density": 60,
      "speed": 50
    },
    "createdAt": "2025-01-10T13:30:00Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Preset name already exists"
}
```

**Notes:**
- name: 1-32 characters, unique
- Validates effect ID exists
- Validates parameters match effect schema
- Returns complete preset object with generated ID

---

### 35. Delete Effect Preset

**Endpoint:** `DELETE /api/effects/presets/{id}`

**Description:** Delete a saved preset.

**Response:**
```json
{
  "success": true,
  "message": "Preset deleted successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Preset not found"
}
```

**Notes:**
- Only affects saved presets, not built-in effects
- Permanent deletion from flash storage

---

## Effect Categories

| Category | Description | Examples |
|----------|-------------|----------|
| Solid | Static single colors or gradients | Solid Color, Gradient |
| Animated | Moving or changing effects | Rainbow, Chase, Breathe, Wave |
| Pattern | Repeating visual patterns | Stripes, Dots, Segments |
| Reactive | Responds to input (audio, sensors) | Audio Reactive, Motion Triggered |
| Custom | User-created effects | Custom animations |

---

## Effect Parameter Types

| Type | Description | Properties |
|------|-------------|------------|
| slider | Numeric range with slider control | min, max, step, unit |
| color | Color picker with hex input | value (hex string) |
| toggle | Boolean on/off switch | value (boolean) |
| select | Dropdown selection | options array |
| number | Numeric text input | min, max, step |

---

## Built-in Effects

The frontend includes 16 consolidated effects with mock data. Similar effects have been combined with additional parameters to reduce redundancy while maintaining full functionality:

### Basic Effects
1. **Solid Color** - Single static color
2. **Rainbow** - Rainbow color cycle with multiple patterns (gradient/solid/diagonal stripes), saturation control (combines Colorloop and Pride functionality)
3. **Chase** - Moving light patterns with multiple styles (standard/theater/scanner), combines standard chase, Theater Chase, and KITT/Cylon scanner effects
4. **Breathe** - Pulsing fade effect
5. **Sparkle** - Random twinkling lights with background color and 1-5 sparkle colors
6. **Fire** - Flickering fire simulation
7. **Color Flow** - Smooth color transitions through 2-8 user-selected colors (static or animated), expands gradient functionality with multi-color support
8. **Strobe** - Fast flashing
9. **Bars** - Moving colored bar patterns with 2-8 colors and directional control (horizontal/vertical/diagonal)

### Advanced Animated Effects
10. **Wave** - Wave patterns with multiple styles (standard/ripple/ocean), combines smooth wave pattern with ripple mode and Pacifica ocean simulation
11. **Confetti** - Colorful celebration effect
12. **Meteor** - Shooting star effect

### WLED-Inspired Effects
13. **Noise** - Perlin noise-based colorful patterns with palette selection
14. **Matrix** - Falling code rain effect
15. **Police** - Red and blue emergency lights with pattern options
16. **Aurora** - Northern lights simulation with color palette options

ESP32 firmware should implement these effects or provide custom alternatives. Note that consolidated effects use select parameters and toggles to switch between modes, reducing the total number of effects while maintaining all functionality.

---

## Effect Sequences API Endpoints

Effect Sequences allow users to create timed playlists of LED effects that play back-to-back. This feature enables automated light shows, smooth transitions, and scheduled effect changes.

### 36. Get All Sequences

**Endpoint:** `GET /api/sequences`

**Description:** Retrieve all saved effect sequences.

**Response:**
```json
{
  "sequences": [
    {
      "id": "seq-1",
      "name": "Party Mode",
      "description": "High energy party sequence",
      "steps": [
        {
          "id": "step-1",
          "effectId": "rainbow",
          "parameters": {
            "speed": 80,
            "mode": "gradient",
            "saturation": 100
          },
          "duration": 30,
          "transition": "fade"
        }
      ],
      "loop": true,
      "createdAt": "2025-01-08T10:30:00Z",
      "updatedAt": "2025-01-09T14:20:00Z"
    }
  ]
}
```

**Notes:**
- duration: Seconds (0 = manual/infinite)
- transition: 'instant', 'fade', or 'crossfade'
- steps: Array of effect configurations with timing

---

### 37. Get Sequence by ID

**Endpoint:** `GET /api/sequences/{id}`

**Description:** Retrieve a specific sequence by ID.

**Response:**
```json
{
  "id": "seq-1",
  "name": "Party Mode",
  "description": "High energy party sequence",
  "steps": [...],
  "loop": true,
  "createdAt": "2025-01-08T10:30:00Z"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Sequence not found"
}
```

---

### 38. Create Sequence

**Endpoint:** `POST /api/sequences`

**Description:** Create a new effect sequence.

**Request Body:**
```json
{
  "name": "Sunset to Night",
  "description": "Peaceful evening transition",
  "steps": [
    {
      "effectId": "gradient",
      "parameters": {
        "colorCount": "3",
        "color1": "#ff6b35",
        "color2": "#f7931e",
        "color3": "#fbb034",
        "animate": true,
        "speed": 20
      },
      "duration": 120,
      "transition": "crossfade"
    }
  ],
  "loop": false
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sequence created successfully",
  "sequence": {
    "id": "seq-2",
    "name": "Sunset to Night",
    "description": "Peaceful evening transition",
    "steps": [...],
    "loop": false,
    "createdAt": "2025-01-10T14:30:00Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid effect ID in step 1"
}
```

**Notes:**
- name: 1-64 characters, unique
- steps: Array with at least 1 step
- Validates all effect IDs and parameters
- Auto-generates step IDs server-side

---

### 39. Update Sequence

**Endpoint:** `PUT /api/sequences/{id}`

**Description:** Update an existing sequence.

**Request Body:**
```json
{
  "id": "seq-1",
  "name": "Party Mode Updated",
  "description": "Updated description",
  "steps": [...],
  "loop": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sequence updated successfully",
  "sequence": {
    "id": "seq-1",
    "name": "Party Mode Updated",
    "updatedAt": "2025-01-10T15:00:00Z",
    ...
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Sequence not found"
}
```

**Notes:**
- Cannot change sequence ID
- Updates updatedAt timestamp
- Validates steps and parameters

---

### 40. Delete Sequence

**Endpoint:** `DELETE /api/sequences/{id}`

**Description:** Delete a saved sequence.

**Response:**
```json
{
  "success": true,
  "message": "Sequence deleted successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Sequence not found"
}
```

**Notes:**
- Stops playback if this sequence is currently playing
- Permanent deletion from flash storage

---

### 41. Play Sequence

**Endpoint:** `POST /api/sequences/{id}/play`

**Description:** Start playing a sequence from beginning or specific step.

**Request Body:**
```json
{
  "fromStep": 0
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sequence playback started",
  "state": {
    "sequenceId": "seq-1",
    "currentStepIndex": 0,
    "isPlaying": true,
    "isPaused": false,
    "remainingTime": 30,
    "totalElapsed": 0
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Sequence not found"
}
```

**Notes:**
- fromStep: Optional, defaults to 0
- Stops any currently playing sequence
- Applies first effect immediately
- remainingTime: Seconds left in current step

---

### 42. Pause Sequence

**Endpoint:** `POST /api/sequences/pause`

**Description:** Pause the currently playing sequence.

**Response:**
```json
{
  "success": true,
  "message": "Sequence paused",
  "state": {
    "sequenceId": "seq-1",
    "currentStepIndex": 2,
    "isPlaying": false,
    "isPaused": true,
    "remainingTime": 15,
    "totalElapsed": 75
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "No sequence is playing"
}
```

**Notes:**
- Preserves current step and remaining time
- Effect continues to display at current state
- Can be resumed from same position

---

### 43. Resume Sequence

**Endpoint:** `POST /api/sequences/resume`

**Description:** Resume a paused sequence.

**Response:**
```json
{
  "success": true,
  "message": "Sequence resumed",
  "state": {
    "sequenceId": "seq-1",
    "currentStepIndex": 2,
    "isPlaying": true,
    "isPaused": false,
    "remainingTime": 15,
    "totalElapsed": 75
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "No paused sequence"
}
```

**Notes:**
- Continues from paused position
- Timing continues from where it left off

---

### 44. Stop Sequence

**Endpoint:** `POST /api/sequences/stop`

**Description:** Stop sequence playback completely.

**Response:**
```json
{
  "success": true,
  "message": "Sequence stopped"
}
```

**Notes:**
- Clears playback state
- Last effect remains displayed
- Next play starts from beginning

---

### 45. Next Step

**Endpoint:** `POST /api/sequences/next`

**Description:** Skip to next step in sequence.

**Response:**
```json
{
  "success": true,
  "message": "Skipped to next step",
  "state": {
    "sequenceId": "seq-1",
    "currentStepIndex": 3,
    "isPlaying": true,
    "isPaused": false,
    "remainingTime": 45,
    "totalElapsed": 105
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "No sequence is playing"
}
```

**Notes:**
- Applies transition effect
- Wraps to first step if at end (loop enabled)
- Stops if at end and loop disabled

---

### 46. Previous Step

**Endpoint:** `POST /api/sequences/previous`

**Description:** Go back to previous step in sequence.

**Response:**
```json
{
  "success": true,
  "message": "Returned to previous step",
  "state": {
    "sequenceId": "seq-1",
    "currentStepIndex": 1,
    "isPlaying": true,
    "isPaused": false,
    "remainingTime": 30,
    "totalElapsed": 30
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "No sequence is playing"
}
```

**Notes:**
- Applies transition effect
- Wraps to last step if at beginning

---

### 47. Get Playback State

**Endpoint:** `GET /api/sequences/playback/state`

**Description:** Get current sequence playback state.

**Response:**
```json
{
  "sequenceId": "seq-1",
  "currentStepIndex": 2,
  "isPlaying": true,
  "isPaused": false,
  "remainingTime": 20,
  "totalElapsed": 95
}
```

**Response (No playback):**
```json
null
```

**Notes:**
- Returns null if no sequence is playing
- Can be polled for UI updates
- Consider WebSocket for real-time updates

---

### 48. Upload FSEQ Sequence

**Endpoint:** `POST /api/sequences/upload-fseq`

**Description:** Upload an FSEQ (xLights pre-rendered) sequence file.

**Request:** `multipart/form-data`

**Form Fields:**
- `file`: FSEQ file (required, .fseq extension)
- `name`: Sequence name (required, 1-64 characters)
- `description`: Sequence description (optional)

**Response:**
```json
{
  "success": true,
  "message": "FSEQ sequence uploaded successfully",
  "sequence": {
    "id": "fseq-1",
    "type": "fseq",
    "name": "Christmas Show",
    "description": "Main holiday light show",
    "fileName": "christmas_show.fseq",
    "fileSize": 2457600,
    "duration": 120,
    "frameRate": 40,
    "channelCount": 512,
    "loop": false,
    "uploadedAt": "2025-01-10T15:30:00Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid FSEQ file format"
}
```

**Notes:**
- File must have .fseq extension
- File size limit: 10MB (configurable)
- FSEQ parser extracts: duration, frameRate, channelCount from file header
- Name auto-filled from filename but can be customized
- FSEQ sequences are read-only (cannot edit effects)
- Only Play and Delete operations available (no Edit/Duplicate/Export)

**FSEQ File Format:**
- Version: FSEQ V2.0 (xLights format)
- Header contains: magic bytes, version, channel count, frame count, step time
- Binary format with compressed frame data
- Parser must validate magic bytes and version

**Validation:**
- File extension: Must be .fseq
- File size: 1KB - 10MB
- Name: 1-64 characters, unique
- Description: 0-500 characters

**Notes:**
- Audio URL and loop settings can be configured after upload using the Update FSEQ endpoint
- Initial upload creates sequence with loop=false and no audio

---

### 49. Update FSEQ Metadata

**Endpoint:** `PUT /api/sequences/fseq/{id}`

**Description:** Update FSEQ sequence metadata (name, audio URL, loop setting).

**Request Body:**
```json
{
  "name": "Christmas Show (Updated)",
  "audioUrl": "https://example.com/audio/christmas.mp3",
  "loop": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "FSEQ sequence updated successfully",
  "sequence": {
    "id": "fseq-1",
    "type": "fseq",
    "name": "Christmas Show (Updated)",
    "description": "Main holiday light show",
    "fileName": "christmas_show.fseq",
    "fileSize": 2457600,
    "duration": 120,
    "frameRate": 40,
    "channelCount": 512,
    "loop": true,
    "audioUrl": "https://example.com/audio/christmas.mp3",
    "uploadedAt": "2025-01-10T15:30:00Z",
    "updatedAt": "2025-01-10T16:45:00Z"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "FSEQ sequence not found"
}
```

**Notes:**
- Can only update name, audioUrl, and loop settings
- Cannot update the FSEQ file itself (must re-upload)
- Name: 1-64 characters, unique
- audioUrl: Can be set to empty string to remove audio
- Updates updatedAt timestamp

---

## Sequence Implementation Notes

### Transition Types

| Type | Behavior | Duration |
|------|----------|----------|
| instant | Immediate effect switch | 0ms |
| fade | Fade to black → switch → fade in | 1000ms |
| crossfade | Blend between effects using brightness | 1000ms |

### Timing Accuracy

- Use hardware timer (millis()) for accurate timing
- Account for effect render time in calculations
- Handle drift correction for long sequences
- Preserve exact position on pause

### Edge Cases

- Sequence deleted while playing → Stop playback
- Invalid effect parameters → Skip step or use defaults
- Manual effect change during playback → Stop sequence
- Storage full → Show error, prevent save

### ESP32 Implementation Considerations

```cpp
// Sequence playback state
struct SequenceState {
  String sequenceId;
  int currentStepIndex;
  bool isPlaying;
  bool isPaused;
  unsigned long stepStartTime;
  int stepDuration;
  unsigned long totalElapsed;
};

// In loop()
void updateSequencePlayback() {
  if (!playbackState.isPlaying || playbackState.isPaused) return;
  
  unsigned long elapsed = millis() - playbackState.stepStartTime;
  int remaining = playbackState.stepDuration - (elapsed / 1000);
  
  if (remaining <= 0) {
    // Move to next step
    advanceToNextStep();
  }
}
```

### Storage Recommendations

- Store sequences in SPIFFS/LittleFS as JSON files
- Filename format: `seq_<id>.json`
- Limit: 50 sequences max (configurable)
- Max steps per sequence: 50 (configurable)
- Total message size limit: 250 bytes per step

---

## Audio File Management API Endpoints

### 50. Get Audio Files

**Endpoint:** `GET /api/files/audio`

**Description:** Retrieve list of audio files on SD card.

**Response:**
```json
{
  "files": [
    {
      "filename": "jingle_bells.mp3",
      "size": 2457600,
      "duration": 153,
      "uploadedAt": "2024-12-01T10:30:00Z"
    },
    {
      "filename": "silent_night.mp3",
      "size": 1843200,
      "duration": 115,
      "uploadedAt": "2024-12-01T10:35:00Z"
    }
  ]
}
```

**Notes:**
- size: File size in bytes
- duration: Audio duration in seconds (optional, 0 if unknown)
- uploadedAt: ISO timestamp of upload (optional)
- Supported formats: MP3, WAV, OGG

---

### 51. Upload Audio File

**Endpoint:** `POST /api/files/audio`

**Description:** Upload an audio file to SD card.

**Request:** `multipart/form-data`

**Form Fields:**
- `file`: Audio file (required, .mp3/.wav/.ogg extension)

**Response:**
```json
{
  "success": true,
  "filename": "my_song.mp3",
  "message": "Audio file uploaded successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Invalid file format or SD card full"
}
```

**Notes:**
- Supported formats: MP3, WAV, OGG
- File size limit: 50MB (configurable based on SD card capacity)
- Filename validation: alphanumeric, hyphens, underscores only
- Duplicate filenames rejected or auto-renamed

**Validation:**
- File extension: .mp3, .wav, or .ogg
- File size: 1KB - 50MB
- Filename: Valid characters, no path traversal
- SD card space check before upload

---

### 52. Delete Audio File

**Endpoint:** `DELETE /api/files/audio/{filename}`

**Description:** Delete an audio file from SD card.

**Response:**
```json
{
  "success": true,
  "message": "Audio file deleted successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "File not found or in use by sequence"
}
```

**Notes:**
- Filename must be URL-encoded
- Cannot delete if file is referenced by an active FSEQ sequence
- Permanent deletion from SD card
- Check file usage before deletion

---

### 53. Stream Audio File

**Endpoint:** `GET /api/files/audio/stream/{filename}`

**Description:** Stream an audio file for playback in browser.

**Response:** Audio file stream (binary data)

**Headers:**
```
Content-Type: audio/mpeg | audio/wav | audio/ogg
Content-Length: <file size>
Accept-Ranges: bytes
```

**Error Response:**
```json
{
  "success": false,
  "message": "File not found"
}
```

**Notes:**
- Filename must be URL-encoded
- Supports range requests for seeking (HTTP 206 Partial Content)
- Content-Type header matches file format
- Used by Audio page for browser playback and visualization
- CORS headers required for development mode

---

## Audio File Management Notes

### SD Card Storage

- Audio files stored in `/audio/` directory on SD card
- Files accessible by both frontend and FSEQ playback system
- FAT32 filesystem compatibility required
- Consider subdirectories for organization (future enhancement)

### FSEQ Integration

- FSEQ sequences can reference audio files by filename
- Audio playback synchronized with FSEQ frame rendering
- Audio file dropdown in FSEQ edit modal fetches from this API
- Consider pre-loading audio metadata (duration) for better UX

### ESP32 Implementation

```cpp
// List audio files
server.on("/api/files/audio", HTTP_GET, [](AsyncWebServerRequest *request){
  File root = SD.open("/audio");
  StaticJsonDocument<2048> doc;
  JsonArray files = doc.createNestedArray("files");
  
  File file = root.openNextFile();
  while(file) {
    if (!file.isDirectory()) {
      JsonObject fileObj = files.createNestedObject();
      fileObj["filename"] = file.name();
      fileObj["size"] = file.size();
      // Optional: Parse MP3/WAV header for duration
    }
    file = root.openNextFile();
  }
  
  String response;
  serializeJson(doc, response);
  request->send(200, "application/json", response);
});

// Upload audio file
server.on("/api/files/audio", HTTP_POST, 
  [](AsyncWebServerRequest *request) { /* handle response */ },
  [](AsyncWebServerRequest *request, String filename, size_t index, 
     uint8_t *data, size_t len, bool final) {
    // Handle file upload chunks
    static File uploadFile;
    if (index == 0) {
      uploadFile = SD.open("/audio/" + filename, FILE_WRITE);
    }
    uploadFile.write(data, len);
    if (final) {
      uploadFile.close();
    }
  }
);
```

---

## Future Enhancements

1. **WebSocket Support:**
   - Real-time network status updates
   - Live RSSI monitoring
   - Connection state changes
   - Real-time message notifications for JBoard Network
   - Live effect preview/streaming

2. **Advanced Settings:**
   - WiFi power settings
   - MAC address filtering for AP
   - Custom DNS servers

3. **Diagnostics:**
   - Connection logs
   - Signal quality graphs
   - Ping test tool

4. **Captive Portal Enhancements:**
   - Multi-language support
   - QR code for easy connection
   - Network speed test
   - Custom branding/themes

5. **JBoard Network Enhancements:**
   - Message routing/mesh networking
   - Group messaging (device groups)
   - Command templates/presets
   - Device health monitoring
   - Firmware update distribution
   - Message encryption by default

6. **Board Configuration:**
   - Runtime board model switching (development/testing)
   - Feature flag overrides
   - Custom board configurations

7. **Effects Enhancements:**
   - Custom effect creation UI
   - Effect sharing between devices
   - Audio reactive effect configuration
   - Sensor-triggered effects
   - Effect scheduling/automation
   - Effect transitions and blending

8. **Audio File Management Enhancements:**
   - Audio file preview/playback in browser
   - Automatic duration detection from file headers
   - Audio waveform visualization
   - Batch upload support
   - Folder organization
   - Audio format conversion
