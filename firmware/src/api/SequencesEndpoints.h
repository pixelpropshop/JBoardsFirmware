#ifndef SEQUENCES_ENDPOINTS_H
#define SEQUENCES_ENDPOINTS_H

#include <ESPAsyncWebServer.h>
#include "../led/SequenceManager.h"

void setupSequencesEndpoints(AsyncWebServer& server, SequenceManager& sequenceManager);

#endif // SEQUENCES_ENDPOINTS_H
