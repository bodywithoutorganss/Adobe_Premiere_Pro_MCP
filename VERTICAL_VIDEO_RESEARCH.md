# Vertical Video & Cut Sheet Implementation Research

**Date:** 2025-12-08
**Purpose:** Determine feasibility of implementing automated cut sheet workflows for 9:16 vertical video

---

## 🎯 Research Objective

Investigate whether the Premiere Pro MCP server can support automated implementation of cut sheets like the "Yeti Logo" example, which requires:
- 9:16 vertical video (1080x1920)
- Reframing 16:9 clips to 9:16
- Audio crossfades and music beds
- Multi-clip assembly with precise timing
- Color grading and effects

---

## ✅ CRITICAL FINDING: Motion Effect Access IS POSSIBLE

### What We Discovered

The **Motion effect** (built into every clip) can be accessed via the `components` array in ExtendScript:

```javascript
// Access Motion component
var clip = /* ... find clip ... */;
var motionComponent = clip.components[1]; // Usually index 1
var properties = motionComponent.properties;

// Motion properties structure:
// properties[0] - Position [x, y]
// properties[1] - Scale
// properties[2] - Scale Width
// properties[4] - Rotation
// properties[5] - Anchor Point
```

### Setting Values

Based on [Adobe Community research](https://community.adobe.com/t5/premiere-pro-discussions/how-to-add-effects-to-clips-in-premiere-with-cep-extendscript/td-p/10431363):

```javascript
// Set position (center of frame)
var positionProp = motionComponent.properties[0];
positionProp.setValue([0.5, 0.5], true);

// Set scale (150% zoom)
var scaleProp = motionComponent.properties[1];
scaleProp.setValue(150, true);
```

### Important Notes

1. **Position values are normalized**: 0-1 range
   - 0 = left/top edge
   - 1 = right/bottom edge
   - 0.5 = center

2. **Version compatibility**: [Some issues reported](https://community.adobe.com/t5/premiere-pro-discussions/setvalue-fails-in-position-property/m-p/10789155) with Position setValue in Premiere 2020, fixed in 14.0.1

3. **Performance**: May be slow, UI updates can lag slightly

### Test Script Created

`test-motion-effect.cjs` - Enumerates all Motion properties on a clip to verify access

---

## ✅ Audio Crossfades: ALREADY IMPLEMENTED

### Current Capability

We already have `addTransition()` and `addTransitionToClip()` operations that support audio transitions via QE DOM.

### Available Audio Transitions

Based on [Premiere Pro audio transitions](https://helpx.adobe.com/premiere/desktop/add-audio-effects/apply-audio-transitions/audio-crossfade-transitions.html):

1. **Constant Gain** - Linear crossfade
2. **Constant Power** - Smooth, gradual (most common for music)
3. **Exponential Fade** - Very gradual logarithmic curve

### Usage Example

```javascript
// Add Constant Power crossfade between two clips
await addTransition(clipId1, clipId2, "Constant Power", 1.0);

// Add fade out to end of clip
await addTransitionToClip(clipId, "Exponential Fade", "end", 2.0);
```

**Status:** ✅ Already works, tested and verified

---

## ⚠️ Sequence Creation: REQUIRES PRESETS

### What We Found

From [PremiereOnScript](https://premiereonscript.com/log-04/) and community research:

Two methods exist:

1. **`app.project.createNewSequence(name, id)`**
   - Requires user interaction (dialog)
   - Not suitable for automation

2. **`qe.project.newSequence(name, presetPath)`** (Recommended)
   - Uses `.sqpreset` files
   - No user interaction required
   - Must reference existing preset file

### Implication

To create 1080x1920 vertical sequences, we need:
- A `.sqpreset` file for 9:16 vertical format
- Path to the preset file
- Or: manually create one sequence as template, then duplicate

### Workaround Options

1. **User creates template sequence** - Program duplicates it
2. **Ship preset file** - Include 9:16 preset with the tool
3. **Manual setup** - User creates sequence, program populates it

**Recommendation:** Option 1 (template duplication) is most reliable

---

## 📊 Gap Analysis for Cut Sheet Workflow

### ✅ What We Have (Ready Now)

| Feature | Status | Implementation |
|---------|--------|----------------|
| Clip assembly | ✅ Complete | addToTimeline |
| Precise timing | ✅ Complete | moveClip, trimClip |
| Audio crossfades | ✅ Complete | addTransition |
| Audio levels | ✅ Complete | adjustAudioLevels |
| Color grading | ✅ Complete | colorCorrect (Lumetri) |
| Effects | ✅ Complete | applyEffect |
| Transitions | ✅ Complete | addTransition |
| Speed changes | ✅ Complete | speedChange |
| Split clips | ✅ Complete | splitClip |
| Export | ✅ Complete | exportSequence |

### 🔴 Critical Missing Features

| Feature | Status | Effort | Priority |
|---------|--------|--------|----------|
| **Motion effect (reframe)** | 🟡 API exists, not implemented | Medium | P0 |
| **Sequence creation** | 🟡 Possible with presets | Medium | P1 |
| **Import media** | ❓ Research needed | Unknown | P2 |

### 🚫 Out of Scope (Per User)

- Text/graphics overlays - Will not be implemented
- Audio cleanup (breath removal, etc.) - Done in pre-processing
- Quality control automation - Manual/separate process

---

## 🚀 Implementation Plan for Motion Effect

### Step 1: Create setMotion Operation

Add new operation to handle position/scale/rotation:

```typescript
private async setMotion(
  clipId: string,
  position?: [number, number],  // [x, y] 0-1 normalized
  scale?: number,               // Percentage (100 = 100%)
  rotation?: number,            // Degrees
  anchorPoint?: [number, number] // [x, y] 0-1 normalized
): Promise<any>
```

### Step 2: Add Reframe Helper

High-level operation for 9:16 reframing:

```typescript
private async reframeFor916(
  clipId: string,
  position: 'center' | 'top' | 'bottom' | 'left' | 'right' = 'center'
): Promise<any>
```

This would automatically:
1. Calculate scale to fit 16:9 into 9:16 (zoom to crop)
2. Set position based on desired framing
3. Handle aspect ratio math

### Step 3: Test with Premiere

1. Run `test-motion-effect.cjs` to verify property access
2. Test setValue() with position/scale values
3. Verify version compatibility (Premiere 2025)
4. Handle any edge cases

**Estimated Implementation Time:** 2-3 hours

---

## 💡 Workflow Integration

### Proposed Cut Sheet → Premiere Flow

Given a cut sheet like the "Yeti Logo" example:

**1. Pre-Processing** (External to this program)
- Twelve Labs identifies scenes/cutaways
- Audio processing (cleanup, normalization)
- Generate JSON instruction set

**2. Premiere Assembly** (This program)
```json
{
  "sequence": {
    "name": "DW_EP032_YetiLogo_9x16_v01",
    "template": "9x16_vertical_template"
  },
  "shots": [
    {
      "clipPath": "/path/to/ranch_stock.mov",
      "startTime": 0.0,
      "duration": 4.0,
      "motion": {
        "scale": 120,
        "position": [0.5, 0.5]
      },
      "colorGrade": "golden_hour"
    },
    {
      "clipPath": "/path/to/interview.mov",
      "sourceIn": 900.0,  // 00:15:00
      "sourceOut": 915.0, // 00:15:15
      "startTime": 4.0,
      "motion": {
        "scale": 150,
        "position": [0.5, 0.4]
      }
    },
    // ... more shots ...
  ],
  "audio": [
    {
      "type": "music",
      "clipPath": "/music/contemplative_acoustic.wav",
      "startTime": 0.0,
      "duration": 50.0,
      "level": -20,
      "fadeIn": 1.0,
      "fadeOut": 2.0
    }
  ],
  "export": {
    "resolution": "1080x1920",
    "frameRate": 30,
    "codec": "H.264",
    "bitrate": 12
  }
}
```

**3. Post-Processing** (External or manual)
- Quality control review
- Text/graphics overlay (separate tool)
- Final delivery prep

### What This Program Does Well

✅ **Assembly & Timing** - Precise clip placement
✅ **Reframing** - Motion effect for 9:16 (once implemented)
✅ **Audio Mixing** - Levels, crossfades, music beds
✅ **Color & Effects** - Lumetri, effects library
✅ **Export** - Render to spec

### What It Doesn't Do

❌ **Generate instructions** - Receives pre-made JSON
❌ **Text overlays** - Out of scope
❌ **Audio processing** - Pre-done externally
❌ **QC validation** - Manual or separate tool

---

## 🎯 Recommended Next Steps

### Phase 1: Motion Effect Implementation (P0)

**Priority:** CRITICAL for 9:16 workflow

1. Implement `setMotion()` operation
2. Implement `reframeFor916()` helper
3. Test with `test-motion-effect.cjs`
4. Document position/scale calculations

**Effort:** 2-3 hours
**Blocks:** All vertical video use cases

### Phase 2: Sequence Creation (P1)

**Priority:** HIGH for automation

1. Research sequence duplication method
2. Implement `createSequenceFromTemplate()`
3. Or: Implement preset-based creation
4. Document setup requirements

**Effort:** 2-4 hours
**Workaround:** User creates sequence manually

### Phase 3: Import Media (P2)

**Priority:** MEDIUM for full automation

1. Research `app.project.importFiles()` API
2. Test file import via ExtendScript
3. Implement if possible
4. Document limitations

**Effort:** 3-5 hours (if possible)
**Workaround:** User imports media manually

---

## 📋 Technical References

**Motion Effect Access:**
- [Adobe Community: Add effects with ExtendScript](https://community.adobe.com/t5/premiere-pro-discussions/how-to-add-effects-to-clips-in-premiere-with-cep-extendscript/td-p/10431363)
- [Adobe Community: setValue with Position](https://community.adobe.com/t5/premiere-pro-discussions/setvalue-fails-in-position-property/m-p/10789155)
- [Adobe CEP Samples](https://github.com/Adobe-CEP/Samples/blob/master/PProPanel/jsx/PPRO/Premiere.jsx)

**Sequence Creation:**
- [PremiereOnScript: Creating Sequences](https://premiereonscript.com/log-04/)
- [Premiere Pro Scripting Guide](https://ppro-scripting.docsforadobe.dev/)

**Audio Transitions:**
- [Adobe: Audio Crossfade Transitions](https://helpx.adobe.com/premiere/desktop/add-audio-effects/apply-audio-transitions/audio-crossfade-transitions.html)
- [FilmDaft: Crossfades Explained](https://filmdaft.com/crossfades-in-premiere-pro-explained/)

---

## 🎬 Example: "Yeti Logo" Cut Sheet Feasibility

### Can We Implement This Cut Sheet?

**SHOT 1:** Golden hour ranch (0:00-0:04)
- ✅ Place stock footage
- ✅ Reframe for 9:16 (with Motion implementation)
- ✅ Color grade (golden hour LUT)
- ❌ Text overlay (out of scope)

**SHOT 2:** Ben speaking (0:04-0:15)
- ✅ Extract from episode (sourceIn/Out)
- ✅ Reframe 9:16, medium close-up
- ✅ Place at precise time
- ❌ Lower third text (out of scope)

**SHOT 3-7:** B-roll and interviews
- ✅ All achievable with current + Motion

**SHOT 8:** End card
- ❌ Graphics (out of scope)
- ✅ Could show logo clip if pre-rendered

**Audio:**
- ✅ Music bed at -20dB
- ✅ Fade in (1s) / fade out (2s)
- ✅ Dialogue crossfades

**Export:**
- ✅ 1080x1920, 30fps, H.264

### Verdict

**90% Implementable** with Motion effect added
- Core assembly: ✅ Yes
- Timing: ✅ Yes
- Reframing: ✅ Yes (once Motion implemented)
- Audio: ✅ Yes
- Color/Effects: ✅ Yes
- Text/Graphics: ❌ No (but out of scope)

---

## 🚦 Final Recommendation

### Go Forward with Implementation

**Rationale:**
1. **Motion effect API exists** - Just needs implementation
2. **Audio crossfades already work** - No blockers
3. **Sequence workaround viable** - User creates template
4. **90% of cut sheet achievable** - Missing pieces are out of scope anyway

### Immediate Action Items

1. ✅ **Implement setMotion operation** (P0, 2-3 hours)
2. ✅ **Create reframeFor916 helper** (P0, 1 hour)
3. ✅ **Test with real clips** (P0, 1 hour)
4. 🟡 **Implement sequence creation** (P1, 2-4 hours)
5. 🟡 **Research import media** (P2, 3-5 hours if viable)

### Timeline

- **Phase 1 (Motion):** Can start immediately, 1 session
- **Phase 2 (Sequence):** Next session, optional
- **Phase 3 (Import):** Future enhancement

**Total estimated effort:** 4-7 hours for full vertical video workflow support

---

**Status:** ✅ FEASIBLE - Recommend proceeding with Motion effect implementation

**Last Updated:** 2025-12-08
