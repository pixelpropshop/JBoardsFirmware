#include "HardwareManager.h"
#include "config.h"
#include <WiFi.h>

// Only include libraries if features are enabled
#if FEATURE_OLED
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define SCREEN_ADDRESS 0x3C
#endif

#if FEATURE_RTC
#include <RTClib.h>
#endif

HardwareManager::HardwareManager() :
    i2cInitialized(false),
    i2cSDA(I2C_SDA_PIN),
    i2cSCL(I2C_SCL_PIN),
    rtcPresent(false),
    rtcInitialized(false),
    rtcDS3231(nullptr),
    rtcDS1307(nullptr),
    isDS3231(false),
    oledPresent(false),
    oledInitialized(false),
    display(nullptr),
    currentMode(DisplayMode::OFF),
    displayBrightness(128),
    displayTimeout(30000),
    lastDisplayUpdate(0),
    lastDisplayActivity(0),
    displaySleeping(false)
{
}

HardwareManager::~HardwareManager() {
#if FEATURE_RTC
    if (rtcDS3231) delete rtcDS3231;
    if (rtcDS1307) delete rtcDS1307;
#endif
#if FEATURE_OLED
    if (display) delete display;
#endif
}

void HardwareManager::begin() {
    Serial.println("[Hardware] Initializing...");
    
    initI2C();
    detectRTC();
    detectOLED();
    
    Serial.printf("[Hardware] I2C: %s, RTC: %s, OLED: %s\n",
        i2cInitialized ? "OK" : "FAILED",
        rtcPresent ? "DETECTED" : "NOT FOUND",
        oledPresent ? "DETECTED" : "NOT FOUND"
    );
}

// ============================================================================
// I2C Functions
// ============================================================================

void HardwareManager::initI2C() {
    Wire.begin(i2cSDA, i2cSCL);
    delay(100);
    i2cInitialized = true;
    Serial.printf("[Hardware] I2C initialized on SDA=%d, SCL=%d\n", i2cSDA, i2cSCL);
}

bool HardwareManager::scanI2C() {
    if (!i2cInitialized) return false;
    
    Serial.println("[Hardware] Scanning I2C bus...");
    uint8_t devicesFound = 0;
    
    for (uint8_t addr = 1; addr < 127; addr++) {
        Wire.beginTransmission(addr);
        if (Wire.endTransmission() == 0) {
            Serial.printf("[Hardware] I2C device found at 0x%02X\n", addr);
            devicesFound++;
        }
    }
    
    Serial.printf("[Hardware] Scan complete: %d devices found\n", devicesFound);
    return devicesFound > 0;
}

String HardwareManager::getI2CDevices() {
    String devices = "[";
    bool first = true;
    
    for (uint8_t addr = 1; addr < 127; addr++) {
        Wire.beginTransmission(addr);
        if (Wire.endTransmission() == 0) {
            if (!first) devices += ",";
            devices += "\"0x" + String(addr, HEX) + "\"";
            first = false;
        }
    }
    
    devices += "]";
    return devices;
}

// ============================================================================
// RTC Functions
// ============================================================================

void HardwareManager::detectRTC() {
#if FEATURE_RTC
    if (!i2cInitialized) return;
    
    // Try DS3231 first (0x68)
    Wire.beginTransmission(0x68);
    if (Wire.endTransmission() == 0) {
        rtcDS3231 = new RTC_DS3231();
        if (rtcDS3231->begin()) {
            rtcPresent = true;
            rtcInitialized = true;
            isDS3231 = true;
            Serial.println("[Hardware] DS3231 RTC detected");
            return;
        }
        delete rtcDS3231;
        rtcDS3231 = nullptr;
    }
    
    // Try DS1307 (also 0x68, but check differently)
    rtcDS1307 = new RTC_DS1307();
    if (rtcDS1307->begin()) {
        rtcPresent = true;
        rtcInitialized = true;
        isDS3231 = false;
        Serial.println("[Hardware] DS1307 RTC detected");
        return;
    }
    delete rtcDS1307;
    rtcDS1307 = nullptr;
    
    Serial.println("[Hardware] No RTC module detected");
#else
    Serial.println("[Hardware] RTC support not compiled in");
#endif
}

bool HardwareManager::hasRTC() {
    return rtcPresent;
}

String HardwareManager::getRTCTime() {
#if FEATURE_RTC
    if (!rtcPresent) return "{\"error\":\"RTC not available\"}";
    
    DateTime now;
    if (isDS3231 && rtcDS3231) {
        now = rtcDS3231->now();
    } else if (rtcDS1307) {
        now = rtcDS1307->now();
    } else {
        return "{\"error\":\"RTC not initialized\"}";
    }
    
    char buffer[100];
    snprintf(buffer, sizeof(buffer),
        "{\"year\":%d,\"month\":%d,\"day\":%d,\"hour\":%d,\"minute\":%d,\"second\":%d,\"timestamp\":%lu}",
        now.year(), now.month(), now.day(),
        now.hour(), now.minute(), now.second(),
        now.unixtime()
    );
    
    return String(buffer);
#else
    return "{\"error\":\"RTC support not compiled\"}";
#endif
}

bool HardwareManager::setRTCTime(int year, int month, int day, int hour, int minute, int second) {
#if FEATURE_RTC
    if (!rtcPresent) return false;
    
    DateTime newTime(year, month, day, hour, minute, second);
    
    if (isDS3231 && rtcDS3231) {
        rtcDS3231->adjust(newTime);
        Serial.printf("[Hardware] RTC time set: %04d-%02d-%02d %02d:%02d:%02d\n",
            year, month, day, hour, minute, second);
        return true;
    } else if (rtcDS1307) {
        rtcDS1307->adjust(newTime);
        Serial.printf("[Hardware] RTC time set: %04d-%02d-%02d %02d:%02d:%02d\n",
            year, month, day, hour, minute, second);
        return true;
    }
    
    return false;
#else
    return false;
#endif
}

bool HardwareManager::syncRTCFromNTP() {
#if FEATURE_RTC
    if (!rtcPresent) return false;
    
    // Get current time from system (should be NTP synced)
    time_t now;
    struct tm timeinfo;
    time(&now);
    localtime_r(&now, &timeinfo);
    
    return setRTCTime(
        timeinfo.tm_year + 1900,
        timeinfo.tm_mon + 1,
        timeinfo.tm_mday,
        timeinfo.tm_hour,
        timeinfo.tm_min,
        timeinfo.tm_sec
    );
#else
    return false;
#endif
}

String HardwareManager::getRTCInfo() {
#if FEATURE_RTC
    if (!rtcPresent) return "{\"present\":false}";
    
    char buffer[200];
    snprintf(buffer, sizeof(buffer),
        "{\"present\":true,\"initialized\":%s,\"type\":\"%s\"}",
        rtcInitialized ? "true" : "false",
        isDS3231 ? "DS3231" : "DS1307"
    );
    
    return String(buffer);
#else
    return "{\"present\":false,\"error\":\"RTC support not compiled\"}";
#endif
}

// ============================================================================
// OLED Functions
// ============================================================================

void HardwareManager::detectOLED() {
#if FEATURE_OLED
    if (!i2cInitialized) return;
    
    // Check if OLED is present at 0x3C
    Wire.beginTransmission(SCREEN_ADDRESS);
    if (Wire.endTransmission() == 0) {
        display = new Adafruit_SSD1306(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
        
        if (display->begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
            oledPresent = true;
            oledInitialized = true;
            display->clearDisplay();
            display->setTextSize(1);
            display->setTextColor(SSD1306_WHITE);
            display->setCursor(0, 0);
            display->println("JSense Board");
            display->println("Initializing...");
            display->display();
            Serial.println("[Hardware] SSD1306 OLED detected");
            return;
        }
        
        delete display;
        display = nullptr;
    }
    
    Serial.println("[Hardware] No OLED display detected");
#else
    Serial.println("[Hardware] OLED support not compiled in");
#endif
}

bool HardwareManager::hasOLED() {
    return oledPresent;
}

bool HardwareManager::setDisplayMode(DisplayMode mode) {
#if FEATURE_OLED
    if (!oledPresent) return false;
    
    currentMode = mode;
    lastDisplayUpdate = 0; // Force immediate update
    wakeDisplay();
    
    Serial.printf("[Hardware] Display mode set to: %d\n", (int)mode);
    return true;
#else
    return false;
#endif
}

DisplayMode HardwareManager::getDisplayMode() {
    return currentMode;
}

bool HardwareManager::setDisplayBrightness(uint8_t brightness) {
#if FEATURE_OLED
    if (!oledPresent || !display) return false;
    
    displayBrightness = brightness;
    display->ssd1306_command(SSD1306_SETCONTRAST);
    display->ssd1306_command(brightness);
    
    Serial.printf("[Hardware] Display brightness set to: %d\n", brightness);
    return true;
#else
    return false;
#endif
}

bool HardwareManager::setDisplayTimeout(uint32_t timeoutMs) {
    displayTimeout = timeoutMs;
    Serial.printf("[Hardware] Display timeout set to: %lu ms\n", timeoutMs);
    return true;
}

bool HardwareManager::displayTestPattern() {
#if FEATURE_OLED
    if (!oledPresent || !display) return false;
    
    wakeDisplay();
    display->clearDisplay();
    
    // Draw test pattern
    display->drawRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, SSD1306_WHITE);
    display->drawLine(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT, SSD1306_WHITE);
    display->drawLine(SCREEN_WIDTH, 0, 0, SCREEN_HEIGHT, SSD1306_WHITE);
    display->fillCircle(SCREEN_WIDTH/2, SCREEN_HEIGHT/2, 10, SSD1306_WHITE);
    
    display->setTextSize(1);
    display->setCursor(10, 10);
    display->println("TEST");
    
    display->display();
    Serial.println("[Hardware] Test pattern displayed");
    return true;
#else
    return false;
#endif
}

void HardwareManager::updateDisplay() {
#if FEATURE_OLED
    if (!oledPresent || !display || currentMode == DisplayMode::OFF) return;
    
    // Check timeout
    if (displayTimeout > 0 && !displaySleeping) {
        if (millis() - lastDisplayActivity > displayTimeout) {
            sleepDisplay();
            return;
        }
    }
    
    if (displaySleeping) return;
    
    // Update display based on mode (throttle updates)
    if (millis() - lastDisplayUpdate < 1000) return;
    lastDisplayUpdate = millis();
    
    switch (currentMode) {
        case DisplayMode::CLOCK:
            renderClock();
            break;
        case DisplayMode::IP_ADDRESS:
            renderIPAddress();
            break;
        case DisplayMode::STATUS:
            renderStatus();
            break;
        case DisplayMode::ROTATING:
            renderRotating();
            break;
        default:
            break;
    }
#endif
}

void HardwareManager::wakeDisplay() {
#if FEATURE_OLED
    if (!oledPresent || !display) return;
    
    if (displaySleeping) {
        display->ssd1306_command(SSD1306_DISPLAYON);
        displaySleeping = false;
    }
    lastDisplayActivity = millis();
#endif
}

void HardwareManager::sleepDisplay() {
#if FEATURE_OLED
    if (!oledPresent || !display || displaySleeping) return;
    
    display->ssd1306_command(SSD1306_DISPLAYOFF);
    displaySleeping = true;
    Serial.println("[Hardware] Display sleeping");
#endif
}

void HardwareManager::renderClock() {
#if FEATURE_OLED
    display->clearDisplay();
    display->setTextSize(2);
    display->setCursor(20, 20);
    
    time_t now;
    struct tm timeinfo;
    time(&now);
    localtime_r(&now, &timeinfo);
    
    char buffer[20];
    strftime(buffer, sizeof(buffer), "%H:%M:%S", &timeinfo);
    display->println(buffer);
    
    display->setTextSize(1);
    strftime(buffer, sizeof(buffer), "%Y-%m-%d", &timeinfo);
    display->setCursor(20, 45);
    display->println(buffer);
    
    display->display();
#endif
}

void HardwareManager::renderIPAddress() {
#if FEATURE_OLED
    display->clearDisplay();
    display->setTextSize(1);
    display->setCursor(0, 0);
    display->println("IP Address:");
    display->println();
    
    display->setTextSize(2);
    if (WiFi.status() == WL_CONNECTED) {
        display->println(WiFi.localIP().toString());
    } else {
        display->println(WiFi.softAPIP().toString());
    }
    
    display->display();
#endif
}

void HardwareManager::renderStatus() {
#if FEATURE_OLED
    display->clearDisplay();
    display->setTextSize(1);
    display->setCursor(0, 0);
    display->println("JSense Board");
    display->println();
    display->printf("WiFi: %s\n", WiFi.status() == WL_CONNECTED ? "Connected" : "AP Mode");
    display->printf("Heap: %d KB\n", ESP.getFreeHeap() / 1024);
    display->printf("Uptime: %lus\n", millis() / 1000);
    
    display->display();
#endif
}

void HardwareManager::renderRotating() {
#if FEATURE_OLED
    // Rotate through different displays every 5 seconds
    static uint32_t rotateTimer = 0;
    static uint8_t rotateIndex = 0;
    
    if (millis() - rotateTimer > 5000) {
        rotateTimer = millis();
        rotateIndex = (rotateIndex + 1) % 3;
    }
    
    switch (rotateIndex) {
        case 0:
            renderClock();
            break;
        case 1:
            renderIPAddress();
            break;
        case 2:
            renderStatus();
            break;
    }
#endif
}

String HardwareManager::getDisplayInfo() {
#if FEATURE_OLED
    if (!oledPresent) return "{\"present\":false}";
    
    char buffer[300];
    snprintf(buffer, sizeof(buffer),
        "{\"present\":true,\"initialized\":%s,\"mode\":\"%s\",\"brightness\":%d,\"timeout\":%lu,\"sleeping\":%s}",
        oledInitialized ? "true" : "false",
        currentMode == DisplayMode::OFF ? "off" :
        currentMode == DisplayMode::CLOCK ? "clock" :
        currentMode == DisplayMode::IP_ADDRESS ? "ip" :
        currentMode == DisplayMode::STATUS ? "status" : "rotating",
        displayBrightness,
        displayTimeout,
        displaySleeping ? "true" : "false"
    );
    
    return String(buffer);
#else
    return "{\"present\":false,\"error\":\"OLED support not compiled\"}";
#endif
}
