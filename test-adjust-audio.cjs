/**
 * Test: Adjust Audio Level
 *
 * Tests the adjust_audio_level operation which sets audio volume in dB.
 *
 * This test demonstrates:
 * 1. Setting audio to specific dB level
 * 2. Ducking music bed to -20dB (common for background music)
 * 3. Boosting quiet audio by +6dB
 * 4. Muting audio (-∞ dB)
 *
 * IMPORTANT: Update clipId with actual audio clip from your timeline before running.
 * Use: node test-list-timeline-clips.cjs to get valid clip IDs.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BRIDGE_DIR = '/tmp/premiere-bridge';
const REQUEST_FILE = path.join(BRIDGE_DIR, 'request.json');
const RESPONSE_FILE = path.join(BRIDGE_DIR, 'response.json');
const TIMEOUT_MS = 10000;

// Test parameters - UPDATE THESE WITH YOUR ACTUAL CLIP ID
const testConfig = {
  // Use an audio clip or a video clip with audio
  clipId: '000f4397',  // Audio clip or linked A/V clip

  // Test cases
  tests: [
    { name: 'Music Bed (Background)', level: -20, description: 'Typical background music level' },
    { name: 'Unity Gain', level: 0, description: 'No adjustment (0 dB)' },
    { name: 'Boost Quiet Audio', level: 6, description: '+6 dB boost' },
    { name: 'Quiet Background', level: -12, description: 'Subtle background' },
  ]
};

function waitForResponse(timeout) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkInterval = 100;

    const check = () => {
      if (fs.existsSync(RESPONSE_FILE)) {
        try {
          const response = JSON.parse(fs.readFileSync(RESPONSE_FILE, 'utf-8'));
          fs.unlinkSync(RESPONSE_FILE);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for response'));
      } else {
        setTimeout(check, checkInterval);
      }
    };

    check();
  });
}

async function adjustAudioLevel(clipId, level) {
  // Create request
  const request = {
    operation: 'adjust_audio_level',
    clipId: clipId,
    level: level,
    timestamp: Date.now()
  };

  // Write request file
  fs.writeFileSync(REQUEST_FILE, JSON.stringify(request, null, 2));
  console.log(`\n📤 Request sent: adjust_audio_level`);
  console.log(`   Clip ID: ${clipId}`);
  console.log(`   Level: ${level > 0 ? '+' : ''}${level} dB`);

  // Wait for response
  console.log(`\n⏳ Waiting for response (timeout: ${TIMEOUT_MS}ms)...`);
  const response = await waitForResponse(TIMEOUT_MS);

  return response;
}

async function main() {
  console.log('=================================================');
  console.log('Test: Adjust Audio Level');
  console.log('=================================================\n');

  // Check bridge directory
  if (!fs.existsSync(BRIDGE_DIR)) {
    console.error(`❌ Bridge directory not found: ${BRIDGE_DIR}`);
    console.error('   Make sure Premiere Pro is running with CEP extension loaded.');
    process.exit(1);
  }

  console.log(`✅ Bridge directory exists: ${BRIDGE_DIR}\n`);

  const results = [];

  try {
    // Run all test cases
    for (let i = 0; i < testConfig.tests.length; i++) {
      const test = testConfig.tests[i];

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`TEST ${i + 1}: ${test.name}`);
      console.log(`Description: ${test.description}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const result = await adjustAudioLevel(testConfig.clipId, test.level);

      console.log('\n📥 Response received:');
      console.log(JSON.stringify(result, null, 2));

      if (result.success) {
        console.log(`\n✅ SUCCESS: Audio level set to ${test.level > 0 ? '+' : ''}${test.level} dB`);
        results.push({ test: test.name, passed: true });
      } else {
        console.error(`\n❌ FAILED: ${result.error || 'Unknown error'}`);
        results.push({ test: test.name, passed: false, error: result.error });
      }

      // Wait a bit between tests for UI to update
      if (i < testConfig.tests.length - 1) {
        console.log('\n⏱️  Waiting 1 second before next test...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    results.forEach(r => {
      console.log(`${r.test}: ${r.passed ? '✅ PASS' : '❌ FAIL'}`);
      if (!r.passed && r.error) {
        console.log(`  Error: ${r.error}`);
      }
    });

    const passCount = results.filter(r => r.passed).length;
    const totalCount = results.length;
    console.log(`\nTotal: ${passCount}/${totalCount} passed`);

    console.log('\n💡 Verification Steps:');
    console.log('1. Check waveform in Premiere Pro timeline');
    console.log('2. Verify audio meters show expected level');
    console.log('3. Play clip to hear volume change');
    console.log('4. Check Audio Track Mixer for level display');

    console.log('\n📚 Common Audio Levels:');
    console.log('  0 dB   - Unity gain (no change)');
    console.log(' -6 dB   - Halve the loudness (typical dialogue mixing)');
    console.log('-12 dB   - Quiet background');
    console.log('-20 dB   - Music bed under dialogue');
    console.log(' +6 dB   - Boost quiet audio');
    console.log('-∞ dB    - Mute (use very low number like -96 dB)');

    console.log('\n🎬 Cut Sheet Usage Example:');
    console.log('// Music bed for entire sequence');
    console.log('await addToTimeline("sequence", "music", 2, 0.0);');
    console.log('await adjustAudioLevel(musicClipId, -20); // -20dB under dialogue');

  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure Premiere Pro is running');
    console.error('2. Check CEP extension panel is visible (Window > Extensions > PremiereRemote)');
    console.error('3. Verify clip has audio component');
    console.error('4. Update clipId in test script with valid ID from test-list-timeline-clips.cjs');
    process.exit(1);
  }
}

main();
