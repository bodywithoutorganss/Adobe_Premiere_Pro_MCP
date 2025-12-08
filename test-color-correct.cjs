#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const BRIDGE_DIR = '/tmp/premiere-bridge';
const TEST_TIMEOUT = 15000;

async function testColorCorrect() {
  console.log('🧪 Testing color_correct Operation\n');

  const clipId = '000f4397'; // First video clip on timeline
  const adjustments = {
    brightness: 10,
    contrast: 15,
    saturation: 5
  };

  console.log(`Clip ID: ${clipId}`);
  console.log(`Adjustments:`, adjustments);
  console.log('');

  const commandId = `test-color-${Date.now()}`;
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
                return {
                  clip: clip,
                  sequence: sequence,
                  trackIndex: t
                };
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

      // Enable QE DOM for effect access
      app.enableQE();
      var qeProject = qe.project;
      var qeSequence = qeProject.getActiveSequence();
      var qeTrack = qeSequence.getVideoTrackAt(result.trackIndex);

      // Find the QE clip by matching name
      var qeClip = null;
      for (var i = 0; i < qeTrack.numItems; i++) {
        if (qeTrack.getItemAt(i).name === result.clip.name) {
          qeClip = qeTrack.getItemAt(i);
          break;
        }
      }

      if (!qeClip) {
        return JSON.stringify({
          success: false,
          error: "Could not find QE clip"
        });
      }

      // Get Lumetri Color effect
      var lumetriEffect = qeProject.getVideoEffectByName("Lumetri Color");
      if (!lumetriEffect) {
        return JSON.stringify({
          success: false,
          error: "Lumetri Color effect not available"
        });
      }

      // Check if Lumetri is already applied
      var lumetriComponent = null;
      for (var i = 0; i < result.clip.components.numItems; i++) {
        var comp = result.clip.components[i];
        if (comp.displayName === "Lumetri Color") {
          lumetriComponent = comp;
          break;
        }
      }

      // If not applied, add it
      if (!lumetriComponent) {
        qeClip.addVideoEffect(lumetriEffect);
        // Re-fetch the component after adding
        for (var i = 0; i < result.clip.components.numItems; i++) {
          var comp = result.clip.components[i];
          if (comp.displayName === "Lumetri Color") {
            lumetriComponent = comp;
            break;
          }
        }
      }

      if (!lumetriComponent) {
        return JSON.stringify({
          success: false,
          error: "Failed to apply Lumetri Color effect"
        });
      }

      var appliedParams = [];

      // Apply brightness (Exposure parameter)
      try {
        var brightnessParam = lumetriComponent.properties.getParamForDisplayName("Exposure");
        if (brightnessParam) {
          brightnessParam.setValue(${adjustments.brightness} / 100);
          appliedParams.push("brightness");
        }
      } catch (e) {}

      // Apply contrast
      try {
        var contrastParam = lumetriComponent.properties.getParamForDisplayName("Contrast");
        if (contrastParam) {
          contrastParam.setValue(${adjustments.contrast});
          appliedParams.push("contrast");
        }
      } catch (e) {}

      // Apply saturation
      try {
        var saturationParam = lumetriComponent.properties.getParamForDisplayName("Saturation");
        if (saturationParam) {
          saturationParam.setValue(${adjustments.saturation});
          appliedParams.push("saturation");
        }
      } catch (e) {}

      return JSON.stringify({
        success: true,
        message: "Color correction applied successfully",
        clipId: "${clipId}",
        appliedParams: appliedParams
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

    console.log('📤 Sending color_correct command...');
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
        console.log('🎉 SUCCESS! Color correction applied!');
        console.log(`   Applied parameters: ${response.appliedParams.join(', ')}`);
        console.log('\n✅ Check Premiere Pro Effects panel - Lumetri Color should be applied!');
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

testColorCorrect()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
