#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const BRIDGE_DIR = '/tmp/premiere-bridge';
const TEST_TIMEOUT = 10000;

async function testSplitClip() {
  console.log('🧪 Testing split_clip Operation\n');

  const clipId = '000f4397'; // First video clip on timeline
  const splitTime = 3.0; // Split at 3 seconds into the clip's timeline position

  console.log(`Clip ID: ${clipId}`);
  console.log(`Split Time: ${splitTime}s\n`);

  const commandId = `test-split-${Date.now()}`;
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
                  return { clip: clip, sequence: sequence, track: track, isVideo: true };
                }
              }
            }

            for (var t = 0; t < sequence.audioTracks.numTracks; t++) {
              var track = sequence.audioTracks[t];
              for (var c = 0; c < track.clips.numItems; c++) {
                var clip = track.clips[c];
                if (clip.nodeId === targetNodeId) {
                  return { clip: clip, sequence: sequence, track: track, isVideo: false };
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
        var track = result.track;

        // Get clip info before split
        var clipStart = clip.start.seconds;
        var clipEnd = clip.end.seconds;
        var originalClipCount = track.clips.numItems;

        // Create Time object for split point (relative to sequence timeline)
        var splitPoint = new Time();
        splitPoint.seconds = ${splitTime};

        // Razor/split the clip at the specified time
        result.sequence.razorAt(splitPoint);

        var newClipCount = track.clips.numItems;

        return JSON.stringify({
          success: true,
          message: "Clip split successfully",
          clipId: "${clipId}",
          splitTime: ${splitTime},
          originalStart: clipStart,
          originalEnd: clipEnd,
          originalClipCount: originalClipCount,
          newClipCount: newClipCount,
          clipsAdded: newClipCount - originalClipCount
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

    console.log('📤 Sending split_clip command...');
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
        console.log('🎉 SUCCESS! Clip split!');
        console.log(`   Split at: ${response.splitTime}s`);
        console.log(`   Original range: ${response.originalStart}s - ${response.originalEnd}s`);
        console.log(`   Original clip count: ${response.originalClipCount}`);
        console.log(`   New clip count: ${response.newClipCount}`);
        console.log(`   Clips added: ${response.clipsAdded}`);
        console.log('\n✅ Check Premiere Pro - clip should now be split into two parts!');
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

testSplitClip()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
