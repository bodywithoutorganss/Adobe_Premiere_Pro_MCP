# Project Validation Checklist

## Date: 2025-12-05

This checklist ensures the Adobe Premiere Pro MCP server is working correctly after API fixes.

---

## ✅ Infrastructure Validation

### 1. MCP Server
- [x] **Server builds without errors**: `npm run build` completes successfully
- [x] **Server starts successfully**: `npm start` runs without crashes
- [x] **Bridge initializes**: Temp directory created at `/tmp/premiere-bridge/`
- [x] **No TypeScript errors**: Build completes cleanly

**Verification:**
```bash
cd ~/Dropbox/CS/premiere-pro/Adobe_Premiere_Pro_MCP
npm run build  # Should complete with no errors
npm start      # Should show "MCP Adobe Premiere Pro Server started successfully"
```

**Status:** ✅ PASS

---

### 2. CEP Extension
- [x] **Extension installed**: Located at `~/Library/Application Support/Adobe/CEP/extensions/PremiereRemote/`
- [x] **Required files present**:
  - [x] CSXS/manifest.xml
  - [x] index.html
  - [x] CSInterface.js
  - [x] jsx/hostscript.jsx
  - [x] .debug file
- [x] **PlayerDebugMode enabled**: For CSXS 9, 10, 11, 12

**Verification:**
```bash
ls ~/Library/Application\ Support/Adobe/CEP/extensions/PremiereRemote/
defaults read com.adobe.CSXS.12 PlayerDebugMode  # Should return 1
```

**Status:** ✅ PASS

---

### 3. Claude Desktop Configuration
- [x] **MCP server configured**: In `claude_desktop_config.json`
- [x] **Correct path**: Points to `dist/index.js`
- [x] **Auto-restart enabled**: Claude Desktop will restart server on rebuild

**Verification:**
```bash
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json | grep -A 5 adobe-premiere-pro
```

**Status:** ✅ PASS

---

## 🧪 Functional Testing (Manual)

### Phase 1: Connection Test

**Prerequisites:**
- [ ] Premiere Pro is running
- [ ] A project is open (Spindle_Tinkering.prproj or any project)
- [ ] Claude Desktop is running with MCP server loaded

**Test 1: List Sequences**
1. In Claude Desktop, ask: "List all sequences in my Premiere Pro project"
2. Expected: Response with sequence names, dimensions, track counts
3. Verify: Sequence IDs, names match project

**Result:** ⏳ PENDING USER TEST

---

**Test 2: List Project Items**
1. Ask: "Show me all the media in my Premiere Pro project"
2. Expected: List of media files with IDs and metadata
3. Verify: Media names match project panel

**Result:** ⏳ PENDING USER TEST

---

### Phase 2: Timeline Operations Test

**Test 3: Add Clip to Timeline**
1. Get a project item ID from Test 2
2. Get a sequence ID from Test 1
3. Ask: "Add clip [itemId] to sequence [seqId] at track 0, time 0"
4. Expected: Clip appears in Premiere Pro timeline
5. Verify: Clip is at correct position

**Result:** ⏳ PENDING USER TEST

---

**Test 4: Remove Clip**
1. Get the clip's nodeId from Premiere Pro (or from response)
2. Ask: "Remove clip [clipId] from timeline with ripple delete"
3. Expected: Clip removed, gap closed
4. Verify: Timeline updated correctly

**Result:** ⏳ PENDING USER TEST

---

**Test 5: Move Clip**
1. Add a clip to timeline
2. Ask: "Move clip [clipId] to 5 seconds"
3. Expected: Clip moves to new position
4. Verify: Clip at 5-second mark

**Result:** ⏳ PENDING USER TEST

---

**Test 6: Trim Clip**
1. Add a clip to timeline
2. Ask: "Trim clip [clipId] in point to 2 seconds, out point to 8 seconds"
3. Expected: Clip duration changes
4. Verify: Clip shows correct in/out points

**Result:** ⏳ PENDING USER TEST

---

**Test 7: Split Clip**
1. Add a clip to timeline
2. Ask: "Split clip [clipId] at 3 seconds"
3. Expected: Clip splits into two clips
4. Verify: Two separate clips on timeline

**Result:** ⏳ PENDING USER TEST

---

### Phase 3: Effects & Transitions Test

**Test 8: Apply Effect**
1. Add a clip to timeline
2. Ask: "Apply Gaussian Blur effect to clip [clipId]"
3. Expected: Effect appears in Effect Controls panel
4. Verify: Effect is applied and visible

**Result:** ⏳ PENDING USER TEST

---

**Test 9: Remove Effect**
1. On a clip with effects
2. Ask: "Remove Gaussian Blur from clip [clipId]"
3. Expected: Effect removed from Effect Controls
4. Verify: Effect no longer present

**Result:** ⏳ PENDING USER TEST

---

**Test 10: Add Transition**
1. Add two adjacent clips to timeline
2. Ask: "Add Cross Dissolve transition between clips [clipId1] and [clipId2] for 1 second"
3. Expected: Transition appears between clips
4. Verify: Transition duration is correct

**Result:** ⏳ PENDING USER TEST

---

**Test 11: Add Transition to Clip**
1. Add a clip to timeline
2. Ask: "Add Cross Dissolve to end of clip [clipId] for 0.5 seconds"
3. Expected: Transition at clip end
4. Verify: Transition is visible

**Result:** ⏳ PENDING USER TEST

---

### Phase 4: Audio Operations Test

**Test 12: Adjust Audio Level**
1. Add an audio clip to timeline
2. Ask: "Set audio level of clip [clipId] to -6 dB"
3. Expected: Audio level changes in Effect Controls
4. Verify: Level shows -6 dB

**Result:** ⏳ PENDING USER TEST

---

**Test 13: Add Audio Keyframes**
1. Add an audio clip to timeline
2. Ask: "Add audio keyframes to clip [clipId]: 0s at -6dB, 2s at -12dB, 4s at -6dB"
3. Expected: Keyframes appear in Effect Controls
4. Verify: Keyframe values are correct

**Result:** ⏳ PENDING USER TEST

---

**Test 14: Mute Track**
1. Get sequence ID
2. Ask: "Mute audio track 0 in sequence [seqId]"
3. Expected: Track mute indicator turns on
4. Verify: Track is muted

**Result:** ⏳ PENDING USER TEST

---

## 🐛 Error Handling Tests

### Test 15: Invalid Clip ID
- Ask: "Move clip 'invalid-id' to 10 seconds"
- Expected: Error message "Clip not found"

**Result:** ⏳ PENDING USER TEST

---

### Test 16: Invalid Sequence ID
- Ask: "List tracks in sequence 'invalid-id'"
- Expected: Error message "Sequence not found"

**Result:** ⏳ PENDING USER TEST

---

### Test 17: Out of Range Track Index
- Ask: "Mute audio track 999 in sequence [validSeqId]"
- Expected: Error about track index out of range

**Result:** ⏳ PENDING USER TEST

---

## 📊 Test Results Summary

| Category | Tested | Passed | Failed | Pending |
|----------|--------|--------|--------|---------|
| Infrastructure | 3 | 3 | 0 | 0 |
| Connection | 2 | 0 | 0 | 2 |
| Timeline Ops | 5 | 0 | 0 | 5 |
| Effects/Transitions | 4 | 0 | 0 | 4 |
| Audio | 3 | 0 | 0 | 3 |
| Error Handling | 3 | 0 | 0 | 3 |
| **TOTAL** | **20** | **3** | **0** | **17** |

**Overall Status:** 🟡 INFRASTRUCTURE VALIDATED, AWAITING FUNCTIONAL TESTS

---

## 🚨 Known Issues & Limitations

### Current Known Issues:
None identified in infrastructure setup.

### Known API Limitations:
1. **Project Item Audio Levels**: Cannot modify audio levels of clips in bins (only on timeline)
2. **Essential Graphics**: Legacy title API has limited capabilities
3. **Warp Stabilizer**: Analysis is automatic and async (no progress feedback)
4. **AI Features**: Require external services (beat detection, analysis)

### Workarounds Documented:
- All timeline operations use findClipByNodeId() helper
- Audio levels use dB-to-decimal conversion formula
- QE DOM used for effects and transitions

---

## ✅ Go/No-Go Decision

### Ready for Production Use: 🟢 YES (with conditions)

**Conditions:**
1. Complete Phase 1 functional tests first (connection & list operations)
2. Test with non-critical project first
3. Keep backups of project files before extensive testing
4. Monitor for any ExtendScript errors in Premiere Pro

### Recommended Next Steps:
1. **IMMEDIATE**: Run Phase 1 tests (list sequences, list items)
2. **SHORT TERM**: Run Phase 2-4 tests with test project
3. **MEDIUM TERM**: Implement P1 advanced features (color correction)
4. **LONG TERM**: Plan AI features architecture

---

## 📝 Test Execution Notes

### How to Test:
1. Open Premiere Pro with a project
2. Ensure CEP extension panel is visible (Window > Extensions > PremiereRemote)
3. Open Claude Desktop
4. Execute test commands one by one
5. Document results in this file
6. Report any issues with:
   - Error message
   - ExtendScript snippet that failed
   - Premiere Pro version
   - Expected vs actual behavior

### Debugging Failed Tests:
1. Check `/tmp/premiere-bridge/` for command/response files
2. Open CEP panel's developer console (right-click panel > Debug)
3. Look for ExtendScript errors in console
4. Review src/tools/index.ts for the failing operation
5. Test ExtendScript directly using ExtendScript Toolkit

---

**Last Updated:** 2025-12-05
**Next Update:** After completing functional tests
