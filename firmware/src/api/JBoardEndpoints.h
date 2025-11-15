#ifndef JBOARD_ENDPOINTS_H
#define JBOARD_ENDPOINTS_H

#include <ESPAsyncWebServer.h>
#include "../network/JBoardNetworkManager.h"

void setupJBoardEndpoints(AsyncWebServer& server, JBoardNetworkManager& jboardManager);

#endif // JBOARD_ENDPOINTS_H
