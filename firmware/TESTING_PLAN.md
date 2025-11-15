# JSense Board Testing & Validation Plan

**Created:** November 12, 2025  
**Status:** Ready to Begin  
**Firmware Version:** All phases A-I complete (105 endpoints)

---

## Overview

All 9 implementation phases are complete. This document tracks hardware testing, API validation, and production readiness.

**Current Build Status:**
- ✅ Compilation: SUCCESS (29.1 seconds)
- ✅ RAM Usage: 13.9% (45,492 / 327,680 bytes)
- ✅ Flash Usage: 25.7% (857,489 / 3,342,336 bytes)
- ✅ Errors: 0

---

## Testing Phases

### **Phase 1: Basic Hardware Validation** ⏳ PENDING
**Goal:** Verify firmware runs on physical hardware  
**Duration:** 1-2 hours  
**Prerequisites:** ESP32-S3 board, USB cable

#### Checklist:
- [ ] Connect ESP32-S3 board via USB
- [ ] Build firmware: `pio run`
- [ ] Flash firmware: `pio run --target upload`
- [ ] Open serial monitor: `pio device monitor`
- [ ] Verify boot messages appear
- [ ] Check for initialization errors
- [ ] Verify all managers initialize (Network, Pixels, Effects, etc.)
- [ ] Note the device MAC address
- [ ] Verify AP mode starts (default: JSense-Board-XXXXXX)

**Success Criteria:**
- Serial output shows "Server started on port 80"
- No crash or reboot loops
- AP network visible from phone/computer

---

### **Phase 2: Network Connectivity** ⏳ PENDING
**Goal:** Establish WiFi connectivity  
**Duration:** 30 minutes  
**Prerequisites:** Phase 1 complete, WiFi credentials

#### Checklist:
- [ ] Connect to device AP (JSense-Board-XXXXXX)
- [ ] Access web UI at http://192.168.4.1
- [ ] Test API: `curl http://192.168.4.1/api/board`
- [ ] Configure WiFi credentials via API
- [ ] Verify device connects to home WiFi
- [ ] Test mDNS: `curl http://jboard-XXXXXX.local/api/board`
- [ ] Verify WiFi profiles save/load
- [ ] Test auto-reconnect (disconnect router, wait, reconnect)
- [ ] Test fallback to AP mode (after failed reconnects)
- [ ] Verify network status endpoint accuracy

**Success Criteria:**
- Device accessible via home WiFi
- mDNS resolution working (.local address)
- Auto-reconnect functional
- AP fallback working

**API Tests:**
```bash
# Get board info
curl http://192.168.4.1/api/board

# Get network status
curl http://192.168.4.1/api/network/status

# Connect to WiFi
curl -X POST http://192.168.4.1/api/network/connect \
  -H "Content-Type: application/json" \
  -d '{"ssid":"YourSSID","password":"YourPassword"}'

# Test mDNS (replace XXXXXX with MAC last 6 digits)
curl http://jboard-XXXXXX.local/api/board
```

---

### **Phase 3: LED Control (Single Output)** ⏳ PENDING
**Goal:** Verify LED control on one output  
**Duration:** 1 hour  
**Prerequisites:** Phase 2 complete, WS2812B LED strip (1 output)

#### Hardware Setup:
- Connect WS2812B LED strip to GPIO 1 (Output 1)
- Connect LED strip power (5V, GND)
- Ensure common ground between ESP32 and LED power supply

#### Checklist:
- [ ] Configure output 1 via API (pixel count, type, order)
- [ ] Test solid color (red, green, blue, white)
- [ ] Verify correct color order (RGB vs GRB)
- [ ] Test brightness control (0-255)
- [ ] Test power on/off
- [ ] Verify all pixels light up
- [ ] Check for flickering or glitches
- [ ] Test pixel count limits
- [ ] Save configuration, reboot, verify persistence

**Success Criteria:**
- LEDs respond to API commands
- Colors display correctly
- Brightness adjustable
- Configuration persists after reboot

**API Tests:**
```bash
# Configure output 1
curl -X POST http://jboard.local/api/pixels/outputs/1 \
  -H "Content-Type: application/json" \
  -d '{"enabled":true,"pixelCount":50,"pixelType":"WS2812B","colorOrder":"GRB"}'

# Test solid red
curl -X POST http://jboard.local/api/pixels/test \
  -H "Content-Type: application/json" \
  -d '{"type":"solid","color":"#FF0000","output":1}'

# Set brightness
curl -X POST http://jboard.local/api/pixels/brightness \
  -H "Content-Type: application/json" \
  -d '{"brightness":128}'

# Power off
curl -X POST http://jboard.local/api/pixels/power \
  -H "Content-Type: application/json" \
  -d '{"power":false}'
```

---

### **Phase 4: LED Effects Testing** ⏳ PENDING
**Goal:** Validate all 16 LED effects  
**Duration:** 2-3 hours  
**Prerequisites:** Phase 3 complete

#### Effects to Test (in order):
- [ ] **Solid** - Static color, test multiple colors
- [ ] **Rainbow** - Smooth color wheel rotation
- [ ] **Chase** - Moving pixels, test speed and size
- [ ] **Breathe** - Pulsing brightness, test speed
- [ ] **Sparkle** - Random pixel flashes, test density
- [ ] **Color Flow** - Color transitions, test speed
- [ ] **Strobe** - Fast flashing, test frequency
- [ ] **Wave** - Sine wave motion, test wavelength
- [ ] **Bars** - Alternating color bars, test width
- [ ] **Confetti** - Random colored pixels, test fade
- [ ] **Fire** - Fire simulation, test cooling/sparking
- [ ] **Meteor** - Moving trail, test tail length
- [ ] **Noise** - Perlin noise patterns, test scale
- [ ] **Matrix** - Matrix rain effect, test speed
- [ ] **Police** - Red/blue alternating, test speed
- [ ] **Aurora** - Aurora borealis, test complexity

#### For Each Effect:
- [ ] Activate effect via API
- [ ] Verify visual appearance matches expectation
- [ ] Test parameter adjustments (speed, color, etc.)
- [ ] Check for smooth animation (no flickering)
- [ ] Verify CPU/memory usage is stable
- [ ] Test effect transition (switch to another effect)

**Success Criteria:**
- All 16 effects display correctly
- Parameters adjustable in real-time
- Smooth animations (60+ FPS)
- No memory leaks or crashes

**API Tests:**
```bash
# Activate rainbow effect
curl -X POST http://jboard.local/api/effects/active \
  -H "Content-Type: application/json" \
  -d '{"name":"rainbow","parameters":{"speed":50}}'

# Activate fire effect
curl -X POST http://jboard.local/api/effects/active \
  -H "Content-Type: application/json" \
  -d '{"name":"fire","parameters":{"cooling":50,"sparking":120}}'

# Get current effect status
curl http://jboard.local/api/effects/active
```

---

### **Phase 5: Multi-Output Testing** ⏳ PENDING
**Goal:** Verify all 16 outputs work independently  
**Duration:** 2-3 hours  
**Prerequisites:** Phase 4 complete, multiple LED strips

#### Checklist:
- [ ] Connect LED strips to outputs 1-16
- [ ] Configure each output with different pixel counts
- [ ] Test all outputs simultaneously (solid colors)
- [ ] Verify each output is independently controllable
- [ ] Test mixed effects (output 1: rainbow, output 2: fire)
- [ ] Check for cross-talk or interference
- [ ] Monitor power consumption calculations
- [ ] Test with maximum pixel count (16 outputs × 300 pixels)
- [ ] Verify frame rate remains stable with all outputs active

**Success Criteria:**
- All 16 outputs functional
- Independent control per output
- No cross-talk between outputs
- Stable performance with high pixel count

---

### **Phase 6: Effects Presets & Persistence** ⏳ PENDING
**Goal:** Validate preset save/load functionality  
**Duration:** 1 hour  
**Prerequisites:** Phase 4 complete

#### Checklist:
- [ ] Create preset "Preset1" (rainbow, speed 50)
- [ ] Create preset "Preset2" (fire, cooling 40)
- [ ] Create preset "Preset3" (aurora, complexity 3)
- [ ] List all presets via API
- [ ] Load each preset and verify effect activates
- [ ] Reboot device, verify presets persist
- [ ] Update preset parameters
- [ ] Delete preset
- [ ] Test maximum preset count

**Success Criteria:**
- Presets save successfully
- Presets load with correct parameters
- Presets survive reboot
- CRUD operations work correctly

**API Tests:**
```bash
# Create preset
curl -X POST http://jboard.local/api/effects/presets \
  -H "Content-Type: application/json" \
  -d '{"name":"MyRainbow","effect":"rainbow","parameters":{"speed":75}}'

# List presets
curl http://jboard.local/api/effects/presets

# Load preset
curl -X POST http://jboard.local/api/effects/presets/MyRainbow/activate

# Delete preset
curl -X DELETE http://jboard.local/api/effects/presets/MyRainbow
```

---

### **Phase 7: Sequence Playback** ⏳ PENDING
**Goal:** Test step-based sequence playback  
**Duration:** 2 hours  
**Prerequisites:** Phase 4 complete

#### Checklist:
- [ ] Create sequence "Test1" with 5 steps
- [ ] Step 1: Solid red, 2 seconds
- [ ] Step 2: Rainbow, 5 seconds
- [ ] Step 3: Chase, 3 seconds
- [ ] Step 4: Fire, 4 seconds
- [ ] Step 5: Solid blue, 2 seconds
- [ ] Start playback, verify timing accuracy
- [ ] Test pause/resume
- [ ] Test stop
- [ ] Test next/previous step
- [ ] Test loop mode
- [ ] Test transition effects (fade, crossfade)
- [ ] Reboot device, verify sequence persists
- [ ] Create multiple sequences, verify all load correctly

**Success Criteria:**
- Sequences play with accurate timing
- Playback controls work correctly
- Transitions smooth between steps
- Sequences persist after reboot

**API Tests:**
```bash
# Create sequence
curl -X POST http://jboard.local/api/sequences \
  -H "Content-Type: application/json" \
  -d '{
    "name":"Test1",
    "steps":[
      {"effect":"solid","parameters":{"color":"#FF0000"},"duration":2000},
      {"effect":"rainbow","parameters":{"speed":50},"duration":5000}
    ],
    "loop":true
  }'

# Start playback
curl -X POST http://jboard.local/api/sequences/Test1/play

# Pause
curl -X POST http://jboard.local/api/sequences/active/pause

# Resume
curl -X POST http://jboard.local/api/sequences/active/resume
```

---

### **Phase 8: SD Card & File Management** ⏳ PENDING
**Goal:** Validate SD card operations  
**Duration:** 1-2 hours  
**Prerequisites:** SD card module connected

#### Hardware Setup:
- Connect SD card module via SPI
- Insert formatted SD card (FAT32)

#### Checklist:
- [ ] Verify SD card detection
- [ ] Check storage info (total/free space)
- [ ] Create directory structure (/audio, /sequences, /config)
- [ ] Upload small text file (<1KB)
- [ ] Download file, verify content matches
- [ ] Upload large file (>1MB) via chunked upload
- [ ] List files recursively
- [ ] Delete file
- [ ] Test storage breakdown by file type
- [ ] Upload FSEQ file for future testing
- [ ] Test file preview (text files)

**Success Criteria:**
- SD card detected and initialized
- File operations work correctly
- Chunked upload handles large files
- Storage info accurate

---

### **Phase 9: System Management** ⏳ PENDING
**Goal:** Test system endpoints and OTA  
**Duration:** 1-2 hours  
**Prerequisites:** Phase 2 complete

#### Checklist:
- [ ] Get system info (heap, CPU, uptime, chip model)
- [ ] Monitor memory over time (check for leaks)
- [ ] Test firmware info endpoint
- [ ] Test health check endpoint
- [ ] Export configuration to JSON
- [ ] Modify config file, import back
- [ ] Test factory reset (clears all settings)
- [ ] Test system restart
- [ ] Prepare OTA update binary
- [ ] Upload OTA update via API
- [ ] Verify firmware updates successfully
- [ ] Test rollback functionality (if update fails)

**Success Criteria:**
- System info accurate
- No memory leaks detected
- Config export/import works
- Factory reset clears all data
- OTA updates functional

**API Tests:**
```bash
# Get system info
curl http://jboard.local/api/system/info

# Health check
curl http://jboard.local/api/system/health

# Export config
curl http://jboard.local/api/system/config/export > config_backup.json

# Factory reset (WARNING: clears all data)
curl -X POST http://jboard.local/api/system/reset/factory
```

---

### **Phase 10: Sensors & Automation** ⏳ PENDING
**Goal:** Test sensor framework and alerts  
**Duration:** 2-3 hours  
**Prerequisites:** Phase 2 complete, sensors available (optional)

#### Checklist:
- [ ] Add analog sensor (light sensor on ADC pin)
- [ ] Configure sensor (type, pin, sampling rate)
- [ ] Read sensor value in real-time
- [ ] Set threshold alerts (warning/critical)
- [ ] Trigger alert by exceeding threshold
- [ ] Acknowledge alert
- [ ] Test calibration (offset adjustment)
- [ ] View sensor history
- [ ] Export sensor data (CSV format)
- [ ] Export sensor data (JSON format)
- [ ] Test multiple sensors simultaneously
- [ ] Create automation rule (sensor → effect)
- [ ] Verify rule triggers effect automatically

**Success Criteria:**
- Sensors read data correctly
- Alerts trigger at thresholds
- Calibration adjusts readings
- Data export formats valid
- Automation rules work

---

### **Phase 11: RTC & OLED (Optional Hardware)** ⏳ PENDING
**Goal:** Test optional hardware modules  
**Duration:** 1-2 hours  
**Prerequisites:** Phase 2 complete, RTC/OLED modules available

#### RTC Testing (DS3231 or DS1307):
- [ ] Connect RTC module via I2C
- [ ] Verify RTC detection
- [ ] Set RTC time manually
- [ ] Sync RTC from NTP
- [ ] Read RTC time
- [ ] Reboot, verify time persists
- [ ] Use RTC for timestamping

#### OLED Testing (SSD1306 128x64):
- [ ] Connect OLED display via I2C
- [ ] Verify OLED detection
- [ ] Test display mode: Clock
- [ ] Test display mode: IP Address
- [ ] Test display mode: Status (WiFi/heap/uptime)
- [ ] Test display mode: Rotating (5s cycle)
- [ ] Test brightness adjustment
- [ ] Test display timeout/sleep
- [ ] Test wake on activity
- [ ] Display test pattern

**Success Criteria:**
- RTC keeps accurate time
- NTP sync works
- OLED displays all modes correctly
- Auto-sleep functional

---

### **Phase 12: JBoard Mesh Network (ESP-NOW)** ⏳ PENDING
**Goal:** Test multi-device mesh networking  
**Duration:** 2-3 hours  
**Prerequisites:** 2+ ESP32-S3 boards with firmware

#### Setup:
- Flash firmware to Board A and Board B
- Both boards connected to same WiFi or in range for ESP-NOW

#### Checklist:
- [ ] Start scan on Board A
- [ ] Verify Board B appears in scan results
- [ ] Pair Board A with Board B (add peer)
- [ ] Send message from Board A to Board B
- [ ] Verify Board B receives message
- [ ] Send message from Board B to Board A
- [ ] Broadcast message from Board A
- [ ] Verify all peers receive broadcast
- [ ] View received message queue
- [ ] Test peer persistence (reboot, verify peers reload)
- [ ] Remove peer
- [ ] Test offline detection (power off Board B, wait 30s)
- [ ] Test synchronized effects (trigger same effect on both)

**Success Criteria:**
- Device discovery works
- Pairing successful
- Messages send/receive correctly
- Broadcast reaches all peers
- Persistence works after reboot

---

### **Phase 13: Frontend Integration** ⏳ PENDING
**Goal:** Test React frontend with live backend  
**Duration:** 2-4 hours  
**Prerequisites:** All backend phases complete, React app setup

#### Checklist:
- [ ] Configure frontend API endpoint (backend IP)
- [ ] Start React dev server: `npm run dev`
- [ ] Test Dashboard page (board info, stats)
- [ ] Test Pixels page (output configuration)
- [ ] Test Effects page (effect selection, parameters)
- [ ] Test Sequences page (create, edit, play)
- [ ] Test Files page (upload, download, delete)
- [ ] Test Sensors page (sensor config, alerts)
- [ ] Test Network page (WiFi, profiles)
- [ ] Test Settings page (system, firmware)
- [ ] Test JBoard Network page (peers, messaging)
- [ ] Test About page (firmware version)
- [ ] Verify real-time updates (WebSocket/polling)
- [ ] Test mobile responsive design
- [ ] Test captive portal flow

**Success Criteria:**
- All pages load without errors
- API calls succeed
- Real-time updates work
- Mobile UI functional

---

### **Phase 14: Stress Testing** ⏳ PENDING
**Goal:** Verify stability under load  
**Duration:** 4-8 hours (mostly automated)  
**Prerequisites:** All previous phases complete

#### Checklist:
- [ ] Run all 16 outputs at full brightness for 1 hour
- [ ] Monitor temperature (ESP32 and power supply)
- [ ] Monitor memory usage over time
- [ ] Rapid effect switching (100 times)
- [ ] Continuous sequence playback (8 hours)
- [ ] API stress test (100 requests/second for 5 minutes)
- [ ] Multiple simultaneous WebSocket connections
- [ ] Large file upload (100MB+)
- [ ] Long-term WiFi stability test (24 hours)
- [ ] Power cycle test (10 reboots in a row)

**Success Criteria:**
- No crashes or freezes
- Memory usage stable (no leaks)
- WiFi connection stable
- All features remain functional

---

### **Phase 15: Production Readiness** ⏳ PENDING
**Goal:** Final validation for production deployment  
**Duration:** 1-2 days  
**Prerequisites:** All tests passed

#### Checklist:
- [ ] Review all test results
- [ ] Document known issues
- [ ] Create user manual
- [ ] Create hardware setup guide
- [ ] Create troubleshooting guide
- [ ] Build release firmware for all variants
- [ ] Test OTA update from v1.0 to v1.1
- [ ] Create firmware distribution package
- [ ] Prepare GitHub release
- [ ] Beta test with 3-5 users
- [ ] Address beta feedback
- [ ] Final QA review

**Success Criteria:**
- All critical tests passed
- Documentation complete
- Beta feedback positive
- No critical bugs

---

## Testing Environment

### Hardware Required:
- ESP32-S3 DevKitC-1 (JBOARD-16 configuration)
- WS2812B LED strips (1-16 outputs)
- 5V power supply (adequate for LED count)
- SD card module + SD card
- DS3231 RTC module (optional)
- SSD1306 OLED display (optional)
- Sensors (light, temperature, etc.) (optional)
- USB cable for programming

### Software Required:
- PlatformIO (installed)
- Python 3.x (for PlatformIO)
- curl or Postman (API testing)
- React development environment (Node.js, npm)

### Network Required:
- WiFi network (2.4GHz)
- Computer with WiFi for captive portal testing
- Optional: Multiple ESP32 boards for mesh testing

---

## Issue Tracking

### Issues Found:
*(Add issues as they are discovered during testing)*

| ID | Phase | Severity | Description | Status | Resolution |
|----|-------|----------|-------------|--------|------------|
| - | - | - | - | - | - |

### Severity Levels:
- **Critical:** Prevents core functionality, blocks testing
- **High:** Major feature broken, workaround exists
- **Medium:** Minor feature issue, low impact
- **Low:** Cosmetic or rare edge case

---

## Progress Summary

**Completed Phases:** 0 / 15  
**Current Phase:** Phase 1 - Basic Hardware Validation  
**Next Milestone:** Get firmware running on physical hardware

**Overall Progress:** 0%

---

## Quick Reference Commands

### Build & Flash:
```bash
# Build firmware
pio run

# Upload to board
pio run --target upload

# Monitor serial output
pio device monitor

# Build + upload + monitor (all in one)
pio run --target upload && pio device monitor
```

### API Testing:
```bash
# Replace with your board's IP or hostname
export BOARD_IP="192.168.4.1"
# Or use mDNS
export BOARD_IP="jboard-XXXXXX.local"

# Quick health check
curl http://$BOARD_IP/api/board
curl http://$BOARD_IP/api/system/health
curl http://$BOARD_IP/api/network/status
```

### Troubleshooting:
```bash
# Erase flash (fresh start)
pio run --target erase

# Verbose build (debug compilation issues)
pio run -v

# Clean build (force rebuild)
pio run --target clean
pio run
```

---

**Last Updated:** November 12, 2025  
**Document Version:** 1.0  
**Status:** Ready to begin Phase 1
