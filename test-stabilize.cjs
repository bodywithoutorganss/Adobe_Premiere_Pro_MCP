#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const BRIDGE_DIR = '/tmp/premiere-bridge';
const TEST_TIMEOUT = 15000;

async function testStabilize() {
  console.log('🧪 Testing stabilize_clip Operation\n');

  const clipId = '000f4397'; // First video clip on timeline
  const smoothness = 50;

  console.log(`Clip ID: ${clipId}`);
  console.log(`Smoothness: ${smoothness}%\n`);

  const commandId = `test-stabilize-${Date.now()}`;
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

      // Get Warp Stabilizer effect
      var stabilizerEffect = qeProject.getVideoEffectByName("Warp Stabilizer");
      if (!stabilizerEffect) {
        return JSON.stringify({
          success: false,
          error: "Warp Stabilizer effect not available"
        });
      }

      // Check if stabilizer is already applied
      var stabilizerComponent = null;
      for (var i = 0; i < result.clip.components.numItems; i++) {
        var comp = result.clip.components[i];
        if (comp.displayName === "Warp Stabilizer") {
          stabilizerComponent = comp;
          break;
        }
      }

      // If not applied, add it
      if (!stabilizerComponent) {
        qeClip.addVideoEffect(stabilizerEffect);
        // Re-fetch the component after adding
        for (var i = 0; i < result.clip.components.numItems; i++) {
          var comp = result.clip.components[i];
          if (comp.displayName === "Warp Stabilizer") {
            stabilizerComponent = comp;
            break;
          }
        }
      }

      if (!stabilizerComponent) {
        return JSON.stringify({
          success: false,
          error: "Failed to apply Warp Stabilizer effect"
        });
      }

      // Configure stabilization settings
      var appliedSettings = [];
      try {
        var smoothnessParam = stabilizerComponent.properties.getParamForDisplayName("Smoothness");
        if (smoothnessParam) {
          smoothnessParam.setValue(${smoothness});
          appliedSettings.push("smoothness");
        }
      } catch (e) {}

      return JSON.stringify({
        success: true,
        message: "Warp Stabilizer applied successfully",
        clipId: "${clipId}",
        smoothness: ${smoothness},
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

    console.log('📤 Sending stabilize_clip command...');
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
        console.log('🎉 SUCCESS! Warp Stabilizer applied!');
        console.log(`   Smoothness: ${response.smoothness}%`);
        console.log(`   Applied settings: ${response.appliedSettings.join(', ')}`);
        console.log('\n✅ Check Premiere Pro Effects panel - Warp Stabilizer should be applied!');
        console.log('⚠️  Note: Warp Stabilizer will analyze the footage (this may take time)');
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

testStabilize()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
