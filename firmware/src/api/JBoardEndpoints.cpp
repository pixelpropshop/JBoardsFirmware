#include "JBoardEndpoints.h"
#include <ArduinoJson.h>

void setupJBoardEndpoints(AsyncWebServer& server, JBoardNetworkManager& jboardManager) {
    
    // 1. GET /api/jboard/device - Get this device information
    server.on("/api/jboard/device", HTTP_GET, [&jboardManager](AsyncWebServerRequest *request) {
        JBoardDevice device = jboardManager.getThisDevice();
        
        StaticJsonDocument<512> doc;
        doc["name"] = device.name;
        doc["macAddress"] = device.macAddress;
        doc["ipAddress"] = device.ipAddress;
        doc["deviceType"] = (uint8_t)device.deviceType;
        doc["capabilities"] = device.capabilities;
        doc["firmware"] = device.firmware;
        doc["enabled"] = jboardManager.isEnabled();
        
        String response;
        serializeJson(doc, response);
        request->send(200, "application/json", response);
    });
    
    // GET /api/jboard/status - Get JBoard Network status
    server.on("/api/jboard/status", HTTP_GET, [&jboardManager](AsyncWebServerRequest *request) {
        StaticJsonDocument<512> doc;
        doc["enabled"] = jboardManager.isEnabled();
        doc["peerCount"] = jboardManager.getPeers().size();
        
        JBoardDevice device = jboardManager.getThisDevice();
        doc["device"]["name"] = device.name;
        doc["device"]["macAddress"] = device.macAddress;
        doc["device"]["ipAddress"] = device.ipAddress;
        
        String response;
        serializeJson(doc, response);
        request->send(200, "application/json", response);
    });
    
    // POST /api/jboard/network/enabled - Enable or disable JBoard Network
    server.on("/api/jboard/network/enabled", HTTP_POST,
        [](AsyncWebServerRequest *request) {
            // Handle response in body handler
        },
        nullptr,
        [&jboardManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            if (index + len == total) {
                StaticJsonDocument<256> doc;
                DeserializationError error = deserializeJson(doc, data, len);
                
                if (error) {
                    request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
                    return;
                }
                
                if (!doc.containsKey("enabled")) {
                    request->send(400, "application/json", "{\"error\":\"Missing 'enabled' field\"}");
                    return;
                }
                
                bool enabled = doc["enabled"];
                jboardManager.setEnabled(enabled);
                
                StaticJsonDocument<128> response;
                response["success"] = true;
                response["enabled"] = enabled;
                response["message"] = enabled ? "JBoard Network enabled" : "JBoard Network disabled";
                
                String result;
                serializeJson(response, result);
                request->send(200, "application/json", result);
            }
        }
    );
    
    // 2. GET /api/jboard/peers - Get connected peers
    server.on("/api/jboard/peers", HTTP_GET, [&jboardManager](AsyncWebServerRequest *request) {
        std::vector<JBoardPeer> peers = jboardManager.getPeers();
        
        StaticJsonDocument<4096> doc;
        JsonArray peersArray = doc.to<JsonArray>();
        
        for (const auto& peer : peers) {
            JsonObject peerObj = peersArray.createNestedObject();
            peerObj["name"] = peer.device.name;
            peerObj["macAddress"] = peer.device.macAddress;
            peerObj["ipAddress"] = peer.device.ipAddress;
            peerObj["deviceType"] = (uint8_t)peer.device.deviceType;
            peerObj["capabilities"] = peer.device.capabilities;
            peerObj["rssi"] = peer.device.rssi;
            peerObj["lastSeen"] = peer.device.lastSeen;
            peerObj["firmware"] = peer.device.firmware;
        }
        
        String response;
        serializeJson(doc, response);
        request->send(200, "application/json", response);
    });
    
    // 3. POST /api/jboard/scan - Start device scan
    server.on("/api/jboard/scan", HTTP_POST, [&jboardManager](AsyncWebServerRequest *request) {
        if (jboardManager.startScan()) {
            // Wait a moment for initial responses
            delay(1000);
            
            std::vector<JBoardDevice> devices = jboardManager.getScannedDevices();
            
            StaticJsonDocument<4096> doc;
            doc["success"] = true;
            doc["message"] = "Scan started";
            
            JsonArray devicesArray = doc.createNestedArray("devices");
            for (const auto& device : devices) {
                JsonObject deviceObj = devicesArray.createNestedObject();
                deviceObj["name"] = device.name;
                deviceObj["macAddress"] = device.macAddress;
                deviceObj["ipAddress"] = device.ipAddress;
                deviceObj["deviceType"] = (uint8_t)device.deviceType;
                deviceObj["capabilities"] = device.capabilities;
                deviceObj["rssi"] = device.rssi;
                deviceObj["firmware"] = device.firmware;
            }
            
            String response;
            serializeJson(doc, response);
            request->send(200, "application/json", response);
        } else {
            request->send(500, "application/json", "{\"error\":\"Failed to start scan\"}");
        }
    });
    
    // 4. POST /api/jboard/pair - Pair with device
    server.on("/api/jboard/pair", HTTP_POST,
        [](AsyncWebServerRequest *request) {
            // Handle response in body handler
        },
        nullptr,
        [&jboardManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            if (index + len == total) {
                StaticJsonDocument<256> doc;
                DeserializationError error = deserializeJson(doc, data, len);
                
                if (error || !doc.containsKey("macAddress")) {
                    request->send(400, "application/json", "{\"error\":\"Invalid request - macAddress required\"}");
                    return;
                }
                
                String macAddress = doc["macAddress"].as<String>();
                String name = doc.containsKey("name") ? doc["name"].as<String>() : "Unknown Device";
                
                if (jboardManager.addPeer(macAddress, name)) {
                    request->send(200, "application/json", "{\"success\":true,\"message\":\"Device paired successfully\"}");
                } else {
                    request->send(500, "application/json", "{\"error\":\"Failed to pair device\"}");
                }
            }
        }
    );
    
    // 5. DELETE /api/jboard/peers/{macAddress} - Unpair device
    server.on("^\\/api\\/jboard\\/peers\\/([A-Fa-f0-9:]+)$", HTTP_DELETE, [&jboardManager](AsyncWebServerRequest *request) {
        String macAddress = request->pathArg(0);
        
        if (jboardManager.removePeer(macAddress)) {
            request->send(200, "application/json", "{\"success\":true,\"message\":\"Device unpaired successfully\"}");
        } else {
            request->send(404, "application/json", "{\"error\":\"Device not found\"}");
        }
    });
    
    // 6. POST /api/jboard/message - Send message to device
    server.on("/api/jboard/message", HTTP_POST,
        [](AsyncWebServerRequest *request) {
            // Handle response in body handler
        },
        nullptr,
        [&jboardManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            if (index + len == total) {
                StaticJsonDocument<1024> doc;
                DeserializationError error = deserializeJson(doc, data, len);
                
                if (error || !doc.containsKey("to") || !doc.containsKey("command")) {
                    request->send(400, "application/json", "{\"error\":\"Invalid request - to and command required\"}");
                    return;
                }
                
                String to = doc["to"].as<String>();
                String command = doc["command"].as<String>();
                String messageData = "{}";
                
                if (doc.containsKey("data")) {
                    String dataStr;
                    serializeJson(doc["data"], dataStr);
                    messageData = dataStr;
                }
                
                if (jboardManager.sendMessage(to, command, messageData)) {
                    request->send(200, "application/json", "{\"success\":true,\"message\":\"Message sent\"}");
                } else {
                    request->send(500, "application/json", "{\"error\":\"Failed to send message\"}");
                }
            }
        }
    );
    
    // 7. POST /api/jboard/broadcast - Broadcast message
    server.on("/api/jboard/broadcast", HTTP_POST,
        [](AsyncWebServerRequest *request) {
            // Handle response in body handler
        },
        nullptr,
        [&jboardManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            if (index + len == total) {
                StaticJsonDocument<1024> doc;
                DeserializationError error = deserializeJson(doc, data, len);
                
                if (error || !doc.containsKey("command")) {
                    request->send(400, "application/json", "{\"error\":\"Invalid request - command required\"}");
                    return;
                }
                
                String command = doc["command"].as<String>();
                String messageData = "{}";
                
                if (doc.containsKey("data")) {
                    String dataStr;
                    serializeJson(doc["data"], dataStr);
                    messageData = dataStr;
                }
                
                if (jboardManager.broadcastMessage(command, messageData)) {
                    request->send(200, "application/json", "{\"success\":true,\"message\":\"Broadcast sent\"}");
                } else {
                    request->send(500, "application/json", "{\"error\":\"Failed to broadcast message\"}");
                }
            }
        }
    );
    
    // 8. GET /api/jboard/messages - Get received messages
    server.on("/api/jboard/messages", HTTP_GET, [&jboardManager](AsyncWebServerRequest *request) {
        int limit = 50;
        if (request->hasParam("limit")) {
            limit = request->getParam("limit")->value().toInt();
            if (limit > 100) limit = 100;
        }
        
        std::vector<JBoardMessage> messages = jboardManager.getReceivedMessages(limit);
        
        StaticJsonDocument<8192> doc;
        JsonArray messagesArray = doc.to<JsonArray>();
        
        for (const auto& message : messages) {
            JsonObject msgObj = messagesArray.createNestedObject();
            msgObj["id"] = message.id;
            msgObj["from"] = message.from;
            msgObj["fromName"] = message.fromName;
            msgObj["command"] = message.command;
            
            // Parse data as JSON if possible
            StaticJsonDocument<256> dataDoc;
            DeserializationError error = deserializeJson(dataDoc, message.data);
            if (!error) {
                msgObj["data"] = dataDoc.as<JsonObject>();
            } else {
                msgObj["data"] = message.data;
            }
            
            msgObj["rssi"] = message.rssi;
            msgObj["receivedAt"] = message.receivedAt;
        }
        
        String response;
        serializeJson(doc, response);
        request->send(200, "application/json", response);
    });
}
