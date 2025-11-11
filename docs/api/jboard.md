# JBoard Network API

P2P device communication using ESP-NOW protocol. No master device required.

## 19. Get This Device Information

**Endpoint:** `GET /api/jboard/device`

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

## 20. Get Connected Peers

**Endpoint:** `GET /api/jboard/peers`

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
  }
]
```

## 21. Start Device Scan

**Endpoint:** `POST /api/jboard/scan`

**Response:**
```json
{
  "success": true,
  "message": "Scan started",
  "devices": [...]
}
```

## 22. Pair with Device

**Endpoint:** `POST /api/jboard/pair`

**Request:**
```json
{
  "macAddress": "AA:BB:CC:DD:EE:05",
  "name": "Sensor Module #5"
}
```

## 23. Unpair Device

**Endpoint:** `DELETE /api/jboard/peers/{macAddress}`

## 24. Send Message to Device

**Endpoint:** `POST /api/jboard/message`

**Request:**
```json
{
  "to": "AA:BB:CC:DD:EE:02",
  "command": "set_brightness",
  "data": {
    "value": 75
  }
}
```

**Notes:**
- Max 250 bytes total per message
- ESP-NOW has no delivery confirmation

## 25. Broadcast Message

**Endpoint:** `POST /api/jboard/broadcast`

**Request:**
```json
{
  "command": "sync_time",
  "data": {
    "timestamp": 1704902400
  }
}
```

## 26. Get Received Messages

**Endpoint:** `GET /api/jboard/messages`

**Query Parameters:**
- limit: Max messages (default: 50, max: 100)
- since: ISO timestamp (optional)

**Response:**
```json
[
  {
    "id": "msg-001",
    "from": "AA:BB:CC:DD:EE:02",
    "fromName": "LED Controller #2",
    "command": "status_update",
    "data": {...},
    "rssi": -48,
    "receivedAt": "2025-01-10T11:35:20Z"
  }
]
```

## Device Types

| Value | Name | Description |
|-------|------|-------------|
| 0x01 | Sensor | Sensor monitoring board |
| 0x02 | Controller | LED/device controller |
| 0x03 | Display | Display/output board |
| 0x04 | Relay | Relay/switching board |
| 0x05 | Gateway | Gateway/bridge board |

## Capabilities Bitmask

| Bit | Value | Name | Description |
|-----|-------|------|-------------|
| 0 | 0x01 | WiFi | WiFi connectivity |
| 1 | 0x02 | BLE | Bluetooth Low Energy |
| 2 | 0x04 | Sensors | Has sensor inputs |
| 3 | 0x08 | Display | Has display output |
| 4 | 0x10 | Audio | Has audio capabilities |
