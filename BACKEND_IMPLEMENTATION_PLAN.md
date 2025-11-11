# JSense Board ESP32 Backend Implementation Plan

## Overview

This document outlines the comprehensive approach for implementing the ESP32 firmware backend for the JSense Board project. The implementation is broken into **10 phases** with **105 total API endpoints** across multiple subsystems.

---

## Technology Stack & Libraries

### Core Framework
- **ESPAsyncWebServer** - Non-blocking async web server (proven, widely used)
- **ArduinoJson** - JSON serialization/deserialization (industry standard)
- **AsyncTCP** - Async TCP library for ESP32

### Network & Communication
- **WiFi.h** - ESP32 WiFi library (built-in)
- **ESPmDNS.h** - mDNS responder for .local addressing
- **DNSServer.h** - DNS server for captive portal
- **esp_now.h** - ESP-NOW for JBoard peer-to-peer networking

### Storage & File Management
- **SPIFFS** or **LittleFS** - File system for configuration storage
- **SD.h** - SD card support for audio/FSEQ files
- **Preferences.h** - NVS (Non-Volatile Storage) for settings

### LED Control
- **FastLED** - Industry-standard LED library (mature, optimized)
- Supports: WS2812B, WS2811, SK6812, APA102, etc.

### Sensors & Hardware
- **Wire.h** - I2C communication (built-in)
- **RTClib** - DS3231/DS1307 RTC support
- **Adafruit_SSD1306** - OLED display support
- **DHT** - Temperature/humidity sensors (if used)

### OTA Updates
- **Update.h** - ESP32 OTA update library (built-in)
- **esp_ota_ops.h** - OTA partition management

### Time Management
- **time.h** - Standard time library
- **NTPClient** - Network Time Protocol client

---

## Implementation Phases

### Phase 1: Foundation & Core Infrastructure (Critical Path)
**Priority:** HIGHEST  
**Estimated Time:** 2-3 days  
**Dependencies:** None

#### Components:
1. **Project Structure Setup**
   - PlatformIO or Arduino IDE project configuration
   - Library dependencies (platformio.ini or libraries)
   - Directory structure (src/, lib/, data/)
   - Build configuration

2. **Basic Web Server**
   - Initialize ESPAsyncWebServer
   - CORS headers for development
   - Basic error handling
   - Health check endpoint (`GET /api/health`)

3. **Configuration System**
   - Preferences/NVS for persistent settings
   - JSON configuration file structure
   - Config load/save utilities
   - Default configuration values

4. **Logging System**
   - Serial logging with levels (DEBUG, INFO, WARN, ERROR)
   - Optional SD card logging
   - Timestamp integration

#### Progress Tracking:
```
Phase 1 Checklist:
[ ] PlatformIO/Arduino project created
[ ] All libraries added to dependencies
[ ] ESPAsyncWebServer initialized
[ ] Basic CORS middleware working
[ ] Health check endpoint responding
[ ] Preferences library configured
[ ] Config load/save functions implemented
[ ] Logging system functional
[ ] Serial output shows structured logs
```

---

### Phase 2: Network Management (Critical Path)
**Priority:** HIGHEST  
**Estimated Time:** 3-4 days  
**Dependencies:** Phase 1  
**Endpoints:** 18 (Network category)

#### Components:
1. **WiFi Station Management** (Endpoints 1-2)
   - WiFi.begin() with credentials
   - Static IP configuration
   - DHCP support
   - Connection retry logic
   - Fallback to AP mode

2. **Access Point Management** (Endpoints 3-4)
   - WiFi.softAP() configuration
   - AP credentials
   - Channel selection
   - Max clients limit

3. **Network Status** (Endpoint 5)
   - WiFi connection state
   - RSSI monitoring
   - IP address info
   - AP client count

4. **WiFi Scanning** (Endpoint 6)
   - WiFi.scanNetworks()
   - Sort by RSSI
   - Security info
   - Async scanning

5. **Hostname & mDNS** (Endpoints 7-8)
   - MDNS.begin(hostname)
   - .local address resolution
   - Hostname validation

6. **WiFi Profiles** (Endpoints 9-13)
   - Multi-network storage
   - Priority-based auto-connect
   - Profile CRUD operations
   - Preferences storage

7. **Auto-Reconnect** (Endpoints 14-15)
   - WiFi event handlers
   - Retry counter
   - Interval timing
   - Fallback logic

8. **Captive Portal** (Endpoints 16-18)
   - DNSServer for all domains
   - Portal detection endpoint
   - Setup completion flag
   - Redirect logic

#### Progress Tracking:
```
Phase 2 Checklist:
[ ] WiFi Station connect/disconnect working
[ ] Static IP assignment functional
[ ] Access Point mode operational
[ ] Network status endpoint accurate
[ ] WiFi scan returns networks
[ ] mDNS responding to .local
[ ] WiFi profiles save/load/delete
[ ] Profile priority auto-connect working
[ ] Auto-reconnect on disconnect
[ ] Captive portal DNS redirects
[ ] Portal completion persists
[ ] All 18 network endpoints tested
```

#### Testing Plan:
- Test WiFi connection with various networks
- Verify AP mode with multiple clients
- Test captive portal auto-open
- Verify profile switching
- Test auto-reconnect with intentional disconnects

---

### Phase 3: System Management & Information
**Priority:** HIGH  
**Estimated Time:** 2-3 days  
**Dependencies:** Phase 1, Phase 2  
**Endpoints:** 14 (System category)

#### Components:
1. **System Information** (Endpoints 60-63)
   - ESP.getChipModel()
   - ESP.getFreeHeap()
   - ESP.getCpuFreqMHz()
   - Uptime tracking
   - Firmware version constants

2. **Firmware Updates** (Endpoint 65)
   - Update.begin()
   - Chunked upload handling
   - Progress tracking
   - Verification before install
   - Rollback support (Phase 3 enhancement)

3. **System Control** (Endpoints 66-67)
   - ESP.restart()
   - Factory reset (erase all settings)
   - Confirmation safety checks

4. **Configuration Export** (Endpoint 68)
   - JSON serialization of all settings
   - File download endpoint
   - Exclusion of sensitive data

5. **Log Management** (Endpoint 69)
   - SD card log file operations
   - Clear logs endpoint
   - Log rotation strategy

#### Progress Tracking:
```
Phase 3 Checklist:
[ ] System info endpoint returns accurate data
[ ] Heap memory tracking working
[ ] Uptime counter accurate
[ ] Firmware upload accepts .bin files
[ ] OTA update completes successfully
[ ] Device restarts after update
[ ] Restart endpoint triggers reboot
[ ] Factory reset clears all settings
[ ] Config export downloads JSON
[ ] Log files can be cleared
[ ] All 14 system endpoints tested
```

---

### Phase 4: Hardware Configuration (RTC & OLED)
**Priority:** MEDIUM  
**Estimated Time:** 2 days  
**Dependencies:** Phase 1  
**Endpoints:** 9 (Hardware category)

#### Components:
1. **RTC Module Support** (Endpoints 74-78)
   - I2C initialization (Wire.begin())
   - RTClib integration
   - DS3231/DS1307 detection
   - Time get/set
   - NTP sync to RTC
   - Timezone handling

2. **OLED Display Support** (Endpoints 79-82)
   - Adafruit_SSD1306 initialization
   - Display modes (clock, IP, status, rotating)
   - Brightness control
   - Timeout/sleep management
   - Test pattern display

#### Progress Tracking:
```
Phase 4 Checklist:
[ ] I2C bus initialized
[ ] RTC module detected (if present)
[ ] RTC time read/write working
[ ] NTP sync updates RTC
[ ] Timezone conversion accurate
[ ] OLED display detected (if present)
[ ] Display shows content correctly
[ ] Brightness control working
[ ] Display timeout functional
[ ] All 9 hardware endpoints tested
```

---

### Phase 5: Board Configuration & Identification
**Priority:** HIGH (affects feature availability)  
**Estimated Time:** 1 day  
**Dependencies:** Phase 1  
**Endpoints:** 1 (Board category)

#### Components:
1. **Board Model Detection** (Endpoint 27)
   - Board variant constants (JBOARD-2, JBOARD-4, JBOARD-8, JBOARD-16)
   - Compile-time configuration
   - Feature flags based on variant
   - Frontend capability negotiation

#### Progress Tracking:
```
Phase 5 Checklist:
[ ] Board variant defined in config
[ ] Board info endpoint returns correct model
[ ] Output count matches variant
[ ] Max pixels per output correct
[ ] Frontend adapts to board capabilities
```

---

### Phase 6: LED Pixel Management
**Priority:** HIGH  
**Estimated Time:** 3-4 days  
**Dependencies:** Phase 1, Phase 5  
**Endpoints:** 7 (Pixels category)

#### Components:
1. **FastLED Initialization**
   - Multiple output support
   - Dynamic LED array allocation
   - Pixel type configuration (WS2812B, WS2811, etc.)
   - Color order mapping

2. **Pixel Configuration** (Endpoints 99-101)
   - Per-output settings (GPIO, count, type)
   - Power management calculations
   - Enable/disable outputs
   - Configuration persistence

3. **Testing Tools** (Endpoints 102-105)
   - Integration with effects system
   - Per-output testing
   - All-outputs testing
   - Emergency off function

#### Progress Tracking:
```
Phase 6 Checklist:
[ ] FastLED compiles and initializes
[ ] Single output displays correctly
[ ] Multiple outputs work independently
[ ] Pixel type auto-detection working
[ ] Color order configuration applies
[ ] Power calculation accurate
[ ] Test endpoint activates LEDs
[ ] All outputs off endpoint works
[ ] All 7 pixel endpoints tested
```

---

### Phase 7: LED Effects Engine
**Priority:** HIGH  
**Estimated Time:** 4-5 days  
**Dependencies:** Phase 6  
**Endpoints:** 8 (Effects category)

#### Components:
1. **Effect Base System**
   - Effect class hierarchy
   - Parameter system
   - Update loop integration
   - State management

2. **Built-in Effects** (16 effects)
   - Solid Color
   - Rainbow (with modes)
   - Chase (with variants)
   - Breathe
   - Sparkle
   - Fire
   - Color Flow
   - Strobe
   - Bars
   - Wave (with modes)
   - Confetti
   - Meteor
   - Noise
   - Matrix
   - Police
   - Aurora

3. **Effect Management** (Endpoints 28-35)
   - Get available effects
   - Apply effect with parameters
   - Effect state persistence
   - Preset save/load/delete
   - Power state control
   - Brightness control

#### Progress Tracking:
```
Phase 7 Checklist:
[ ] Effect base class implemented
[ ] Parameter system working
[ ] At least 5 basic effects functional
[ ] All 16 effects implemented
[ ] Effect apply endpoint working
[ ] Parameter validation enforced
[ ] Brightness control applies
[ ] Power on/off working
[ ] Preset save/load/delete working
[ ] All 8 effect endpoints tested
```

#### Testing Plan:
- Visual verification of each effect
- Parameter range testing
- Smooth transitions between effects
- Preset recall accuracy

---

### Phase 8: Sequence Playback System
**Priority:** MEDIUM  
**Estimated Time:** 5-6 days  
**Dependencies:** Phase 7  
**Endpoints:** 14 (Sequences category) + 3 (Files for audio)

#### Components:
1. **Sequence Engine**
   - Step-based playback
   - Timing system (millis() based)
   - Loop support
   - Transition effects (instant, fade, crossfade)

2. **Sequence Management** (Endpoints 36-47)
   - CRUD operations for sequences
   - JSON storage on SPIFFS/LittleFS
   - Playback state management
   - Play/pause/resume/stop
   - Next/previous step navigation

3. **FSEQ Support** (Endpoints 48-49)
   - xLights FSEQ V2.0 parser
   - Frame data extraction
   - Channel mapping
   - Frame rate timing (40fps typical)
   - Large file handling (SD card required)

4. **Audio Integration** (Endpoints 50-53)
   - SD card audio file listing
   - Audio upload handling
   - File deletion
   - Streaming endpoint for browser playback
   - Audio sync with FSEQ (timing only, not playback)

#### Progress Tracking:
```
Phase 8 Checklist:
[ ] Sequence storage structure defined
[ ] Sequence CRUD endpoints working
[ ] Playback engine timing accurate
[ ] Play/pause/resume functional
[ ] Next/previous step working
[ ] Loop mode operational
[ ] Transition effects implemented
[ ] FSEQ header parser complete
[ ] FSEQ frame data extraction working
[ ] FSEQ playback synchronized
[ ] Audio file list endpoint working
[ ] Audio upload successful
[ ] Audio file streaming functional
[ ] All 17 sequence/audio endpoints tested
```

---

### Phase 9: Sensor System
**Priority:** LOW (optional feature)  
**Estimated Time:** 4-5 days  
**Dependencies:** Phase 1, Phase 7 (for automation)  
**Endpoints:** 16 (Sensors category)

#### Components:
1. **Sensor Framework**
   - Sensor base class
   - Sampling system with timers
   - Smoothing/averaging
   - Calibration support

2. **Sensor Types**
   - Temperature (DHT22, DS18B20)
   - Humidity
   - Light (LDR, BH1750)
   - Sound (analog mic)
   - Motion (PIR)
   - Analog inputs (voltage, current)
   - Digital inputs (GPIO)

3. **Sensor Management** (Endpoints 83-91)
   - Sensor discovery/configuration
   - Real-time readings
   - Historical data storage
   - Statistics calculation
   - Alert system
   - Calibration endpoints

4. **Automation Rules** (Endpoints 92-95)
   - Rule engine (condition → action)
   - Threshold triggers
   - Effect/scene triggering
   - Alert generation

5. **Data Export** (Endpoints 96-98)
   - CSV export
   - JSON export
   - Sensor grouping

#### Progress Tracking:
```
Phase 9 Checklist:
[ ] Sensor base class implemented
[ ] At least one sensor type working
[ ] Sampling system timing accurate
[ ] Smoothing algorithm functional
[ ] Calibration applies correctly
[ ] Real-time readings endpoint working
[ ] Historical data storage operational
[ ] Alert system triggers correctly
[ ] Automation rules engine working
[ ] Effect triggering from sensors functional
[ ] Data export formats valid
[ ] All 16 sensor endpoints tested
```

---

### Phase 10: JBoard Network (ESP-NOW P2P)
**Priority:** MEDIUM  
**Estimated Time:** 3-4 days  
**Dependencies:** Phase 1, Phase 2  
**Endpoints:** 8 (JBoard category)

#### Components:
1. **ESP-NOW Initialization**
   - esp_now_init()
   - Callback registration
   - MAC address management

2. **Device Management** (Endpoints 19-23)
   - This device info
   - Peer list management
   - Device scanning
   - Pairing/unpairing
   - Peer info storage

3. **Messaging** (Endpoints 24-26)
   - Send message to specific device
   - Broadcast to all peers
   - Received message queue
   - Message history storage

#### Progress Tracking:
```
Phase 10 Checklist:
[ ] ESP-NOW initialized successfully
[ ] Device info endpoint accurate
[ ] Peer scanning discovers devices
[ ] Pairing adds peer successfully
[ ] Send message delivers to peer
[ ] Broadcast reaches all peers
[ ] Receive callback stores messages
[ ] Message queue endpoint working
[ ] All 8 JBoard endpoints tested
```

#### Testing Plan:
- Test with 2+ ESP32 devices
- Verify message delivery
- Test range limitations
- Verify broadcast functionality

---

## Implementation Strategy

### 1. Incremental Development
- Implement one phase at a time
- Test thoroughly before moving forward
- Use version control (git) with frequent commits
- Tag stable milestones

### 2. Testing Approach
- Unit testing per component (where possible)
- Integration testing per phase
- Manual endpoint testing with Postman/curl
- Frontend integration testing
- Performance testing (heap usage, timing)

### 3. Code Organization

```
firmware/
├── platformio.ini              # Project configuration
├── src/
│   ├── main.cpp               # Entry point, setup(), loop()
│   ├── config.h               # Board variant, pin definitions
│   ├── network/
│   │   ├── NetworkManager.cpp # WiFi, AP, profiles
│   │   ├── CaptivePortal.cpp  # DNS server, portal logic
│   │   └── JBoardNetwork.cpp  # ESP-NOW implementation
│   ├── api/
│   │   ├── APIServer.cpp      # ESPAsyncWebServer setup
│   │   ├── NetworkEndpoints.cpp
│   │   ├── SystemEndpoints.cpp
│   │   ├── PixelsEndpoints.cpp
│   │   ├── EffectsEndpoints.cpp
│   │   ├── SequencesEndpoints.cpp
│   │   ├── SensorsEndpoints.cpp
│   │   └── HardwareEndpoints.cpp
│   ├── led/
│   │   ├── PixelManager.cpp   # FastLED wrapper
│   │   ├── EffectEngine.cpp   # Effect base classes
│   │   ├── effects/           # Individual effect implementations
│   │   └── SequencePlayer.cpp # Sequence playback
│   ├── storage/
│   │   ├── ConfigManager.cpp  # Preferences/SPIFFS
│   │   ├── FileManager.cpp    # SD card operations
│   │   └── FSEQParser.cpp     # FSEQ file parser
│   ├── sensors/
│   │   ├── SensorManager.cpp  # Sensor framework
│   │   ├── AutomationEngine.cpp
│   │   └── sensors/           # Individual sensor drivers
│   ├── hardware/
│   │   ├── RTCManager.cpp     # RTC module support
│   │   └── DisplayManager.cpp # OLED display
│   └── utils/
│       ├── Logger.cpp         # Logging system
│       ├── TimeManager.cpp    # NTP, timezones
│       └── PowerManager.cpp   # Power calculations
├── data/                      # SPIFFS/LittleFS files
│   ├── config.json           # Default configuration
│   └── www/                  # Optional: host React build
└── test/                     # Unit tests (if using)
```

### 4. Progress Tracking Document

Create `BACKEND_PROGRESS.md`:

```markdown
# Backend Implementation Progress

## Current Phase: [Phase Number]

### Completed Phases:
- [x] Phase 1: Foundation & Core Infrastructure

### Current Phase Checklist:
[Paste current phase checklist here]

### Recent Changes:
- [Date] [Description]

### Known Issues:
- [Issue description]

### Next Steps:
- [Next task]

## Test Results:
[Link to test results or summary]
```

### 5. Development Environment Setup

**Required Tools:**
- PlatformIO IDE (VS Code extension) - RECOMMENDED
  - Or Arduino IDE 2.x
- ESP32 board support
- USB-to-Serial drivers (if needed)
- ESP32 Dev Board (for testing)
- Optional: Logic analyzer for debugging

**Initial Setup Steps:**
1. Install PlatformIO
2. Create new project (ESP32 board)
3. Add all library dependencies to platformio.ini
4. Verify compilation of empty project
5. Test upload to ESP32 hardware

---

## Risk Mitigation

### Memory Management
- **Risk:** ESP32 has limited RAM (~320KB)
- **Mitigation:** 
  - Use PROGMEM for constants
  - Minimize dynamic allocations
  - Stream large files
  - Monitor heap usage continuously

### Timing Accuracy
- **Risk:** LED effects require precise timing
- **Mitigation:**
  - Use hardware timers where possible
  - Avoid blocking operations
  - Test frame rates under load

### File System Corruption
- **Risk:** Power loss during writes
- **Mitigation:**
  - Atomic file writes (temp + rename)
  - Config file versioning
  - Backup critical settings to NVS

### Network Reliability
- **Risk:** WiFi disconnections
- **Mitigation:**
  - Robust auto-reconnect
  - Fallback to AP mode
  - Queue critical data during disconnect

---

## Library Dependencies (platformio.ini)

```ini
[env:esp32]
platform = espressif32
board = esp32dev
framework = arduino

lib_deps =
    # Core Web Server
    ESP Async WebServer @ ^1.2.3
    AsyncTCP @ ^1.1.1
    ArduinoJson @ ^6.21.3
    
    # LED Control
    fastled/FastLED @ ^3.6.0
    
    # Storage
    adafruit/SD @ ^1.2.4
    
    # Sensors (optional)
    adafruit/DHT sensor library @ ^1.4.4
    adafruit/RTClib @ ^2.1.1
    adafruit/Adafruit SSD1306 @ ^2.5.7
    adafruit/Adafruit GFX Library @ ^1.11.5
    
    # Time
    arduino-libraries/NTPClient @ ^3.2.1

build_flags =
    -DCORE_DEBUG_LEVEL=3
    -DBOARD_HAS_PSRAM
    -mfix-esp32-psram-cache-issue

monitor_speed = 115200
upload_speed = 921600
```

---

## Estimated Total Timeline

| Phase | Duration | Dependencies | Priority |
|-------|----------|--------------|----------|
| 1. Foundation | 2-3 days | None | CRITICAL |
| 2. Network | 3-4 days | Phase 1 | CRITICAL |
| 3. System | 2-3 days | Phase 1, 2 | HIGH |
| 4. Hardware | 2 days | Phase 1 | MEDIUM |
| 5. Board Config | 1 day | Phase 1 | HIGH |
| 6. Pixels | 3-4 days | Phase 1, 5 | HIGH |
| 7. Effects | 4-5 days | Phase 6 | HIGH |
| 8. Sequences | 5-6 days | Phase 7 | MEDIUM |
| 9. Sensors | 4-5 days | Phase 1, 7 | LOW |
| 10. JBoard | 3-4 days | Phase 1, 2 | MEDIUM |

**Total Estimated Time:** 29-40 days (developer days)

**Critical Path (MVP):** Phases 1 → 2 → 5 → 6 → 7 = ~15-19 days

---

## Success Criteria

### Phase Completion:
- [ ] All endpoints in phase respond correctly
- [ ] Integration tests pass
- [ ] No memory leaks detected
- [ ] Performance targets met
- [ ] Documentation updated
- [ ] Frontend integration confirmed

### Final Acceptance:
- [ ] All 105 endpoints functional
- [ ] Frontend fully integrated
- [ ] Hardware testing complete
- [ ] Power consumption within limits
- [ ] OTA updates working reliably
- [ ] Multi-device testing passed (JBoard Network)
- [ ] Documentation complete

---

## Next Steps

1. **Review and Approve Plan** - Ensure alignment on approach
2. **Set Up Development Environment** - PlatformIO + ESP32
3. **Create Project Structure** - Directories and base files
4. **Begin Phase 1** - Foundation implementation
5. **Establish Progress Tracking** - Update BACKEND_PROGRESS.md daily

---

## Questions to Resolve Before Starting

1. **Board Variant:** Which board model are we targeting initially? (JBOARD-2, 4, 8, or 16?)
2. **Storage:** SD card required, or can we use SPIFFS/LittleFS only?
3. **Hardware:** Which optional components are present? (RTC? OLED? Sensors?)
4. **Testing:** Do you have ESP32 hardware available for testing?
5. **Priority:** Should we focus on MVP (critical path) or complete implementation?
