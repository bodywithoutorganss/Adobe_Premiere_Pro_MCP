# Implementation Roadmap & Decisions

**Date:** 2025-12-08
**Status:** Active Development

---

## ✅ User Decisions Made

### Confirmed Requirements

1. **✅ Automatic Media Import**
   - Decision: Implement automated import
   - User: "I'd like automatic imports"
   - Priority: HIGH
   - Status: To implement

2. **✅ Auto-Create Sequences**
   - Decision: Create sequences from cut sheet metadata
   - User: "Sequences would be great"
   - Priority: HIGH
   - Status: To implement

3. **✅ Track Management**
   - Decision: Ensure works for cut sheet needs
   - User: "Ensure track management works for what we need"
   - Priority: MEDIUM
   - Status: Review existing, enhance if needed

4. **⏸️ Markers**
   - Decision: Add to backlog for later
   - User: "Markers should be added but later (backlog)"
   - Priority: LOW (Future)
   - Status: Backlog

5. **✅ Timecode Support**
   - Decision: Keep conversion in processor layer
   - Status: ✅ IMPLEMENTED

6. **✅ Fine-Grained Tool Design**
   - Decision: Keep current approach
   - Status: ✅ CONFIRMED

---

## 🎯 Implementation Priority

### Phase 1: Core Automation (Current Session)

**1. Automatic Media Import** 🔴 HIGH
- [ ] Implement `import_media` operation
- [ ] Support single file import
- [ ] Support batch import from array
- [ ] Return imported clip IDs/names
- [ ] Handle import errors gracefully
- [ ] Create test script: `test-import-media.cjs`

**2. Auto-Create Sequences** 🔴 HIGH
- [ ] Implement `create_sequence` operation
- [ ] Parse sequence metadata from cut sheet
- [ ] Support common presets (9:16, 16:9, 1:1)
- [ ] Handle existing sequence (skip or error)
- [ ] Return sequence info
- [ ] Create test script: `test-create-sequence.cjs`

**3. Track Management Review** 🟡 MEDIUM
- [ ] Review existing track operations
- [ ] Ensure video/audio track handling works
- [ ] Document track numbering (V1=1, A1=2, etc.)
- [ ] Test multi-track workflows
- [ ] Add track utilities if needed

**4. Cut Sheet Processor Updates** 🔴 HIGH
- [ ] Integrate auto-import into processor
- [ ] Integrate auto-sequence creation
- [ ] Update `process-cutsheet.cjs`
- [ ] Update JSON schema with import/sequence metadata
- [ ] Test end-to-end workflow

---

### Phase 2: Testing & Validation (When Premiere Available)

**Priority Tests:**
1. **Audio Operations** 🔴 CRITICAL
   - [ ] `adjust_audio_level` - Music bed at -20dB
   - [ ] `fade_audio` - Fades for music in/out
   - [ ] `add_transition` - Audio crossfades

2. **Motion Operations** 🔴 **MOST CRITICAL**
   - [ ] `set_motion` - Position/scale/rotation
   - [ ] `reframe_for_916` - 9:16 vertical reframing

3. **Import & Sequence** 🔴 HIGH
   - [ ] `import_media` - Import clips
   - [ ] `create_sequence` - Auto-create 9:16 sequence

4. **Export Workflow** 🔴 CRITICAL
   - [ ] `export_sequence` - 9:16 vertical export
   - [ ] Validate H.264 settings
   - [ ] Check 1080x1920 resolution

5. **Complete Cut Sheet** 🔴 CRITICAL
   - [ ] Process `cutsheet-yeti-logo-timecode.json` end-to-end
   - [ ] Validate all operations work together
   - [ ] Time the automation vs manual

---

### Phase 3: Backlog (Future)

**Markers** 🟢 LOW (Future)
- [ ] `add_marker` operation
- [ ] Support different marker types
- [ ] Marker metadata (name, comments)
- [ ] Integration with timecodes

**Advanced Features** 🟢 LOW
- [ ] Nested sequences
- [ ] Multicam editing
- [ ] Advanced track operations
- [ ] Batch processing multiple cut sheets

**Polish** 🟢 LOW
- [ ] Performance optimization
- [ ] Better error messages
- [ ] Undo/redo support
- [ ] Preview generation

---

## 📋 Current System Status

### Implemented ✅

**Core Operations (21 total):**
- Timeline: add, remove, move, trim, split
- Effects: color correct, LUT, stabilizer, speed change
- Audio: levels, fades, transitions
- Motion: set_motion, reframe_for_916
- Export: sequence export, proxy creation
- Timecode: full support (HH:MM:SS, etc.)

**Infrastructure:**
- MCP server architecture ✅
- Bridge communication ✅
- Test suite (21/21 scripts) ✅
- Timecode utilities ✅
- Documentation ✅

### To Implement 🔨

**High Priority:**
1. `import_media` - Automatic media import
2. `create_sequence` - Auto-create sequences
3. Track management review

**Medium Priority:**
4. Additional track utilities (if needed)
5. Batch import optimization

**Low Priority (Backlog):**
6. Markers
7. Advanced features

---

## 🔧 Technical Architecture

### MCP Tool Workflow

**Current Process:**
```
User Request
    ↓
Claude (MCP Client)
    ↓
MCP Server (this project)
    ↓
Bridge (file-based IPC: /tmp/premiere-bridge/)
    ↓
CEP Extension (PremiereRemote)
    ↓
ExtendScript (Premiere Pro API)
    ↓
Premiere Pro Application
```

**Data Flow:**
1. Claude sends tool call to MCP server
2. MCP server writes request.json to bridge directory
3. CEP extension polls, reads request
4. Extension executes ExtendScript
5. Extension writes response.json
6. MCP server reads response, returns to Claude
7. Claude processes result

**Key Files:**
- `src/index.ts` - MCP server entry point
- `src/tools/index.ts` - Tool definitions & execution
- `src/bridge/index.ts` - Bridge communication
- `CEP Extension` - PremiereRemote panel
- `/tmp/premiere-bridge/` - IPC directory

---

## 📊 Track Management

### Current Understanding

**Track Numbering:**
- Video tracks: 1, 2, 3, ... (V1, V2, V3 in Premiere)
- Audio tracks: 1, 2, 3, ... (A1, A2, A3 in Premiere)
- Tracks specified separately for video vs audio operations

**Operations Using Tracks:**
- `add_to_timeline(trackIndex)` - Place clip on specific track
- Audio operations apply to audio component of clip

**Questions to Verify:**
1. How are audio-only clips tracked?
2. Can we specify A1, A2 explicitly?
3. What about linked AV clips on separate tracks?

**Action Items:**
- [ ] Document track numbering clearly
- [ ] Test multi-track scenarios
- [ ] Ensure audio track handling works
- [ ] Add track utilities if gaps found

---

## 📝 Cut Sheet Format Evolution

### Current Format (v2 - Timecode-Based)

```json
{
  "project": "Project_Name",
  "sequence": {
    "name": "Sequence_Name",
    "format": "9:16",
    "resolution": "1080x1920",
    "frameRate": 30
  },
  "media": {
    "import": [
      {
        "path": "/path/to/clip1.mov",
        "name": "interview_ben"
      },
      {
        "path": "/path/to/clip2.mov",
        "name": "ranch_golden_hour"
      }
    ]
  },
  "shots": [
    {
      "clipName": "interview_ben",
      "timelineStart": "00:00:00",
      "sourceIn": "00:15:00",
      "sourceOut": "00:15:11",
      "operations": [...]
    }
  ],
  "audio": [...],
  "export": {...}
}
```

### Additions for Phase 1

**Import Section (NEW):**
```json
"media": {
  "import": [
    {
      "path": "/path/to/file.mov",
      "name": "optional_custom_name",
      "bin": "optional_bin_name"
    }
  ]
}
```

**Sequence Auto-Creation (ENHANCED):**
```json
"sequence": {
  "name": "Sequence_Name",
  "preset": "DSLR_1080p_30",  // OR custom:
  "format": "9:16",           // Custom format
  "resolution": "1080x1920",
  "frameRate": 30,
  "audioTracks": 4,
  "videoTracks": 3
}
```

---

## 🎯 Success Criteria

### Phase 1 Complete When:
- [x] Timecode support working (DONE ✅)
- [ ] Import media from cut sheet working
- [ ] Auto-create sequences working
- [ ] Track management validated
- [ ] End-to-end cut sheet processing working without manual steps
- [ ] Documentation updated
- [ ] All test scripts created

### Phase 2 Complete When:
- [ ] All operations tested with Premiere Pro
- [ ] Audio operations validated
- [ ] Motion/reframing validated
- [ ] Export workflow validated
- [ ] Bug fixes completed
- [ ] Performance acceptable

### Phase 3:
- Backlog items implemented as needed

---

## 📐 Design Decisions

### Import Strategy
**Decision:** Automated import from cut sheet
- Cut sheet specifies file paths
- System imports before processing
- Returns clip references
- Handles errors gracefully

### Sequence Creation
**Decision:** Auto-create from metadata
- Check if sequence exists first
- Create if missing
- Use preset or custom settings
- Return sequence info

### Timecode Handling
**Decision:** Processor layer conversion
- Cut sheets use timecodes (HH:MM:SS)
- Processor converts to seconds
- MCP tools use seconds internally
- Clear separation of concerns

### Tool Granularity
**Decision:** Fine-grained operations
- Each operation is a separate tool
- Composable in cut sheets
- Flexible for different workflows

### Error Handling
**Decision:** Fail-fast with clear errors
- Stop on first error
- Return clear error message
- User fixes and retries
- Better than partial success with unclear state

---

## 🗂️ File Organization

### Source Code
```
src/
  index.ts              - MCP server entry
  tools/index.ts        - Tool definitions & execution
  bridge/index.ts       - Bridge communication
  utils/
    timecode.ts         - Timecode utilities
    logger.ts           - Logging
  resources/            - MCP resources (if needed)
  prompts/              - MCP prompts (if needed)
```

### Test Scripts
```
test-*.cjs              - 21 operation test scripts
test-timecode.cjs       - Timecode utility tests
process-cutsheet.cjs    - Cut sheet processor
```

### Documentation
```
ROADMAP.md              - This file
MCP_TOOL_AUDIT.md       - Tool inventory & gaps
TIMECODE_WORKFLOW.md    - Timecode usage guide
CUTSHEET_EXAMPLE.md     - Original example
MOTION_IMPLEMENTATION.md - Motion API docs
TESTING_CHECKLIST.md    - Test procedures
NEXT_SESSION.md         - Session status
```

### Examples
```
cutsheet-yeti-logo-timecode.json  - Example cut sheet
```

---

## 🚀 Next Actions

### Immediate (This Session)

1. **Implement Import Media**
   - Create import operation in tools/index.ts
   - Support file paths and arrays
   - Return clip IDs/names
   - Handle errors

2. **Implement Create Sequence**
   - Create sequence operation
   - Parse preset or custom settings
   - Check for existing sequence
   - Return sequence info

3. **Update Cut Sheet Processor**
   - Add import step
   - Add sequence creation step
   - Test with updated cut sheet

4. **Update Documentation**
   - Document new operations
   - Update cut sheet schema
   - Create test scripts

### When Premiere Available

5. **Test Everything**
   - Priority: Audio, Motion, Export
   - Run all test scripts
   - Fix bugs
   - Document results

6. **Production Validation**
   - Process real cut sheets
   - Time automation vs manual
   - Gather feedback
   - Iterate

---

## 📊 Progress Tracking

### Overall Progress

| Category | Complete | In Progress | Planned | Total |
|----------|----------|-------------|---------|-------|
| Core Operations | 21 | 0 | 0 | 21 |
| Import/Export | 1 | 2 | 0 | 3 |
| Test Scripts | 21 | 2 | 0 | 23 |
| Documentation | 10 | 1 | 0 | 11 |
| Live Testing | 7 | 0 | 14 | 21 |

### Session 5 Milestones

- [x] Motion implementation (9:16 reframing)
- [x] Test suite completion (100%)
- [x] Timecode support
- [ ] Import automation ← CURRENT
- [ ] Sequence auto-creation ← CURRENT
- [ ] Track management review ← CURRENT

---

## 💡 Notes & Insights

### What's Working Well
- Timecode utilities are solid ✅
- Test infrastructure is comprehensive ✅
- Cut sheet format is clear and usable ✅
- Bridge communication is reliable ✅

### Challenges
- Can't test without Premiere Pro running
- ExtendScript API has quirks (QE DOM, etc.)
- Need to validate assumptions with live tests

### Learnings
- File-based IPC works well for CEP
- Timecode support was critical for real workflows
- Fine-grained tools provide good flexibility
- Comprehensive testing infrastructure pays off

---

## 🔗 Related Resources

**External:**
- [Premiere Pro Scripting Docs](https://ppro-scripting.docsforadobe.dev/)
- [Adobe CEP Samples](https://github.com/Adobe-CEP/Samples)
- [MCP Protocol Spec](https://modelcontextprotocol.io/)

**Internal:**
- See TESTING_CHECKLIST.md for test procedures
- See MCP_TOOL_AUDIT.md for tool inventory
- See TIMECODE_WORKFLOW.md for timecode usage

---

**Last Updated:** 2025-12-08
**Session:** 5 (Part 5 - Import & Sequence Implementation)
**Status:** Active Development - Implementing Phase 1
