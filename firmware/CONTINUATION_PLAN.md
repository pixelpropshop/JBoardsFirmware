# JSense Board Firmware - Continuation Plan

**Created:** November 11, 2025  
**Status:** API Framework Complete - Ready for Core Implementation  

---

## Executive Summary

All 105 API endpoints are implemented and compiling successfully. The backend framework is complete with:
- ✅ ESPAsyncWebServer initialized
- ✅ All manager classes created
- ✅ All type definitions in place
- ✅ CORS middleware configured
- ✅ 0 compilation errors
- ✅ Optimized memory usage (13.9% RAM, 25.7% Flash)

**Next Phase:** Implement actual functionality behind the API endpoints.

---

## Critical Path to MVP (Minimum Viable Product)

### MVP Goal
A functional LED controller accessible via WiFi network that can:
1. Connect to WiFi or create AP
2. Control LED strips on multiple outputs
3. Run basic LED effects
4. Persist configuration across reboots

**Estimated Time:** 14-19 days

---

## Phase A: Network Connectivity (CRITICAL)

**Priority:** 🔴 CRITICAL  
**Time Estimate:** 3-4 days  
**Dependencies:** None  
**Deliverable:** Device accessible via network for API testing

### Tasks

#### A1: WiFi Station Mode Implementation
**File:** `src/network/NetworkManager.cpp`

```cpp
// Implement these methods:
bool NetworkManager::connectToWiFi(const String& ssid, const String& password, bool staticIP, const String& ip, const String& gateway, const String& subnet) {
    // Store credentials in Preferences
    // WiFi.begin(ssid, password)
    // Wait for connection with timeout
    // If staticIP, configure static IP
    // Return connection status
}

bool NetworkManager::disconnect() {
    // WiFi.disconnect(true)
    // Update connection state
}

WiFiStatus NetworkManager::getStatus() {
    // Return real WiFi.status()
    // Include RSSI, IP, MAC
}
```

**Key Implementation Details:**
- Use `Preferences` library to store WiFi credentials
- Implement connection timeout (30 seconds)
- Retry logic: 3 attempts with 5-second intervals
- Fallback to AP mode if all retries fail
- Store last successful SSID for auto-reconnect

**Testing Checklist:**
- [ ] Device connects to 2.4GHz WiFi network
- [ ] Static IP configuration works
- [ ] Connection timeout triggers properly
- [ ] Credentials persist across reboots
- [ ] WiFi status endpoint returns accurate data

---

#### A2: Access Point Mode Implementation
**File:** `src/network/NetworkManager.cpp`

```cpp
bool NetworkManager::startAP(const String& ssid, const String& password, int channel, int maxConnections) {
    // WiFi.softAP(ssid, password, channel, false, maxConnections)
    // Configure AP IP (default: 192.168.4.1)
    // Start mDNS
    // Return success status
}

bool NetworkManager::stopAP() {
    // WiFi.softAPdisconnect(true)
}
```

**Key Implementation Details:**
- Default SSID: `JBoard-[MAC_LAST_6]` (e.g., "JBoard-A1B2C3")
- Default password: `jsenseboard` (8+ chars required)
- Default IP: `192.168.4.1`
- Default channel: 1
- Max clients: 4

**Testing Checklist:**
- [ ] AP mode starts successfully
- [ ] Phone/computer can connect to AP
- [ ] AP IP accessible (192.168.4.1)
- [ ] Multiple clients can connect (up to max)
- [ ] AP survives reboot if configured

---

#### A3: mDNS Implementation
**File:** `src/network/NetworkManager.cpp`

```cpp
bool NetworkManager::setHostname(const String& hostname) {
    // Validate hostname (alphanumeric + hyphens)
    // MDNS.begin(hostname)
    // Store in Preferences
}
```

**Key Implementation Details:**
- Default hostname: `jboard-[MAC_LAST_6]`
- Validate hostname: lowercase, alphanumeric, hyphens only
- Accessible via: `http://jboard-xxxxx.local`
- Advertise HTTP service: `_http._tcp`

**Testing Checklist:**
- [ ] mDNS resolves .local address
- [ ] Hostname persists across reboots
- [ ] Custom hostname can be set
- [ ] Service discovery works (Bonjour browser)

---

#### A4: Network Profiles (Multi-Network Support)
**File:** `src/network/NetworkManager.cpp`

```cpp
String NetworkManager::addProfile(const WiFiProfile& profile) {
    // Generate unique ID
    // Store profile in Preferences (as JSON)
    // Return profile ID
}

bool NetworkManager::connectToProfile(const String& profileId) {
    // Load profile from Preferences
    // Call connectToWiFi() with profile credentials
}

// Auto-connect logic in setup():
void NetworkManager::autoConnect() {
    // Load all profiles
    // Sort by priority
    // Attempt connection to each until success
    // Fallback to AP mode if all fail
}
```

**Testing Checklist:**
- [ ] Multiple profiles can be stored
- [ ] Auto-connect tries profiles by priority
- [ ] Profile CRUD operations work
- [ ] AP fallback triggers if no profiles connect

---

### Phase A Completion Criteria
- [ ] Device connects to WiFi successfully
- [ ] AP mode accessible from phone/laptop
- [ ] mDNS `.local` address works
- [ ] Network status endpoint returns live data
- [ ] Configuration persists across reboots
- [ ] All network endpoints tested with Postman/curl

---

## Phase B: LED Control Foundation (CRITICAL)

**Priority:** 🔴 CRITICAL  
**Time Estimate:** 4-5 days  
**Dependencies:** Phase A (for testing via API)  
**Deliverable:** LEDs physically responding to API commands

### Tasks

#### B1: FastLED Initialization
**File:** `src/led/PixelManager.cpp`

**Pin Assignments (JBOARD-16):**
```cpp
// Define in config.h
#ifdef JBOARD_16
#define OUTPUT_1_PIN    4
#define OUTPUT_2_PIN    5
#define OUTPUT_3_PIN    6
// ... through OUTPUT_16_PIN
#endif
```

**Implementation:**
```cpp
void PixelManager::initialize() {
    // Load saved configs from Preferences
    // For each output:
    for (int i = 0; i < NUM_OUTPUTS; i++) {
        if (outputConfigs[i].enabled) {
            // Allocate LED array
            leds[i] = new CRGB[outputConfigs[i].numPixels];
            
            // Add LEDs to FastLED based on type
            switch (outputConfigs[i].chipset) {
                case WS2812B:
                    FastLED.addLeds<WS2812B, OUTPUT_PIN, GRB>(leds[i], numPixels);
                    break;
                // ... other chipsets
            }
        }
    }
    
    FastLED.setBrightness(globalBrightness);
}
```

**Key Implementation Details:**
- Support chipsets: WS2812B, WS2811, SK6812, APA102
- Support color orders: RGB, GRB, BRG, RGBW
- Max pixels per output: 1000 (configurable)
- Global brightness: 0-255
- Power limit calculation: volts × amps
- Refresh rate target: 60+ FPS

**Testing Checklist:**
- [ ] Single output shows LEDs
- [ ] Multiple outputs work independently
- [ ] Chipset auto-detection works
- [ ] Color order configuration correct
- [ ] Brightness control functional
- [ ] Power calculations accurate

---

#### B2: Pixel Configuration API
**File:** `src/api/PixelsEndpoints.cpp`

Implement actual logic for:
- `GET /api/pixels/outputs` - Return real configs
- `POST /api/pixels/outputs/{outputId}/config` - Save and apply config
- `DELETE /api/pixels/outputs/{outputId}` - Disable output

**Storage:**
```cpp
// Preferences keys:
// pixels.out1.enabled = true
// pixels.out1.numPixels = 150
// pixels.out1.chipset = "WS2812B"
// pixels.out1.colorOrder = "GRB"
// pixels.out1.pin = 4
```

---

#### B3: Basic Test Patterns
**File:** `src/led/PixelManager.cpp`

```cpp
void PixelManager::testOutput(int outputId, const String& pattern) {
    if (pattern == "red") {
        fill_solid(leds[outputId], numPixels[outputId], CRGB::Red);
    } else if (pattern == "green") {
        fill_solid(leds[outputId], numPixels[outputId], CRGB::Green);
    } else if (pattern == "blue") {
        fill_solid(leds[outputId], numPixels[outputId], CRGB::Blue);
    } else if (pattern == "rainbow") {
        fill_rainbow(leds[outputId], numPixels[outputId], 0, 255 / numPixels[outputId]);
    }
    FastLED.show();
}

void PixelManager::allOff() {
    for (int i = 0; i < NUM_OUTPUTS; i++) {
        fill_solid(leds[i], numPixels[i], CRGB::Black);
    }
    FastLED.show();
}
```

**Testing Checklist:**
- [ ] Red test pattern works
- [ ] Green test pattern works
- [ ] Blue test pattern works
- [ ] Rainbow test pattern works
- [ ] All outputs off works
- [ ] Per-output testing works

---

### Phase B Completion Criteria
- [ ] FastLED initializes without errors
- [ ] LEDs physically light up
- [ ] Multiple outputs work independently
- [ ] Configuration persists across reboots
- [ ] Test patterns display correctly
- [ ] All pixels endpoints tested

---

## Phase C: LED Effects Engine (HIGH PRIORITY)

**Priority:** 🟠 HIGH  
**Time Estimate:** 5-7 days  
**Dependencies:** Phase B  
**Deliverable:** All 16 effects working and configurable

### Effect Implementation Order

#### C1: Simple Effects (Days 1-2)
1. **Solid Color** ⭐⭐⭐ (EASIEST)
   ```cpp
   void EffectSolid::update() {
       fill_solid(leds, numPixels, CRGB(params.color1));
   }
   ```

2. **Rainbow** ⭐⭐⭐
   ```cpp
   void EffectRainbow::update() {
       fill_rainbow(leds, numPixels, hue, 255 / numPixels);
       hue += params.speed;
   }
   ```

3. **Chase** ⭐⭐
   ```cpp
   void EffectChase::update() {
       fill_solid(leds, numPixels, CRGB::Black);
       leds[position] = CRGB(params.color1);
       position = (position + 1) % numPixels;
       delay(params.speed);
   }
   ```

4. **Breathe** ⭐⭐
   ```cpp
   void EffectBreathe::update() {
       uint8_t brightness = beatsin8(params.speed, 0, 255);
       fill_solid(leds, numPixels, CRGB(params.color1));
       FastLED.setBrightness(brightness);
   }
   ```

**Testing:** Visual verification, smooth animation, parameter control

---

#### C2: Intermediate Effects (Days 3-4)
5. **Sparkle** ⭐⭐
6. **Color Flow** ⭐⭐
7. **Strobe** ⭐
8. **Wave** ⭐⭐⭐
9. **Bars** ⭐⭐
10. **Confetti** ⭐⭐

---

#### C3: Advanced Effects (Days 5-7)
11. **Fire** ⭐⭐⭐⭐ (Complex algorithm)
12. **Meteor** ⭐⭐⭐
13. **Noise** ⭐⭐⭐⭐ (FastLED noise functions)
14. **Matrix** ⭐⭐⭐⭐
15. **Police** ⭐⭐
16. **Aurora** ⭐⭐⭐⭐⭐ (MOST COMPLEX)

---

### Effect Base Class
**File:** `src/led/EffectsManager.h`

```cpp
class Effect {
protected:
    CRGB* leds;
    uint16_t numPixels;
    EffectParams params;
    
public:
    Effect(CRGB* leds, uint16_t numPixels, EffectParams params)
        : leds(leds), numPixels(numPixels), params(params) {}
    
    virtual void initialize() {}
    virtual void update() = 0; // Pure virtual
    virtual void cleanup() {}
};

// Specific effects inherit from Effect
class EffectSolid : public Effect {
public:
    void update() override;
};
```

---

### Phase C Completion Criteria
- [ ] All 16 effects implemented
- [ ] Each effect visually verified
- [ ] Parameters control effect behavior
- [ ] Smooth transitions between effects
- [ ] Effect presets save/load/delete
- [ ] Performance: 60+ FPS maintained

---

## Phase D: System Management (HIGH PRIORITY)

**Priority:** 🟠 HIGH  
**Time Estimate:** 2-3 days  
**Dependencies:** Phases A, B  
**Deliverable:** Production-ready system features

### Tasks

#### D1: Configuration Persistence
**File:** `src/system/SystemManager.cpp`

```cpp
void SystemManager::saveConfig() {
    // Save all configs to Preferences
    // Network config
    // Pixel configs
    // Effect configs
    // System settings
}

void SystemManager::loadConfig() {
    // Load from Preferences on boot
}

void SystemManager::factoryReset() {
    // Preferences.clear()
    // Restart ESP
}
```

---

#### D2: System Information
**File:** `src/api/SystemEndpoints.cpp`

```cpp
// GET /api/system/info
{
    "chipModel": ESP.getChipModel(),
    "cores": ESP.getChipCores(),
    "cpuFreqMHz": ESP.getCpuFreqMHz(),
    "freeHeap": ESP.getFreeHeap(),
    "heapSize": ESP.getHeapSize(),
    "flashSize": ESP.getFlashChipSize(),
    "uptime": millis() / 1000,
    "firmwareVersion": FIRMWARE_VERSION
}
```

---

#### D3: OTA Firmware Updates
**File:** `src/api/SystemEndpoints.cpp`

```cpp
// POST /api/system/firmware/upload
server.on("/api/system/firmware/upload", HTTP_POST,
    [](AsyncWebServerRequest *request) {},
    [](AsyncWebServerRequest *request, String filename, size_t index, uint8_t *data, size_t len, bool final) {
        if (!index) {
            Update.begin(UPDATE_SIZE_UNKNOWN);
        }
        Update.write(data, len);
        if (final) {
            Update.end(true);
            ESP.restart();
        }
    }
);
```

---

### Phase D Completion Criteria
- [ ] All settings persist across reboots
- [ ] System info accurate
- [ ] Factory reset clears all data
- [ ] OTA update successful
- [ ] Config export/import works

---

## Phases E-I: Extended Features

### Phase E: Sequence Playback (5-6 days)
- Step-based sequences
- FSEQ parser
- Audio timing sync

### Phase F: File Management (2-3 days)
- SD card operations
- File upload/download
- Directory management

### Phase G: Sensors & Automation (4-5 days - OPTIONAL)
- Sensor drivers
- Automation rules
- Data export

### Phase H: Hardware Integration (2-3 days - OPTIONAL)
- RTC module
- OLED display

### Phase I: JBoard Mesh (3-4 days)
- ESP-NOW P2P
- Multi-device sync

---

## Testing Strategy

### Continuous Testing (Each Phase)
1. **Compilation Test** - `pio run -e jboard-16`
2. **Upload Test** - `pio run -t upload`
3. **Serial Monitor** - Verify boot logs
4. **API Test** - Postman/curl endpoint tests
5. **Hardware Test** - Visual/physical verification

### Integration Testing (After Phase D)
1. Full API test suite
2. Network resilience (disconnect/reconnect)
3. Configuration persistence
4. Memory leak detection (heap monitoring)
5. Performance benchmarks (FPS, response time)

---

## Success Metrics

### MVP Success (Phases A-D Complete)
- ✅ Device accessible via WiFi
- ✅ LEDs controllable via API
- ✅ All 16 effects working
- ✅ Configuration persists
- ✅ OTA updates functional
- ✅ Memory usage under 50%
- ✅ LED refresh rate > 60 FPS

### Full Feature Success (All Phases)
- ✅ All 105 endpoints functional
- ✅ Sequences playable
- ✅ FSEQ files from xLights working
- ✅ Multi-device mesh operational
- ✅ Frontend fully integrated
- ✅ Hardware tested and verified

---

## Risk Mitigation

### Memory Constraints
- **Risk:** ESP32 limited RAM (~320KB)
- **Mitigation:** 
  - Monitor heap usage continuously
  - Use PROGMEM for constants
  - Stream large files (FSEQ)
  - Limit pixel counts per output

### Timing Accuracy
- **Risk:** LED effects require precise timing
- **Mitigation:**
  - Use `millis()` for non-blocking timing
  - FastLED.show() rate limiting
  - Separate update loop from network handling

### WiFi Stability
- **Risk:** Network disconnections
- **Mitigation:**
  - Auto-reconnect logic
  - AP fallback mode
  - Queue critical data

---

## Next Immediate Steps

1. **Review and approve this plan**
2. **Choose starting phase** (Recommended: Phase A - Network)
3. **Set up hardware for testing**
4. **Begin implementation of Phase A1** (WiFi Station Mode)

**Ready to begin?** Say "start Phase A" to begin network implementation.
