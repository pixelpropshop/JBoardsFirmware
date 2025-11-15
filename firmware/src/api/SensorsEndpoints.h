#ifndef SENSORS_ENDPOINTS_H
#define SENSORS_ENDPOINTS_H

#include <ESPAsyncWebServer.h>
#include "../sensors/SensorsManager.h"

void setupSensorsEndpoints(AsyncWebServer& server, SensorsManager& sensorsManager);

#endif // SENSORS_ENDPOINTS_H
