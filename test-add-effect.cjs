/**
 * Test: Add Effect (Generic)
 *
 * Tests the add_effect operation which applies video or audio effects to clips.
 *
 * This test demonstrates:
 * 1. Adding Gaussian Blur effect
 * 2. Adding Brightness & Contrast effect
 * 3. Setting effect parameters
 *
 * IMPORTANT: Update clipId with actual value from your timeline before running.
 * Use: node test-list-timeline-clips.cjs to get valid clip IDs.
 *
 * Note: This is different from color_correct which specifically handles Lumetri Color.
 * This tests generic effect application for other effects.
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
  clipId: '000f4397',  // Video clip ID

  // Test cases - various effects
  tests: [
    {
      name: 'Gaussian Blur',
      effectName: 'Gaussian Blur',
      params: {
        'Blurriness': 20  // Blur amount
      },
      description: 'Blur effect for background plates or privacy'
    },
    {
      name: 'Brightness & Contrast',
      effectName: 'Brightness & Contrast',
      params: {
        'Brightness': 10.0,
        'Contrast': 15.0
      },
      description: 'Simple brightness/contrast adjustment'
    },
    {
      name: 'Vignette',
      effectName: 'Vignette',
      params: {
        'Amount': -0.5,  // Darkening amount
        'Midpoint': 0.5,
        'Roundness': 0.5
      },
      description: 'Darken edges for cinematic look'
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

async function addEffect(clipId, effectName, params = {}) {
  // Create request
  const request = {
    operation: 'add_effect',
    clipId: clipId,
    effectName: effectName,
    params: params,
    timestamp: Date.now()
  };

  // Write request file
  fs.writeFileSync(REQUEST_FILE, JSON.stringify(request, null, 2));
  console.log(`\n📤 Request sent: add_effect`);
  console.log(`   Clip ID: ${clipId}`);
  console.log(`   Effect: ${effectName}`);
  if (Object.keys(params).length > 0) {
    console.log(`   Parameters: ${JSON.stringify(params)}`);
  }

  // Wait for response
  console.log(`\n⏳ Waiting for response (timeout: ${TIMEOUT_MS}ms)...`);
  const response = await waitForResponse(TIMEOUT_MS);

  return response;
}

async function main() {
  console.log('=================================================');
  console.log('Test: Add Effect (Generic)');
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

      const result = await addEffect(
        testConfig.clipId,
        test.effectName,
        test.params
      );

      console.log('\n📥 Response received:');
      console.log(JSON.stringify(result, null, 2));

      if (result.success) {
        console.log(`\n✅ SUCCESS: ${test.effectName} applied`);
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
    console.log('1. Check Effects Control panel - all effects should be listed');
    console.log('2. Verify effect parameters match expected values');
    console.log('3. Check Program Monitor - visual changes should be visible');
    console.log('4. Toggle effect on/off to see difference');

    console.log('\n📚 Commonly Used Effects:');
    console.log('\nVideo Effects:');
    console.log('  - Gaussian Blur (blur backgrounds)');
    console.log('  - Brightness & Contrast (quick adjustments)');
    console.log('  - Vignette (cinematic edges)');
    console.log('  - Fast Color Corrector (basic color)');
    console.log('  - Sharpen (enhance detail)');
    console.log('\nAudio Effects:');
    console.log('  - Parametric Equalizer (EQ)');
    console.log('  - DeNoiser (remove background noise)');
    console.log('  - Compressor (dynamic range)');

    console.log('\n⚠️  Note:');
    console.log('For Lumetri Color, use test-color-correct.cjs instead.');
    console.log('For Warp Stabilizer, use test-stabilize.cjs instead.');

  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure Premiere Pro is running');
    console.error('2. Check CEP extension panel is visible (Window > Extensions > PremiereRemote)');
    console.error('3. Verify effect names match Premiere exactly (case-sensitive)');
    console.error('4. Update clipId in test script with valid ID from test-list-timeline-clips.cjs');
    console.error('5. Check Effects panel in Premiere for exact effect names');
    process.exit(1);
  }
}

main();
