# Hardware Configuration API

RTC (Real-Time Clock) and OLED display configuration.

## 74. Get RTC Status

**Endpoint:** `GET /api/hardware/rtc/status`

**Response:**
```json
{
  "available": true,
  "currentTime": "2025-01-10T15:30:00Z",
  "isTimeSynced": true,
  "ntpEnabled": true
}
```

## 75. Get RTC Configuration

**Endpoint:** `GET /api/hardware/rtc`

**Response:**
```json
{
  "enabled": true,
  "timezone": "America/Phoenix",
  "timeFormat": "12h",
  "dateFormat": "MM/DD/YYYY",
  "syncPriority": "ntp",
  "lastSync": "2025-01-10T15:00:00Z"
}
```

**Notes:**
- timeFormat: '12h' or '24h'
- dateFormat: 'MM/DD/YYYY', 'DD/MM/YYYY', or 'YYYY-MM-DD'
- syncPriority: 'ntp', 'rtc', or 'manual'

## 76. Update RTC Configuration

**Endpoint:** `POST /api/hardware/rtc`

**Request:**
```json
{
  "enabled": true,
  "timezone": "America/Phoenix",
  "timeFormat": "24h",
  "dateFormat": "YYYY-MM-DD",
  "syncPriority": "ntp"
}
```

## 77. Sync RTC Time

**Endpoint:** `POST /api/hardware/rtc/sync`

**Notes:**
- Syncs based on syncPriority setting (NTP or RTC)
- May take several seconds for NTP sync

## 78. Set Manual Time

**Endpoint:** `POST /api/hardware/rtc/set-time`

**Request:**
```json
{
  "time": "2025-01-10T15:30:00Z"
}
```

**Notes:**
- Only works when syncPriority is 'manual'
- ISO 8601 timestamp format

## 79. Get OLED Status

**Endpoint:** `GET /api/hardware/oled/status`

**Response:**
```json
{
  "available": true,
  "width": 128,
  "height": 64,
  "currentScreen": "clock",
  "isActive": true
}
```

## 80. Get OLED Configuration

**Endpoint:** `GET /api/hardware/oled`

**Response:**
```json
{
  "enabled": true,
  "brightness": 80,
  "timeout": "5m",
  "autoSleep": true,
  "rotation": 0,
  "defaultScreen": "rotating",
  "screenSaver": false
}
```

**Notes:**
- brightness: 0-255
- timeout: 'always-on', '30s', '1m', '5m', or '10m'
- rotation: 0, 90, 180, or 270 degrees
- defaultScreen: 'clock', 'ip-address', 'status', 'sequence', or 'rotating'

## 81. Update OLED Configuration

**Endpoint:** `POST /api/hardware/oled`

**Request:**
```json
{
  "enabled": true,
  "brightness": 120,
  "timeout": "1m",
  "autoSleep": true,
  "rotation": 180,
  "defaultScreen": "clock",
  "screenSaver": true
}
```

## 82. Test OLED Display

**Endpoint:** `POST /api/hardware/oled/test`

**Notes:**
- Displays test pattern for 5 seconds
- Used to verify display is working
