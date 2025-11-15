#ifndef SEQUENCE_H
#define SEQUENCE_H

#include <Arduino.h>
#include <vector>
#include <map>

// Transition types for sequence steps
enum TransitionType {
    TRANSITION_INSTANT,
    TRANSITION_FADE,
    TRANSITION_CROSSFADE
};

// Sequence step structure
struct SequenceStep {
    String effectId;
    std::map<String, float> parameters;
    uint32_t duration;  // milliseconds (0 = manual/infinite)
    TransitionType transition;
    uint16_t transitionDuration;  // milliseconds
};

// Sequence structure
struct Sequence {
    String id;
    String name;
    String description;
    std::vector<SequenceStep> steps;
    bool loop;
    String createdAt;
    String updatedAt;
    String type;  // "standard" or "fseq"
};

// FSEQ sequence structure
struct FSEQSequence {
    String id;
    String name;
    String description;
    String fileName;
    uint32_t fileSize;
    uint32_t duration;  // seconds
    uint16_t frameRate;  // fps
    uint16_t channelCount;
    bool loop;
    String audioUrl;
    String uploadedAt;
};

// Playback state structure
struct PlaybackState {
    String sequenceId;
    uint16_t currentStepIndex;
    bool isPlaying;
    bool isPaused;
    uint32_t remainingTime;  // milliseconds
    uint32_t totalElapsed;   // milliseconds
    unsigned long stepStartTime;  // millis()
    unsigned long pauseTime;      // millis() when paused
    uint32_t pausedDuration;      // accumulated pause time
};

#endif // SEQUENCE_H
