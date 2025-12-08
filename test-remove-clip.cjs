#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const BRIDGE_DIR = '/tmp/premiere-bridge';
const TEST_TIMEOUT = 15000;

async function testRemoveClip() {
  console.log('🧪 Testing remove_from_timeline Operation\n');

  const clipId = '000f439b'; // Linked clip we just moved
  const deleteMode = 'ripple'; // Close the gap

  console.log(`Clip ID: ${clipId}`);
  console.log(`Delete Mode: ${deleteMode} (close gap)\n`);

  const commandId = `test-remove-${Date.now()}`;
  const commandFile = path.join(BRIDGE_DIR, `command-${commandId}.json`);
  const responseFile = path.join(BRIDGE_DIR, `response-${commandId}.json`);

  // Updated script with linked clip handling
  const script = `
    try {
      // Helper function to find clip by nodeId
      function findClipByNodeId(targetNodeId) {
        for (var s = 0; s < app.project.sequences.numSequences; s++) {
          var sequence = app.project.sequences[s];

          // Search video tracks
          for (var t = 0; t < sequence.videoTracks.numTracks; t++) {
            var track = sequence.videoTracks[t];
            for (var c = 0; c < track.clips.numItems; c++) {
              var clip = track.clips[c];
              if (clip.nodeId === targetNodeId) {
                return {
                  clip: clip,
                  sequence: sequence,
                  trackIndex: t,
                  isVideo: true
                };
              }
            }
          }

          // Search audio tracks
          for (var t = 0; t < sequence.audioTracks.numTracks; t++) {
            var track = sequence.audioTracks[t];
            for (var c = 0; c < track.clips.numItems; c++) {
              var clip = track.clips[c];
              if (clip.nodeId === targetNodeId) {
                return {
                  clip: clip,
                  sequence: sequence,
                  trackIndex: t,
                  isVideo: false
                };
              }
            }
          }
        }
        return null;
      }

      // Helper: Find all linked clips (same projectItem and start time)
      function findLinkedClips(targetClip, sequence) {
        var linkedClips = [];
        var projectItemPath = targetClip.projectItem ? targetClip.projectItem.treePath : null;
        var startTime = targetClip.start.seconds;

        // Search video tracks
        for (var t = 0; t < sequence.videoTracks.numTracks; t++) {
          for (var c = 0; c < sequence.videoTracks[t].clips.numItems; c++) {
            var clip = sequence.videoTracks[t].clips[c];
            if (clip.projectItem &&
                clip.projectItem.treePath === projectItemPath &&
                Math.abs(clip.start.seconds - startTime) < 0.001) {
              linkedClips.push(clip);
            }
          }
        }

        // Search audio tracks
        for (var t = 0; t < sequence.audioTracks.numTracks; t++) {
          for (var c = 0; c < sequence.audioTracks[t].clips.numItems; c++) {
            var clip = sequence.audioTracks[t].clips[c];
            if (clip.projectItem &&
                clip.projectItem.treePath === projectItemPath &&
                Math.abs(clip.start.seconds - startTime) < 0.001) {
              linkedClips.push(clip);
            }
          }
        }

        return linkedClips;
      }

      var result = findClipByNodeId("${clipId}");

      if (!result) {
        JSON.stringify({
          success: false,
          error: "Clip not found with ID: ${clipId}"
        });
      }

      var clipName = result.clip.name;

      // Find all linked clips (video + audio)
      var linkedClips = findLinkedClips(result.clip, result.sequence);

      // Use TrackItem.remove() method
      // Parameters: inRipple (1 = ripple, 0 = lift), inAlignToVideo
      var ripple = "${deleteMode}" === "ripple" ? 1 : 0;

      // Remove all linked clips
      for (var i = 0; i < linkedClips.length; i++) {
        linkedClips[i].remove(ripple, 0);
      }

      JSON.stringify({
        success: true,
        message: "Clip(s) removed successfully!",
        clipName: clipName,
        deleteMode: "${deleteMode}",
        linkedClipsRemoved: linkedClips.length
      });
    } catch (e) {
      JSON.stringify({
        success: false,
        error: e.toString()
      });
    }
  `;

  try {
    await fs.writeFile(commandFile, JSON.stringify({
      id: commandId,
      script: script,
      timestamp: new Date().toISOString()
    }));

    console.log('📤 Sending remove_from_timeline command...');
    console.log('⏳ Waiting for response...\n');

    const startTime = Date.now();
    let response = null;

    while (Date.now() - startTime < TEST_TIMEOUT) {
      try {
        const responseData = await fs.readFile(responseFile, 'utf8');
        response = JSON.parse(responseData);
        break;
      } catch (error) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Clean up
    try {
      await fs.unlink(commandFile);
      if (response) await fs.unlink(responseFile);
    } catch (error) {}

    if (response) {
      console.log('✅ Response received:\n');

      if (response.success) {
        console.log('🎉 SUCCESS! Clip(s) removed from timeline!');
        console.log(`   Clip: ${response.clipName}`);
        console.log(`   Mode: ${response.deleteMode}`);
        console.log(`   Linked clips removed: ${response.linkedClipsRemoved}`);
        console.log('\n✅ Check Premiere Pro - all linked clips should be gone and gap closed!');
        return 0;
      } else {
        console.log('❌ Error:', response.error);
        return 1;
      }
    } else {
      console.log('❌ No response (timeout)');
      return 1;
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    return 1;
  }
}

testRemoveClip()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
