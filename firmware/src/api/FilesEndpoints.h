#ifndef FILES_ENDPOINTS_H
#define FILES_ENDPOINTS_H

#include <ESPAsyncWebServer.h>
#include "../storage/FilesManager.h"

// Setup Files API endpoints
void setupFilesEndpoints(AsyncWebServer& server, FilesManager& filesManager);

#endif // FILES_ENDPOINTS_H
