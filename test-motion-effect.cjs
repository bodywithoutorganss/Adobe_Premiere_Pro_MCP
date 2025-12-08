#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const BRIDGE_DIR = '/tmp/premiere-bridge';
const TEST_TIMEOUT = 10000;

async function testMotionEffect() {
  console.log('🧪 Testing Motion Effect Access\n');

  const clipId = '000f4397'; // First video clip on timeline

  console.log(`Clip ID: ${clipId}`);
  console.log('Testing: Position, Scale, Rotation access\n');

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
        var motionIndex = -1;

        // Find Motion component
        for (var i = 0; i < components.numItems; i++) {
          if (components[i].displayName === "Motion" || components[i].matchName === "Motion") {
            motionComponent = components[i];
            motionIndex = i;
            break;
          }
        }

        if (!motionComponent) {
          return JSON.stringify({
            success: false,
            error: "Motion component not found"
          });
        }

        var properties = motionComponent.properties;
        var propertyInfo = [];

        // Enumerate all Motion properties
        for (var p = 0; p < properties.numItems; p++) {
          var prop = properties[p];
          var propData = {
            index: p,
            displayName: prop.displayName,
            matchName: prop.matchName,
            isTimeVarying: prop.isTimeVarying(),
            type: typeof prop.getValue()
          };

          // Try to get current value
          try {
            var value = prop.getValue();
            if (typeof value === 'object' && value !== null) {
              // Array or complex object
              propData.value = "Complex value (array/object)";
            } else {
              propData.value = value;
            }
          } catch (e) {
            propData.value = "Error reading value: " + e.toString();
          }

          propertyInfo.push(propData);
        }

        return JSON.stringify({
          success: true,
          clipId: "${clipId}",
          motionComponentIndex: motionIndex,
          motionComponentName: motionComponent.displayName,
          totalProperties: properties.numItems,
          properties: propertyInfo
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

    console.log('📤 Sending motion effect query...');
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
        console.log('🎉 SUCCESS! Motion component found!');
        console.log(`   Component Index: ${response.motionComponentIndex}`);
        console.log(`   Total Properties: ${response.totalProperties}\n`);

        console.log('📋 Motion Properties:');
        response.properties.forEach(prop => {
          console.log(`   [${prop.index}] ${prop.displayName}`);
          console.log(`       Match Name: ${prop.matchName}`);
          console.log(`       Time Varying: ${prop.isTimeVarying}`);
          console.log(`       Value: ${prop.value}`);
          console.log('');
        });

        console.log('\n✅ Motion effect is accessible via components array!');
        console.log('💡 Can be used for position, scale, rotation adjustments');
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

testMotionEffect()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
