#include "PixelManager.h"
#include <Preferences.h>

// FastLED controller templates - will be instantiated per output
CLEDController* controllers[NUM_PIXEL_OUTPUTS] = {nullptr};

PixelManager::PixelManager() {
    // Initialize output structures
    for (uint8_t i = 0; i < NUM_PIXEL_OUTPUTS; i++) {
        outputs[i].id = i + 1;
        outputs[i].name = "Output " + String(i + 1);
        outputs[i].enabled = false;
        outputs[i].gpio = getGPIOForOutput(i + 1);
        outputs[i].pixelCount = 0;
        outputs[i].pixelType = "WS2812B";
        outputs[i].colorOrder = "GRB";
        outputs[i].voltage = 5;
        outputs[i].maxCurrent = 2000;
        outputs[i].status = "idle";
        outputs[i].leds = nullptr;
        outputs[i].initialized = false;
    }
}

PixelManager::~PixelManager() {
    // Clean up LED arrays
    for (uint8_t i = 0; i < NUM_PIXEL_OUTPUTS; i++) {
        if (outputs[i].leds != nullptr) {
            delete[] outputs[i].leds;
            outputs[i].leds = nullptr;
        }
    }
}

void PixelManager::begin() {
    Serial.println("[PixelManager] Initializing...");
    
    // Load saved configuration
    loadConfiguration();
    
    // Initialize enabled outputs
    for (uint8_t i = 0; i < NUM_PIXEL_OUTPUTS; i++) {
        if (outputs[i].enabled && outputs[i].pixelCount > 0) {
            initializeOutput(i + 1);
        }
    }
    
    Serial.println("[PixelManager] Initialization complete");
}

bool PixelManager::initializeOutput(uint8_t outputId) {
    if (outputId < 1 || outputId > NUM_PIXEL_OUTPUTS) {
        return false;
    }
    
    uint8_t idx = outputId - 1;
    PixelOutput* output = &outputs[idx];
    
    // Clean up existing array if present
    if (output->leds != nullptr) {
        delete[] output->leds;
        output->leds = nullptr;
    }
    
    // Allocate LED array
    if (output->pixelCount > 0) {
        output->leds = new CRGB[output->pixelCount];
        if (output->leds == nullptr) {
            Serial.printf("[PixelManager] Failed to allocate %d pixels for output %d\n", 
                         output->pixelCount, outputId);
            output->status = "error";
            return false;
        }
        
        // Initialize FastLED for this output
        // Note: Using WS2812B as default, can be extended for other types
        switch (outputId) {
            case 1: FastLED.addLeds<WS2812B, PIXEL_PIN_1, GRB>(output->leds, output->pixelCount); break;
            case 2: FastLED.addLeds<WS2812B, PIXEL_PIN_2, GRB>(output->leds, output->pixelCount); break;
#if NUM_PIXEL_OUTPUTS >= 4
            case 3: FastLED.addLeds<WS2812B, PIXEL_PIN_3, GRB>(output->leds, output->pixelCount); break;
            case 4: FastLED.addLeds<WS2812B, PIXEL_PIN_4, GRB>(output->leds, output->pixelCount); break;
#endif
#if NUM_PIXEL_OUTPUTS >= 8
            case 5: FastLED.addLeds<WS2812B, PIXEL_PIN_5, GRB>(output->leds, output->pixelCount); break;
            case 6: FastLED.addLeds<WS2812B, PIXEL_PIN_6, GRB>(output->leds, output->pixelCount); break;
            case 7: FastLED.addLeds<WS2812B, PIXEL_PIN_7, GRB>(output->leds, output->pixelCount); break;
            case 8: FastLED.addLeds<WS2812B, PIXEL_PIN_8, GRB>(output->leds, output->pixelCount); break;
#endif
#if NUM_PIXEL_OUTPUTS >= 16
            case 9: FastLED.addLeds<WS2812B, PIXEL_PIN_9, GRB>(output->leds, output->pixelCount); break;
            case 10: FastLED.addLeds<WS2812B, PIXEL_PIN_10, GRB>(output->leds, output->pixelCount); break;
            case 11: FastLED.addLeds<WS2812B, PIXEL_PIN_11, GRB>(output->leds, output->pixelCount); break;
            case 12: FastLED.addLeds<WS2812B, PIXEL_PIN_12, GRB>(output->leds, output->pixelCount); break;
            case 13: FastLED.addLeds<WS2812B, PIXEL_PIN_13, GRB>(output->leds, output->pixelCount); break;
            case 14: FastLED.addLeds<WS2812B, PIXEL_PIN_14, GRB>(output->leds, output->pixelCount); break;
            case 15: FastLED.addLeds<WS2812B, PIXEL_PIN_15, GRB>(output->leds, output->pixelCount); break;
            case 16: FastLED.addLeds<WS2812B, PIXEL_PIN_16, GRB>(output->leds, output->pixelCount); break;
#endif
        }
        
        // Clear LEDs
        fill_solid(output->leds, output->pixelCount, CRGB::Black);
        FastLED.show();
        
        output->initialized = true;
        output->status = "idle";
        
        Serial.printf("[PixelManager] Output %d initialized: GPIO %d, %d pixels\n", 
                     outputId, output->gpio, output->pixelCount);
        
        return true;
    }
    
    return false;
}

void PixelManager::initializeAllOutputs() {
    for (uint8_t i = 0; i < NUM_PIXEL_OUTPUTS; i++) {
        if (outputs[i].enabled && outputs[i].pixelCount > 0) {
            initializeOutput(i + 1);
        }
    }
}

bool PixelManager::updateOutput(uint8_t outputId, const JsonObject& config) {
    if (outputId < 1 || outputId > NUM_PIXEL_OUTPUTS) {
        return false;
    }
    
    uint8_t idx = outputId - 1;
    PixelOutput* output = &outputs[idx];
    
    // Update configuration
    if (config.containsKey("name")) {
        output->name = config["name"].as<String>();
    }
    if (config.containsKey("enabled")) {
        output->enabled = config["enabled"].as<bool>();
    }
    if (config.containsKey("pixelCount")) {
        output->pixelCount = config["pixelCount"].as<uint16_t>();
        if (output->pixelCount > MAX_PIXELS_PER_OUTPUT) {
            output->pixelCount = MAX_PIXELS_PER_OUTPUT;
        }
    }
    if (config.containsKey("pixelType")) {
        output->pixelType = config["pixelType"].as<String>();
    }
    if (config.containsKey("colorOrder")) {
        output->colorOrder = config["colorOrder"].as<String>();
    }
    if (config.containsKey("voltage")) {
        output->voltage = config["voltage"].as<uint8_t>();
    }
    if (config.containsKey("maxCurrent")) {
        output->maxCurrent = config["maxCurrent"].as<uint16_t>();
    }
    
    // Save configuration
    saveConfiguration();
    
    // Re-initialize if enabled
    if (output->enabled && output->pixelCount > 0) {
        return initializeOutput(outputId);
    }
    
    return true;
}

bool PixelManager::setOutputEnabled(uint8_t outputId, bool enabled) {
    if (outputId < 1 || outputId > NUM_PIXEL_OUTPUTS) {
        return false;
    }
    
    uint8_t idx = outputId - 1;
    outputs[idx].enabled = enabled;
    
    if (enabled && outputs[idx].pixelCount > 0) {
        return initializeOutput(outputId);
    } else if (!enabled) {
        clear(outputId);
        show(outputId);
    }
    
    saveConfiguration();
    return true;
}

void PixelManager::setColor(uint8_t outputId, CRGB color) {
    if (outputId < 1 || outputId > NUM_PIXEL_OUTPUTS) {
        return;
    }
    
    uint8_t idx = outputId - 1;
    if (outputs[idx].leds != nullptr && outputs[idx].initialized) {
        fill_solid(outputs[idx].leds, outputs[idx].pixelCount, color);
    }
}

void PixelManager::setAllColors(CRGB color) {
    for (uint8_t i = 0; i < NUM_PIXEL_OUTPUTS; i++) {
        if (outputs[i].enabled && outputs[i].leds != nullptr) {
            fill_solid(outputs[i].leds, outputs[i].pixelCount, color);
        }
    }
}

void PixelManager::fill(uint8_t outputId, CRGB color, uint16_t start, uint16_t count) {
    if (outputId < 1 || outputId > NUM_PIXEL_OUTPUTS) {
        return;
    }
    
    uint8_t idx = outputId - 1;
    if (outputs[idx].leds != nullptr && outputs[idx].initialized) {
        if (start + count > outputs[idx].pixelCount) {
            count = outputs[idx].pixelCount - start;
        }
        fill_solid(outputs[idx].leds + start, count, color);
    }
}

void PixelManager::clear(uint8_t outputId) {
    setColor(outputId, CRGB::Black);
}

void PixelManager::clearAll() {
    setAllColors(CRGB::Black);
}

void PixelManager::show(uint8_t outputId) {
    // FastLED.show() updates all outputs, so just call it once
    FastLED.show();
}

void PixelManager::showAll() {
    FastLED.show();
}

bool PixelManager::testOutput(uint8_t outputId, const String& effectId, 
                               const JsonObject& params, uint8_t brightness) {
    if (outputId < 1 || outputId > NUM_PIXEL_OUTPUTS) {
        return false;
    }
    
    uint8_t idx = outputId - 1;
    if (!outputs[idx].enabled || !outputs[idx].initialized) {
        return false;
    }
    
    // Set status to testing
    outputs[idx].status = "testing";
    
    // Apply test pattern based on effect ID
    if (effectId == "solid") {
        // Solid color test
        CRGB color = CRGB::White;
        if (params.containsKey("color")) {
            String colorStr = params["color"].as<String>();
            // Parse hex color (#RRGGBB)
            if (colorStr.startsWith("#") && colorStr.length() == 7) {
                long rgb = strtol(colorStr.substring(1).c_str(), NULL, 16);
                color = CRGB((rgb >> 16) & 0xFF, (rgb >> 8) & 0xFF, rgb & 0xFF);
            }
        }
        fill_solid(outputs[idx].leds, outputs[idx].pixelCount, color);
    } else if (effectId == "rainbow") {
        // Rainbow test
        fill_rainbow(outputs[idx].leds, outputs[idx].pixelCount, 0, 255 / outputs[idx].pixelCount);
    } else if (effectId == "chase") {
        // Simple chase pattern - alternate red/black
        for (uint16_t i = 0; i < outputs[idx].pixelCount; i++) {
            outputs[idx].leds[i] = (i % 4 == 0) ? CRGB::Red : CRGB::Black;
        }
    }
    
    FastLED.setBrightness(brightness);
    FastLED.show();
    
    return true;
}

void PixelManager::stopTest(uint8_t outputId) {
    if (outputId < 1 || outputId > NUM_PIXEL_OUTPUTS) {
        return;
    }
    
    uint8_t idx = outputId - 1;
    clear(outputId);
    show(outputId);
    outputs[idx].status = "idle";
}

bool PixelManager::testAllOutputs(const String& effectId, const JsonObject& params, 
                                   uint8_t brightness) {
    bool anyTested = false;
    
    for (uint8_t i = 1; i <= NUM_PIXEL_OUTPUTS; i++) {
        if (testOutput(i, effectId, params, brightness)) {
            anyTested = true;
        }
    }
    
    return anyTested;
}

void PixelManager::turnOffAll() {
    clearAll();
    showAll();
    
    for (uint8_t i = 0; i < NUM_PIXEL_OUTPUTS; i++) {
        if (outputs[i].enabled) {
            outputs[i].status = "idle";
        }
    }
}

PixelOutput* PixelManager::getOutput(uint8_t outputId) {
    if (outputId < 1 || outputId > NUM_PIXEL_OUTPUTS) {
        return nullptr;
    }
    return &outputs[outputId - 1];
}

uint32_t PixelManager::calculateOutputPower(uint8_t outputId) {
    if (outputId < 1 || outputId > NUM_PIXEL_OUTPUTS) {
        return 0;
    }
    
    uint8_t idx = outputId - 1;
    if (!outputs[idx].enabled) {
        return 0;
    }
    
    // Estimate: 60mA per pixel at full white (RGB), 80mA for RGBW
    uint16_t currentPerPixel = 60;
    if (outputs[idx].pixelType.indexOf("RGBW") >= 0) {
        currentPerPixel = 80;
    }
    
    // Total current (mA) = pixels * current per pixel
    uint32_t totalCurrent = outputs[idx].pixelCount * currentPerPixel;
    
    // Power (W) = (V * I) / 1000
    uint32_t power = (outputs[idx].voltage * totalCurrent) / 1000;
    
    return power;
}

uint32_t PixelManager::calculateTotalPower() {
    uint32_t totalPower = 0;
    
    for (uint8_t i = 1; i <= NUM_PIXEL_OUTPUTS; i++) {
        totalPower += calculateOutputPower(i);
    }
    
    return totalPower;
}

void PixelManager::getOutputsConfig(JsonDocument& doc) {
    doc.clear();
    JsonArray outputsArray = doc["outputs"].to<JsonArray>();
    
    for (uint8_t i = 0; i < NUM_PIXEL_OUTPUTS; i++) {
        JsonObject output = outputsArray.createNestedObject();
        output["id"] = "output-" + String(outputs[i].id);
        output["number"] = outputs[i].id;
        output["name"] = outputs[i].name;
        output["enabled"] = outputs[i].enabled;
        output["gpio"] = outputs[i].gpio;
        output["pixelCount"] = outputs[i].pixelCount;
        output["pixelType"] = outputs[i].pixelType;
        output["colorOrder"] = outputs[i].colorOrder;
        output["voltage"] = outputs[i].voltage;
        output["maxCurrent"] = outputs[i].maxCurrent;
        output["status"] = outputs[i].status;
    }
    
    doc["estimatedCurrent"] = 0; // TODO: Calculate based on current state
    doc["estimatedPower"] = calculateTotalPower();
    doc["powerLimit"] = 200; // TODO: Make configurable
    doc["supplyVoltage"] = 5;
}

uint8_t PixelManager::getGPIOForOutput(uint8_t outputId) {
    switch (outputId) {
        case 1: return PIXEL_PIN_1;
        case 2: return PIXEL_PIN_2;
#if NUM_PIXEL_OUTPUTS >= 4
        case 3: return PIXEL_PIN_3;
        case 4: return PIXEL_PIN_4;
#endif
#if NUM_PIXEL_OUTPUTS >= 8
        case 5: return PIXEL_PIN_5;
        case 6: return PIXEL_PIN_6;
        case 7: return PIXEL_PIN_7;
        case 8: return PIXEL_PIN_8;
#endif
#if NUM_PIXEL_OUTPUTS >= 16
        case 9: return PIXEL_PIN_9;
        case 10: return PIXEL_PIN_10;
        case 11: return PIXEL_PIN_11;
        case 12: return PIXEL_PIN_12;
        case 13: return PIXEL_PIN_13;
        case 14: return PIXEL_PIN_14;
        case 15: return PIXEL_PIN_15;
        case 16: return PIXEL_PIN_16;
#endif
        default: return 0;
    }
}

void PixelManager::loadConfiguration() {
    Preferences prefs;
    if (!prefs.begin("pixels", true)) {
        Serial.println("[PixelManager] Failed to open preferences");
        return;
    }
    
    for (uint8_t i = 0; i < NUM_PIXEL_OUTPUTS; i++) {
        String key = "out" + String(i);
        String config = prefs.getString(key.c_str(), "");
        
        if (config.length() > 0) {
            StaticJsonDocument<512> doc;
            DeserializationError error = deserializeJson(doc, config);
            
            if (!error) {
                if (doc.containsKey("name")) outputs[i].name = doc["name"].as<String>();
                if (doc.containsKey("enabled")) outputs[i].enabled = doc["enabled"].as<bool>();
                if (doc.containsKey("pixelCount")) outputs[i].pixelCount = doc["pixelCount"].as<uint16_t>();
                if (doc.containsKey("pixelType")) outputs[i].pixelType = doc["pixelType"].as<String>();
                if (doc.containsKey("colorOrder")) outputs[i].colorOrder = doc["colorOrder"].as<String>();
                if (doc.containsKey("voltage")) outputs[i].voltage = doc["voltage"].as<uint8_t>();
                if (doc.containsKey("maxCurrent")) outputs[i].maxCurrent = doc["maxCurrent"].as<uint16_t>();
            }
        }
    }
    
    prefs.end();
    Serial.println("[PixelManager] Configuration loaded");
}

void PixelManager::saveConfiguration() {
    Preferences prefs;
    if (!prefs.begin("pixels", false)) {
        Serial.println("[PixelManager] Failed to open preferences for writing");
        return;
    }
    
    for (uint8_t i = 0; i < NUM_PIXEL_OUTPUTS; i++) {
        StaticJsonDocument<512> doc;
        doc["name"] = outputs[i].name;
        doc["enabled"] = outputs[i].enabled;
        doc["pixelCount"] = outputs[i].pixelCount;
        doc["pixelType"] = outputs[i].pixelType;
        doc["colorOrder"] = outputs[i].colorOrder;
        doc["voltage"] = outputs[i].voltage;
        doc["maxCurrent"] = outputs[i].maxCurrent;
        
        String config;
        serializeJson(doc, config);
        
        String key = "out" + String(i);
        prefs.putString(key.c_str(), config);
    }
    
    prefs.end();
    Serial.println("[PixelManager] Configuration saved");
}

uint32_t PixelManager::getPixelTypeCode(const String& type) {
    // TODO: Map string types to FastLED type codes
    return 0;
}

uint32_t PixelManager::getColorOrderCode(const String& order) {
    // TODO: Map string orders to FastLED order codes
    return 0;
}
