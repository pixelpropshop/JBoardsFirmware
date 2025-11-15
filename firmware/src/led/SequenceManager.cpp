#include "SequenceManager.h"
#include <LittleFS.h>
#include <ArduinoJson.h>

SequenceManager::SequenceManager() : _effects(nullptr) {
    _state.isPlaying = false;
    _state.isPaused = false;
    _state.currentStepIndex = 0;
    _state.remainingTime = 0;
    _state.totalElapsed = 0;
}

void SequenceManager::begin(EffectsManager* effectsManager) {
    _effects = effectsManager;
    _prefs.begin("sequences", false);
    
    // Initialize LittleFS for sequence storage
    if (!LittleFS.begin(true)) {
        Serial.println("[Sequences] Failed to mount LittleFS");
    }
}

bool SequenceManager::createSequence(const Sequence& sequence) {
    Sequence seq = sequence;
    if (seq.id.length() == 0) {
        seq.id = generateSequenceId();
    }
    seq.createdAt = getCurrentTimestamp();
    seq.updatedAt = seq.createdAt;
    seq.type = "standard";
    
    return saveSequenceToStorage(seq);
}

bool SequenceManager::updateSequence(const String& id, const Sequence& sequence) {
    Sequence existing;
    if (!loadSequenceFromStorage(id, existing)) {
        return false;
    }
    
    Sequence updated = sequence;
    updated.id = id;
    updated.createdAt = existing.createdAt;
    updated.updatedAt = getCurrentTimestamp();
    
    return saveSequenceToStorage(updated);
}

bool SequenceManager::deleteSequence(const String& id) {
    // Stop playback if this sequence is playing
    if (_state.isPlaying && _state.sequenceId == id) {
        stop();
    }
    
    String path = "/sequences/" + id + ".json";
    return LittleFS.remove(path);
}

Sequence* SequenceManager::getSequence(const String& id) {
    static Sequence seq;
    if (loadSequenceFromStorage(id, seq)) {
        return &seq;
    }
    return nullptr;
}

std::vector<Sequence> SequenceManager::listSequences() {
    std::vector<Sequence> sequences;
    
    // Check if sequences directory exists before opening
    if (!LittleFS.exists("/sequences")) {
        return sequences; // Return empty list without error
    }
    
    File root = LittleFS.open("/sequences");
    if (!root || !root.isDirectory()) {
        return sequences;
    }
    
    File file = root.openNextFile();
    while (file) {
        if (!file.isDirectory()) {
            String filename = file.name();
            if (filename.endsWith(".json")) {
                String id = filename.substring(11, filename.length() - 5); // Remove "/sequences/" and ".json"
                Sequence seq;
                if (loadSequenceFromStorage(id, seq)) {
                    sequences.push_back(seq);
                }
            }
        }
        file = root.openNextFile();
    }
    
    return sequences;
}

bool SequenceManager::play(const String& sequenceId, uint16_t fromStep) {
    if (!loadSequenceFromStorage(sequenceId, _currentSequence)) {
        return false;
    }
    
    if (fromStep >= _currentSequence.steps.size()) {
        return false;
    }
    
    _state.sequenceId = sequenceId;
    _state.currentStepIndex = fromStep;
    _state.isPlaying = true;
    _state.isPaused = false;
    _state.totalElapsed = 0;
    _state.pausedDuration = 0;
    _state.stepStartTime = millis();
    
    // Apply first step
    if (_currentSequence.steps.size() > 0) {
        applyStep(_currentSequence.steps[fromStep]);
        _state.remainingTime = _currentSequence.steps[fromStep].duration;
    }
    
    return true;
}

bool SequenceManager::pause() {
    if (!_state.isPlaying || _state.isPaused) {
        return false;
    }
    
    _state.isPaused = true;
    _state.pauseTime = millis();
    
    return true;
}

bool SequenceManager::resume() {
    if (!_state.isPlaying || !_state.isPaused) {
        return false;
    }
    
    _state.isPaused = false;
    unsigned long pauseDuration = millis() - _state.pauseTime;
    _state.pausedDuration += pauseDuration;
    
    return true;
}

bool SequenceManager::stop() {
    if (!_state.isPlaying) {
        return false;
    }
    
    _state.isPlaying = false;
    _state.isPaused = false;
    _state.currentStepIndex = 0;
    _state.remainingTime = 0;
    _state.totalElapsed = 0;
    _state.sequenceId = "";
    
    return true;
}

bool SequenceManager::nextStep() {
    if (!_state.isPlaying || _currentSequence.steps.size() == 0) {
        return false;
    }
    
    _state.currentStepIndex++;
    
    // Handle looping
    if (_state.currentStepIndex >= _currentSequence.steps.size()) {
        if (_currentSequence.loop) {
            _state.currentStepIndex = 0;
        } else {
            stop();
            return true;
        }
    }
    
    _state.stepStartTime = millis();
    _state.pausedDuration = 0;
    applyStep(_currentSequence.steps[_state.currentStepIndex]);
    _state.remainingTime = _currentSequence.steps[_state.currentStepIndex].duration;
    
    return true;
}

bool SequenceManager::previousStep() {
    if (!_state.isPlaying || _currentSequence.steps.size() == 0) {
        return false;
    }
    
    if (_state.currentStepIndex > 0) {
        _state.currentStepIndex--;
    } else if (_currentSequence.loop) {
        _state.currentStepIndex = _currentSequence.steps.size() - 1;
    }
    
    _state.stepStartTime = millis();
    _state.pausedDuration = 0;
    applyStep(_currentSequence.steps[_state.currentStepIndex]);
    _state.remainingTime = _currentSequence.steps[_state.currentStepIndex].duration;
    
    return true;
}

PlaybackState SequenceManager::getPlaybackState() {
    return _state;
}

void SequenceManager::update() {
    if (!_state.isPlaying || _state.isPaused || _currentSequence.steps.size() == 0) {
        return;
    }
    
    unsigned long now = millis();
    unsigned long elapsed = now - _state.stepStartTime - _state.pausedDuration;
    
    const SequenceStep& currentStep = _currentSequence.steps[_state.currentStepIndex];
    
    // Skip steps with 0 duration (manual/infinite)
    if (currentStep.duration == 0) {
        return;
    }
    
    _state.totalElapsed = elapsed;
    
    if (elapsed >= currentStep.duration) {
        _state.remainingTime = 0;
        nextStep();
    } else {
        _state.remainingTime = currentStep.duration - elapsed;
    }
}

// Private helper functions

bool SequenceManager::loadSequenceFromStorage(const String& id, Sequence& sequence) {
    String path = "/sequences/" + id + ".json";
    
    File file = LittleFS.open(path, "r");
    if (!file) {
        return false;
    }
    
    StaticJsonDocument<4096> doc;
    DeserializationError error = deserializeJson(doc, file);
    file.close();
    
    if (error) {
        return false;
    }
    
    sequence.id = doc["id"].as<String>();
    sequence.name = doc["name"].as<String>();
    sequence.description = doc["description"].as<String>();
    sequence.loop = doc["loop"];
    sequence.createdAt = doc["createdAt"].as<String>();
    sequence.updatedAt = doc["updatedAt"].as<String>();
    sequence.type = doc["type"].as<String>();
    
    sequence.steps.clear();
    JsonArray stepsArray = doc["steps"];
    for (JsonObject stepObj : stepsArray) {
        SequenceStep step;
        step.effectId = stepObj["effectId"].as<String>();
        step.duration = stepObj["duration"];
        step.transition = parseTransitionType(stepObj["transition"].as<String>());
        step.transitionDuration = stepObj.containsKey("transitionDuration") ? stepObj["transitionDuration"].as<uint16_t>() : 1000;
        
        if (stepObj.containsKey("parameters")) {
            JsonObject params = stepObj["parameters"];
            for (JsonPair kv : params) {
                step.parameters[String(kv.key().c_str())] = kv.value().as<float>();
            }
        }
        
        sequence.steps.push_back(step);
    }
    
    return true;
}

bool SequenceManager::saveSequenceToStorage(const Sequence& sequence) {
    String path = "/sequences/" + sequence.id + ".json";
    
    // Ensure directory exists
    LittleFS.mkdir("/sequences");
    
    StaticJsonDocument<4096> doc;
    
    doc["id"] = sequence.id;
    doc["name"] = sequence.name;
    doc["description"] = sequence.description;
    doc["loop"] = sequence.loop;
    doc["createdAt"] = sequence.createdAt;
    doc["updatedAt"] = sequence.updatedAt;
    doc["type"] = sequence.type;
    
    JsonArray stepsArray = doc.createNestedArray("steps");
    for (const auto& step : sequence.steps) {
        JsonObject stepObj = stepsArray.createNestedObject();
        stepObj["effectId"] = step.effectId;
        stepObj["duration"] = step.duration;
        stepObj["transition"] = transitionTypeToString(step.transition);
        stepObj["transitionDuration"] = step.transitionDuration;
        
        if (!step.parameters.empty()) {
            JsonObject params = stepObj.createNestedObject("parameters");
            for (const auto& param : step.parameters) {
                params[param.first] = param.second;
            }
        }
    }
    
    File file = LittleFS.open(path, "w");
    if (!file) {
        return false;
    }
    
    serializeJson(doc, file);
    file.close();
    
    return true;
}

String SequenceManager::generateSequenceId() {
    return "seq-" + String(millis());
}

String SequenceManager::getCurrentTimestamp() {
    // Simple timestamp (would use RTC in production)
    return String(millis());
}

void SequenceManager::applyStep(const SequenceStep& step) {
    if (_effects == nullptr) return;
    
    // Convert effect ID string to EffectType enum
    // This is a simplified mapping
    EffectType type = EFFECT_SOLID;
    if (step.effectId == "rainbow") type = EFFECT_RAINBOW;
    else if (step.effectId == "chase") type = EFFECT_CHASE;
    else if (step.effectId == "breathe") type = EFFECT_BREATHE;
    else if (step.effectId == "sparkle") type = EFFECT_SPARKLE;
    else if (step.effectId == "fire") type = EFFECT_FIRE;
    else if (step.effectId == "colorflow") type = EFFECT_COLOR_FLOW;
    else if (step.effectId == "strobe") type = EFFECT_STROBE;
    else if (step.effectId == "bars") type = EFFECT_BARS;
    else if (step.effectId == "wave") type = EFFECT_WAVE;
    else if (step.effectId == "confetti") type = EFFECT_CONFETTI;
    else if (step.effectId == "meteor") type = EFFECT_METEOR;
    else if (step.effectId == "noise") type = EFFECT_NOISE;
    else if (step.effectId == "matrix") type = EFFECT_MATRIX;
    else if (step.effectId == "police") type = EFFECT_POLICE;
    else if (step.effectId == "aurora") type = EFFECT_AURORA;
    
    _effects->applyEffect(type, step.parameters);
}

TransitionType SequenceManager::parseTransitionType(const String& type) {
    if (type == "fade") return TRANSITION_FADE;
    if (type == "crossfade") return TRANSITION_CROSSFADE;
    return TRANSITION_INSTANT;
}

String SequenceManager::transitionTypeToString(TransitionType type) {
    switch (type) {
        case TRANSITION_FADE: return "fade";
        case TRANSITION_CROSSFADE: return "crossfade";
        default: return "instant";
    }
}
