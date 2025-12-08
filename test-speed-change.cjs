#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const BRIDGE_DIR = '/tmp/premiere-bridge';
const TEST_TIMEOUT = 10000;

async function testSpeedChange() {
  console.log('🧪 Testing speed_change Operation\n');

  const clipId = '000f4397'; // First video clip on timeline
  const speed = 2.0; // 2x speed
  const maintainAudio = true;

  console.log(`Clip ID: ${clipId}`);
  console.log(`Speed: ${speed}x`);
  console.log(`Maintain Audio Pitch: ${maintainAudio}\n`);

  const commandId = `test-speed-${Date.now()}`;
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
        var oldSpeed = clip.getSpeed();

        // Set new speed
        clip.setSpeed(${speed});

        // Maintain audio pitch if requested
        if (${maintainAudio}) {
          try {
            clip.maintainAudioPitch = true;
          } catch (e) {
            // maintainAudioPitch may not be available on all clips
          }
        }

        return JSON.stringify({
          success: true,
          message: "Speed change applied successfully",
          clipId: "${clipId}",
          oldSpeed: oldSpeed,
          newSpeed: ${speed},
          maintainAudio: ${maintainAudio}
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

    console.log('📤 Sending speed_change command...');
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
        console.log('🎉 SUCCESS! Speed changed!');
        console.log(`   Old Speed: ${response.oldSpeed}x`);
        console.log(`   New Speed: ${response.newSpeed}x`);
        console.log(`   Audio Pitch Maintained: ${response.maintainAudio}`);
        console.log('\n✅ Check Premiere Pro - clip should be playing faster/slower!');
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

testSpeedChange()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
