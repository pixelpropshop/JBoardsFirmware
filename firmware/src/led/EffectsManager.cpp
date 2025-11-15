#include "EffectsManager.h"

EffectsManager::EffectsManager() : _leds(nullptr), _numLeds(0), _prefsInitialized(false) {
    _state.type = EFFECT_SOLID;
    _state.brightness = 128;
    _state.power = false;
    _state.lastUpdate = 0;
    _state.phase = 0.0;
    _state.counter = 0;
}

void EffectsManager::begin(CRGB* leds, uint16_t numLeds) {
    _leds = leds;
    _numLeds = numLeds;
    
    // Initialize preferences (lazy initialization - only once)
    if (!_prefsInitialized) {
        _prefs.begin("effects", false);
        _prefsInitialized = true;
    }
    
    // Load saved state (power always starts OFF)
    _state.brightness = _prefs.getInt("brightness", 128);
    _state.power = false;  // Always start with lights OFF
    _state.type = (EffectType)_prefs.getInt("type", EFFECT_SOLID);
    
    FastLED.setBrightness(_state.brightness);
}

bool EffectsManager::applyEffect(EffectType type, const std::map<String, float>& parameters) {
    _state.type = type;
    _state.parameters = parameters;
    _state.phase = 0.0;
    _state.counter = 0;
    _state.lastUpdate = millis();
    
    // Save to NVS
    _prefs.putInt("type", (int)type);
    
    return true;
}

bool EffectsManager::setPower(bool on) {
    _state.power = on;
    // Don't save power state to NVS - always start OFF after reboot
    
    if (!on) {
        fillAll(CRGB::Black);
        FastLED.show();
    }
    
    return true;
}

bool EffectsManager::setBrightness(int brightness) {
    if (brightness < 0 || brightness > 255) return false;
    
    _state.brightness = brightness;
    _prefs.putInt("brightness", brightness);
    FastLED.setBrightness(brightness);
    
    return true;
}

void EffectsManager::update() {
    if (!_state.power || _leds == nullptr) return;
    
    unsigned long now = millis();
    unsigned long delta = now - _state.lastUpdate;
    _state.lastUpdate = now;
    
    // Update phase (0.0 - 1.0, wraps around)
    float speed = getParameter("speed", 50.0) / 100.0;
    _state.phase += (delta / 1000.0) * speed;
    if (_state.phase >= 1.0) _state.phase -= 1.0;
    
    _state.counter++;
    
    // Execute current effect
    switch (_state.type) {
        case EFFECT_SOLID: effectSolid(); break;
        case EFFECT_RAINBOW: effectRainbow(); break;
        case EFFECT_CHASE: effectChase(); break;
        case EFFECT_BREATHE: effectBreathe(); break;
        case EFFECT_SPARKLE: effectSparkle(); break;
        case EFFECT_FIRE: effectFire(); break;
        case EFFECT_COLOR_FLOW: effectColorFlow(); break;
        case EFFECT_STROBE: effectStrobe(); break;
        case EFFECT_BARS: effectBars(); break;
        case EFFECT_WAVE: effectWave(); break;
        case EFFECT_CONFETTI: effectConfetti(); break;
        case EFFECT_METEOR: effectMeteor(); break;
        case EFFECT_NOISE: effectNoise(); break;
        case EFFECT_MATRIX: effectMatrix(); break;
        case EFFECT_POLICE: effectPolice(); break;
        case EFFECT_AURORA: effectAurora(); break;
    }
    
    FastLED.show();
}

std::vector<String> EffectsManager::getAvailableEffects() {
    return {
        "Solid", "Rainbow", "Chase", "Breathe", "Sparkle", "Fire",
        "Color Flow", "Strobe", "Bars", "Wave", "Confetti", "Meteor",
        "Noise", "Matrix", "Police", "Aurora"
    };
}

std::vector<EffectParameter> EffectsManager::getEffectParameters(EffectType type) {
    std::vector<EffectParameter> params;
    
    switch (type) {
        case EFFECT_SOLID:
            params.push_back({"color", "color", 0xFF0000, 0, 0xFFFFFF, {}});
            break;
        case EFFECT_RAINBOW:
            params.push_back({"speed", "number", 50, 1, 100, {}});
            params.push_back({"density", "number", 50, 1, 100, {}});
            break;
        case EFFECT_CHASE:
            params.push_back({"color", "color", 0xFF0000, 0, 0xFFFFFF, {}});
            params.push_back({"speed", "number", 50, 1, 100, {}});
            params.push_back({"size", "number", 5, 1, 50, {}});
            break;
        case EFFECT_BREATHE:
            params.push_back({"color", "color", 0xFF0000, 0, 0xFFFFFF, {}});
            params.push_back({"speed", "number", 50, 1, 100, {}});
            break;
        case EFFECT_SPARKLE:
            params.push_back({"color", "color", 0xFFFFFF, 0, 0xFFFFFF, {}});
            params.push_back({"density", "number", 50, 1, 100, {}});
            break;
        case EFFECT_FIRE:
            params.push_back({"cooling", "number", 55, 20, 100, {}});
            params.push_back({"sparking", "number", 120, 50, 200, {}});
            break;
        case EFFECT_COLOR_FLOW:
            params.push_back({"speed", "number", 50, 1, 100, {}});
            break;
        case EFFECT_STROBE:
            params.push_back({"color", "color", 0xFFFFFF, 0, 0xFFFFFF, {}});
            params.push_back({"speed", "number", 50, 1, 100, {}});
            break;
        case EFFECT_BARS:
            params.push_back({"color1", "color", 0xFF0000, 0, 0xFFFFFF, {}});
            params.push_back({"color2", "color", 0x0000FF, 0, 0xFFFFFF, {}});
            params.push_back({"width", "number", 10, 1, 50, {}});
            params.push_back({"speed", "number", 50, 1, 100, {}});
            break;
        case EFFECT_WAVE:
            params.push_back({"color", "color", 0x00FFFF, 0, 0xFFFFFF, {}});
            params.push_back({"speed", "number", 50, 1, 100, {}});
            params.push_back({"width", "number", 20, 5, 100, {}});
            break;
        case EFFECT_CONFETTI:
            params.push_back({"speed", "number", 50, 1, 100, {}});
            break;
        case EFFECT_METEOR:
            params.push_back({"color", "color", 0xFFFFFF, 0, 0xFFFFFF, {}});
            params.push_back({"speed", "number", 50, 1, 100, {}});
            params.push_back({"size", "number", 10, 1, 50, {}});
            break;
        case EFFECT_NOISE:
            params.push_back({"speed", "number", 50, 1, 100, {}});
            params.push_back({"scale", "number", 50, 1, 100, {}});
            break;
        case EFFECT_MATRIX:
            params.push_back({"speed", "number", 50, 1, 100, {}});
            break;
        case EFFECT_POLICE:
            params.push_back({"speed", "number", 50, 1, 100, {}});
            break;
        case EFFECT_AURORA:
            params.push_back({"speed", "number", 50, 1, 100, {}});
            break;
    }
    
    return params;
}

EffectState EffectsManager::getCurrentState() {
    return _state;
}

// Effect implementations

void EffectsManager::effectSolid() {
    CRGB color = getParameterColor("color");
    fillAll(color);
}

void EffectsManager::effectRainbow() {
    float density = getParameter("density", 50.0) / 100.0;
    uint8_t deltaHue = 256.0 / (_numLeds * density);
    uint8_t startHue = _state.phase * 255;
    
    for (uint16_t i = 0; i < _numLeds; i++) {
        _leds[i] = CHSV(startHue + (i * deltaHue), 255, 255);
    }
}

void EffectsManager::effectChase() {
    CRGB color = getParameterColor("color");
    int size = getParameter("size", 5);
    
    fillAll(CRGB::Black);
    
    int position = _state.phase * (_numLeds + size);
    for (int i = 0; i < size; i++) {
        int pos = position - i;
        if (pos >= 0 && pos < _numLeds) {
            _leds[pos] = color;
        }
    }
}

void EffectsManager::effectBreathe() {
    CRGB color = getParameterColor("color");
    float breath = (sin(_state.phase * 2 * PI) + 1.0) / 2.0;
    
    CRGB scaled = color;
    scaled.nscale8(breath * 255);
    fillAll(scaled);
}

void EffectsManager::effectSparkle() {
    CRGB color = getParameterColor("color");
    float density = getParameter("density", 50.0) / 100.0;
    
    fadeToBlackBy(20);
    
    int sparkles = density * (_numLeds / 10.0);
    for (int i = 0; i < sparkles; i++) {
        int pos = random16(_numLeds);
        _leds[pos] = color;
    }
}

void EffectsManager::effectFire() {
    static byte heat[1000];  // Max 1000 LEDs
    int cooling = getParameter("cooling", 55);
    int sparking = getParameter("sparking", 120);
    
    // Cool down every cell a little
    for (uint16_t i = 0; i < _numLeds; i++) {
        heat[i] = qsub8(heat[i], random8(0, ((cooling * 10) / _numLeds) + 2));
    }
    
    // Heat from each cell drifts up
    for (uint16_t k = _numLeds - 1; k >= 2; k--) {
        heat[k] = (heat[k - 1] + heat[k - 2] + heat[k - 2]) / 3;
    }
    
    // Randomly ignite new sparks
    if (random8() < sparking) {
        int y = random8(7);
        heat[y] = qadd8(heat[y], random8(160, 255));
    }
    
    // Convert heat to LED colors
    for (uint16_t j = 0; j < _numLeds; j++) {
        CRGB color = HeatColor(heat[j]);
        _leds[j] = color;
    }
}

void EffectsManager::effectColorFlow() {
    uint8_t hue = _state.phase * 255;
    
    for (uint16_t i = 0; i < _numLeds; i++) {
        uint8_t pixelHue = hue + (i * 10);
        _leds[i] = CHSV(pixelHue, 255, 255);
    }
}

void EffectsManager::effectStrobe() {
    CRGB color = getParameterColor("color");
    
    if (_state.counter % 2 == 0) {
        fillAll(color);
    } else {
        fillAll(CRGB::Black);
    }
}

void EffectsManager::effectBars() {
    CRGB color1 = getParameterColor("color1");
    CRGB color2 = getParameterColor("color2");
    int width = getParameter("width", 10);
    
    int offset = _state.phase * (width * 2);
    
    for (uint16_t i = 0; i < _numLeds; i++) {
        int pos = (i + offset) % (width * 2);
        _leds[i] = (pos < width) ? color1 : color2;
    }
}

void EffectsManager::effectWave() {
    CRGB color = getParameterColor("color");
    float width = getParameter("width", 20);
    
    for (uint16_t i = 0; i < _numLeds; i++) {
        float wave = sin((i / width + _state.phase * 2 * PI) * 2 * PI);
        float brightness = (wave + 1.0) / 2.0;
        
        CRGB scaled = color;
        scaled.nscale8(brightness * 255);
        _leds[i] = scaled;
    }
}

void EffectsManager::effectConfetti() {
    fadeToBlackBy(10);
    
    int pos = random16(_numLeds);
    _leds[pos] += CHSV(random8(), 200, 255);
}

void EffectsManager::effectMeteor() {
    CRGB color = getParameterColor("color");
    int size = getParameter("size", 10);
    
    fadeToBlackBy(64);
    
    int position = _state.phase * (_numLeds + size);
    for (int i = 0; i < size; i++) {
        int pos = position - i;
        if (pos >= 0 && pos < _numLeds) {
            float brightness = 1.0 - ((float)i / size);
            CRGB scaled = color;
            scaled.nscale8(brightness * 255);
            _leds[pos] = scaled;
        }
    }
}

void EffectsManager::effectNoise() {
    uint16_t scale = getParameter("scale", 50) * 10;
    
    for (uint16_t i = 0; i < _numLeds; i++) {
        uint8_t noise = inoise8(i * scale, _state.counter * 10);
        _leds[i] = CHSV(noise, 255, 255);
    }
}

void EffectsManager::effectMatrix() {
    fadeToBlackBy(20);
    
    if (_state.counter % 2 == 0) {
        int pos = random16(_numLeds);
        _leds[pos] = CRGB::Green;
    }
}

void EffectsManager::effectPolice() {
    fillAll(CRGB::Black);
    
    int half = _numLeds / 2;
    CRGB color = (_state.counter / 5) % 2 == 0 ? CRGB::Red : CRGB::Blue;
    
    for (int i = 0; i < half; i++) {
        if ((_state.counter / 5) % 2 == 0) {
            _leds[i] = CRGB::Red;
        } else {
            _leds[i + half] = CRGB::Blue;
        }
    }
}

void EffectsManager::effectAurora() {
    for (uint16_t i = 0; i < _numLeds; i++) {
        uint8_t noise1 = inoise8(i * 50, _state.counter * 10);
        uint8_t noise2 = inoise8(i * 30 + 5000, _state.counter * 15);
        
        uint8_t hue = (noise1 + noise2) / 2;
        uint8_t sat = 255 - (noise1 / 4);
        
        _leds[i] = CHSV(hue, sat, 255);
    }
}

// Utility functions

CRGB EffectsManager::getParameterColor(const String& paramName) {
    uint32_t colorValue = (uint32_t)getParameter(paramName, 0xFF0000);
    uint8_t r = (colorValue >> 16) & 0xFF;
    uint8_t g = (colorValue >> 8) & 0xFF;
    uint8_t b = colorValue & 0xFF;
    return CRGB(r, g, b);
}

float EffectsManager::getParameter(const String& paramName, float defaultValue) {
    auto it = _state.parameters.find(paramName);
    if (it != _state.parameters.end()) {
        return it->second;
    }
    return defaultValue;
}

void EffectsManager::fillAll(CRGB color) {
    for (uint16_t i = 0; i < _numLeds; i++) {
        _leds[i] = color;
    }
}

void EffectsManager::fadeToBlackBy(uint8_t amount) {
    for (uint16_t i = 0; i < _numLeds; i++) {
        _leds[i].nscale8(255 - amount);
    }
}

CRGB EffectsManager::wheel(uint8_t wheelPos) {
    if (wheelPos < 85) {
        return CRGB(wheelPos * 3, 255 - wheelPos * 3, 0);
    } else if (wheelPos < 170) {
        wheelPos -= 85;
        return CRGB(255 - wheelPos * 3, 0, wheelPos * 3);
    } else {
        wheelPos -= 170;
        return CRGB(0, wheelPos * 3, 255 - wheelPos * 3);
    }
}

// Preset management

bool EffectsManager::savePreset(const String& id, const String& name) {
    EffectPreset preset;
    preset.id = id;
    preset.name = name;
    preset.type = _state.type;
    preset.parameters = _state.parameters;
    preset.brightness = _state.brightness;
    
    return savePresetToFS(preset);
}

bool EffectsManager::loadPreset(const String& id) {
    EffectPreset preset;
    if (loadPresetFromFS(id, preset)) {
        applyEffect(preset.type, preset.parameters);
        setBrightness(preset.brightness);
        return true;
    }
    return false;
}

bool EffectsManager::deletePreset(const String& id) {
    String path = "/presets/" + id + ".json";
    
    if (!LittleFS.exists(path)) {
        return false;
    }
    
    bool success = LittleFS.remove(path);
    Serial.printf("[EffectsManager] Deleted preset %s: %s\n", id.c_str(), success ? "success" : "failed");
    
    return success;
}

std::vector<EffectPreset> EffectsManager::listPresets() {
    std::vector<EffectPreset> presets;
    
    ensurePresetsDir();
    
    File dir = LittleFS.open("/presets");
    if (!dir || !dir.isDirectory()) {
        Serial.println("[EffectsManager] Failed to open /presets directory");
        return presets;
    }
    
    File file = dir.openNextFile();
    while (file) {
        if (!file.isDirectory()) {
            String filename = file.name();
            
            // Extract ID from filename (remove .json extension)
            if (filename.endsWith(".json")) {
                String id = filename.substring(0, filename.length() - 5);
                
                EffectPreset preset;
                if (loadPresetFromFS(id, preset)) {
                    Serial.printf("[EffectsManager] Loaded preset %s: %s\n", id.c_str(), preset.name.c_str());
                    presets.push_back(preset);
                } else {
                    Serial.printf("[EffectsManager] Failed to load preset %s\n", id.c_str());
                }
            }
        }
        file = dir.openNextFile();
    }
    
    Serial.printf("[EffectsManager] Returning %d presets\n", presets.size());
    return presets;
}

void EffectsManager::ensurePresetsDir() {
    if (!LittleFS.exists("/presets")) {
        LittleFS.mkdir("/presets");
        Serial.println("[EffectsManager] Created /presets directory");
    }
}

bool EffectsManager::savePresetToFS(const EffectPreset& preset) {
    ensurePresetsDir();
    
    // Create JSON document
    StaticJsonDocument<512> doc;
    doc["id"] = preset.id;
    doc["name"] = preset.name;
    doc["type"] = (int)preset.type;
    doc["brightness"] = preset.brightness;
    
    // Save parameters
    if (!preset.parameters.empty()) {
        JsonObject params = doc.createNestedObject("parameters");
        for (const auto& param : preset.parameters) {
            params[param.first] = param.second;
        }
    }
    
    // Write to file
    String path = "/presets/" + preset.id + ".json";
    File file = LittleFS.open(path, "w");
    
    if (!file) {
        Serial.printf("[EffectsManager] Failed to open %s for writing\n", path.c_str());
        return false;
    }
    
    size_t bytesWritten = serializeJson(doc, file);
    file.close();
    
    Serial.printf("[EffectsManager] Saved preset %s to %s (%d bytes)\n", 
                  preset.id.c_str(), path.c_str(), bytesWritten);
    
    return bytesWritten > 0;
}

bool EffectsManager::loadPresetFromFS(const String& id, EffectPreset& preset) {
    String path = "/presets/" + id + ".json";
    
    if (!LittleFS.exists(path)) {
        Serial.printf("[EffectsManager] Preset file %s does not exist\n", path.c_str());
        return false;
    }
    
    File file = LittleFS.open(path, "r");
    if (!file) {
        Serial.printf("[EffectsManager] Failed to open %s for reading\n", path.c_str());
        return false;
    }
    
    // Parse JSON
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, file);
    file.close();
    
    if (error) {
        Serial.printf("[EffectsManager] JSON parse error for %s: %s\n", path.c_str(), error.c_str());
        return false;
    }
    
    preset.id = doc["id"].as<String>();
    preset.name = doc["name"].as<String>();
    preset.type = (EffectType)doc["type"].as<int>();
    preset.brightness = doc["brightness"].as<int>();
    
    // Load parameters
    preset.parameters.clear();
    if (doc.containsKey("parameters")) {
        JsonObject params = doc["parameters"];
        for (JsonPair kv : params) {
            preset.parameters[String(kv.key().c_str())] = kv.value().as<float>();
        }
    }
    
    Serial.printf("[EffectsManager] Loaded preset %s from %s\n", id.c_str(), path.c_str());
    return true;
}
