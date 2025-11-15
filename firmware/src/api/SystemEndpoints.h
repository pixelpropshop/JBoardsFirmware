#ifndef SYSTEM_ENDPOINTS_H
#define SYSTEM_ENDPOINTS_H

#include <ESPAsyncWebServer.h>
#include "../system/SystemManager.h"
#include "../led/PixelManager.h"
#include "../led/EffectsManager.h"
#include "../led/SequenceManager.h"

void setupSystemEndpoints(AsyncWebServer& server, SystemManager& systemManager, PixelManager& pixelManager, EffectsManager& effectsManager, SequenceManager& sequenceManager);

#endif // SYSTEM_ENDPOINTS_H
