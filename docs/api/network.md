# Network API Endpoints

This document covers Network API endpoints for the JSense Board, including WiFi configuration, Access Point management, Network status, WiFi profiles, Auto-reconnect settings, and Captive Portal functionality.

**Endpoints 1-18 of 105 total**

---

## WiFi Station Configuration

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

## Access Point Configuration

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

## Network Status & Scanning

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

## Hostname Configuration

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

## WiFi Profiles

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

## Auto-Reconnect Configuration

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

## Captive Portal

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

## Implementation Notes

### CORS Configuration

For development testing, the ESP32 web server should include CORS headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

In production (when the React app is served from the ESP32), CORS is not needed.

---

### Error Handling

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

### Security Considerations

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

### Captive Portal Behavior

#### Implementation Flow

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

#### DNS Captive Portal Setup

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

### ESP32 Example Implementation

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

## Related Documentation

- [JBoard Network API](./jboard.md) - Peer-to-peer device communication
- [System API](./system.md) - Device information and management
