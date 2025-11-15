#ifndef HARDWARE_ENDPOINTS_H
#define HARDWARE_ENDPOINTS_H

#include <ESPAsyncWebServer.h>
#include "../hardware/HardwareManager.h"

void setupHardwareEndpoints(AsyncWebServer& server, HardwareManager& hardwareManager);

#endif // HARDWARE_ENDPOINTS_H
