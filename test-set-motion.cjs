#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const BRIDGE_DIR = '/tmp/premiere-bridge';
const TEST_TIMEOUT = 10000;

async function testSetMotion() {
  console.log('🧪 Testing set_motion Operation\n');

  const clipId = '000f4397'; // First video clip on timeline
  const position = [0.3, 0.7]; // Left third, bottom third
  const scale = 150; // 150% zoom
  const rotation = 5; // 5 degrees

  console.log(`Clip ID: ${clipId}`);
  console.log(`Position: [${position[0]}, ${position[1]}]`);
  console.log(`Scale: ${scale}%`);
  console.log(`Rotation: ${rotation}°\n`);

  const commandId = `test-motion-${Date.now()}`;
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
        var appliedSettings = {};

        // Set Position
        try {
          var positionProp = properties[0];
          positionProp.setValue([${position[0]}, ${position[1]}], true);
          appliedSettings.position = [${position[0]}, ${position[1]}];
        } catch (e) {
          appliedSettings.positionError = e.toString();
        }

        // Set Scale
        try {
          var scaleProp = properties[1];
          scaleProp.setValue(${scale}, true);
          appliedSettings.scale = ${scale};
        } catch (e) {
          appliedSettings.scaleError = e.toString();
        }

        // Set Rotation
        try {
          var rotationProp = properties[4];
          rotationProp.setValue(${rotation}, true);
          appliedSettings.rotation = ${rotation};
        } catch (e) {
          appliedSettings.rotationError = e.toString();
        }

        return JSON.stringify({
          success: true,
          message: "Motion parameters applied successfully",
          clipId: "${clipId}",
          appliedSettings: appliedSettings
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

    console.log('📤 Sending set_motion command...');
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
        console.log('🎉 SUCCESS! Motion parameters applied!');
        console.log('\n   Applied Settings:');
        if (response.appliedSettings.position) {
          console.log(`   ✅ Position: [${response.appliedSettings.position[0]}, ${response.appliedSettings.position[1]}]`);
        }
        if (response.appliedSettings.scale !== undefined) {
          console.log(`   ✅ Scale: ${response.appliedSettings.scale}%`);
        }
        if (response.appliedSettings.rotation !== undefined) {
          console.log(`   ✅ Rotation: ${response.appliedSettings.rotation}°`);
        }

        // Check for any errors
        if (response.appliedSettings.positionError) {
          console.log(`   ⚠️  Position Error: ${response.appliedSettings.positionError}`);
        }
        if (response.appliedSettings.scaleError) {
          console.log(`   ⚠️  Scale Error: ${response.appliedSettings.scaleError}`);
        }
        if (response.appliedSettings.rotationError) {
          console.log(`   ⚠️  Rotation Error: ${response.appliedSettings.rotationError}`);
        }

        console.log('\n✅ Check Premiere Pro - clip should be repositioned, scaled, and rotated!');
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

testSetMotion()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
