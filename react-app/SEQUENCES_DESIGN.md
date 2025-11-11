# Effect Sequences - Feature Design Document

## Overview
Effect Sequences allow users to create timed playlists of LED effects that play back-to-back, similar to a video timeline or music playlist. This enables automated light shows for parties, events, storefronts, or ambient displays.

## Feature Comparison

| Feature | Purpose | Example |
|---------|---------|---------|
| **Preset** | Save single effect configuration | "Ocean Blue" (Wave effect with specific colors) |
| **Sequence** | Timed playlist of multiple effects | "Party Mode" (Rainbow 30s → Strobe 10s → Confetti 45s) |
| **Modifier** (Future) | Layer overlay on base effect | Rainbow + Sparkle Overlay |

## Data Structures

### EffectSequence Type
```typescript
interface EffectSequenceStep {
  id: string;                           // Unique step ID
  effectId: string;                     // Reference to effect
  parameters: Record<string, any>;      // Effect parameters
  duration: number;                     // Duration in seconds (0 = manual/infinite)
  transition: TransitionType;           // How to transition to next
}

interface EffectSequence {
  id: string;                           // Unique sequence ID
  name: string;                         // User-defined name
  description?: string;                 // Optional description
  steps: EffectSequenceStep[];          // Array of effects in order
  loop: boolean;                        // Loop back to start when finished
  createdAt: string;                    // ISO timestamp
  updatedAt?: string;                   // ISO timestamp
}

type TransitionType = 
  | 'instant'      // Hard cut to next effect
  | 'fade'         // Fade out then fade in (1 second)
  | 'crossfade';   // Blend between effects (1 second)

interface SequencePlaybackState {
  sequenceId: string;                   // Currently playing sequence
  currentStepIndex: number;             // Current step in sequence
  isPlaying: boolean;                   // Playback state
  isPaused: boolean;                    // Pause state
  remainingTime: number;                // Seconds left in current step
  totalElapsed: number;                 // Total playback time
}
```

## API Endpoints

### Sequence Management

#### GET `/api/sequences`
Get all saved sequences
```json
Response: {
  "sequences": [EffectSequence]
}
```

#### POST `/api/sequences`
Create new sequence
```json
Request: {
  "name": "Party Mode",
  "description": "High energy party sequence",
  "steps": [EffectSequenceStep],
  "loop": true
}
Response: {
  "success": true,
  "sequence": EffectSequence
}
```

#### PUT `/api/sequences/{id}`
Update existing sequence
```json
Request: EffectSequence
Response: {
  "success": true,
  "sequence": EffectSequence
}
```

#### DELETE `/api/sequences/{id}`
Delete sequence
```json
Response: {
  "success": true,
  "message": "Sequence deleted"
}
```

### Playback Control

#### POST `/api/sequences/{id}/play`
Start playing sequence
```json
Request: {
  "fromStep": 0  // Optional: start from specific step
}
Response: {
  "success": true,
  "state": SequencePlaybackState
}
```

#### POST `/api/sequences/pause`
Pause current sequence
```json
Response: {
  "success": true,
  "state": SequencePlaybackState
}
```

#### POST `/api/sequences/resume`
Resume paused sequence
```json
Response: {
  "success": true,
  "state": SequencePlaybackState
}
```

#### POST `/api/sequences/stop`
Stop sequence playback
```json
Response: {
  "success": true
}
```

#### POST `/api/sequences/next`
Skip to next step
```json
Response: {
  "success": true,
  "state": SequencePlaybackState
}
```

#### POST `/api/sequences/previous`
Go to previous step
```json
Response: {
  "success": true,
  "state": SequencePlaybackState
}
```

#### GET `/api/sequences/playback/state`
Get current playback state
```json
Response: SequencePlaybackState | null
```

## UI/UX Design

### Navigation
Add "Sequences" to main navigation (between "Effects" and "Files")

### Sequences Page Layout

```
┌─────────────────────────────────────────────────────┐
│ Sequences                                    [+ New] │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌─────────────────────────────────────────────┐    │
│  │ 🎵 Party Mode                        [▶] [✎] [🗑] │
│  │ 5 effects • 2m 15s • Loop enabled              │
│  └─────────────────────────────────────────────┘    │
│                                                       │
│  ┌─────────────────────────────────────────────┐    │
│  │ 🌅 Sunset to Night                   [▶] [✎] [🗑] │
│  │ 3 effects • 5m 0s • No loop                    │
│  └─────────────────────────────────────────────┘    │
│                                                       │
│  ┌─────────────────────────────────────────────┐    │
│  │ 🎄 Holiday Lights                    [▶] [✎] [🗑] │
│  │ 8 effects • 10m 30s • Loop enabled             │
│  └─────────────────────────────────────────────┘    │
│                                                       │
└─────────────────────────────────────────────────────┘
```

### Sequence Editor (Create/Edit)

```
┌─────────────────────────────────────────────────────┐
│ ← Back to Sequences                                  │
├─────────────────────────────────────────────────────┤
│ Sequence Name: [Party Mode____________]              │
│ Description:   [High energy party lights___]          │
│ Loop: [✓] Loop sequence                              │
├─────────────────────────────────────────────────────┤
│ Timeline                                   [+ Add]   │
│                                                       │
│  1. ┌──────────────────────────────────────────┐    │
│     │ 🌈 Rainbow                          [↑][↓][×] │
│     │ Duration: [30] seconds                      │
│     │ Transition: [Fade ▼]                        │
│     │ [⚙ Configure Parameters]                    │
│     └──────────────────────────────────────────┘    │
│                                                       │
│  2. ┌──────────────────────────────────────────┐    │
│     │ ⚡ Strobe                            [↑][↓][×] │
│     │ Duration: [10] seconds                      │
│     │ Transition: [Instant ▼]                     │
│     │ [⚙ Configure Parameters]                    │
│     └──────────────────────────────────────────┘    │
│                                                       │
│  3. ┌──────────────────────────────────────────┐    │
│     │ 🎊 Confetti                         [↑][↓][×] │
│     │ Duration: [45] seconds                      │
│     │ Transition: [Crossfade ▼]                   │
│     │ [⚙ Configure Parameters]                    │
│     └──────────────────────────────────────────┘    │
│                                                       │
├─────────────────────────────────────────────────────┤
│ Total Duration: 1m 25s                               │
│                                   [Cancel] [Save]     │
└─────────────────────────────────────────────────────┘
```

### Active Playback Widget (shown when sequence is playing)

```
┌─────────────────────────────────────────────────────┐
│ 🎵 Now Playing: Party Mode                           │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 45s / 2m 15s     │
│ 🌈 Rainbow (Step 1 of 5)                             │
│ [⏮] [⏸] [⏭] [⏹]                            Loop: On │
└─────────────────────────────────────────────────────┘
```

### Add Effect to Sequence Modal

```
┌─────────────────────────────────────────────────────┐
│ Add Effect to Sequence                          [×] │
├─────────────────────────────────────────────────────┤
│                                                       │
│ Select Effect:                                        │
│ [Rainbow ▼]                                          │
│                                                       │
│ Effect Parameters:                                    │
│ ┌──────────────────────────────────────────┐        │
│ │ Speed:      [████████░░] 50%              │        │
│ │ Pattern:    [Gradient ▼]                  │        │
│ │ Saturation: [██████████] 100%             │        │
│ └──────────────────────────────────────────┘        │
│                                                       │
│ Duration:                                             │
│ ○ Custom: [30] seconds                               │
│ ○ Manual (infinite until next step)                  │
│                                                       │
│ Transition to Next:                                   │
│ ○ Instant   ○ Fade   ○ Crossfade                    │
│                                                       │
│ Or load from preset:                                  │
│ [Select Preset ▼]                                    │
│                                                       │
│                              [Cancel] [Add Effect]    │
└─────────────────────────────────────────────────────┘
```

## File Structure

### New Files to Create

```
react-app/src/types/sequence.ts          # TypeScript types
react-app/src/services/sequenceService.ts # API service
react-app/src/pages/Sequences.tsx         # Main sequences page
react-app/src/pages/SequenceEditor.tsx    # Create/edit sequence
react-app/src/components/SequenceCard.tsx # Sequence list item
react-app/src/components/SequencePlaybackWidget.tsx # Playback controls
react-app/src/components/SequenceStepCard.tsx # Timeline step item
```

### Files to Modify

```
react-app/src/App.tsx                    # Add route
react-app/src/components/Sidebar.tsx      # Add nav item
react-app/API_SPECIFICATION.md           # Document endpoints
```

## Implementation Phases

### Phase 1: Data Layer (Backend Foundation)
**Goal:** ESP32 can store and manage sequences

**Tasks:**
- [ ] Define sequence data structures in ESP32 SPIFFS/LittleFS
- [ ] Implement sequence CRUD operations
- [ ] Implement playback engine on ESP32
- [ ] Add API endpoints for sequence management
- [ ] Add API endpoints for playback control
- [ ] Test with mock data

**Deliverable:** Working API that can store/retrieve sequences and control playback

### Phase 2: Basic UI (Frontend Foundation)
**Goal:** Users can create and view sequences

**Files:**
- [ ] Create `types/sequence.ts` with TypeScript interfaces
- [ ] Create `services/sequenceService.ts` with API calls
- [ ] Create `pages/Sequences.tsx` (list view)
- [ ] Create `components/SequenceCard.tsx`
- [ ] Add navigation route and sidebar link
- [ ] Update API_SPECIFICATION.md

**Deliverable:** Can view saved sequences, basic list interface

### Phase 3: Sequence Editor
**Goal:** Users can create/edit sequences

**Files:**
- [ ] Create `pages/SequenceEditor.tsx`
- [ ] Create `components/SequenceStepCard.tsx`
- [ ] Implement add/remove/reorder steps
- [ ] Implement parameter configuration
- [ ] Implement drag-and-drop reordering (optional enhancement)
- [ ] Add duration and transition controls
- [ ] Add save/cancel functionality

**Deliverable:** Full sequence creation and editing

### Phase 4: Playback Controls
**Goal:** Users can play/pause/control sequences

**Files:**
- [ ] Create `components/SequencePlaybackWidget.tsx`
- [ ] Implement play/pause/stop controls
- [ ] Implement next/previous controls
- [ ] Add progress bar and time display
- [ ] Add real-time playback state updates
- [ ] Show current step indicator
- [ ] Add loop toggle

**Deliverable:** Full playback control interface

### Phase 5: Polish & Features
**Goal:** Enhanced user experience

**Tasks:**
- [ ] Add sequence duration presets (quick 15s, 30s, 1m buttons)
- [ ] Add "duplicate sequence" feature
- [ ] Add "create from current effect" quick action
- [ ] Add transition preview/test
- [ ] Add sequence import/export (JSON)
- [ ] Add search/filter sequences
- [ ] Add sequence categories/tags
- [ ] Mobile-responsive design refinements
- [ ] Dark mode compatibility check

**Deliverable:** Production-ready feature

## Technical Considerations

### ESP32 Performance
- **Memory:** Limit sequences to 50 steps max (configurable)
- **Storage:** Store sequences in SPIFFS/LittleFS as JSON files
- **Processing:** Use hardware timer for accurate step transitions
- **Transitions:** Pre-calculate blend values for smooth crossfades

### Timing Accuracy
- Use millis() on ESP32 for step timing
- Account for effect render time
- Handle drift correction for long sequences
- Pause should preserve exact position

### Edge Cases
- What happens if sequence is deleted while playing? → Stop playback
- What if effect parameters are invalid? → Skip step or use defaults
- What if user changes effects during sequence playback? → Stop sequence
- Memory full, can't save sequence? → Show error, suggest deletion

### Transition Implementation
- **Instant:** Switch immediately to next effect
- **Fade:** Fade to black (0.5s) → switch → fade in (0.5s)
- **Crossfade:** Blend between effects using brightness interpolation

### Future Enhancements (Post-MVP)
- Random step order mode
- Step shuffle
- BPM sync for music synchronization
- Schedule sequences (play at specific times)
- Weather-reactive sequences
- Effect modifiers/overlays (layering lite)
- Sequence templates/library
- Cloud sync for sequences

## Mock Data Example

```json
{
  "id": "seq-1",
  "name": "Party Mode",
  "description": "High energy party sequence",
  "loop": true,
  "steps": [
    {
      "id": "step-1",
      "effectId": "rainbow",
      "parameters": {
        "speed": 80,
        "mode": "gradient",
        "saturation": 100
      },
      "duration": 30,
      "transition": "fade"
    },
    {
      "id": "step-2",
      "effectId": "strobe",
      "parameters": {
        "color": "#ffffff",
        "frequency": 15
      },
      "duration": 10,
      "transition": "instant"
    },
    {
      "id": "step-3",
      "effectId": "confetti",
      "parameters": {
        "density": 80,
        "speed": 70
      },
      "duration": 45,
      "transition": "crossfade"
    }
  ],
  "createdAt": "2025-11-10T14:30:00Z"
}
```

## Success Metrics
- Users can create sequences in < 2 minutes
- Playback transitions are smooth (< 100ms lag)
- Sequences play accurately (< 1% timing drift over 10 minutes)
- Mobile UI is fully functional
- No memory leaks during extended playback

---

**Status:** Design Phase  
**Next Step:** Review & approve design, then begin Phase 1 implementation  
**Estimated Total Implementation:** 12-16 hours across all phases
