#include "SequencesEndpoints.h"
#include <ArduinoJson.h>

void setupSequencesEndpoints(AsyncWebServer& server, SequenceManager& sequenceManager) {
    
    // GET /api/sequences/playback/state - Get playback state
    // IMPORTANT: Register this BEFORE /api/sequences to avoid route matching conflicts
    server.on("/api/sequences/playback/state", HTTP_GET, [&sequenceManager](AsyncWebServerRequest *request) {
        PlaybackState state = sequenceManager.getPlaybackState();
        
        // Return null if nothing is currently playing
        if (!state.isPlaying) {
            request->send(200, "application/json", "null");
            return;
        }
        
        StaticJsonDocument<512> doc;
        doc["sequenceId"] = state.sequenceId;
        doc["currentStepIndex"] = state.currentStepIndex;
        doc["isPlaying"] = state.isPlaying;
        doc["isPaused"] = state.isPaused;
        doc["remainingTime"] = state.remainingTime;
        doc["totalElapsed"] = state.totalElapsed;
        
        String response;
        serializeJson(doc, response);
        request->send(200, "application/json", response);
    });
    
    // GET /api/sequences - Get all sequences
    server.on("/api/sequences", HTTP_GET, [&sequenceManager](AsyncWebServerRequest *request) {
        StaticJsonDocument<4096> doc;
        JsonArray sequences = doc.createNestedArray("sequences");
        
        std::vector<Sequence> seqList = sequenceManager.listSequences();
        
        for (const auto& seq : seqList) {
            JsonObject seqObj = sequences.createNestedObject();
            seqObj["id"] = seq.id;
            seqObj["name"] = seq.name;
            seqObj["description"] = seq.description;
            seqObj["loop"] = seq.loop;
            seqObj["createdAt"] = seq.createdAt;
            seqObj["updatedAt"] = seq.updatedAt;
            seqObj["type"] = seq.type;
            seqObj["stepCount"] = seq.steps.size();
        }
        
        String response;
        serializeJson(doc, response);
        request->send(200, "application/json", response);
    });
    
    // GET /api/sequences/{id} - Get sequence by ID
    server.on("^\\/api\\/sequences\\/([a-zA-Z0-9_-]+)$", HTTP_GET,
        [&sequenceManager](AsyncWebServerRequest *request) {
            String id = request->pathArg(0);
            
            Sequence* seq = sequenceManager.getSequence(id);
            if (seq == nullptr) {
                request->send(404, "application/json", "{\"error\":\"Sequence not found\"}");
                return;
            }
            
            StaticJsonDocument<4096> doc;
            doc["id"] = seq->id;
            doc["name"] = seq->name;
            doc["description"] = seq->description;
            doc["loop"] = seq->loop;
            doc["createdAt"] = seq->createdAt;
            doc["updatedAt"] = seq->updatedAt;
            doc["type"] = seq->type;
            
            JsonArray steps = doc.createNestedArray("steps");
            for (const auto& step : seq->steps) {
                JsonObject stepObj = steps.createNestedObject();
                stepObj["effectId"] = step.effectId;
                stepObj["duration"] = step.duration;
                stepObj["transition"] = step.transition == TRANSITION_FADE ? "fade" : 
                                       step.transition == TRANSITION_CROSSFADE ? "crossfade" : "instant";
                
                JsonObject params = stepObj.createNestedObject("parameters");
                for (const auto& param : step.parameters) {
                    params[param.first] = param.second;
                }
            }
            
            String response;
            serializeJson(doc, response);
            request->send(200, "application/json", response);
        }
    );
    
    // POST /api/sequences - Create sequence
    server.on("/api/sequences", HTTP_POST,
        [](AsyncWebServerRequest *request) { /* handled by body handler */ },
        nullptr,
        [&sequenceManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            if (index == 0) {
                StaticJsonDocument<4096> doc;
                DeserializationError error = deserializeJson(doc, data, len);
                
                if (error) {
                    request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
                    return;
                }
                
                Sequence seq;
                seq.name = doc["name"].as<String>();
                seq.description = doc.containsKey("description") ? doc["description"].as<String>() : "";
                seq.loop = doc.containsKey("loop") ? doc["loop"].as<bool>() : false;
                
                JsonArray stepsArray = doc["steps"];
                for (JsonObject stepObj : stepsArray) {
                    SequenceStep step;
                    step.effectId = stepObj["effectId"].as<String>();
                    step.duration = stepObj.containsKey("duration") ? stepObj["duration"].as<uint32_t>() : 0;
                    
                    String trans = stepObj.containsKey("transition") ? stepObj["transition"].as<String>() : "instant";
                    if (trans == "fade") step.transition = TRANSITION_FADE;
                    else if (trans == "crossfade") step.transition = TRANSITION_CROSSFADE;
                    else step.transition = TRANSITION_INSTANT;
                    
                    step.transitionDuration = 1000;
                    
                    if (stepObj.containsKey("parameters")) {
                        JsonObject params = stepObj["parameters"];
                        for (JsonPair kv : params) {
                            step.parameters[String(kv.key().c_str())] = kv.value().as<float>();
                        }
                    }
                    
                    seq.steps.push_back(step);
                }
                
                if (sequenceManager.createSequence(seq)) {
                    request->send(200, "application/json", "{\"success\":true}");
                } else {
                    request->send(500, "application/json", "{\"error\":\"Failed to create sequence\"}");
                }
            }
        }
    );
    
    // PUT /api/sequences/{id} - Update sequence
    server.on("^\\/api\\/sequences\\/([a-zA-Z0-9_-]+)$", HTTP_PUT,
        [](AsyncWebServerRequest *request) { /* handled by body handler */ },
        nullptr,
        [&sequenceManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            if (index == 0) {
                String id = request->pathArg(0);
                
                StaticJsonDocument<4096> doc;
                DeserializationError error = deserializeJson(doc, data, len);
                
                if (error) {
                    request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
                    return;
                }
                
                Sequence seq;
                seq.name = doc["name"].as<String>();
                seq.description = doc.containsKey("description") ? doc["description"].as<String>() : "";
                seq.loop = doc.containsKey("loop") ? doc["loop"].as<bool>() : false;
                
                JsonArray stepsArray = doc["steps"];
                for (JsonObject stepObj : stepsArray) {
                    SequenceStep step;
                    step.effectId = stepObj["effectId"].as<String>();
                    step.duration = stepObj.containsKey("duration") ? stepObj["duration"].as<uint32_t>() : 0;
                    
                    String trans = stepObj.containsKey("transition") ? stepObj["transition"].as<String>() : "instant";
                    if (trans == "fade") step.transition = TRANSITION_FADE;
                    else if (trans == "crossfade") step.transition = TRANSITION_CROSSFADE;
                    else step.transition = TRANSITION_INSTANT;
                    
                    step.transitionDuration = 1000;
                    
                    if (stepObj.containsKey("parameters")) {
                        JsonObject params = stepObj["parameters"];
                        for (JsonPair kv : params) {
                            step.parameters[String(kv.key().c_str())] = kv.value().as<float>();
                        }
                    }
                    
                    seq.steps.push_back(step);
                }
                
                if (sequenceManager.updateSequence(id, seq)) {
                    request->send(200, "application/json", "{\"success\":true}");
                } else {
                    request->send(404, "application/json", "{\"error\":\"Sequence not found\"}");
                }
            }
        }
    );
    
    // DELETE /api/sequences/{id} - Delete sequence
    server.on("^\\/api\\/sequences\\/([a-zA-Z0-9_-]+)$", HTTP_DELETE,
        [&sequenceManager](AsyncWebServerRequest *request) {
            String id = request->pathArg(0);
            
            if (sequenceManager.deleteSequence(id)) {
                request->send(200, "application/json", "{\"success\":true}");
            } else {
                request->send(404, "application/json", "{\"error\":\"Sequence not found\"}");
            }
        }
    );
    
    // POST /api/sequences/{id}/play - Play sequence
    server.on("^\\/api\\/sequences\\/([a-zA-Z0-9_-]+)\\/play$", HTTP_POST,
        [](AsyncWebServerRequest *request) { /* handled by body handler */ },
        nullptr,
        [&sequenceManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            if (index == 0) {
                String id = request->pathArg(0);
                
                uint16_t fromStep = 0;
                if (len > 0) {
                    StaticJsonDocument<256> doc;
                    deserializeJson(doc, data, len);
                    fromStep = doc.containsKey("fromStep") ? doc["fromStep"].as<uint16_t>() : 0;
                }
                
                if (sequenceManager.play(id, fromStep)) {
                    PlaybackState state = sequenceManager.getPlaybackState();
                    
                    StaticJsonDocument<512> responseDoc;
                    responseDoc["success"] = true;
                    responseDoc["message"] = "Sequence playback started";
                    
                    JsonObject stateObj = responseDoc.createNestedObject("state");
                    stateObj["sequenceId"] = state.sequenceId;
                    stateObj["currentStepIndex"] = state.currentStepIndex;
                    stateObj["isPlaying"] = state.isPlaying;
                    stateObj["isPaused"] = state.isPaused;
                    stateObj["remainingTime"] = state.remainingTime;
                    stateObj["totalElapsed"] = state.totalElapsed;
                    
                    String response;
                    serializeJson(responseDoc, response);
                    request->send(200, "application/json", response);
                } else {
                    request->send(404, "application/json", "{\"error\":\"Sequence not found or invalid\"}");
                }
            }
        }
    );
    
    // POST /api/sequences/pause - Pause sequence
    server.on("/api/sequences/pause", HTTP_POST, [&sequenceManager](AsyncWebServerRequest *request) {
        if (sequenceManager.pause()) {
            request->send(200, "application/json", "{\"success\":true}");
        } else {
            request->send(400, "application/json", "{\"error\":\"No sequence playing or already paused\"}");
        }
    });
    
    // POST /api/sequences/resume - Resume sequence
    server.on("/api/sequences/resume", HTTP_POST, [&sequenceManager](AsyncWebServerRequest *request) {
        if (sequenceManager.resume()) {
            request->send(200, "application/json", "{\"success\":true}");
        } else {
            request->send(400, "application/json", "{\"error\":\"No sequence paused\"}");
        }
    });
    
    // POST /api/sequences/stop - Stop sequence
    server.on("/api/sequences/stop", HTTP_POST, [&sequenceManager](AsyncWebServerRequest *request) {
        if (sequenceManager.stop()) {
            request->send(200, "application/json", "{\"success\":true}");
        } else {
            request->send(400, "application/json", "{\"error\":\"No sequence playing\"}");
        }
    });
    
    // POST /api/sequences/next - Next step
    server.on("/api/sequences/next", HTTP_POST, [&sequenceManager](AsyncWebServerRequest *request) {
        if (sequenceManager.nextStep()) {
            request->send(200, "application/json", "{\"success\":true}");
        } else {
            request->send(400, "application/json", "{\"error\":\"No sequence playing\"}");
        }
    });
    
    // POST /api/sequences/previous - Previous step
    server.on("/api/sequences/previous", HTTP_POST, [&sequenceManager](AsyncWebServerRequest *request) {
        if (sequenceManager.previousStep()) {
            request->send(200, "application/json", "{\"success\":true}");
        } else {
            request->send(400, "application/json", "{\"error\":\"No sequence playing\"}");
        }
    });
}
