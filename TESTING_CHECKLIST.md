# Comprehensive Testing Checklist

**Last Updated:** 2025-12-08
**Session:** 5

---

## Overview

This document provides a systematic testing checklist for all Adobe Premiere Pro MCP operations. Use this to ensure comprehensive validation before production use.

---

## 🎯 Testing Prerequisites

### Required Setup
- [ ] Premiere Pro installed and running
- [ ] CEP extension installed (`~/Library/Application Support/Adobe/CEP/extensions/PremiereRemote/`)
- [ ] Extension panel visible (Window > Extensions > PremiereRemote)
- [ ] Bridge directory exists (`/tmp/premiere-bridge/`)
- [ ] Test project open with clips on timeline (e.g., `Spindle_Tinkering.prproj`)
- [ ] MCP server built (`npm run build`)

### Test Data Required
- **Clip IDs**: Note nodeId values from `node test-list-timeline-clips.cjs`
- **Sequence names**: From `node test-list-sequences.cjs`
- **Project items**: From `node test-list-items.cjs`
- **LUT file**: Path to valid .cube LUT file for LUT tests
- **Audio file**: Project item for audio tests

---

## 📋 Core Operations Testing

### 1. Bridge Communication ✅
**Test Script:** `test-bridge.cjs`
**Status:** TESTED & VERIFIED

```bash
node test-bridge.cjs
```

**Expected Result:**
- Bridge responds within timeout
- Returns project info with sequences
- No connection errors

---

### 2. List Sequences ✅
**Test Script:** `test-list-sequences.cjs`
**Status:** TESTED & VERIFIED

```bash
node test-list-sequences.cjs
```

**Expected Result:**
- Returns all sequences in project
- Each sequence has name, dimensions, frame rate
- Sequence count matches Premiere Pro

**Verified Results:**
- 8 sequences retrieved
- All 1920x1080 resolution
- Frame rates: 23.976 and 29.97

---

### 3. List Project Items ✅
**Test Script:** `test-list-items.cjs`
**Status:** TESTED & VERIFIED

```bash
node test-list-items.cjs
```

**Expected Result:**
- Returns all clips/media in project
- Shows bins if `includeBins: true`
- Each item has type, path, media info

**Verified Results:**
- 17 clips found
- Includes video and audio files
- Media paths and types correct

---

### 4. Add to Timeline ✅
**Test Script:** `test-add-to-timeline.cjs`
**Status:** TESTED & VERIFIED

```bash
node test-add-to-timeline.cjs
```

**Expected Result:**
- Clip added to specified track at correct time
- Clip appears in Premiere Pro timeline
- Correct duration and positioning

**Verified Results:**
- Clip added at 0.5s on track 1
- Video appears correctly on timeline
- Duration matches source clip

---

### 5. Move Clip (with Linked Clips) ✅
**Test Script:** `test-move-clip.cjs`
**Status:** TESTED & VERIFIED

```bash
node test-move-clip.cjs
```

**Expected Result:**
- Clip moves to new position
- Linked audio/video clips move together
- `linkedClipsMoved: 2` or more
- Audio-video sync maintained

**Verified Results:**
- 2 linked clips moved together
- Video + audio maintained sync
- New position correct

---

### 6. Remove from Timeline (with Linked Clips) ✅
**Test Script:** `test-remove-clip.cjs`
**Status:** TESTED & VERIFIED

```bash
node test-remove-clip.cjs
```

**Expected Result:**
- Clip removed from timeline
- Linked audio/video clips removed together
- `linkedClipsRemoved: 2` or more
- Timeline clip count decreases correctly

**Verified Results:**
- 2 linked clips removed together
- Timeline: 85 → 83 clips
- Ripple delete worked correctly

---

## 🎨 Effects & Color Operations

### 7. Color Correction ✅
**Test Script:** `test-color-correct.cjs`
**Status:** TESTED & VERIFIED

```bash
node test-color-correct.cjs
```

**Expected Result:**
- Lumetri Color effect applied
- Parameters set correctly (brightness, contrast, saturation)
- Effect visible in Effects Control panel

**Verified Results:**
- Lumetri Color applied successfully
- All three parameters set
- Effect visible in Premiere Pro

**Parameters to Test:**
- [ ] Brightness (-100 to 100)
- [ ] Contrast (-100 to 100)
- [ ] Saturation (-100 to 100)
- [ ] Temperature (-100 to 100)
- [ ] Tint (-100 to 100)
- [ ] Hue (-180 to 180)

---

### 8. Warp Stabilizer ⏸️
**Test Script:** `test-stabilize.cjs`
**Status:** NOT YET TESTED

```bash
node test-stabilize.cjs
```

**Expected Result:**
- Warp Stabilizer effect applied
- Smoothness parameter set
- Auto-analysis starts (may take time)
- Effect visible in Effects Control panel

**Parameters to Test:**
- [ ] Smoothness: 0 (minimal)
- [ ] Smoothness: 50 (default)
- [ ] Smoothness: 100 (maximum)

---

### 9. Apply LUT ⏸️
**Test Script:** `test-apply-lut.cjs`
**Status:** NOT YET TESTED

**Setup Required:**
1. Update `lutPath` in test-apply-lut.cjs with valid LUT file
2. Ensure LUT file is accessible

```bash
# Edit test file first:
# const lutPath = '/path/to/your/lut-file.cube';
node test-apply-lut.cjs
```

**Expected Result:**
- Lumetri Color effect applied
- LUT file loaded
- Intensity parameter set
- Color grading visible on clip

**Parameters to Test:**
- [ ] Intensity: 0% (no effect)
- [ ] Intensity: 50% (half blend)
- [ ] Intensity: 100% (full effect)
- [ ] Different LUT files (.cube, .3dl)

---

### 10. Speed Change ⏸️
**Test Script:** `test-speed-change.cjs`
**Status:** NOT YET TESTED

```bash
node test-speed-change.cjs
```

**Expected Result:**
- Clip speed changed (2x, 0.5x, etc.)
- Audio pitch maintained if enabled
- Clip duration adjusts accordingly
- Playback reflects new speed

**Parameters to Test:**
- [ ] Speed: 2.0 (double speed)
- [ ] Speed: 0.5 (half speed)
- [ ] Speed: 0.25 (slow motion)
- [ ] Speed: 4.0 (fast forward)
- [ ] maintainAudioPitch: true
- [ ] maintainAudioPitch: false

---

### 11. Add Effect ⏸️
**Test Script:** Create `test-add-effect.cjs`
**Status:** NOT YET TESTED

**Expected Result:**
- Effect applied to clip
- Parameters can be adjusted
- Effect visible in Effects Control panel

**Effects to Test:**
- [ ] Gaussian Blur
- [ ] Brightness & Contrast
- [ ] Color Balance
- [ ] Fast Color Corrector
- [ ] Vignette

---

### 12. Add Transition ⏸️
**Test Script:** Create `test-add-transition.cjs`
**Status:** NOT YET TESTED

**Expected Result:**
- Transition added between clips
- Duration set correctly
- Transition visible on timeline

**Transitions to Test:**
- [ ] Cross Dissolve (video)
- [ ] Dip to Black
- [ ] Constant Power (audio)
- [ ] Exponential Fade (audio)

---

## ✂️ Editing Operations

### 13. Trim Clip ⏸️
**Test Script:** `test-trim-clip.cjs`
**Status:** NOT YET TESTED

```bash
node test-trim-clip.cjs
```

**Expected Result:**
- Clip in/out points adjusted
- Clip duration changes
- Position on timeline remains same
- No adjacent clips affected

**Scenarios to Test:**
- [ ] Trim start only
- [ ] Trim end only
- [ ] Trim both start and end
- [ ] Extend duration (if source allows)

---

### 14. Split Clip ⏸️
**Test Script:** `test-split-clip.cjs`
**Status:** NOT YET TESTED

```bash
node test-split-clip.cjs
```

**Expected Result:**
- Clip divided into two clips
- Both clips on timeline
- No gap between clips
- Track clip count increases

**Scenarios to Test:**
- [ ] Split at middle
- [ ] Split near start
- [ ] Split near end
- [ ] Split with linked audio/video

---

## 🔊 Audio Operations

### 15. Adjust Audio Level ⏸️
**Test Script:** Create `test-adjust-audio.cjs`
**Status:** NOT YET TESTED

**Expected Result:**
- Audio volume changed
- Waveform reflects new level
- Playback volume matches setting

**Levels to Test:**
- [ ] 0 dB (unity)
- [ ] +6 dB (louder)
- [ ] -6 dB (quieter)
- [ ] -∞ dB (mute)

---

### 16. Fade Audio ⏸️
**Test Script:** Create `test-fade-audio.cjs`
**Status:** NOT YET TESTED

**Expected Result:**
- Fade in/out applied
- Keyframes visible on timeline
- Audio fades smoothly during playback

**Fades to Test:**
- [ ] Fade in at clip start
- [ ] Fade out at clip end
- [ ] Custom duration fades

---

## 🎬 Advanced Operations

### 17. Export Sequence ⏸️
**Test Script:** Create `test-export.cjs`
**Status:** NOT YET TESTED

**Expected Result:**
- Export job added to queue
- Export settings correct
- File created at specified path

---

### 18. Create Proxy Media ⏸️
**Test Script:** Create `test-create-proxy.cjs`
**Status:** NOT YET TESTED

**Expected Result:**
- Proxy generation starts
- Proxy preset applied
- Proxies created in project

---

## 🐛 Error Handling Tests

### Test Invalid Operations
- [ ] Invalid clip ID → Should return clear error
- [ ] Invalid sequence name → Should return clear error
- [ ] Invalid effect name → Should return clear error
- [ ] Invalid file path → Should return clear error
- [ ] Out of bounds time values → Should handle gracefully
- [ ] Missing required parameters → Should return parameter error

---

## 🚀 Performance Tests

### Stress Testing
- [ ] Large timeline (100+ clips) operations
- [ ] Rapid successive operations (10 ops in 1 second)
- [ ] Operations on 4K footage
- [ ] Multiple sequences open
- [ ] Large project file (1000+ items)

---

## 📊 Test Results Template

For each test, record:

```
✅ PASS / ❌ FAIL / ⏸️ PENDING

Test: [Operation Name]
Date: [YYYY-MM-DD]
Premiere Version: [e.g., 2025 v25.0]
Clip ID: [nodeId used]
Result: [Success/Failure]
Notes: [Any observations]
Error: [If failed, error message]
```

---

## 🔄 Regression Testing

After any code changes, rerun:
1. Bridge communication test
2. Add to timeline test
3. Move clip test (with linked clips)
4. Color correction test
5. One operation from each category

---

## 📝 Test Coverage Summary

| Category | Total | Tested | Pending | Pass Rate |
|----------|-------|--------|---------|-----------|
| Core Operations | 6 | 6 | 0 | 100% ✅ |
| Effects & Color | 6 | 1 | 5 | 17% 🟡 |
| Editing Operations | 2 | 0 | 2 | 0% 🔴 |
| Audio Operations | 2 | 0 | 2 | 0% 🔴 |
| Advanced Operations | 2 | 0 | 2 | 0% 🔴 |
| **TOTAL** | **18** | **7** | **11** | **39%** |

---

## 🎯 Priority Testing Order

**When Premiere Pro is available, test in this order:**

1. **P0 - Critical** (Must pass for basic functionality)
   - [x] Bridge communication
   - [x] List sequences
   - [x] Add to timeline
   - [x] Move clip
   - [x] Remove clip

2. **P1 - High** (Core features)
   - [x] Color correction
   - [ ] Warp stabilizer
   - [ ] Speed change
   - [ ] Trim clip
   - [ ] Split clip

3. **P2 - Medium** (Enhanced features)
   - [ ] Apply LUT
   - [ ] Add effect
   - [ ] Add transition
   - [ ] Adjust audio level

4. **P3 - Low** (Nice to have)
   - [ ] Fade audio
   - [ ] Export sequence
   - [ ] Create proxy media

---

## 💡 Testing Tips

1. **Test with Real Project**: Use actual project files, not empty projects
2. **Check Premiere UI**: Always verify results visually in Premiere Pro
3. **Test Edge Cases**: Empty timelines, long clips, short clips, etc.
4. **Test Undo**: Verify Premiere's Undo works after operations
5. **Monitor Performance**: Watch for slowdowns or crashes
6. **Save First**: Save project before testing destructive operations

---

## 🔗 Related Documentation

- [API Fix Status](./API_FIX_STATUS.md) - API corrections history
- [Test Results](./TEST_RESULTS.md) - Detailed test execution results
- [Next Session Guide](./NEXT_SESSION.md) - Session planning
- [Validation Checklist](./VALIDATION_CHECKLIST.md) - Pre-release validation

---

**Last Updated:** 2025-12-08
**Status:** 7/18 operations tested (39%)
**Next Tests:** Warp stabilizer, speed change, trim, split
