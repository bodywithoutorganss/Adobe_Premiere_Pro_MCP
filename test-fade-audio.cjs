/**
 * Test: Fade Audio
 *
 * Tests audio fade in/out functionality using keyframes.
 *
 * This test demonstrates:
 * 1. Fade in at clip start (1 second)
 * 2. Fade out at clip end (2 seconds)
 * 3. Custom duration fades
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
  clipId: '000f4397',  // Audio clip or linked A/V clip

  // Test cases
  tests: [
    {
      name: 'Fade In (1 second)',
      fadeType: 'in',
      duration: 1.0,
      description: 'Gradual fade in over 1 second'
    },
    {
      name: 'Fade Out (2 seconds)',
      fadeType: 'out',
      duration: 2.0,
      description: 'Gradual fade out over 2 seconds'
    },
    {
      name: 'Quick Fade In (0.5 seconds)',
      fadeType: 'in',
      duration: 0.5,
      description: 'Quick fade in for tight cuts'
    }
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

async function fadeAudio(clipId, fadeType, duration) {
  // Create request
  const request = {
    operation: 'fade_audio',
    clipId: clipId,
    fadeType: fadeType,
    duration: duration,
    timestamp: Date.now()
  };

  // Write request file
  fs.writeFileSync(REQUEST_FILE, JSON.stringify(request, null, 2));
  console.log(`\n📤 Request sent: fade_audio`);
  console.log(`   Clip ID: ${clipId}`);
  console.log(`   Fade Type: ${fadeType}`);
  console.log(`   Duration: ${duration}s`);

  // Wait for response
  console.log(`\n⏳ Waiting for response (timeout: ${TIMEOUT_MS}ms)...`);
  const response = await waitForResponse(TIMEOUT_MS);

  return response;
}

async function main() {
  console.log('=================================================');
  console.log('Test: Fade Audio');
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

      const result = await fadeAudio(
        testConfig.clipId,
        test.fadeType,
        test.duration
      );

      console.log('\n📥 Response received:');
      console.log(JSON.stringify(result, null, 2));

      if (result.success) {
        console.log(`\n✅ SUCCESS: ${test.fadeType} fade applied (${test.duration}s)`);
        results.push({ test: test.name, passed: true });
      } else {
        console.error(`\n❌ FAILED: ${result.error || 'Unknown error'}`);
        results.push({ test: test.name, passed: false, error: result.error });
      }

      // Wait a bit between tests
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
    console.log('1. Check timeline - keyframes should be visible on audio clip');
    console.log('2. Zoom in to see fade handles at start/end');
    console.log('3. Play clip to hear fade effect');
    console.log('4. Check waveform - should show volume ramping');

    console.log('\n📚 Fade Types:');
    console.log('  in  - Fade from silence to full volume at clip start');
    console.log('  out - Fade from full volume to silence at clip end');

    console.log('\n⏱️  Common Durations:');
    console.log('  0.5s - Quick fade for tight edits');
    console.log('  1.0s - Standard fade for music/dialogue');
    console.log('  2.0s - Smooth fade for emotional moments');
    console.log('  3.0s - Long fade for scene transitions');

    console.log('\n🎬 Cut Sheet Usage:');
    console.log('// Music bed with fades');
    console.log('await addToTimeline("sequence", "music", 2, 0.0);');
    console.log('await fadeAudio(musicClipId, "in", 1.0);  // Fade in at start');
    console.log('await fadeAudio(musicClipId, "out", 2.0); // Fade out at end');

  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure Premiere Pro is running');
    console.error('2. Check CEP extension panel is visible (Window > Extensions > PremiereRemote)');
    console.error('3. Verify clip has audio component');
    console.error('4. Update clipId in test script with valid ID from test-list-timeline-clips.cjs');
    console.error('5. Ensure clip is long enough for fade duration');
    process.exit(1);
  }
}

main();
