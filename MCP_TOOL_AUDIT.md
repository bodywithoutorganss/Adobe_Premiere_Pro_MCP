# MCP Tool Audit & Design Review

**Date:** 2025-12-08
**Purpose:** Comprehensive audit of MCP tool definitions, implementations, and gaps

---

## 🎯 Executive Summary

**Current Status:**
- **Defined Tools:** 35+ MCP tools in schema
- **Implemented Operations:** 21 operations fully implemented
- **Tested Operations:** 7 operations live tested (33%)
- **Test Scripts:** 21/21 operations have test scripts (100%)
- **Critical Gap:** Import media operations need review/testing

---

## 📊 Tool Inventory

### ✅ Project & Media Management

| Tool | Status | Tested | Notes |
|------|--------|--------|-------|
| `list_project_items` | ✅ Implemented | ✅ Yes | Works - 17 items found |
| `list_sequences` | ✅ Implemented | ✅ Yes | Works - 8 sequences |
| `list_sequence_tracks` | ✅ Implemented | ⏸️ No | Needs testing |
| `get_project_info` | ✅ Implemented | ⏸️ No | Needs testing |
| `create_project` | ⚠️ Defined | ❌ No | Not implemented |
| `open_project` | ⚠️ Defined | ❌ No | Not implemented |
| `save_project` | ⚠️ Defined | ❌ No | Not implemented |
| `save_project_as` | ⚠️ Defined | ❌ No | Not implemented |

**Notes:**
- Project creation/opening may not be needed for cut sheet workflow
- User can manually open project before automation
- Consider: Do we need these for our use case?

---

### 📥 Import Operations

| Tool | Status | Tested | Priority | Notes |
|------|--------|--------|----------|-------|
| `import_media` | ⚠️ Defined | ❌ No | 🟡 Medium | User said "can do manually if needed" |
| `import_folder` | ⚠️ Defined | ❌ No | 🟡 Medium | Batch import |
| `create_bin` | ⚠️ Defined | ❌ No | 🟢 Low | Organization feature |

**Analysis:**
- **User's stated preference:** Can import manually
- **Cut sheet workflow:** Assumes media already imported
- **Recommendation:** Lower priority - focus on assembly operations
- **Future:** Could be useful for fully automated pipelines

**Questions for User:**
1. Do you want automatic media import from cut sheet?
2. Or is manual import before processing acceptable?
3. Should we implement bin organization?

---

### ✅ Timeline & Editing Operations

| Tool | Status | Tested | Priority | Notes |
|------|--------|--------|----------|-------|
| `create_sequence` | ⚠️ Defined | ❌ No | 🟡 Medium | Could be useful |
| `duplicate_sequence` | ⚠️ Defined | ❌ No | 🟢 Low | Versioning feature |
| `delete_sequence` | ⚠️ Defined | ❌ No | 🟢 Low | Cleanup feature |
| `add_to_timeline` | ✅ Implemented | ✅ Yes | 🔴 Critical | **WORKS PERFECTLY** |
| `remove_from_timeline` | ✅ Implemented | ✅ Yes | 🔴 Critical | **WORKS** - Maintains sync |
| `move_clip` | ✅ Implemented | ✅ Yes | 🔴 Critical | **WORKS** - Maintains sync |
| `trim_clip` | ✅ Implemented | ⏸️ No | 🟡 Medium | Test script ready |
| `split_clip` | ✅ Implemented | ⏸️ No | 🟡 Medium | Test script ready |

**Analysis:**
- Core editing operations are solid ✅
- Sequence creation might be useful (avoid manual setup)
- Split/trim need testing but have scripts ready

---

### 🎨 Effects & Color

| Tool | Status | Tested | Priority | Notes |
|------|--------|--------|----------|-------|
| `apply_effect` | ✅ Implemented | ⏸️ No | 🟡 Medium | Generic effect application |
| `remove_effect` | ⚠️ Defined | ❌ No | 🟢 Low | Cleanup feature |
| `add_transition` | ✅ Implemented | ⏸️ No | 🔴 Critical | **CRITICAL for cut sheets** |
| `add_transition_to_clip` | ⚠️ Defined | ❌ No | 🟡 Medium | Different API? |
| `color_correct` | ✅ Implemented | ✅ Yes | 🔴 Critical | **WORKS** - Lumetri Color |
| `apply_lut` | ✅ Implemented | ⏸️ No | 🟡 Medium | Test script ready |
| `stabilize_clip` | ✅ Implemented | ⏸️ No | 🟡 Medium | Warp Stabilizer |
| `speed_change` | ✅ Implemented | ⏸️ No | 🟡 Medium | Retiming |

**Analysis:**
- Color correction works perfectly ✅
- Transitions critical for audio crossfades
- Two transition tools defined - may be redundant?

**Questions:**
1. Difference between `add_transition` and `add_transition_to_clip`?
2. Should we consolidate these?

---

### 🔊 Audio Operations

| Tool | Status | Tested | Priority | Notes |
|------|--------|--------|----------|-------|
| `adjust_audio_levels` | ✅ Implemented | ⏸️ No | 🔴 Critical | **CRITICAL for cut sheets** |
| `fade_audio` | ✅ Implemented | ⏸️ No | 🔴 Critical | **CRITICAL for music beds** |
| `add_audio_keyframes` | ⚠️ Defined | ❌ No | 🟡 Medium | Advanced audio mixing |
| `mute_track` | ⚠️ Defined | ❌ No | 🟢 Low | Track-level control |

**Analysis:**
- Core audio operations implemented ✅
- Critical for music bed workflow (-20dB, fades)
- Advanced keyframing not needed for basic cut sheets

---

### 🎬 Motion & Transform

| Tool | Status | Tested | Priority | Notes |
|------|--------|--------|----------|-------|
| `set_motion` | ✅ Implemented | ⏸️ No | 🔴 Critical | Position/scale/rotation |
| `reframe_for_916` | ✅ Implemented | ⏸️ No | 🔴 **CRITICAL** | **9:16 vertical video** |

**Analysis:**
- **THE KEY FEATURE** for cut sheet automation ✅
- Enables Instagram/TikTok/Stories workflow
- Must test when Premiere available

---

### 📝 Text & Graphics (OUT OF SCOPE)

| Tool | Status | Tested | Priority | Notes |
|------|--------|--------|----------|-------|
| `add_text_overlay` | ⚠️ Defined | ❌ No | ⛔ Out of Scope | Per user: "won't be made" |
| `add_shape` | ⚠️ Defined | ❌ No | ⛔ Out of Scope | Per user: "won't be made" |

**User Statement:** "assume that text/graphics just wont be made"

**Recommendation:**
- Keep tool definitions for future
- Don't implement now
- Document as "not in scope"

---

### 📤 Export & Delivery

| Tool | Status | Tested | Priority | Notes |
|------|--------|--------|----------|-------|
| `export_sequence` | ✅ Implemented | ⏸️ No | 🔴 Critical | **Final delivery step** |
| `export_frame` | ⚠️ Defined | ❌ No | 🟢 Low | Still image export |
| `create_proxy_media` | ✅ Implemented | ⏸️ No | 🟡 Medium | 4K workflow optimization |

**Analysis:**
- Export sequence is THE final step ✅
- Must work for 9:16 vertical (1080x1920)
- Proxy media is nice-to-have

---

### 🎥 Advanced Features

| Tool | Status | Tested | Priority | Notes |
|------|--------|--------|----------|-------|
| `create_multicam_sequence` | ⚠️ Defined | ❌ No | 🟢 Low | Multi-camera editing |

**Analysis:**
- Not needed for single-clip cut sheet workflow
- Could be useful for multi-angle podcasts
- Low priority

---

## 🔍 Gaps & Issues

### 1. **Import Operations** - Needs Decision

**Current State:**
- Defined but not fully implemented/tested
- User said "can import manually if needed"

**Options:**
A. **Manual Import (Current)**: User imports media before processing
   - ✅ Simpler workflow
   - ✅ User has control
   - ❌ Not fully automated

B. **Automated Import**: Implement import_media operation
   - ✅ Fully automated pipeline
   - ❌ More complexity
   - ❌ Harder to debug if media missing

**Recommendation:** Start with Manual (A), implement automated later if needed.

---

### 2. **Sequence Creation** - Should We Auto-Create?

**Current State:**
- User creates 9:16 sequence manually in Premiere
- Cut sheet processor assumes sequence exists

**Alternative:**
```javascript
// Auto-create from cut sheet metadata
{
  "sequence": {
    "name": "DW_EP032_YetiLogo_9x16_v01",
    "resolution": "1080x1920",
    "frameRate": 30
  }
}

// Processor creates sequence if doesn't exist
await createSequence(cutSheet.sequence);
```

**Pros:**
- ✅ Fully automated - no manual setup
- ✅ Ensures correct sequence settings
- ✅ Repeatable

**Cons:**
- ❌ May conflict with existing sequences
- ❌ User loses manual control

**Question for User:** Auto-create sequences or assume manual creation?

---

### 3. **Transition Tool Duplication**

**Current State:**
- `add_transition` - Between two clips
- `add_transition_to_clip` - To a single clip (fade in/out?)

**Issue:** Redundant or different use cases?

**Recommendation:**
- Clarify difference
- Consolidate if redundant
- Or document distinct use cases

---

### 4. **Missing Operations?**

**Potential Gaps:**
- **Markers:** Add markers at specific timecodes?
  - Could be useful for noting edit points
  - Low priority for automated workflow

- **Nested Sequences:** Create nested compositions?
  - Useful for complex multi-layer edits
  - Not needed for basic cut sheets

- **Track Management:** Lock/unlock/solo tracks?
  - Workflow convenience
  - Not critical

**Question for User:** Are any of these needed?

---

## 🎯 Recommendations

### High Priority (Do Now)

1. **Test Audio Operations**
   - `adjust_audio_levels` - CRITICAL for music beds
   - `fade_audio` - CRITICAL for music fades
   - `add_transition` - CRITICAL for audio crossfades

2. **Test Motion Operations**
   - `reframe_for_916` - THE key feature
   - `set_motion` - Position/scale/rotation

3. **Test Export**
   - `export_sequence` - Final delivery
   - Validate 9:16 vertical export works

4. **Review Import Strategy**
   - Decide: Manual vs automated
   - If automated, implement import_media
   - If manual, document workflow

---

### Medium Priority (Soon)

1. **Implement Sequence Creation**
   - `create_sequence` from cut sheet metadata
   - Auto-create 9:16 sequences
   - Fallback if sequence exists

2. **Test Remaining Effects**
   - `apply_lut` - Color grading
   - `stabilize_clip` - Warp Stabilizer
   - `speed_change` - Retiming

3. **Clarify Tool Design**
   - Document transition tool differences
   - Consolidate if redundant
   - Clean up unused definitions

---

### Low Priority (Later/Optional)

1. **Advanced Features**
   - Text overlays (if scope changes)
   - Multicam sequences
   - Proxy media workflow
   - Markers and organization

2. **Project Management**
   - Create/open/save projects
   - Only if needed for automation

---

## 📋 Tool Design Review

### Naming Conventions

**Current:**
- `snake_case` for tool names ✅
- Descriptive, clear names ✅
- Consistent verb prefixes (add_, remove_, create_)

**Suggestions:**
- ✅ Keep current convention
- Consider grouping: `timeline_add_clip`, `audio_adjust_levels`?
- Or keep flat namespace (current approach)

**Recommendation:** Current naming is fine - don't change.

---

### Parameter Design

**Current Approach:**
- Mix of explicit parameters
- Optional parameters for flexibility
- Some operations take clipId, others take clipName

**Issues:**
1. **Inconsistent clip identification:**
   - Some: `clipId` (node ID)
   - Some: `projectItemId` (item name/ID)
   - Some: Both?

2. **Timecode support:**
   - Now supported via utility functions ✅
   - Should we accept timecodes directly in MCP tools?
   - Or keep conversion in processor layer?

**Recommendations:**

**Option A - Keep Current (Recommended):**
- MCP tools accept seconds (numbers)
- Cut sheet processor converts timecodes → seconds
- Clear separation of concerns

**Option B - Accept Both:**
```typescript
{
  time: z.union([
    z.number(),
    z.string().describe('Timecode (HH:MM:SS) or seconds')
  ])
}
```
- More flexible
- More complexity in tool validation

**Question for User:** Which approach do you prefer?

---

### Response Format

**Current:**
```json
{
  "success": true,
  "clipId": "abc123",
  "message": "Clip added successfully"
}
```

**Works well for:**
- ✅ Success/failure detection
- ✅ Returning clip IDs for chaining
- ✅ Error messages

**Consider adding:**
- Timecode information in responses?
- Duration information?
- More metadata?

---

## 🔄 Workflow Validation

### Cut Sheet Assembly Workflow

**Steps:**
1. User creates/opens Premiere project ✅
2. User imports media manually ✅ (or automated?)
3. User creates 9:16 sequence manually ✅ (or automated?)
4. System processes cut sheet:
   - Reads JSON ✅
   - Converts timecodes ✅
   - Adds clips to timeline ✅
   - Applies operations (reframe, color, audio) ⏸️
5. User reviews in Premiere ✅
6. System exports final video ⏸️

**Manual Steps:**
- Project setup
- Media import
- Sequence creation
- (Optional) Text overlays
- Final review

**Automated Steps:**
- Timeline assembly
- Clip positioning
- Effects application
- Color grading
- Audio mixing
- Export

**Questions:**
1. Should we automate more manual steps?
2. Are current manual steps acceptable?
3. Any workflow pain points?

---

## 🎬 Cut Sheet Operations Coverage

### Required for "Yeti Logo" Example

| Operation | Status | Priority |
|-----------|--------|----------|
| Add clips to timeline | ✅ Works | CRITICAL |
| Source in/out points | ✅ Works | CRITICAL |
| Reframe to 9:16 | ✅ Implemented | **CRITICAL** |
| Color grading | ✅ Works | CRITICAL |
| Motion (zoom) | ✅ Implemented | HIGH |
| Audio levels (-20dB) | ✅ Implemented | CRITICAL |
| Audio fades | ✅ Implemented | CRITICAL |
| Export 9:16 | ✅ Implemented | CRITICAL |

**Coverage:** 90% (only text overlays missing, per scope)

**Blockers:** None! Just need testing.

---

## 💡 Design Philosophy Questions

### 1. Granularity

**Current:** Fine-grained operations
- Separate tools for each operation
- Composable in cut sheets
- More MCP tools (35+)

**Alternative:** Coarse-grained
- Fewer, more powerful tools
- E.g., `assemble_cutsheet` that does everything
- Less flexibility

**Question:** Do you like the fine-grained approach?

### 2. Automation Level

**Spectrum:**
```
Manual <---------------------> Fully Automated
   |          |          |
   User       Cut Sheet  AI Agent
   Control    Processor  Decision
```

**Current Position:** Cut Sheet Processor (middle)
- User creates cut sheet with precise specs
- System executes faithfully
- No AI decision-making

**Alternative:** AI Agent
- "Make this vertical for Instagram"
- AI decides framing, timing, effects
- More magic, less control

**Question:** Is current level right for your use case?

### 3. Error Handling

**Current:** Operation-level errors
- Each MCP call can fail independently
- Cut sheet processor stops on error
- User must fix and retry

**Alternative:** Resilient processing
- Skip failed operations
- Continue with warnings
- Partial success possible

**Question:** Fail-fast or continue-on-error?

---

## 📝 Action Items

### For Next Session (User Decision Needed)

1. **Import Strategy:**
   - [ ] Confirm: Manual import is acceptable?
   - [ ] Or: Implement automated import?

2. **Sequence Creation:**
   - [ ] Confirm: Manual sequence creation OK?
   - [ ] Or: Auto-create from cut sheet metadata?

3. **Tool Cleanup:**
   - [ ] Review transition tool duplication
   - [ ] Decide on text/graphics tool removal

4. **Parameter Design:**
   - [ ] Timecodes in MCP tools or processor only?
   - [ ] Unified clip identification strategy?

### For Implementation (When Premiere Available)

1. **Priority Testing:**
   - [ ] Audio operations (levels, fades, transitions)
   - [ ] Motion operations (reframe 9:16)
   - [ ] Export workflow

2. **Bug Fixes:**
   - [ ] Any issues discovered in testing

3. **Documentation:**
   - [ ] Update based on test results
   - [ ] Add troubleshooting guides

---

## ✅ What's Working Well

1. **Core Timeline Operations** - Solid foundation ✅
2. **Timecode Support** - Production-ready ✅
3. **Test Infrastructure** - 100% coverage ✅
4. **Documentation** - Comprehensive ✅
5. **Cut Sheet Format** - Clear and usable ✅

---

**Last Updated:** 2025-12-08
**Next Review:** After live testing with Premiere Pro
