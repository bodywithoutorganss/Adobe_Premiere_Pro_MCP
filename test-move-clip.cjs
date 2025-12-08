#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const BRIDGE_DIR = '/tmp/premiere-bridge';
const TEST_TIMEOUT = 15000;

async function testMoveClip() {
  console.log('🧪 Testing move_clip Operation\n');

  const clipId = '000f4397'; // Clip at 1392s
  const newTime = 500; // Move to 500 seconds

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

      var result = findClipByNodeId("${clipId}");
      if (!result) {
        JSON.stringify({ success: false, error: "Clip not found" });
      }

      var clipName = result.clip.name;
      var oldStart = result.clip.start.seconds;

      // Create Time object for new position
      var newInPoint = result.clip.start;
      newInPoint.seconds = ${newTime};

      // Use TrackItem.move() method
      result.clip.move(newInPoint);

      JSON.stringify({
        success: true,
        message: "Clip moved successfully!",
        clipName: clipName,
        oldPosition: oldStart,
        newPosition: ${newTime}
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
        console.log('🎉 SUCCESS! Clip moved on timeline!');
        console.log(`   Clip: ${response.clipName}`);
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
