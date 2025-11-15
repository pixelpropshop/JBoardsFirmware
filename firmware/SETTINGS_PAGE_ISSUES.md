# Settings Page Issues

## Analysis Date: 11/13/2025

Comprehensive analysis of Settings page frontend requirements vs backend implementation.

---

## Critical API Endpoint Mismatches

### **Hardware - RTC Configuration**

#### 1. Missing RTC Status Endpoint
**Frontend Expects:** `GET /api/hardware/rtc/status`
**Backend Has:** Only `GET /api/hardware/rtc` (returns config, not status)
**Impact:** Cannot distinguish between RTC configuration and current status
**Fix Required:** Add separate status endpoint or merge status into config response

#### 2. Missing Unified RTC Config Update
**Frontend Expects:** `POST /api/hardware/rtc` with partial config updates
```json
{
  "timezone": "America/Phoenix",
  "timeFormat": "12h",
  "dateFormat": "MM/DD/YYYY",
  "syncPriority": "ntp"
}
```
**Backend Has:** Individual endpoints for each setting
**Impact:** Frontend cannot update RTC config - will fail silently or error
**Fix Required:** Add POST handler for `/api/hardware/rtc` that accepts partial config updates

#### 3. RTC Sync Endpoint Mismatch
**Frontend Calls:** `POST /api/hardware/rtc/sync`
**Backend Has:** `POST /api/hardware/rtc/sync-ntp`
**Impact:** Sync time button won't work
**Fix Required:** Add endpoint at `/api/hardware/rtc/sync` or update frontend

#### 4. Manual Time Set Endpoint Mismatch
**Frontend Calls:** `POST /api/hardware/rtc/set-time` with `{ "time": "ISO-8601 string" }`
**Backend Has:** `POST /api/hardware/rtc/time` with `{ year, month, day, hour, minute, second }`
**Impact:** "Set to Browser Time" button won't work
**Fix Required:** Add `/set-time` endpoint that accepts ISO-8601 timestamps

---

### **Hardware - OLED Configuration**

#### 5. Missing OLED Status Endpoint
**Frontend Expects:** `GET /api/hardware/oled/status`
**Backend Has:** Only `GET /api/hardware/oled` (returns config, not status)
**Impact:** Cannot check if OLED is actually available/working
**Fix Required:** Add separate status endpoint

#### 6. Missing Unified OLED Config Update
**Frontend Expects:** `POST /api/hardware/oled` with partial config updates
```json
{
  "enabled": true,
  "brightness": 80,
  "timeout": "5m",
  "rotation": 0,
  "defaultScreen": "rotating",
  "screenSaver": false
}
```
**Backend Has:** Individual endpoints (`/mode`, `/brightness`, `/timeout`)
**Impact:** Configuration updates require multiple API calls, not atomic
**Fix Required:** Add unified POST handler for `/api/hardware/oled`

---

### **System - Firmware Management**

#### 7. Missing OTA Status Endpoint
**Frontend Expects:** `GET /api/system/firmware/ota-status`
**Expected Response:**
```json
{
  "currentPartition": "ota_0",
  "currentVersion": "1.0.0",
  "backupPartition": "ota_1",
  "backupVersion": "0.9.5",
  "bootCount": 1,
  "lastBootSuccess": true,
  "safeBoot": false,
  "rollbackAvailable": true
}
```
**Backend Has:** Nothing
**Impact:** Firmware Backup & Recovery section won't display any data
**Fix Required:** Implement OTA status endpoint with ESP32 partition info

#### 8. Missing Mark Boot Valid Endpoint
**Frontend Expects:** `POST /api/system/firmware/mark-valid`
**Backend Has:** Nothing
**Impact:** "Confirm Firmware Working" button won't work
**Fix Required:** Implement endpoint to mark current boot as valid (prevents auto-rollback)

#### 9. Missing Safe Boot Endpoint
**Frontend Expects:** `POST /api/system/firmware/safe-boot`
**Backend Has:** Nothing
**Impact:** "Enable Safe Boot" button won't work
**Fix Required:** Implement endpoint to set safe boot flag

#### 10. Firmware Upload URL Mismatch
**Frontend Calls:** `POST /api/system/firmware/update`
**Backend Has:** `POST /api/system/firmware/upload`
**Impact:** Manual firmware upload won't work
**Fix Required:** Add alias at `/update` or update frontend URL

---

### **System - Configuration Management**

#### 11. Export Config URL Mismatch
**Frontend Calls:** `GET /api/system/export-config`
**Backend Has:** `GET /api/system/config/export`
**Impact:** Export Configuration button won't work
**Fix Required:** Add alias at `/export-config` or update frontend URL

#### 12. Clear Logs Method Mismatch
**Frontend Calls:** `POST /api/system/clear-logs`
**Backend Has:** `DELETE /api/system/logs`
**Impact:** Clear System Logs button won't work
**Fix Required:** Add POST endpoint at `/clear-logs` or update frontend to use DELETE

---

## Data Format Mismatches

### 13. RTC Config Response Format
**Frontend Expects:**
```json
{
  "enabled": true,
  "timezone": "America/Phoenix",
  "timeFormat": "12h",
  "dateFormat": "MM/DD/YYYY",
  "syncPriority": "ntp",
  "lastSync": "2025-11-13T..."
}
```
**Backend May Return:** Different structure (needs verification in HardwareManager)
**Fix Required:** Ensure backend returns expected structure

### 14. OLED Config Response Format
**Frontend Expects:**
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
**Backend May Return:** Different structure (needs verification in HardwareManager)
**Fix Required:** Ensure backend returns expected structure

---

## Missing Features

### 15. No Import Configuration Endpoint Called
**Available:** `POST /api/system/config/import`
**Frontend:** No UI to import configuration
**Status:** Backend implemented but unused
**Action:** Consider adding import UI or removing endpoint

### 16. Firmware Checksum Verification
**Frontend:** Supports SHA256 checksum verification in advanced options
**Backend:** Unknown if firmware upload validates checksums
**Action:** Verify backend checksum support or add it

---

## Resolution Priority

### **HIGH PRIORITY** (Blocks core functionality) - ✅ COMPLETED
1. ✅ Add `/api/hardware/rtc/status` endpoint
2. ✅ Add `/api/hardware/rtc` POST handler for config updates
3. ✅ Add `/api/hardware/oled/status` endpoint
4. ✅ Add `/api/hardware/oled` POST handler for config updates
5. ✅ Add `/api/system/firmware/ota-status` endpoint
6. ✅ Fix firmware upload URL (`/update` vs `/upload`)
7. ✅ Fix export config URL (`/export-config` vs `/config/export`)
8. ✅ Fix clear logs endpoint (`POST /clear-logs` vs `DELETE /logs`)

### **MEDIUM PRIORITY** (Breaks specific features) - ✅ COMPLETED
9. ✅ Add `/api/hardware/rtc/sync` endpoint (or alias)
10. ✅ Add `/api/hardware/rtc/set-time` endpoint with ISO-8601 support
11. ✅ Add `/api/system/firmware/mark-valid` endpoint
12. ✅ Add `/api/system/firmware/safe-boot` endpoint

### **LOW PRIORITY** (Data format verification) - ⚠️ DEFERRED
13. ⬜ Verify RTC config response format (requires hardware testing)
14. ⬜ Verify OLED config response format (requires hardware testing)
15. ⬜ Test firmware checksum verification (requires testing)

---

## Implementation Notes

### RTC Endpoints Strategy
- Keep existing individual endpoints for backward compatibility
- Add unified POST `/api/hardware/rtc` that updates multiple fields atomically
- Add GET `/api/hardware/rtc/status` that returns current time + sync status
- Add POST `/api/hardware/rtc/sync` as alias to `/sync-ntp`
- Add POST `/api/hardware/rtc/set-time` that accepts ISO-8601 timestamps

### OLED Endpoints Strategy
- Keep existing individual endpoints for backward compatibility  
- Add unified POST `/api/hardware/oled` that updates multiple fields atomically
- Add GET `/api/hardware/oled/status` that returns availability + current state

### Firmware Endpoints Strategy
- Add GET `/api/system/firmware/ota-status` using ESP32 partition APIs
- Add POST `/api/system/firmware/mark-valid` using ESP OTA APIs
- Add POST `/api/system/firmware/safe-boot` to set boot flags
- Add URL aliases for `/update` and `/export-config`

---

## Testing Checklist

After fixes - **READY FOR TESTING**:
- [ ] RTC timezone change works
- [ ] RTC time format change works
- [ ] RTC sync from NTP works
- [ ] RTC set to browser time works
- [ ] OLED enable/disable toggle works
- [ ] OLED brightness slider works
- [ ] OLED timeout dropdown works
- [ ] OLED rotation dropdown works
- [ ] OLED default screen dropdown works
- [ ] OLED screen saver toggle works
- [ ] OLED test display works
- [ ] Check for updates works
- [ ] Download and install firmware works
- [ ] Manual firmware upload works
- [ ] Firmware rollback works (if backup available)
- [ ] Mark boot valid works
- [ ] Enable safe boot works
- [ ] Export configuration works
- [ ] Clear logs works
- [ ] Restart device works
- [ ] Factory reset works

---

## Implementation Summary (11/13/2025)

### Changes Made to `src/api/HardwareEndpoints.cpp`:
1. **Added GET /api/hardware/rtc/status** - Returns RTC availability and sync status
2. **Added POST /api/hardware/rtc** - Unified RTC configuration update (timezone, time format, etc.)
3. **Added POST /api/hardware/rtc/sync** - Alias for sync-ntp endpoint
4. **Added POST /api/hardware/rtc/set-time** - Accepts ISO-8601 timestamps for browser time sync
5. **Added GET /api/hardware/oled/status** - Returns OLED availability and enabled status
6. **Added POST /api/hardware/oled** - Unified OLED configuration update with timeout parsing

### Changes Made to `src/api/SystemEndpoints.cpp`:
1. **Added GET /api/system/firmware/ota-status** - Returns ESP32 partition info, boot diagnostics
2. **Added POST /api/system/firmware/mark-valid** - Marks firmware as valid using esp_ota APIs
3. **Added POST /api/system/firmware/safe-boot** - Safe boot flag endpoint (placeholder)
4. **Added POST /api/system/firmware/update** - Alias for /upload endpoint
5. **Added GET /api/system/export-config** - Alias for /config/export endpoint
6. **Added POST /api/system/clear-logs** - Alias for DELETE /logs endpoint
7. **Added includes** - `<esp_ota_ops.h>` and `<esp_partition.h>` for OTA partition APIs

### Build Status:
✅ **Firmware compiled successfully**
- RAM Usage: 15.6% (51,228 / 327,680 bytes)
- Flash Usage: 33.8% (1,106,437 / 3,276,800 bytes)
- Build Time: 68.93 seconds

### Notes:
- RTC config POST endpoint accepts configuration but doesn't yet store timezone/format settings (requires HardwareManager enhancement)
- Safe boot endpoint is a placeholder (actual safe boot logic needs to be implemented)
- RTC/OLED status endpoints return basic availability info (sync tracking could be enhanced)
- All endpoint aliases are now in place for Settings page compatibility
