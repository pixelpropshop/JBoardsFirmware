#include "EffectsEndpoints.h"
#include <ArduinoJson.h>

void setupEffectsEndpoints(AsyncWebServer& server, EffectsManager& effectsManager) {
    
    // GET /api/effects/list - Get available effects with their parameters
    server.on("/api/effects/list", HTTP_GET, [&effectsManager](AsyncWebServerRequest *request) {
        StaticJsonDocument<4096> doc;
        JsonArray effects = doc.createNestedArray("effects");
        
        std::vector<String> effectNames = effectsManager.getAvailableEffects();
        
        for (size_t i = 0; i < effectNames.size(); i++) {
            JsonObject effect = effects.createNestedObject();
            effect["id"] = i;
            effect["name"] = effectNames[i];
            
            // Get parameters for this effect
            std::vector<EffectParameter> params = effectsManager.getEffectParameters((EffectType)i);
            JsonArray parameters = effect.createNestedArray("parameters");
            
            for (const auto& param : params) {
                JsonObject p = parameters.createNestedObject();
                p["name"] = param.name;
                p["type"] = param.type;
                p["value"] = param.value;
                p["min"] = param.min;
                p["max"] = param.max;
                
                if (!param.options.empty()) {
                    JsonArray opts = p.createNestedArray("options");
                    for (const auto& opt : param.options) {
                        opts.add(opt);
                    }
                }
            }
        }
        
        String response;
        serializeJson(doc, response);
        request->send(200, "application/json", response);
    });
    
    // GET /api/effects/current - Get current effect state
    server.on("/api/effects/current", HTTP_GET, [&effectsManager](AsyncWebServerRequest *request) {
        StaticJsonDocument<2048> doc;
        
        EffectState state = effectsManager.getCurrentState();
        
        doc["type"] = (int)state.type;
        doc["brightness"] = state.brightness;
        doc["power"] = state.power;
        
        JsonObject params = doc.createNestedObject("parameters");
        for (const auto& param : state.parameters) {
            params[param.first] = param.second;
        }
        
        String response;
        serializeJson(doc, response);
        request->send(200, "application/json", response);
    });
    
    // POST /api/effects/apply - Apply an effect with parameters
    server.on("/api/effects/apply", HTTP_POST,
        [](AsyncWebServerRequest *request) { /* handled by body handler */ },
        nullptr,
        [&effectsManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            if (index == 0) {
                StaticJsonDocument<1024> doc;
                DeserializationError error = deserializeJson(doc, data, len);
                
                if (error) {
                    request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
                    return;
                }
                
                if (!doc.containsKey("type")) {
                    request->send(400, "application/json", "{\"error\":\"Missing type field\"}");
                    return;
                }
                
                int effectType = doc["type"];
                
                // Parse parameters
                std::map<String, float> parameters;
                if (doc.containsKey("parameters")) {
                    JsonObject params = doc["parameters"];
                    for (JsonPair kv : params) {
                        parameters[String(kv.key().c_str())] = kv.value().as<float>();
                    }
                }
                
                bool success = effectsManager.applyEffect((EffectType)effectType, parameters);
                
                if (success) {
                    request->send(200, "application/json", "{\"success\":true}");
                } else {
                    request->send(500, "application/json", "{\"error\":\"Failed to apply effect\"}");
                }
            }
        }
    );
    
    // PUT /api/effects/power - Set power on/off
    server.on("/api/effects/power", HTTP_PUT,
        [](AsyncWebServerRequest *request) { /* handled by body handler */ },
        nullptr,
        [&effectsManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            if (index == 0) {
                StaticJsonDocument<256> doc;
                DeserializationError error = deserializeJson(doc, data, len);
                
                if (error) {
                    request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
                    return;
                }
                
                if (!doc.containsKey("power")) {
                    request->send(400, "application/json", "{\"error\":\"Missing power field\"}");
                    return;
                }
                
                bool power = doc["power"];
                bool success = effectsManager.setPower(power);
                
                if (success) {
                    request->send(200, "application/json", "{\"success\":true}");
                } else {
                    request->send(500, "application/json", "{\"error\":\"Failed to set power\"}");
                }
            }
        }
    );
    
    // PUT /api/effects/brightness - Set brightness
    server.on("/api/effects/brightness", HTTP_PUT,
        [](AsyncWebServerRequest *request) { /* handled by body handler */ },
        nullptr,
        [&effectsManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            if (index == 0) {
                StaticJsonDocument<256> doc;
                DeserializationError error = deserializeJson(doc, data, len);
                
                if (error) {
                    request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
                    return;
                }
                
                if (!doc.containsKey("brightness")) {
                    request->send(400, "application/json", "{\"error\":\"Missing brightness field\"}");
                    return;
                }
                
                int brightness = doc["brightness"];
                bool success = effectsManager.setBrightness(brightness);
                
                if (success) {
                    request->send(200, "application/json", "{\"success\":true}");
                } else {
                    request->send(400, "application/json", "{\"error\":\"Invalid brightness value (0-255)\"}");
                }
            }
        }
    );
    
    // POST /api/effects/presets/load - Load a preset by ID (body-based)
    // MUST come BEFORE /api/effects/presets POST to avoid route collision
    server.on("/api/effects/presets/load", HTTP_POST,
        [](AsyncWebServerRequest *request) { /* handled by body handler */ },
        nullptr,
        [&effectsManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            if (index == 0) {
                StaticJsonDocument<256> doc;
                DeserializationError error = deserializeJson(doc, data, len);
                
                if (error) {
                    request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
                    return;
                }
                
                if (!doc.containsKey("id")) {
                    request->send(400, "application/json", "{\"error\":\"Missing id field\"}");
                    return;
                }
                
                String id = doc["id"].as<String>();
                
                bool success = effectsManager.loadPreset(id);
                
                if (success) {
                    request->send(200, "application/json", "{\"success\":true}");
                } else {
                    request->send(404, "application/json", "{\"error\":\"Preset not found\"}");
                }
            }
        }
    );
    
    // POST /api/effects/presets - Save a preset
    server.on("/api/effects/presets", HTTP_POST,
        [](AsyncWebServerRequest *request) { /* handled by body handler */ },
        nullptr,
        [&effectsManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            if (index == 0) {
                StaticJsonDocument<512> doc;
                DeserializationError error = deserializeJson(doc, data, len);
                
                if (error) {
                    request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
                    return;
                }
                
                if (!doc.containsKey("id") || !doc.containsKey("name")) {
                    request->send(400, "application/json", "{\"error\":\"Missing id or name field\"}");
                    return;
                }
                
                String id = doc["id"].as<String>();
                String name = doc["name"].as<String>();
                
                bool success = effectsManager.savePreset(id, name);
                
                if (success) {
                    request->send(200, "application/json", "{\"success\":true}");
                } else {
                    request->send(500, "application/json", "{\"error\":\"Failed to save preset\"}");
                }
            }
        }
    );
    
    // GET /api/effects/presets - List all presets
    server.on("/api/effects/presets", HTTP_GET, [&effectsManager](AsyncWebServerRequest *request) {
        StaticJsonDocument<4096> doc;
        JsonArray presets = doc.createNestedArray("presets");
        
        std::vector<EffectPreset> presetList = effectsManager.listPresets();
        
        for (const auto& preset : presetList) {
            JsonObject p = presets.createNestedObject();
            p["id"] = preset.id;
            p["name"] = preset.name;
            p["type"] = (int)preset.type;
            p["brightness"] = preset.brightness;
            
            JsonObject params = p.createNestedObject("parameters");
            for (const auto& param : preset.parameters) {
                params[param.first] = param.second;
            }
        }
        
        String response;
        serializeJson(doc, response);
        request->send(200, "application/json", response);
    });
    
    // DELETE /api/effects/presets/:id - Delete a preset
    server.on("^\\/api\\/effects\\/presets\\/([^/]+)$", HTTP_DELETE, 
        [&effectsManager](AsyncWebServerRequest *request) {
            String id = request->pathArg(0);
            
            bool success = effectsManager.deletePreset(id);
            
            if (success) {
                request->send(200, "application/json", "{\"success\":true}");
            } else {
                request->send(404, "application/json", "{\"error\":\"Preset not found\"}");
            }
        }
    );
    
}
