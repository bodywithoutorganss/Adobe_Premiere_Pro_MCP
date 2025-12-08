#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const BRIDGE_DIR = '/tmp/premiere-bridge';
const TEST_TIMEOUT = 10000;

async function testReframe916() {
  console.log('🧪 Testing reframe_for_916 Operation\n');
  console.log('This operation reframes 16:9 clips for 9:16 vertical video\n');

  const clipId = '000f4397'; // First video clip on timeline
  const framePosition = 'center'; // Options: center, top, bottom, left, right

  console.log(`Clip ID: ${clipId}`);
  console.log(`Frame Position: ${framePosition}\n`);
  console.log('Expected: 177.78% scale, centered position\n');

  const commandId = `test-reframe-${Date.now()}`;
  const commandFile = path.join(BRIDGE_DIR, `command-${commandId}.json`);
  const responseFile = path.join(BRIDGE_DIR, `response-${commandId}.json`);

  // Calculate expected values
  const scale = 177.78;
  let expectedPosition;
  switch (framePosition) {
    case 'top':
      expectedPosition = [0.5, 0.3];
      break;
    case 'bottom':
      expectedPosition = [0.5, 0.7];
      break;
    case 'left':
      expectedPosition = [0.3, 0.5];
      break;
    case 'right':
      expectedPosition = [0.7, 0.5];
      break;
    case 'center':
    default:
      expectedPosition = [0.5, 0.5];
      break;
  }

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
        var components = clip.components;
        var motionComponent = null;

        // Find Motion component
        for (var i = 0; i < components.numItems; i++) {
          if (components[i].displayName === "Motion" || components[i].matchName === "Motion") {
            motionComponent = components[i];
            break;
          }
        }

        if (!motionComponent) {
          return JSON.stringify({
            success: false,
            error: "Motion component not found on clip"
          });
        }

        var properties = motionComponent.properties;

        // Set scale to fill 9:16 frame
        try {
          var scaleProp = properties[1];
          scaleProp.setValue(${scale}, true);
        } catch (e) {
          return JSON.stringify({
            success: false,
            error: "Failed to set scale: " + e.toString()
          });
        }

        // Set position for framing
        try {
          var positionProp = properties[0];
          positionProp.setValue([${expectedPosition[0]}, ${expectedPosition[1]}], true);
        } catch (e) {
          return JSON.stringify({
            success: false,
            error: "Failed to set position: " + e.toString()
          });
        }

        return JSON.stringify({
          success: true,
          message: "Clip reframed for 9:16 vertical video",
          clipId: "${clipId}",
          framePosition: "${framePosition}",
          scale: ${scale},
          position: [${expectedPosition[0]}, ${expectedPosition[1]}]
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

    console.log('📤 Sending reframe_for_916 command...');
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
        console.log('🎉 SUCCESS! Clip reframed for 9:16!');
        console.log(`   Frame Position: ${response.framePosition}`);
        console.log(`   Scale: ${response.scale}%`);
        console.log(`   Position: [${response.position[0]}, ${response.position[1]}]`);
        console.log('\n💡 Explanation:');
        console.log('   - 177.78% scale fills 9:16 frame with 16:9 content');
        console.log('   - Position values are normalized (0-1)');
        console.log('   - [0.5, 0.5] = center, [0.5, 0.3] = top, etc.');
        console.log('\n✅ Check Premiere Pro Program Monitor - clip should fill vertical frame!');
        console.log('💡 Tip: Create a 1080x1920 sequence to see the final 9:16 result');
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

testReframe916()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
