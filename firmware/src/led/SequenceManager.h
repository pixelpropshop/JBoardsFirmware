#ifndef SEQUENCE_MANAGER_H
#define SEQUENCE_MANAGER_H

#include <Arduino.h>
#include <Preferences.h>
#include <vector>
#include "../types/Sequence.h"
#include "EffectsManager.h"

class SequenceManager {
public:
    SequenceManager();
    
    // Initialization
    void begin(EffectsManager* effectsManager);
    
    // Sequence CRUD
    bool createSequence(const Sequence& sequence);
    bool updateSequence(const String& id, const Sequence& sequence);
    bool deleteSequence(const String& id);
    Sequence* getSequence(const String& id);
    std::vector<Sequence> listSequences();
    
    // Playback control
    bool play(const String& sequenceId, uint16_t fromStep = 0);
    bool pause();
    bool resume();
    bool stop();
    bool nextStep();
    bool previousStep();
    
    // Playback state
    PlaybackState getPlaybackState();
    bool isPlaying() { return _state.isPlaying; }
    
    // Update loop (call from main loop)
    void update();
    
private:
    EffectsManager* _effects;
    Preferences _prefs;
    
    // Current playback state
    PlaybackState _state;
    Sequence _currentSequence;
    
    // Helper functions
    bool loadSequenceFromStorage(const String& id, Sequence& sequence);
    bool saveSequenceToStorage(const Sequence& sequence);
    String generateSequenceId();
    String getCurrentTimestamp();
    void applyStep(const SequenceStep& step);
    TransitionType parseTransitionType(const String& type);
    String transitionTypeToString(TransitionType type);
};

#endif // SEQUENCE_MANAGER_H
