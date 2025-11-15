#include "FilesEndpoints.h"
#include <ArduinoJson.h>

void setupFilesEndpoints(AsyncWebServer& server, FilesManager& filesManager) {
    
    // ========================================================================
    // Audio File Management
    // ========================================================================
    
    // 1. GET /api/files/audio - Get audio files
    server.on("/api/files/audio", HTTP_GET, [&filesManager](AsyncWebServerRequest* request) {
        std::vector<AudioFile> audioFiles = filesManager.getAudioFiles();
        
        StaticJsonDocument<4096> doc;
        JsonArray filesArray = doc.createNestedArray("files");
        
        for (const auto& audioFile : audioFiles) {
            JsonObject fileObj = filesArray.createNestedObject();
            fileObj["filename"] = audioFile.filename;
            fileObj["size"] = audioFile.size;
            fileObj["duration"] = audioFile.duration;
            fileObj["uploadedAt"] = audioFile.uploadedAt;
        }
        
        String response;
        serializeJson(doc, response);
        request->send(200, "application/json", response);
    });
    
    // 2. POST /api/files/audio - Upload audio file
    server.on("/api/files/audio", HTTP_POST,
        [](AsyncWebServerRequest* request) {
            request->send(200, "application/json", "{\"success\":true,\"message\":\"Audio file uploaded successfully\"}");
        },
        [&filesManager](AsyncWebServerRequest* request, String filename, size_t index, uint8_t* data, size_t len, bool final) {
            // Handle file upload
            static File uploadFile;
            
            if (index == 0) {
                // Start of upload
                String path = "/audio/" + filename;
                uploadFile = SD.open(path, FILE_WRITE);
                if (!uploadFile) {
                    return;
                }
            }
            
            if (uploadFile) {
                uploadFile.write(data, len);
            }
            
            if (final && uploadFile) {
                uploadFile.close();
            }
        }
    );
    
    // 3. DELETE /api/files/audio/{filename} - Delete audio file
    server.on("^\\/api\\/files\\/audio\\/(.+)$", HTTP_DELETE, [&filesManager](AsyncWebServerRequest* request) {
        String filename = request->pathArg(0);
        
        bool success = filesManager.deleteAudioFile(filename);
        
        StaticJsonDocument<128> doc;
        doc["success"] = success;
        doc["message"] = success ? "Audio file deleted successfully" : "File not found";
        
        String response;
        serializeJson(doc, response);
        request->send(success ? 200 : 404, "application/json", response);
    });
    
    // 4. GET /api/files/audio/stream/{filename} - Stream audio file
    server.on("^\\/api\\/files\\/audio\\/stream\\/(.+)$", HTTP_GET, [&filesManager](AsyncWebServerRequest* request) {
        String filename = request->pathArg(0);
        String path = "/audio/" + filename;
        
        if (!filesManager.fileExists(path)) {
            request->send(404, "application/json", "{\"success\":false,\"message\":\"File not found\"}");
            return;
        }
        
        String mimeType = getMimeTypeFromExtension(filename);
        request->send(SD, path, mimeType);
    });
    
    // ========================================================================
    // General File Management
    // ========================================================================
    
    // 5. GET /api/files/list - Get file list
    server.on("/api/files/list", HTTP_GET, [&filesManager](AsyncWebServerRequest* request) {
        String type = "";
        if (request->hasParam("type")) {
            type = request->getParam("type")->value();
        }
        
        std::vector<FileInfo> files = filesManager.listFiles(type);
        
        DynamicJsonDocument doc(8192);
        JsonArray filesArray = doc.to<JsonArray>();
        
        for (const auto& file : files) {
            JsonObject fileObj = filesArray.createNestedObject();
            fileObj["filename"] = file.filename;
            fileObj["path"] = file.path;
            fileObj["size"] = file.size;
            fileObj["type"] = getFileTypeName(file.type);
            fileObj["mimeType"] = file.mimeType;
            fileObj["lastModified"] = file.lastModified;
        }
        
        String response;
        serializeJson(doc, response);
        request->send(200, "application/json", response);
    });
    
    // 6. GET /api/files/storage - Get storage information
    server.on("/api/files/storage", HTTP_GET, [&filesManager](AsyncWebServerRequest* request) {
        StorageInfo info = filesManager.getStorageInfo();
        
        StaticJsonDocument<512> doc;
        doc["totalBytes"] = info.totalBytes;
        doc["usedBytes"] = info.usedBytes;
        doc["freeBytes"] = info.freeBytes;
        
        JsonObject breakdown = doc.createNestedObject("breakdown");
        breakdown["audio"] = info.breakdown.audio;
        breakdown["fseq"] = info.breakdown.fseq;
        breakdown["config"] = info.breakdown.config;
        breakdown["log"] = info.breakdown.log;
        breakdown["backup"] = info.breakdown.backup;
        breakdown["other"] = info.breakdown.other;
        
        String response;
        serializeJson(doc, response);
        request->send(200, "application/json", response);
    });
    
    // 7. POST /api/files/upload - Upload general file
    server.on("/api/files/upload", HTTP_POST,
        [&filesManager](AsyncWebServerRequest* request) {
            // Get the uploaded file info from request
            String uploadedFilename = "";
            String uploadedPath = "";
            size_t uploadedSize = 0;
            
            // This handler is called after upload completes
            // We need to retrieve file info from the static variables set in upload handler
            static String lastUploadedFilename;
            static String lastUploadedPath;
            static size_t lastUploadedSize;
            
            uploadedFilename = lastUploadedFilename;
            uploadedPath = lastUploadedPath;
            uploadedSize = lastUploadedSize;
            
            if (uploadedFilename.isEmpty()) {
                request->send(400, "application/json", "{\"success\":false,\"message\":\"No file uploaded\"}");
                return;
            }
            
            // Get file info
            File file = SD.open(uploadedPath);
            if (!file) {
                request->send(500, "application/json", "{\"success\":false,\"message\":\"Failed to read uploaded file\"}");
                return;
            }
            
            time_t lastModified = file.getLastWrite();
            file.close();
            
            // Determine file type
            String ext = "";
            int dotIndex = uploadedFilename.lastIndexOf('.');
            if (dotIndex > 0) {
                ext = uploadedFilename.substring(dotIndex + 1);
                ext.toLowerCase();
            }
            
            String fileType = "other";
            if (ext == "mp3" || ext == "wav" || ext == "ogg" || ext == "m4a" || ext == "flac") {
                fileType = "audio";
            } else if (ext == "fseq") {
                fileType = "fseq";
            } else if (ext == "json" || ext == "txt" || ext == "cfg") {
                fileType = "config";
            } else if (ext == "log") {
                fileType = "log";
            }
            
            String mimeType = getMimeTypeFromExtension(uploadedFilename);
            
            // Build response with file metadata
            StaticJsonDocument<512> doc;
            doc["success"] = true;
            JsonObject fileObj = doc.createNestedObject("file");
            fileObj["filename"] = uploadedFilename;
            fileObj["path"] = uploadedPath;
            fileObj["size"] = uploadedSize;
            fileObj["type"] = fileType;
            fileObj["mimeType"] = mimeType;
            fileObj["lastModified"] = lastModified;
            
            String response;
            serializeJson(doc, response);
            request->send(200, "application/json", response);
        },
        [](AsyncWebServerRequest* request, String filename, size_t index, uint8_t* data, size_t len, bool final) {
            static File uploadFile;
            static String lastUploadedFilename;
            static String lastUploadedPath;
            static size_t lastUploadedSize;
            
            if (index == 0) {
                String path = "/files/" + filename;
                uploadFile = SD.open(path, FILE_WRITE);
                if (!uploadFile) {
                    return;
                }
                lastUploadedFilename = filename;
                lastUploadedPath = path;
                lastUploadedSize = 0;
            }
            
            if (uploadFile) {
                uploadFile.write(data, len);
                lastUploadedSize += len;
            }
            
            if (final && uploadFile) {
                uploadFile.close();
            }
        }
    );
    
    // 8. DELETE /api/files/delete - Delete file
    server.on("/api/files/delete", HTTP_DELETE,
        [](AsyncWebServerRequest* request) { /* handled by body handler */ },
        nullptr,
        [&filesManager](AsyncWebServerRequest* request, uint8_t* data, size_t len, size_t index, size_t total) {
            if (index == 0) {
                StaticJsonDocument<256> doc;
                DeserializationError error = deserializeJson(doc, data, len);
                
                if (error) {
                    request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
                    return;
                }
                
                if (!doc.containsKey("path")) {
                    request->send(400, "application/json", "{\"success\":false,\"message\":\"Path parameter required\"}");
                    return;
                }
                
                String path = doc["path"].as<String>();
                bool success = filesManager.deleteFile(path);
                
                StaticJsonDocument<128> responseDoc;
                responseDoc["success"] = success;
                responseDoc["message"] = success ? "File deleted successfully" : "File not found or in use";
                
                String response;
                serializeJson(responseDoc, response);
                request->send(success ? 200 : 404, "application/json", response);
            }
        }
    );
    
    // 9. GET /api/files/download/{path} - Download file
    server.on("^\\/api\\/files\\/download\\/(.+)$", HTTP_GET, [&filesManager](AsyncWebServerRequest* request) {
        String path = "/" + request->pathArg(0);
        
        if (!filesManager.fileExists(path)) {
            request->send(404, "application/json", "{\"success\":false,\"message\":\"File not found\"}");
            return;
        }
        
        // Extract filename from path
        int lastSlash = path.lastIndexOf('/');
        String filename = path.substring(lastSlash + 1);
        
        String mimeType = getMimeTypeFromExtension(filename);
        
        AsyncWebServerResponse* response = request->beginResponse(SD, path, mimeType, true);
        response->addHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");
        request->send(response);
    });
    
    // 10. POST /api/files/preview - Preview file
    server.on("/api/files/preview", HTTP_POST,
        [](AsyncWebServerRequest* request) { /* handled by body handler */ },
        nullptr,
        [&filesManager](AsyncWebServerRequest* request, uint8_t* data, size_t len, size_t index, size_t total) {
            if (index == 0) {
                StaticJsonDocument<256> doc;
                DeserializationError error = deserializeJson(doc, data, len);
                
                if (error) {
                    request->send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
                    return;
                }
                
                if (!doc.containsKey("path")) {
                    request->send(400, "application/json", "{\"success\":false,\"message\":\"Path parameter required\"}");
                    return;
                }
                
                String path = doc["path"].as<String>();
                String content = filesManager.getFilePreview(path);
                
                if (content.isEmpty()) {
                    request->send(400, "application/json", "{\"success\":false,\"message\":\"File not found or cannot preview this file type\"}");
                    return;
                }
                
                StaticJsonDocument<2048> responseDoc;
                responseDoc["success"] = true;
                responseDoc["content"] = content;
                
                String response;
                serializeJson(responseDoc, response);
                request->send(200, "application/json", response);
            }
        }
    );
}
