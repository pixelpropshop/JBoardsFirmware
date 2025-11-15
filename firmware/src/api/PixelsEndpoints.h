#ifndef PIXELS_ENDPOINTS_H
#define PIXELS_ENDPOINTS_H

#include <ESPAsyncWebServer.h>
#include "../led/PixelManager.h"

// Setup pixel management endpoints
void setupPixelsEndpoints(AsyncWebServer& server, PixelManager& pixelManager);

#endif // PIXELS_ENDPOINTS_H
