#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const BRIDGE_DIR = '/tmp/premiere-bridge';
const TEST_TIMEOUT = 10000;

async function testTrimClip() {
  console.log('🧪 Testing trim_clip Operation\n');

  const clipId = '000f4397'; // First video clip on timeline
  const newInPoint = 1.0; // Start 1 second into the clip
  const newOutPoint = 5.0; // End 5 seconds into the clip

  console.log(`Clip ID: ${clipId}`);
  console.log(`New In Point: ${newInPoint}s`);
  console.log(`New Out Point: ${newOutPoint}s\n`);

  const commandId = `test-trim-${Date.now()}`;
  const commandFile = path.join(BRIDGE_DIR, `command-${commandId}.json`);
  const responseFile = path.join(BRIDGE_DIR, `response-${commandId}.json`);

  const script = `
    (function() {
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
          return JSON.stringify({
            success: false,
            error: "Clip not found"
          });
        }

        var clip = result.clip;

        // Get original in/out points
        var oldInPoint = clip.inPoint.seconds;
        var oldOutPoint = clip.outPoint.seconds;

        // Set new in/out points
        var newIn = new Time();
        newIn.seconds = ${newInPoint};
        var newOut = new Time();
        newOut.seconds = ${newOutPoint};

        clip.inPoint = newIn;
        clip.outPoint = newOut;

        return JSON.stringify({
          success: true,
          message: "Clip trimmed successfully",
          clipId: "${clipId}",
          oldInPoint: oldInPoint,
          oldOutPoint: oldOutPoint,
          newInPoint: ${newInPoint},
          newOutPoint: ${newOutPoint}
        });
      } catch (e) {
        return JSON.stringify({
          success: false,
          error: e.toString()
        });
      }
    })();
  `;

  try {
    await fs.writeFile(commandFile, JSON.stringify({
      id: commandId,
      script: script,
      timestamp: new Date().toISOString()
    }));

    console.log('📤 Sending trim_clip command...');
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
        console.log('🎉 SUCCESS! Clip trimmed!');
        console.log(`   Old In Point: ${response.oldInPoint}s`);
        console.log(`   Old Out Point: ${response.oldOutPoint}s`);
        console.log(`   New In Point: ${response.newInPoint}s`);
        console.log(`   New Out Point: ${response.newOutPoint}s`);
        console.log('\n✅ Check Premiere Pro - clip duration should be changed!');
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

testTrimClip()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
