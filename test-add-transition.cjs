/**
 * Test: Add Transition
 *
 * Tests the add_transition operation which adds video or audio transitions
 * between clips or at clip boundaries.
 *
 * This test demonstrates:
 * 1. Adding Cross Dissolve between video clips
 * 2. Adding Constant Power audio crossfade
 * 3. Setting transition duration
 *
 * IMPORTANT: Update clipIds with actual values from your timeline before running.
 * Use: node test-list-timeline-clips.cjs to get valid clip IDs.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BRIDGE_DIR = '/tmp/premiere-bridge';
const REQUEST_FILE = path.join(BRIDGE_DIR, 'request.json');
const RESPONSE_FILE = path.join(BRIDGE_DIR, 'response.json');
const TIMEOUT_MS = 10000;

// Test parameters - UPDATE THESE WITH YOUR ACTUAL CLIP IDs
const testConfig = {
  // Video transition test
  videoClip1: '000f4397',  // First video clip ID
  videoClip2: '0010439a',  // Second video clip ID (should be adjacent)
  videoTransition: 'Cross Dissolve',
  videoDuration: 1.0,  // 1 second

  // Audio transition test
  audioClip1: '000f4397',  // First audio clip ID (or linked to video)
  audioClip2: '0010439a',  // Second audio clip ID
  audioTransition: 'Constant Power',
  audioDuration: 0.5,  // 500ms
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

async function addTransition(clip1Id, clip2Id, transitionName, duration) {
  // Create request
  const request = {
    operation: 'add_transition',
    clip1Id: clip1Id,
    clip2Id: clip2Id,
    transitionName: transitionName,
    duration: duration,
    timestamp: Date.now()
  };

  // Write request file
  fs.writeFileSync(REQUEST_FILE, JSON.stringify(request, null, 2));
  console.log(`\n📤 Request sent: add_transition`);
  console.log(`   Clip 1: ${clip1Id}`);
  console.log(`   Clip 2: ${clip2Id}`);
  console.log(`   Transition: ${transitionName}`);
  console.log(`   Duration: ${duration}s`);

  // Wait for response
  console.log(`\n⏳ Waiting for response (timeout: ${TIMEOUT_MS}ms)...`);
  const response = await waitForResponse(TIMEOUT_MS);

  return response;
}

async function main() {
  console.log('=================================================');
  console.log('Test: Add Transition');
  console.log('=================================================\n');

  // Check bridge directory
  if (!fs.existsSync(BRIDGE_DIR)) {
    console.error(`❌ Bridge directory not found: ${BRIDGE_DIR}`);
    console.error('   Make sure Premiere Pro is running with CEP extension loaded.');
    process.exit(1);
  }

  console.log(`✅ Bridge directory exists: ${BRIDGE_DIR}\n`);

  try {
    // Test 1: Video transition (Cross Dissolve)
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 1: Video Transition (Cross Dissolve)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const videoResult = await addTransition(
      testConfig.videoClip1,
      testConfig.videoClip2,
      testConfig.videoTransition,
      testConfig.videoDuration
    );

    console.log('\n📥 Response received:');
    console.log(JSON.stringify(videoResult, null, 2));

    if (videoResult.success) {
      console.log('\n✅ SUCCESS: Video transition added');
      console.log(`   Transition: ${testConfig.videoTransition}`);
      console.log(`   Duration: ${testConfig.videoDuration}s`);
    } else {
      console.error(`\n❌ FAILED: ${videoResult.error || 'Unknown error'}`);
    }

    // Test 2: Audio transition (Constant Power)
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 2: Audio Transition (Constant Power)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const audioResult = await addTransition(
      testConfig.audioClip1,
      testConfig.audioClip2,
      testConfig.audioTransition,
      testConfig.audioDuration
    );

    console.log('\n📥 Response received:');
    console.log(JSON.stringify(audioResult, null, 2));

    if (audioResult.success) {
      console.log('\n✅ SUCCESS: Audio transition added');
      console.log(`   Transition: ${testConfig.audioTransition}`);
      console.log(`   Duration: ${testConfig.audioDuration}s`);
    } else {
      console.error(`\n❌ FAILED: ${audioResult.error || 'Unknown error'}`);
    }

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Video Transition: ${videoResult.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Audio Transition: ${audioResult.success ? '✅ PASS' : '❌ FAIL'}`);

    console.log('\n💡 Next Steps:');
    console.log('1. Check Premiere Pro timeline - transitions should be visible');
    console.log('2. Verify transition durations are correct');
    console.log('3. Test playback to ensure smooth transitions');
    console.log('4. Try other transitions: Dip to Black, Exponential Fade, etc.');

    console.log('\n📚 Available Transitions:');
    console.log('Video: Cross Dissolve, Dip to Black, Dip to White, Film Dissolve');
    console.log('Audio: Constant Gain, Constant Power, Exponential Fade');

  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure Premiere Pro is running');
    console.error('2. Check CEP extension panel is visible (Window > Extensions > PremiereRemote)');
    console.error('3. Verify clips are adjacent on timeline');
    console.error('4. Update clipIds in test script with valid IDs from test-list-timeline-clips.cjs');
    process.exit(1);
  }
}

main();
