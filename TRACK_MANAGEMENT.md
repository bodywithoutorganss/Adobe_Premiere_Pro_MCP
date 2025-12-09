# Track Management Guide

**Date:** 2025-12-08
**Status:** Review Complete - Issue Identified

---

## Current Track Implementation

### How `add_to_timeline` Works

**MCP Tool Definition** (src/tools/index.ts:144-153):
```typescript
{
  name: 'add_to_timeline',
  description: 'Adds a media clip from the project panel to a sequence timeline at a specific track and time.',
  inputSchema: z.object({
    sequenceId: z.string(),
    projectItemId: z.string(),
    trackIndex: z.number().describe('The index of the video or audio track (0-based)'),
    time: z.number(),
    insertMode: z.enum(['overwrite', 'insert']).optional()
  })
}
```

**Bridge Implementation** (src/bridge/index.ts:268-324):
```javascript
async addToTimeline(sequenceId, projectItemId, trackIndex, time) {
  const script = `
    // Uses Premiere Pro's sequence.insertClip() API:
    // insertClip(projectItem, time, videoTrackIndex, audioTrackIndex)
    var insertedClip = sequence.insertClip(projectItem, ${time}, ${trackIndex}, 0);
  `;
}
```

**Key Observation:**
- `trackIndex` parameter is passed as the **videoTrackIndex**
- Audio track is **hardcoded to 0** (A1)

---

## Current Behavior

### Video Clips (with or without audio)
```json
{
  "clipName": "interview_ben",
  "track": 1,
  "timelineStart": "00:00:04"
}
```

**Result:**
- Video placed on: **V1** (track 1)
- Audio placed on: **A1** (hardcoded to track 0)

### Audio-Only Clips
```json
{
  "id": "music_bed",
  "clipName": "contemplative_acoustic",
  "track": 2,
  "timelineStart": "00:00:00"
}
```

**Current Behavior (PROBLEM):**
- Attempts to place on: **V2** (track 2 as video track)
- Audio component goes to: **A1** (hardcoded)
- **This is incorrect for audio-only clips!**

**Expected Behavior:**
- Should place on: **A2** (track 2 as audio track)
- No video component

---

## The Problem

**Issue:** Audio-only clips cannot be placed on specific audio tracks.

**Root Cause:**
1. `add_to_timeline` doesn't distinguish between video and audio clips
2. Bridge always treats `trackIndex` as video track
3. Audio track is hardcoded to 0

**Impact:**
- ❌ Cannot place audio on A2, A3, A4
- ❌ Audio-only clips try to use video tracks
- ❌ Multi-track audio workflows don't work correctly

**What Works:**
- ✅ Video clips on different video tracks (V1, V2, V3)
- ✅ Video clips with audio on V1/A1, V2/A1, V3/A1 (limited)

**What Doesn't Work:**
- ❌ Audio-only clips on specific audio tracks
- ❌ Controlling audio track placement for video clips

---

## Solutions

### Option 1: Add `audioTrackIndex` Parameter (RECOMMENDED)

**Extend the tool:**
```typescript
{
  name: 'add_to_timeline',
  inputSchema: z.object({
    sequenceId: z.string(),
    projectItemId: z.string(),
    trackIndex: z.number().describe('The video track index (0-based)'),
    audioTrackIndex: z.number().optional().describe('The audio track index (0-based, defaults to 0)'),
    time: z.number(),
    insertMode: z.enum(['overwrite', 'insert']).optional()
  })
}
```

**Bridge implementation:**
```javascript
async addToTimeline(sequenceId, projectItemId, trackIndex, time, audioTrackIndex = 0) {
  const script = `
    var insertedClip = sequence.insertClip(
      projectItem,
      ${time},
      ${trackIndex},
      ${audioTrackIndex}
    );
  `;
}
```

**Cut sheet usage:**
```json
{
  "id": "music_bed",
  "clipName": "contemplative_acoustic",
  "track": 0,           // Video track (irrelevant for audio-only)
  "audioTrack": 2,      // Audio track A2
  "timelineStart": "00:00:00"
}
```

**Pros:**
- Simple, explicit control
- Backward compatible (audioTrack defaults to 0)
- Handles all cases

**Cons:**
- Requires cut sheet format update
- Need to specify both tracks for video clips

### Option 2: Add `clipType` Parameter

**Extend the tool:**
```typescript
{
  name: 'add_to_timeline',
  inputSchema: z.object({
    sequenceId: z.string(),
    projectItemId: z.string(),
    trackIndex: z.number(),
    clipType: z.enum(['video', 'audio']).optional(),
    time: z.number()
  })
}
```

**Bridge logic:**
```javascript
// If clipType === 'audio': insertClip(item, time, 0, trackIndex)
// If clipType === 'video': insertClip(item, time, trackIndex, 0)
```

**Pros:**
- Semantic clarity
- Cut sheet can specify audio vs video

**Cons:**
- Less flexible than separate indices
- Still need to handle video+audio clips

### Option 3: Auto-Detect from Media Type

**Bridge could inspect the clip:**
```javascript
if (projectItem.getVideoFrameRate() === 0) {
  // Audio-only clip
  insertClip(item, time, 0, trackIndex);
} else {
  // Video clip (with or without audio)
  insertClip(item, time, trackIndex, 0);
}
```

**Pros:**
- No API changes needed
- Automatic handling

**Cons:**
- Magic behavior (less explicit)
- Can't control audio track for video clips

---

## Recommended Solution

**Use Option 1: Add `audioTrackIndex` parameter**

**Why:**
- Most flexible
- Explicit control for all scenarios
- Backward compatible
- Professional workflows need this control

**Implementation Steps:**
1. Update tool schema in `src/tools/index.ts`
2. Update bridge method in `src/bridge/index.ts`
3. Update cut sheet processor to handle both tracks
4. Update cut sheet format examples
5. Test with Premiere Pro

---

## Track Numbering Reference

### Premiere Pro Track Naming
- Video tracks: V1, V2, V3, ...
- Audio tracks: A1, A2, A3, ...

### MCP API Track Indexing (0-based)
```
Premiere Pro   MCP trackIndex   Notes
─────────────────────────────────────────
V1             0                Video track 1
V2             1                Video track 2
V3             2                Video track 3

A1             0                Audio track 1
A2             1                Audio track 2
A3             2                Audio track 3
A4             3                Audio track 4
```

### Cut Sheet Track Values

**Current Format:**
```json
{
  "shots": [
    {
      "clipName": "interview",
      "track": 1,     // V1 (0-based: trackIndex=0)
      ...
    }
  ],
  "audio": [
    {
      "clipName": "music",
      "track": 2,     // Currently tries V2, should be A2!
      ...
    }
  ]
}
```

**Proposed Format (with audioTrack):**
```json
{
  "shots": [
    {
      "clipName": "interview",
      "track": 1,        // V1
      "audioTrack": 1,   // A1 (default if omitted)
      ...
    }
  ],
  "audio": [
    {
      "clipName": "music",
      "track": 1,        // V1 (irrelevant for audio-only)
      "audioTrack": 2,   // A2 (explicit audio track)
      ...
    }
  ]
}
```

---

## Current Workarounds

**Until Option 1 is implemented:**

### For Audio-Only Clips
**Problem:** Can't specify audio track
**Workaround:**
- All audio clips will go to A1 (track 0)
- Manual adjustment in Premiere required

### For Video Clips with Audio
**Problem:** Can't control audio track placement
**Current Behavior:**
- Video goes to specified track (V1, V2, etc.)
- Audio always goes to A1
**Workaround:**
- Accept A1 placement
- Or manually unlink and move audio in Premiere

### Multi-Track Audio Workflows
**Problem:** Music beds, SFX on separate tracks
**Current Limitation:**
- All automated audio goes to A1
- Requires manual track organization
**Workaround:**
- Use cut sheet for primary dialogue (A1)
- Manually add music/SFX to A2, A3, A4
- Or wait for Option 1 implementation

---

## Testing Requirements

**When Premiere Pro is available, test:**

1. **Video Clip Placement**
   - [ ] Video on V1, V2, V3
   - [ ] Audio component goes to A1 (current hardcode)
   - [ ] Verify linked AV behavior

2. **Audio-Only Clip Placement**
   - [ ] Test current behavior (likely fails or wrong track)
   - [ ] Document actual behavior
   - [ ] Confirm need for fix

3. **Multi-Track Scenarios**
   - [ ] Multiple video tracks
   - [ ] Multiple audio tracks
   - [ ] Mixed video/audio clips

4. **After Fix (Option 1)**
   - [ ] Video on V2, audio on A3
   - [ ] Audio-only on A2, A3, A4
   - [ ] Backward compatibility (default audioTrack=0)

---

## Cut Sheet Processor Impact

### Current Implementation
```javascript
// process-cutsheet.cjs:197
const addRequest = {
  operation: 'add_to_timeline',
  sequenceName: 'SEQUENCE_NAME_PLACEHOLDER',
  projectItemId: audioClip.clipName,
  trackIndex: audioClip.track,  // PROBLEM: Used as video track!
  time: timelineStartSeconds,
  sourceIn: sourceInSeconds,
  sourceOut: sourceOutSeconds,
  timestamp: Date.now()
};
```

### After Fix (Option 1)
```javascript
const addRequest = {
  operation: 'add_to_timeline',
  sequenceName: sequenceId,
  projectItemId: audioClip.clipName,
  trackIndex: audioClip.videoTrack || 0,     // Video track (0 for audio-only)
  audioTrackIndex: audioClip.audioTrack || 0,  // Audio track (explicit)
  time: timelineStartSeconds,
  sourceIn: sourceInSeconds,
  sourceOut: sourceOutSeconds,
  timestamp: Date.now()
};
```

---

## Summary

### Current State ✅
- Video clips work on different video tracks
- Audio always goes to A1 (hardcoded)
- Basic workflows functional

### Known Issues ❌
- Audio-only clips can't specify audio track
- No control over audio placement for video clips
- Multi-track audio workflows require manual work

### Recommendation 🎯
- **Implement Option 1** (add audioTrackIndex parameter)
- Update cut sheet format to support audioTrack
- Test thoroughly with Premiere Pro
- Document track numbering clearly

### Priority
- **MEDIUM** - Current workarounds exist
- **HIGH** for professional multi-track audio workflows
- **Required** for full cut sheet automation

---

**Status:** Documented
**Next Steps:** Await user decision on implementation priority
**Testing:** Requires Premiere Pro to validate behavior
