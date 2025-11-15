#include "NetworkEndpoints.h"
#include <ArduinoJson.h>

void setupNetworkEndpoints(AsyncWebServer& server, NetworkManager& networkManager) {
    // ========================================================================
    // WiFi Station Management
    // ========================================================================
    
    // GET /api/network/wifi - Get WiFi station configuration
    server.on("/api/network/wifi", HTTP_GET, [&networkManager](AsyncWebServerRequest *request) {
        StaticJsonDocument<512> doc;
        
        // Always read from saved config to get password
        Preferences prefs;
        prefs.begin("wifi_config", true);
        String savedPassword = prefs.getString("password", "");
        prefs.end();
        
        // Return current connection data if connected, otherwise saved config
        if (networkManager.isConnected()) {
            doc["ssid"] = WiFi.SSID();
            doc["password"] = savedPassword;  // Return actual password
            doc["ip"] = networkManager.getIP().toString();
            doc["gateway"] = WiFi.gatewayIP().toString();
            doc["subnet"] = WiFi.subnetMask().toString();
            doc["dns"] = WiFi.dnsIP().toString();
            doc["dhcp"] = true;  // If connected without static config, assume DHCP
        } else {
            // Return saved config when not connected
            Preferences prefs2;
            prefs2.begin("wifi_config", true);
            doc["ssid"] = prefs2.getString("ssid", "");
            doc["password"] = savedPassword;  // Return actual password
            doc["ip"] = prefs2.getString("ip", "");
            doc["gateway"] = prefs2.getString("gateway", "192.168.1.1");
            doc["subnet"] = prefs2.getString("subnet", "255.255.255.0");
            doc["dns"] = prefs2.getString("dns", "8.8.8.8");
            doc["dhcp"] = prefs2.getBool("dhcp", true);
            prefs2.end();
        }
        
        String output;
        serializeJson(doc, output);
        request->send(200, "application/json", output);
    });
    
    // POST /api/network/wifi - Update WiFi configuration
    server.on("/api/network/wifi", HTTP_POST,
        [](AsyncWebServerRequest *request) {},
        NULL,
        [&networkManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            StaticJsonDocument<512> doc;
            DeserializationError error = deserializeJson(doc, data);
            
            if (error) {
                request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
                return;
            }
            
            String ssid = doc["ssid"] | "";
            String password = doc["password"] | "";
            
            if (ssid.length() == 0) {
                request->send(400, "application/json", "{\"error\":\"SSID required\"}");
                return;
            }
            
            // Save configuration to NVS first
            Preferences prefs;
            prefs.begin("wifi_config", false);
            prefs.putString("ssid", ssid);
            prefs.putString("password", password);
            prefs.putBool("dhcp", doc["dhcp"] | true);
            
            if (doc.containsKey("dhcp") && !doc["dhcp"].as<bool>()) {
                // Save static IP configuration
                prefs.putString("ip", doc["ip"] | "");
                prefs.putString("gateway", doc["gateway"] | "");
                prefs.putString("subnet", doc["subnet"] | "255.255.255.0");
                prefs.putString("dns", doc["dns"] | "8.8.8.8");
            } else {
                // Clear static IP config for DHCP
                prefs.putString("ip", "");
                prefs.putString("gateway", "");
                prefs.putString("subnet", "");
                prefs.putString("dns", "");
            }
            prefs.end();
            
            // Send response FIRST before triggering reconnection
            StaticJsonDocument<128> response;
            response["success"] = true;
            response["message"] = "WiFi configuration saved. Reconnecting...";
            
            String output;
            serializeJson(response, output);
            request->send(200, "application/json", output);
            
            // Create a task to reconnect after response is sent (3 second delay)
            xTaskCreate([](void* params) {
                NetworkManager* nm = (NetworkManager*)params;
                vTaskDelay(3000 / portTICK_PERIOD_MS);
                
                Serial.println("[WiFi] Starting connection task...");
                
                // Read config from NVS
                Preferences prefs;
                prefs.begin("wifi_config", true);
                String ssid = prefs.getString("ssid", "");
                String password = prefs.getString("password", "");
                bool dhcp = prefs.getBool("dhcp", true);
                
                bool success = false;
                
                if (!dhcp) {
                    IPAddress ip, gateway, subnet, dns1, dns2;
                    ip.fromString(prefs.getString("ip", ""));
                    gateway.fromString(prefs.getString("gateway", ""));
                    subnet.fromString(prefs.getString("subnet", "255.255.255.0"));
                    dns1.fromString(prefs.getString("dns", "8.8.8.8"));
                    dns2.fromString("8.8.4.4");
                    prefs.end();
                    
                    success = nm->connectToWiFi(ssid, password, ip, gateway, subnet, dns1, dns2);
                } else {
                    prefs.end();
                    success = nm->connectToWiFi(ssid, password);
                }
                
                if (success) {
                    Serial.println("[WiFi] Connection successful");
                } else {
                    Serial.println("[WiFi] Connection failed, AP mode will remain active");
                    // Auto-reconnect will handle retries and AP fallback
                }
                
                vTaskDelete(NULL);
            }, "wifi_reconnect", 4096, &networkManager, 1, NULL);
        }
    );
    
    // 1. POST /api/network/wifi/connect - Connect to WiFi
    server.on("/api/network/wifi/connect", HTTP_POST,
        [](AsyncWebServerRequest *request) {}, 
        NULL,
        [&networkManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            StaticJsonDocument<512> doc;
            DeserializationError error = deserializeJson(doc, data);
            
            if (error) {
                request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
                return;
            }
            
            String ssid = doc["ssid"] | "";
            String password = doc["password"] | "";
            
            if (ssid.length() == 0) {
                request->send(400, "application/json", "{\"error\":\"SSID required\"}");
                return;
            }
            
            bool success = false;
            
            if (doc.containsKey("staticIP")) {
                IPAddress ip, gateway, subnet, dns1, dns2;
                ip.fromString(doc["staticIP"]["ip"] | "");
                gateway.fromString(doc["staticIP"]["gateway"] | "");
                subnet.fromString(doc["staticIP"]["subnet"] | "255.255.255.0");
                dns1.fromString(doc["staticIP"]["dns1"] | "8.8.8.8");
                dns2.fromString(doc["staticIP"]["dns2"] | "8.8.4.4");
                
                success = networkManager.connectToWiFi(ssid, password, ip, gateway, subnet, dns1, dns2);
            } else {
                success = networkManager.connectToWiFi(ssid, password);
            }
            
            StaticJsonDocument<128> response;
            response["success"] = success;
            response["connected"] = networkManager.isConnected();
            if (success) {
                response["ip"] = networkManager.getIP().toString();
            }
            
            String output;
            serializeJson(response, output);
            request->send(success ? 200 : 400, "application/json", output);
        }
    );
    
    // 2. POST /api/network/wifi/disconnect - Disconnect from WiFi
    server.on("/api/network/wifi/disconnect", HTTP_POST, [&networkManager](AsyncWebServerRequest *request) {
        networkManager.disconnectWiFi();
        request->send(200, "application/json", "{\"success\":true}");
    });
    
    // ========================================================================
    // Access Point Management
    // ========================================================================
    
    // GET /api/network/ap - Get Access Point configuration
    server.on("/api/network/ap", HTTP_GET, [&networkManager](AsyncWebServerRequest *request) {
        Preferences prefs;
        prefs.begin("ap_config", true);
        
        StaticJsonDocument<512> doc;
        doc["ssid"] = prefs.getString("ssid", "JSenseBoard");
        doc["password"] = prefs.getString("password", "");  // Return actual password
        doc["ip"] = networkManager.isAPActive() ? networkManager.getAPIP().toString() : "192.168.4.1";
        doc["channel"] = prefs.getInt("channel", 6);
        doc["hidden"] = prefs.getBool("hidden", false);
        doc["maxClients"] = prefs.getInt("maxClients", 4);
        doc["keepActive"] = prefs.getBool("keepActive", false);
        
        prefs.end();
        
        String output;
        serializeJson(doc, output);
        request->send(200, "application/json", output);
    });
    
    // POST /api/network/ap - Update Access Point configuration
    server.on("/api/network/ap", HTTP_POST,
        [](AsyncWebServerRequest *request) {},
        NULL,
        [&networkManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            StaticJsonDocument<256> doc;
            DeserializationError error = deserializeJson(doc, data);
            
            if (error) {
                request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
                return;
            }
            
            String ssid = doc["ssid"] | "JSenseBoard";
            String password = doc["password"] | "";
            int channel = doc["channel"] | 6;
            bool hidden = doc["hidden"] | false;
            int maxConnections = doc["maxClients"] | 4;
            bool keepActive = doc["keepActive"] | false;
            
            // Save keepActive setting to NVS
            Preferences prefs;
            prefs.begin("ap_config", false);
            prefs.putBool("keepActive", keepActive);
            prefs.end();
            
            // Stop current AP if active
            if (networkManager.isAPActive()) {
                networkManager.stopAP();
            }
            
            // Start AP with new configuration
            bool success = networkManager.startAP(ssid, password, channel, hidden, maxConnections);
            
            StaticJsonDocument<128> response;
            response["success"] = success;
            if (success) {
                response["ip"] = networkManager.getAPIP().toString();
                response["message"] = "Access Point configuration updated successfully";
            }
            
            String output;
            serializeJson(response, output);
            request->send(success ? 200 : 400, "application/json", output);
        }
    );
    
    // 3. POST /api/network/ap/start - Start Access Point
    server.on("/api/network/ap/start", HTTP_POST,
        [](AsyncWebServerRequest *request) {},
        NULL,
        [&networkManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            StaticJsonDocument<256> doc;
            DeserializationError error = deserializeJson(doc, data);
            
            if (error) {
                request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
                return;
            }
            
            String ssid = doc["ssid"] | "JSenseBoard";
            String password = doc["password"] | "jsenseboard";
            int channel = doc["channel"] | 6;
            bool hidden = doc["hidden"] | false;
            int maxConnections = doc["maxConnections"] | 4;
            
            bool success = networkManager.startAP(ssid, password, channel, hidden, maxConnections);
            
            StaticJsonDocument<128> response;
            response["success"] = success;
            if (success) {
                response["ip"] = networkManager.getAPIP().toString();
            }
            
            String output;
            serializeJson(response, output);
            request->send(success ? 200 : 400, "application/json", output);
        }
    );
    
    // 4. POST /api/network/ap/stop - Stop Access Point
    server.on("/api/network/ap/stop", HTTP_POST, [&networkManager](AsyncWebServerRequest *request) {
        networkManager.stopAP();
        request->send(200, "application/json", "{\"success\":true}");
    });
    
    // ========================================================================
    // Network Status
    // ========================================================================
    
    // 5. GET /api/network/status - Get network status
    server.on("/api/network/status", HTTP_GET, [&networkManager](AsyncWebServerRequest *request) {
        StaticJsonDocument<512> doc;
        
        // Flat structure to match frontend NetworkStatus interface
        doc["wifiConnected"] = networkManager.isConnected();
        doc["wifiRSSI"] = networkManager.isConnected() ? networkManager.getRSSI() : 0;
        doc["wifiIP"] = networkManager.isConnected() ? networkManager.getIP().toString() : "";
        doc["apActive"] = networkManager.isAPActive();
        doc["apClients"] = networkManager.isAPActive() ? networkManager.getAPClientCount() : 0;
        
        String output;
        serializeJson(doc, output);
        request->send(200, "application/json", output);
    });
    
    // ========================================================================
    // WiFi Scanning
    // ========================================================================
    
    // 6. GET /api/network/scan - Scan for WiFi networks
    server.on("/api/network/scan", HTTP_GET, [&networkManager](AsyncWebServerRequest *request) {
        int n = networkManager.scanNetworks();
        
        if (n == -1) {
            request->send(500, "application/json", "{\"error\":\"Scan failed\"}");
            return;
        }
        
        // Return scan results
        String results = networkManager.getScanResults();
        request->send(200, "application/json", results);
    });
    
    // ========================================================================
    // Hostname & mDNS
    // ========================================================================
    
    // 7. POST /api/network/hostname - Set hostname
    server.on("/api/network/hostname", HTTP_POST,
        [](AsyncWebServerRequest *request) {},
        NULL,
        [&networkManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            StaticJsonDocument<128> doc;
            DeserializationError error = deserializeJson(doc, data);
            
            if (error) {
                request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
                return;
            }
            
            String hostname = doc["hostname"] | "";
            bool mdnsEnabled = doc["mdnsEnabled"] | true;
            
            if (hostname.length() == 0) {
                request->send(400, "application/json", "{\"error\":\"Hostname required\"}");
                return;
            }
            
            // Save hostname and mdnsEnabled to NVS
            Preferences prefs;
            prefs.begin("network", false);
            prefs.putString("hostname", hostname);
            prefs.putBool("mdnsEnabled", mdnsEnabled);
            prefs.end();
            
            bool success = networkManager.setHostname(hostname);
            
            // Only start mDNS if enabled
            if (mdnsEnabled) {
                networkManager.startMDNS(hostname);
            } else {
                // Stop mDNS if it's running
                MDNS.end();
            }
            
            StaticJsonDocument<128> response;
            response["success"] = success;
            response["hostname"] = hostname;
            response["message"] = "Hostname configuration saved successfully";
            
            String output;
            serializeJson(response, output);
            request->send(200, "application/json", output);
        }
    );
    
    // 8. GET /api/network/hostname - Get hostname
    server.on("/api/network/hostname", HTTP_GET, [&networkManager](AsyncWebServerRequest *request) {
        StaticJsonDocument<128> doc;
        doc["hostname"] = networkManager.getHostname();
        
        // Load mdnsEnabled from NVS
        Preferences prefs;
        prefs.begin("network", true);
        doc["mdnsEnabled"] = prefs.getBool("mdnsEnabled", true);
        prefs.end();
        
        String output;
        serializeJson(doc, output);
        request->send(200, "application/json", output);
    });
    
    // ========================================================================
    // WiFi Profiles
    // ========================================================================
    
    // 9. GET /api/network/profiles - List all WiFi profiles
    server.on("/api/network/profiles", HTTP_GET, [&networkManager](AsyncWebServerRequest *request) {
        String profiles = networkManager.getAllProfiles();
        request->send(200, "application/json", profiles);
    });
    
    // 10. POST /api/network/profiles/priority - Update profile priority (SSID in body)
    // IMPORTANT: This must be registered BEFORE ALL other profile routes to avoid route collision
    server.on("/api/network/profiles/priority", HTTP_POST,
        [](AsyncWebServerRequest *request) {},
        NULL,
        [&networkManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            Serial.println("[Priority] Body handler called");
            
            // Only process when we have all the data
            if (index + len != total) {
                return;
            }
            
            Serial.printf("[Priority] Body data: %.*s\n", len, (char*)data);
            
            StaticJsonDocument<256> doc;
            DeserializationError error = deserializeJson(doc, data, len);
            
            if (error) {
                Serial.printf("[Priority] JSON parse error: %s\n", error.c_str());
                request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
                return;
            }
            
            if (!doc.containsKey("ssid")) {
                Serial.println("[Priority] Missing 'ssid' field");
                request->send(400, "application/json", "{\"error\":\"Missing ssid field\"}");
                return;
            }
            
            if (!doc.containsKey("priority")) {
                Serial.println("[Priority] Missing 'priority' field");
                request->send(400, "application/json", "{\"error\":\"Missing priority field\"}");
                return;
            }
            
            String ssid = doc["ssid"].as<String>();
            int priority = doc["priority"];
            Serial.printf("[Priority] Updating '%s' to priority %d\n", ssid.c_str(), priority);
            
            bool success = networkManager.updateProfilePriority(ssid, priority);
            
            Serial.printf("[Priority] Result: %s\n", success ? "success" : "failed");
            
            StaticJsonDocument<128> response;
            response["success"] = success;
            
            String output;
            serializeJson(response, output);
            request->send(success ? 200 : 404, "application/json", output);
        }
    );
    
    // 11. POST /api/network/profiles - Create WiFi profile
    server.on("/api/network/profiles", HTTP_POST,
        [](AsyncWebServerRequest *request) {},
        NULL,
        [&networkManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            StaticJsonDocument<512> doc;
            DeserializationError error = deserializeJson(doc, data);
            
            if (error) {
                request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
                return;
            }
            
            WiFiProfile profile;
            profile.ssid = doc["ssid"] | "";
            profile.password = doc["password"] | "";
            profile.name = doc["name"] | "";
            profile.priority = doc["priority"] | 0;
            profile.useStaticIP = doc["useStaticIP"] | false;
            
            if (profile.ssid.length() == 0) {
                request->send(400, "application/json", "{\"error\":\"SSID required\"}");
                return;
            }
            
            if (profile.useStaticIP) {
                profile.staticIP.fromString(doc["staticIP"]["ip"] | "");
                profile.gateway.fromString(doc["staticIP"]["gateway"] | "");
                profile.subnet.fromString(doc["staticIP"]["subnet"] | "255.255.255.0");
                profile.dns1.fromString(doc["staticIP"]["dns1"] | "8.8.8.8");
                profile.dns2.fromString(doc["staticIP"]["dns2"] | "8.8.4.4");
            }
            
            bool success = networkManager.saveProfile(profile);
            
            StaticJsonDocument<128> response;
            response["success"] = success;
            
            String output;
            serializeJson(response, output);
            request->send(success ? 200 : 400, "application/json", output);
        }
    );
    
    // 12. GET /api/network/profiles/:ssid - Get specific profile
    server.on("^\\/api\\/network\\/profiles\\/([^/]+)$", HTTP_GET, [&networkManager](AsyncWebServerRequest *request) {
        String ssid = request->pathArg(0);
        WiFiProfile* profile = networkManager.getProfile(ssid);
        
        if (profile == nullptr) {
            request->send(404, "application/json", "{\"error\":\"Profile not found\"}");
            return;
        }
        
        StaticJsonDocument<512> doc;
        doc["ssid"] = profile->ssid;
        doc["priority"] = profile->priority;
        doc["useStaticIP"] = profile->useStaticIP;
        
        if (profile->useStaticIP) {
            doc["staticIP"]["ip"] = profile->staticIP.toString();
            doc["staticIP"]["gateway"] = profile->gateway.toString();
            doc["staticIP"]["subnet"] = profile->subnet.toString();
        }
        
        String output;
        serializeJson(doc, output);
        request->send(200, "application/json", output);
    });
    
    // 13. PUT /api/network/profiles/:ssid - Update profile (same as create)
    server.on("^\\/api\\/network\\/profiles\\/([^/]+)$", HTTP_PUT,
        [](AsyncWebServerRequest *request) {},
        NULL,
        [&networkManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            StaticJsonDocument<512> doc;
            DeserializationError error = deserializeJson(doc, data);
            
            if (error) {
                request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
                return;
            }
            
            WiFiProfile profile;
            profile.ssid = request->pathArg(0);
            profile.password = doc["password"] | "";
            profile.name = doc["name"] | "";
            profile.priority = doc["priority"] | 0;
            profile.useStaticIP = doc["useStaticIP"] | false;
            
            if (profile.useStaticIP) {
                profile.staticIP.fromString(doc["staticIP"]["ip"] | "");
                profile.gateway.fromString(doc["staticIP"]["gateway"] | "");
                profile.subnet.fromString(doc["staticIP"]["subnet"] | "255.255.255.0");
                profile.dns1.fromString(doc["staticIP"]["dns1"] | "8.8.8.8");
                profile.dns2.fromString(doc["staticIP"]["dns2"] | "8.8.4.4");
            }
            
            bool success = networkManager.saveProfile(profile);
            
            StaticJsonDocument<128> response;
            response["success"] = success;
            
            String output;
            serializeJson(response, output);
            request->send(success ? 200 : 400, "application/json", output);
        }
    );
    
    // 14. POST /api/network/profiles/:ssid/connect - Connect to a specific profile
    server.on("^\\/api\\/network\\/profiles\\/([^/]+)\\/connect$", HTTP_POST, [&networkManager](AsyncWebServerRequest *request) {
        String ssid = request->pathArg(0);
        WiFiProfile* profile = networkManager.getProfile(ssid);
        
        if (profile == nullptr) {
            request->send(404, "application/json", "{\"error\":\"Profile not found\"}");
            return;
        }
        
        Serial.print("[Profiles] Connecting to profile: ");
        Serial.println(ssid);
        
        bool success;
        if (profile->useStaticIP) {
            success = networkManager.connectToWiFi(profile->ssid, profile->password,
                                                  profile->staticIP, profile->gateway, profile->subnet,
                                                  profile->dns1, profile->dns2);
        } else {
            success = networkManager.connectToWiFi(profile->ssid, profile->password);
        }
        
        StaticJsonDocument<128> response;
        response["success"] = success;
        if (success) {
            response["message"] = "Connected to WiFi profile";
        } else {
            response["message"] = "Failed to connect to WiFi profile";
        }
        
        String output;
        serializeJson(response, output);
        request->send(success ? 200 : 400, "application/json", output);
    });
    
    // 15. DELETE /api/network/profiles/:ssid - Delete profile
    server.on("^\\/api\\/network\\/profiles\\/([^/]+)$", HTTP_DELETE, [&networkManager](AsyncWebServerRequest *request) {
        String ssid = request->pathArg(0);
        bool success = networkManager.deleteProfile(ssid);
        
        StaticJsonDocument<128> doc;
        doc["success"] = success;
        
        String output;
        serializeJson(doc, output);
        request->send(success ? 200 : 404, "application/json", output);
    });
    
    // ========================================================================
    // Auto-Reconnect
    // ========================================================================
    
    // GET /api/network/autoreconnect - Get auto-reconnect configuration
    server.on("/api/network/autoreconnect", HTTP_GET, [&networkManager](AsyncWebServerRequest *request) {
        Preferences prefs;
        prefs.begin("network", true);
        
        StaticJsonDocument<256> doc;
        doc["enabled"] = prefs.getBool("autoReconnect", true);
        doc["maxAttempts"] = prefs.getInt("maxAttempts", 5);
        doc["attemptInterval"] = prefs.getInt("reconnectInterval", 30);
        doc["fallbackToAP"] = prefs.getBool("fallbackToAP", true);
        
        prefs.end();
        
        String output;
        serializeJson(doc, output);
        request->send(200, "application/json", output);
    });
    
    // POST /api/network/autoreconnect - Update auto-reconnect configuration
    server.on("/api/network/autoreconnect", HTTP_POST,
        [](AsyncWebServerRequest *request) {},
        NULL,
        [&networkManager](AsyncWebServerRequest *request, uint8_t *data, size_t len, size_t index, size_t total) {
            StaticJsonDocument<256> doc;
            DeserializationError error = deserializeJson(doc, data);
            
            if (error) {
                request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
                return;
            }
            
            bool enabled = doc["enabled"] | true;
            int maxAttempts = doc["maxAttempts"] | 5;
            int attemptInterval = doc["attemptInterval"] | 30;  // Changed from "interval"
            bool fallbackToAP = doc["fallbackToAP"] | true;
            
            // Save to NVS
            Preferences prefs;
            prefs.begin("network", false);
            prefs.putBool("autoReconnect", enabled);
            prefs.putInt("maxAttempts", maxAttempts);
            prefs.putInt("reconnectInterval", attemptInterval);
            prefs.putBool("fallbackToAP", fallbackToAP);
            prefs.end();
            
            // Convert seconds to milliseconds for the enableAutoReconnect function
            networkManager.enableAutoReconnect(enabled, maxAttempts, attemptInterval * 1000);
            
            StaticJsonDocument<128> response;
            response["success"] = true;
            response["message"] = "Auto-reconnect settings saved successfully";
            
            String output;
            serializeJson(response, output);
            request->send(200, "application/json", output);
        }
    );
    
    // 17. GET /api/network/auto-reconnect - Get auto-reconnect status
    server.on("/api/network/auto-reconnect", HTTP_GET, [&networkManager](AsyncWebServerRequest *request) {
        StaticJsonDocument<128> doc;
        doc["enabled"] = networkManager.isAutoReconnectEnabled();
        
        String output;
        serializeJson(doc, output);
        request->send(200, "application/json", output);
    });
}
