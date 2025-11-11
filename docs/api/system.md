# System Management API

System stats, firmware OTA updates, restart, factory reset, and rollback.

## 60. Get System Stats

**Endpoint:** `GET /api/system/stats`

**Response:**
```json
{
  "info": {
    "productName": "JSense Board",
    "hostname": "jsense-board",
    "firmwareVersion": "1.0.0",
    "chipModel": "ESP32-S3",
    "macAddressWiFi": "24:6F:28:XX:XX:XX"
  },
  "health": {
    "uptimeSeconds": 86400,
    "heapTotal": 327680,
    "heapFree": 131072,
    "cpuTemperature": 45.5
  },
  "ledChannels": [...],
  "nowPlaying": {...}
}
```

## 61. Get System Info

**Endpoint:** `GET /api/system/info`

**Response:**
```json
{
  "productName": "JSense Board",
  "hostname": "jsense-board",
  "firmwareVersion": "1.0.0",
  "chipModel": "ESP32-S3",
  "flashSize": 8388608,
  "cpuFrequency": 240
}
```

## 62. Get System Health

**Endpoint:** `GET /api/system/health`

**Response:**
```json
{
  "uptimeSeconds": 86400,
  "heapTotal": 327680,
  "heapFree": 131072,
  "cpuTemperature": 45.5,
  "freeSketchSpace": 6291456
}
```

## 63. Get LED Channels

**Endpoint:** `GET /api/system/channels`

## 64. Get Now Playing

**Endpoint:** `GET /api/system/now-playing`

## 65. Upload Firmware Update

**Endpoint:** `POST /api/system/firmware/update`

**Request:** `multipart/form-data`
- firmware: Firmware binary file (.bin)
- checksum: Optional SHA256 checksum (hex string, 64 characters)

**Response:**
```json
{
  "success": true,
  "message": "Firmware uploaded successfully. Device will restart.",
  "progress": 100,
  "stage": "complete",
  "newVersion": "1.1.0",
  "checksumVerified": true
}
```

**Progress Stages:**
- verifying: Calculating checksum
- uploading: Firmware upload in progress
- installing: Installing firmware
- complete: Installation complete

**Notes:**
- Max file size: 2MB
- OTA update - device restarts automatically
- SHA256 verification prevents corrupted installs

## 66. Restart Device

**Endpoint:** `POST /api/system/restart`

**Notes:**
- Device disconnects after ~1-2 seconds
- Accessible again in 10-15 seconds

## 67. Factory Reset

**Endpoint:** `POST /api/system/factory-reset`

**Notes:**
- Erases all user settings and configurations
- WiFi credentials cleared
- **IRREVERSIBLE**

## 68. Export Configuration

**Endpoint:** `GET /api/system/export-config`

**Response:** Binary JSON file download

**Notes:**
- Does NOT include passwords
- Used for backup and migration

## 69. Clear System Logs

**Endpoint:** `POST /api/system/clear-logs`

## 70. Get OTA Status

**Endpoint:** `GET /api/system/firmware/ota-status`

**Response:**
```json
{
  "currentPartition": "ota_0",
  "currentVersion": "1.0.0",
  "backupPartition": "ota_1",
  "backupVersion": "0.9.5",
  "bootCount": 1,
  "rollbackAvailable": true
}
```

**Notes:**
- ESP32 dual OTA partition system
- Backup firmware preserved during updates

## 71. Rollback Firmware

**Endpoint:** `POST /api/system/firmware/rollback`

**Notes:**
- Switches to backup partition
- Device restarts automatically
- Current firmware becomes backup

## 72. Mark Boot Valid

**Endpoint:** `POST /api/system/firmware/mark-valid`

**Notes:**
- Validates current firmware boot
- Prevents auto-rollback on next boot

## 73. Enable Safe Boot Mode

**Endpoint:** `POST /api/system/firmware/safe-boot`

**Notes:**
- Sets device to boot from backup on next restart
- Does not immediately restart
- User must manually restart

## Firmware Update Features

**Phase 1 (Current):**
- Real-time upload progress tracking
- SHA256 checksum verification
- Multi-stage progress (verifying → uploading → installing)
- Enhanced error handling

**Phase 2:**
- Automatic update checking from GitHub
- Version comparison and selection
- Direct firmware download from repository

**Phase 3:**
- Automatic firmware backup (ESP32 native)
- Rollback to previous version
- Safe boot mode
- Boot validation

## GitHub Update Repository

**URL:** `https://github.com/pixelpropshop/JBoardsFirmware`

**Structure:**
```
JBoardsFirmware/
├── JSense/
│   ├── manifest.json          # Latest stable version
│   ├── versions.json          # All versions
│   └── versions/
│       ├── 1.0.0/
│       │   ├── firmware.bin
│       │   └── info.json
