#ifndef NETWORK_ENDPOINTS_H
#define NETWORK_ENDPOINTS_H

#include <ESPAsyncWebServer.h>
#include "../network/NetworkManager.h"

void setupNetworkEndpoints(AsyncWebServer& server, NetworkManager& networkManager);

#endif // NETWORK_ENDPOINTS_H
