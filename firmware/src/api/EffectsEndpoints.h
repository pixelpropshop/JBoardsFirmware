#ifndef EFFECTS_ENDPOINTS_H
#define EFFECTS_ENDPOINTS_H

#include <ESPAsyncWebServer.h>
#include "../led/EffectsManager.h"

void setupEffectsEndpoints(AsyncWebServer& server, EffectsManager& effectsManager);

#endif // EFFECTS_ENDPOINTS_H
