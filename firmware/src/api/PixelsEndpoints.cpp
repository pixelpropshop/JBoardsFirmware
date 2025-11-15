#include "PixelsEndpoints.h"
#include <ArduinoJson.h>
#include "config.h"

void setupPixelsEndpoints(AsyncWebServer& server, PixelManager& pixelManager) {
    
    // GET /api/pixels/board - Get board information (same as /api/board/info but under pixels namespace)
    server.on("/api/pixels/board", HTTP_GET, [&pixelManager](AsyncWebServerRequest *request) {
        StaticJsonDocument<512> doc;
        
        doc["variant"] = pixelManager.getBoardVariant();
        doc["outputCount"] = pixelManager.getOutputCount();
        doc["maxPixelsPerOutput"] = pixelManager.getMaxPixelsPerOutput();
        doc["firmwareVersion"] = FIRMWARE_VERSION;
        
        // Available GPIO pins
        JsonArray gpios = doc.createNestedArray("availableGPIOs");
        for (uint8_t i = 1; i <= pixelManager.getOutputCount(); i++) {
            PixelOutput* output = pixelManager.getOutput(i);
            if (output) {
                gpios.add(output->gpio);
            }
        }
        
        String response;
        serializeJson(doc, response);
        
        request->send(200, "application/json", response);
    });
    
    // GET /api/pixels/config - Get pixel configuration
    server.on("/api/pixels/config", HTTP_GET, [&pixelManager](AsyncWebServerRequest *request) {
        StaticJsonDocument<4096> doc;
        pixelManager.getOutputsConfig(doc);
        
        String response;
        serializeJson(doc, response);
        
        request->send(200, "application/json", response);
    });
    
    // PUT /api/pixels/output/{id} - Update pixel output configuration
    server.on("^\\/api\\/pixels\\/output\\/([0-9]+)$", HTTP_PUT,
        [](AsyncWebServerRequest *request) {
            // Request complete handler (no-op since body handler does the work)
        },
        nullptr,
        [&pixelManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            if (index + len == total) {
                // Last chunk - parse the output ID from URL
                String url = request->url();
                int lastSlash = url.lastIndexOf('/');
                String idStr = url.substring(lastSlash + 1);
                uint8_t outputId = idStr.toInt();
                
                // Parse JSON body
                StaticJsonDocument<512> doc;
                DeserializationError error = deserializeJson(doc, data, len);
                
                if (error) {
                    request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
                    return;
                }
                
                // Update output configuration
                if (pixelManager.updateOutput(outputId, doc.as<JsonObject>())) {
                    request->send(200, "application/json", "{\"success\":true}");
                } else {
                    request->send(400, "application/json", "{\"error\":\"Failed to update output\"}");
                }
            }
        }
    );
    
    // POST /api/pixels/output/{id}/test - Test pixel output
    server.on("^\\/api\\/pixels\\/output\\/([0-9]+)\\/test$", HTTP_POST,
        [](AsyncWebServerRequest *request) {
            // Request complete handler (no-op since body handler does the work)
        },
        nullptr,
        [&pixelManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            if (index + len == total) {
                // Parse output ID from URL
                String url = request->url();
                int lastSlash = url.lastIndexOf('/');
                int secondLastSlash = url.lastIndexOf('/', lastSlash - 1);
                String idStr = url.substring(secondLastSlash + 1, lastSlash);
                uint8_t outputId = idStr.toInt();
                
                // Parse JSON body
                StaticJsonDocument<512> doc;
                DeserializationError error = deserializeJson(doc, data, len);
                
                if (error) {
                    request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
                    return;
                }
                
                // Extract test parameters
                String effectId = doc["effectId"] | "rainbow";
                uint8_t brightness = doc["brightness"] | 128;
                JsonObject params = doc["parameters"].as<JsonObject>();
                
                // Test output
                if (pixelManager.testOutput(outputId, effectId, params, brightness)) {
                    request->send(200, "application/json", "{\"success\":true}");
                } else {
                    request->send(400, "application/json", "{\"error\":\"Failed to test output\"}");
                }
            }
        }
    );
    
    // POST /api/pixels/output/{id}/stop - Stop output test
    server.on("^\\/api\\/pixels\\/output\\/([0-9]+)\\/stop$", HTTP_POST,
        [&pixelManager](AsyncWebServerRequest *request) {
            // Parse output ID from URL
            String url = request->url();
            int lastSlash = url.lastIndexOf('/');
            int secondLastSlash = url.lastIndexOf('/', lastSlash - 1);
            String idStr = url.substring(secondLastSlash + 1, lastSlash);
            uint8_t outputId = idStr.toInt();
            
            // Stop test
            pixelManager.stopTest(outputId);
            
            request->send(200, "application/json", "{\"success\":true}");
        }
    );
    
    // POST /api/pixels/test/all - Test all outputs
    server.on("/api/pixels/test/all", HTTP_POST,
        [](AsyncWebServerRequest *request) {
            // Request complete handler (no-op since body handler does the work)
        },
        nullptr,
        [&pixelManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            if (index + len == total) {
                // Parse JSON body
                StaticJsonDocument<512> doc;
                DeserializationError error = deserializeJson(doc, data, len);
                
                if (error) {
                    request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
                    return;
                }
                
                // Extract test parameters
                String effectId = doc["effectId"] | "rainbow";
                uint8_t brightness = doc["brightness"] | 128;
                JsonObject params = doc["parameters"].as<JsonObject>();
                
                // Test all outputs
                if (pixelManager.testAllOutputs(effectId, params, brightness)) {
                    request->send(200, "application/json", "{\"success\":true}");
                } else {
                    request->send(400, "application/json", "{\"error\":\"No outputs tested\"}");
                }
            }
        }
    );
    
    // POST /api/pixels/off - Turn all outputs off
    server.on("/api/pixels/off", HTTP_POST, [&pixelManager](AsyncWebServerRequest *request) {
        pixelManager.turnOffAll();
        request->send(200, "application/json", "{\"success\":true}");
    });
}
