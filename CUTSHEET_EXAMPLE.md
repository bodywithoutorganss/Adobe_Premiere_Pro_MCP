# Cut Sheet Implementation Example

**Example:** "The Yeti Logo That Never Made the Cut" (from Doc Walks podcast)
**Format:** 9:16 vertical (1080x1920) for Instagram Reels, TikTok, Stories
**Duration:** 50 seconds

---

## Source Cut Sheet Requirements

From the original cut sheet:
- 8 shots with precise timing
- 9:16 vertical format
- Audio: Interview dialogue + music bed
- Color grading: Golden hour look
- Audio crossfades and levels
- Export: 1080x1920, 30fps, H.264

**What this MCP can do:** 90% (missing text overlays only)

---

## Implementation Approach

### Prerequisites
1. Premiere Pro project open with imported media
2. CEP extension running (PremiereRemote panel visible)
3. MCP server running (`npm start`)
4. Media files imported and available in project bins

### Asset Requirements
```
/project/bins/stock/
  - ranch_golden_hour.mov (stock footage)
  - cattle_feeding.mov (B-roll)
  - truck_bed.mov (B-roll)
  - yeti_tumbler_logo.mov (B-roll or create in Premiere)

/project/bins/interview/
  - episode_032_ben.mov (00:15:00 - 00:15:45)
  - episode_032_scott.mov (00:16:45 - 00:17:00)

/project/bins/audio/
  - contemplative_acoustic.wav (music bed)
```

---

## Step-by-Step MCP Operations

### Step 1: Create or Select 9:16 Sequence

**Option A:** User creates manually (recommended for now)
```
Premiere Pro:
1. File > New > Sequence
2. Settings: 1080x1920, 30fps
3. Name: "DW_EP032_YetiLogo_9x16_v01"
```

**Option B:** Future - via MCP (when implemented)
```javascript
// Not yet implemented - requires sequence creation
await createSequenceFromTemplate("DW_EP032_YetiLogo_9x16_v01", "9x16_vertical")
```

---

### Step 2: SHOT 1 - Golden Hour Ranch (0:00-0:04)

**MCP Operations:**
```javascript
// 1. Add stock footage to timeline
const shot1 = await addToTimeline(
  "DW_EP032_YetiLogo_9x16_v01",  // sequence name
  "ranch_golden_hour",            // project item ID or path
  1,                              // video track 1
  0.0                             // start at 0 seconds
);

// 2. Reframe for 9:16 vertical, centered
await reframeFor916(
  shot1.clipId,
  "center"  // center framing for landscape
);

// 3. Trim to 4 seconds
await trimClip(
  shot1.clipId,
  0.0,    // in point
  4.0,    // out point
  null    // auto-calculate duration
);

// 4. Color grade for golden hour
await colorCorrect(
  shot1.clipId,
  {
    temperature: 25,     // Warm
    saturation: 15,      // Slightly boosted
    brightness: 5        // Subtle lift
  }
);
```

**Result:** 4-second clip, 9:16 framed, warm golden hour look

---

### Step 3: SHOT 2 - Ben Speaking (0:04-0:15)

**MCP Operations:**
```javascript
// 1. Add Ben interview clip with source in/out
const shot2 = await addToTimeline(
  "DW_EP032_YetiLogo_9x16_v01",
  "episode_032_ben",
  1,                    // video track 1
  4.0,                  // start at 4 seconds
  {
    sourceIn: 900.0,    // 00:15:00 (15 minutes)
    sourceOut: 911.0,   // 00:15:11 (15:11)
    insertMode: "overwrite"
  }
);

// 2. Reframe for medium close-up (center)
await reframeFor916(
  shot2.clipId,
  "center"  // Center framing for talking head
);

// 3. Optional: Subtle color correction for consistency
await colorCorrect(
  shot2.clipId,
  {
    brightness: 3,
    contrast: 5
  }
);
```

**Audio:** Ben's dialogue from 00:15:00-00:15:11
**Result:** 11-second interview clip, 9:16 centered

---

### Step 4: SHOT 3 - B-Roll Sequence (0:15-0:22)

**Three quick B-roll shots, 2-3 seconds each:**

```javascript
// Shot 3A: Cattle feeding (0:15-0:17)
const shot3a = await addToTimeline(
  "DW_EP032_YetiLogo_9x16_v01",
  "cattle_feeding",
  1,
  15.0
);
await reframeFor916(shot3a.clipId, "center");
await trimClip(shot3a.clipId, 0.0, 2.0);

// Shot 3B: Truck bed (0:17-0:19)
const shot3b = await addToTimeline(
  "DW_EP032_YetiLogo_9x16_v01",
  "truck_bed",
  1,
  17.0
);
await reframeFor916(shot3b.clipId, "center");
await trimClip(shot3b.clipId, 0.0, 2.0);

// Shot 3C: Yeti tumbler (0:19-0:22)
const shot3c = await addToTimeline(
  "DW_EP032_YetiLogo_9x16_v01",
  "yeti_tumbler_logo",
  1,
  19.0
);
await reframeFor916(shot3c.clipId, "center");
await trimClip(shot3c.clipId, 0.0, 3.0);

// Add golden hour color to all B-roll
for (const clip of [shot3a.clipId, shot3b.clipId, shot3c.clipId]) {
  await colorCorrect(clip, {
    temperature: 25,
    saturation: 15
  });
}
```

**Audio:** Continues Ben's narration
**Result:** 7 seconds of B-roll, color-matched

---

### Step 5: SHOT 4 - Yeti Logo Moment (0:22-0:28)

Already included in Shot 3C above, extended:

```javascript
// Extend the Yeti tumbler shot to 6 seconds total
await trimClip(shot3c.clipId, 0.0, 6.0);

// Optional: Add slight zoom for emphasis
await setMotion(
  shot3c.clipId,
  [0.5, 0.5],  // Center position
  120,         // 120% scale (slight zoom)
  0            // No rotation
);
```

**Result:** Emphasized Yeti logo shot, 6 seconds

---

### Step 6: SHOT 5-7 - More Interview (0:28-0:50)

```javascript
// Shot 5: Ben continues (0:28-0:35)
const shot5 = await addToTimeline(
  "DW_EP032_YetiLogo_9x16_v01",
  "episode_032_ben",
  1,
  28.0,
  { sourceIn: 915.0, sourceOut: 922.0 }  // 00:15:15 to 00:15:22
);
await reframeFor916(shot5.clipId, "center");

// Shot 6: Quick cut to Scott (0:35-0:40)
const shot6 = await addToTimeline(
  "DW_EP032_YetiLogo_9x16_v01",
  "episode_032_scott",
  1,
  35.0,
  { sourceIn: 1005.0, sourceOut: 1010.0 }  // 00:16:45 to 00:16:50
);
await reframeFor916(shot6.clipId, "center");

// Shot 7: Scott continues (0:40-0:50)
const shot7 = await addToTimeline(
  "DW_EP032_YetiLogo_9x16_v01",
  "episode_032_scott",
  1,
  40.0,
  { sourceIn: 1010.0, sourceOut: 1020.0 }  // 00:16:50 to 00:17:00
);
await reframeFor916(shot7.clipId, "center");
```

**Result:** Interview conclusion, 22 seconds

---

### Step 7: Audio - Music Bed

```javascript
// Add music bed to audio track 2
const music = await addToTimeline(
  "DW_EP032_YetiLogo_9x16_v01",
  "contemplative_acoustic",
  2,  // Audio track 2
  0.0
);

// Set music level to -20dB (under dialogue)
await adjustAudioLevels(
  music.clipId,
  -20  // dB
);

// Fade in at start (1 second)
await addTransitionToClip(
  music.clipId,
  "Constant Power",
  "start",
  1.0  // 1 second fade
);

// Fade out at end (2 seconds)
await addTransitionToClip(
  music.clipId,
  "Exponential Fade",
  "end",
  2.0  // 2 second fade
);

// Trim music to match video duration (50 seconds)
await trimClip(music.clipId, 0.0, 50.0);
```

**Result:** Music bed with proper levels and fades

---

### Step 8: Audio Crossfades (Between Dialogue)

```javascript
// Crossfade between Ben and Scott (if needed)
// Note: Only needed if there's a hard cut between audio clips
// With continuous interview, this may not be necessary

// Example if clips are separate:
await addTransition(
  shot5.clipId,  // Ben's last clip
  shot6.clipId,  // Scott's first clip
  "Constant Power",
  0.3  // 300ms crossfade
);
```

**Result:** Smooth audio transitions

---

### Step 9: Export

```javascript
await exportSequence(
  "DW_EP032_YetiLogo_9x16_v01",
  "/output/DW_EP032_YetiLogo_9x16_v01.mp4",
  null,  // Use default H.264 preset
  {
    format: "H.264",
    resolution: "1080x1920",
    frameRate: 30,
    bitrate: 12  // 12 Mbps VBR
  }
);
```

**Result:** Final 9:16 vertical video, ready for upload

---

## What's Missing (Per Scope)

### Text Overlays (Out of Scope)
The cut sheet specifies:
- "The Shot That Never Made It" (0:01)
- "Ben Steinbauer - Doc Walks Host" (0:05-0:09)
- "Golden Hour" (0:16)
- "NO." flash text (0:37)
- "Scott Ballew - Former Head of Content @ Yeti" (0:41-0:45)
- "No Product Shots" (0:47-0:49)
- End card (0:50-0:53)

**Solution:** Handle separately:
- Pre-render in After Effects
- Use separate graphics tool
- Manual Premiere Pro work
- Or: Future implementation if text API becomes available

---

## Full Automation Example

If you wanted to automate the entire assembly:

```javascript
// cutsheet-yeti-logo.js
async function assembleCutSheet() {
  const sequenceName = "DW_EP032_YetiLogo_9x16_v01";

  // Shot 1: Golden hour ranch
  const s1 = await addToTimeline(sequenceName, "ranch_golden_hour", 1, 0.0);
  await reframeFor916(s1.clipId, "center");
  await trimClip(s1.clipId, 0.0, 4.0);
  await colorCorrect(s1.clipId, { temperature: 25, saturation: 15, brightness: 5 });

  // Shot 2: Ben speaking
  const s2 = await addToTimeline(sequenceName, "episode_032_ben", 1, 4.0,
    { sourceIn: 900.0, sourceOut: 911.0 });
  await reframeFor916(s2.clipId, "center");

  // Shots 3A-C: B-roll
  const s3a = await addToTimeline(sequenceName, "cattle_feeding", 1, 15.0);
  await reframeFor916(s3a.clipId, "center");
  await trimClip(s3a.clipId, 0.0, 2.0);

  const s3b = await addToTimeline(sequenceName, "truck_bed", 1, 17.0);
  await reframeFor916(s3b.clipId, "center");
  await trimClip(s3b.clipId, 0.0, 2.0);

  const s3c = await addToTimeline(sequenceName, "yeti_tumbler_logo", 1, 19.0);
  await reframeFor916(s3c.clipId, "center");
  await trimClip(s3c.clipId, 0.0, 6.0);
  await setMotion(s3c.clipId, [0.5, 0.5], 120, 0);

  // Apply golden hour to B-roll
  for (const clip of [s3a.clipId, s3b.clipId, s3c.clipId]) {
    await colorCorrect(clip, { temperature: 25, saturation: 15 });
  }

  // Shots 5-7: More interview
  const s5 = await addToTimeline(sequenceName, "episode_032_ben", 1, 28.0,
    { sourceIn: 915.0, sourceOut: 922.0 });
  await reframeFor916(s5.clipId, "center");

  const s6 = await addToTimeline(sequenceName, "episode_032_scott", 1, 35.0,
    { sourceIn: 1005.0, sourceOut: 1010.0 });
  await reframeFor916(s6.clipId, "center");

  const s7 = await addToTimeline(sequenceName, "episode_032_scott", 1, 40.0,
    { sourceIn: 1010.0, sourceOut: 1020.0 });
  await reframeFor916(s7.clipId, "center");

  // Music bed
  const music = await addToTimeline(sequenceName, "contemplative_acoustic", 2, 0.0);
  await adjustAudioLevels(music.clipId, -20);
  await addTransitionToClip(music.clipId, "Constant Power", "start", 1.0);
  await addTransitionToClip(music.clipId, "Exponential Fade", "end", 2.0);
  await trimClip(music.clipId, 0.0, 50.0);

  console.log("Cut sheet assembly complete!");
  console.log("Next: Add text overlays manually or via graphics tool");
}

assembleCutSheet();
```

---

## JSON-Driven Approach

For maximum automation, you could drive this from JSON:

```json
{
  "project": "DW_EP032_YetiLogo",
  "sequence": {
    "name": "DW_EP032_YetiLogo_9x16_v01",
    "format": "9:16",
    "resolution": "1080x1920",
    "frameRate": 30,
    "duration": 50
  },
  "shots": [
    {
      "id": "shot1",
      "clipName": "ranch_golden_hour",
      "track": 1,
      "startTime": 0.0,
      "duration": 4.0,
      "reframe": "center",
      "color": {
        "temperature": 25,
        "saturation": 15,
        "brightness": 5
      }
    },
    {
      "id": "shot2",
      "clipName": "episode_032_ben",
      "track": 1,
      "startTime": 4.0,
      "sourceIn": 900.0,
      "sourceOut": 911.0,
      "reframe": "center"
    },
    {
      "id": "shot3a",
      "clipName": "cattle_feeding",
      "track": 1,
      "startTime": 15.0,
      "duration": 2.0,
      "reframe": "center",
      "color": {
        "temperature": 25,
        "saturation": 15
      }
    }
    // ... more shots
  ],
  "audio": [
    {
      "id": "music",
      "clipName": "contemplative_acoustic",
      "track": 2,
      "startTime": 0.0,
      "duration": 50.0,
      "level": -20,
      "fadeIn": 1.0,
      "fadeOut": 2.0
    }
  ],
  "export": {
    "path": "/output/DW_EP032_YetiLogo_9x16_v01.mp4",
    "format": "H.264",
    "bitrate": 12
  }
}
```

Then process with a script that reads JSON and executes MCP operations.

---

## Timeline Estimate

**With this MCP system:**
- Manual assembly: ~45-60 minutes (original estimate)
- Automated assembly: ~2-5 minutes (script execution)
- Manual text overlays: ~15-20 minutes
- **Total: ~20-25 minutes** (vs 45-60 manual)

**Savings: ~50% reduction in editing time**

---

## Key Takeaways

1. **90% automatable** - Only text overlays require manual/external work
2. **Repeatable** - JSON-driven approach means consistent results
3. **Fast** - Script execution vs. manual clicking
4. **Scalable** - Same approach for 10 cut sheets or 100

**Status:** ✅ Ready to implement when Premiere Pro is available

---

**Last Updated:** 2025-12-08
**Requires:** Motion operations tested and verified
**Next Step:** Test with real Premiere Pro project
