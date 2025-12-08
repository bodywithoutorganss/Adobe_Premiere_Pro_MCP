#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const BRIDGE_DIR = '/tmp/premiere-bridge';
const TEST_TIMEOUT = 15000;

async function testMoveClip() {
  console.log('🧪 Testing move_clip Operation\n');

  const clipId = '000f439b'; // Linked clip at 1312.06s
  const newTime = 50; // Move to 50 seconds

  console.log(`Clip ID: ${clipId}`);
  console.log(`New Position: ${newTime} seconds\n`);

  const commandId = `test-move-${Date.now()}`;
  const commandFile = path.join(BRIDGE_DIR, `command-${commandId}.json`);
  const responseFile = path.join(BRIDGE_DIR, `response-${commandId}.json`);

  const script = `
    try {
      // Helper function to find clip by nodeId
      function findClipByNodeId(targetNodeId) {
        for (var s = 0; s < app.project.sequences.numSequences; s++) {
          var sequence = app.project.sequences[s];

          for (var t = 0; t < sequence.videoTracks.numTracks; t++) {
            var track = sequence.videoTracks[t];
            for (var c = 0; c < track.clips.numItems; c++) {
              var clip = track.clips[c];
              if (clip.nodeId === targetNodeId) {
                return { clip: clip, sequence: sequence };
              }
            }
          }

          for (var t = 0; t < sequence.audioTracks.numTracks; t++) {
            var track = sequence.audioTracks[t];
            for (var c = 0; c < track.clips.numItems; c++) {
              var clip = track.clips[c];
              if (clip.nodeId === targetNodeId) {
                return { clip: clip, sequence: sequence };
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
        JSON.stringify({ success: false, error: "Clip not found" });
      }

      var clipName = result.clip.name;
      var oldStart = result.clip.start.seconds;

      // Find all linked clips (video + audio)
      var linkedClips = findLinkedClips(result.clip, result.sequence);

      // Create Time object for new position
      var newInPoint = new Time();
      newInPoint.seconds = ${newTime};

      // Move all linked clips together
      for (var i = 0; i < linkedClips.length; i++) {
        linkedClips[i].move(newInPoint);
      }

      JSON.stringify({
        success: true,
        message: "Clip(s) moved successfully!",
        clipName: clipName,
        oldPosition: oldStart,
        newPosition: ${newTime},
        linkedClipsMoved: linkedClips.length
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

    console.log('📤 Sending move_clip command...');
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
        console.log('🎉 SUCCESS! Clip(s) moved on timeline!');
        console.log(`   Clip: ${response.clipName}`);
        console.log(`   Linked clips moved: ${response.linkedClipsMoved}`);
        console.log(`   From: ${response.oldPosition}s → To: ${response.newPosition}s`);
        console.log('\n✅ Check Premiere Pro - clip should be at new position!');
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

testMoveClip()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
