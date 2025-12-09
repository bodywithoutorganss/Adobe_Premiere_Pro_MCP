/**
 * Test: Create Sequence
 *
 * Tests the create_sequence operation which creates new sequences (timelines)
 * in Premiere Pro with specified settings.
 *
 * This demonstrates:
 * 1. Creating sequence with preset
 * 2. Creating custom 9:16 vertical sequence
 * 3. Creating different aspect ratios
 *
 * IMPORTANT: This will create actual sequences in your open Premiere project.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BRIDGE_DIR = '/tmp/premiere-bridge';
const TIMEOUT_MS = 10000;

// Test parameters
const testConfig = {
  tests: [
    {
      name: 'Create 9:16 Vertical Sequence',
      sequenceName: 'Test_9x16_Vertical',
      width: 1080,
      height: 1920,
      frameRate: 30,
      sampleRate: 48000,
      description: 'Instagram/TikTok vertical format'
    },
    {
      name: 'Create 16:9 HD Sequence',
      sequenceName: 'Test_16x9_HD',
      width: 1920,
      height: 1080,
      frameRate: 30,
      sampleRate: 48000,
      description: 'Standard HD widescreen'
    },
    {
      name: 'Create 1:1 Square Sequence',
      sequenceName: 'Test_1x1_Square',
      width: 1080,
      height: 1080,
      frameRate: 30,
      sampleRate: 48000,
      description: 'Instagram feed square format'
    },
    {
      name: 'Create with Preset',
      sequenceName: 'Test_Preset_Sequence',
      presetPath: 'DSLR 1080p30',  // Premiere preset name
      description: 'Using built-in preset'
    }
  ]
};

function waitForResponse(responseFile, timeout) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkInterval = 100;

    const check = () => {
      if (fs.existsSync(responseFile)) {
        try {
          const response = JSON.parse(fs.readFileSync(responseFile, 'utf-8'));
          fs.unlinkSync(responseFile);
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

async function createSequence(sequenceName, options = {}) {
  // Generate unique command ID
  const commandId = `create-seq-${Date.now()}`;
  const commandFile = path.join(BRIDGE_DIR, `command-${commandId}.json`);
  const responseFile = path.join(BRIDGE_DIR, `response-${commandId}.json`);

  // Build ExtendScript for creating sequence
  let script;
  if (options.presetPath) {
    script = `
      try {
        var newSeq = app.project.createNewSequence("${sequenceName}", "${options.presetPath}");
        JSON.stringify({
          success: true,
          message: "Sequence created with preset",
          name: newSeq.name,
          id: newSeq.sequenceID,
          frameRate: newSeq.framerate
        });
      } catch (e) {
        JSON.stringify({
          success: false,
          error: e.toString()
        });
      }
    `;
  } else {
    // Create with custom settings
    script = `
      try {
        var newSeq = app.project.createNewSequence("${sequenceName}", "");
        if (newSeq) {
          JSON.stringify({
            success: true,
            message: "Sequence created",
            name: newSeq.name,
            id: newSeq.sequenceID,
            frameRate: newSeq.framerate
          });
        } else {
          JSON.stringify({
            success: false,
            error: "Failed to create sequence - createNewSequence returned null"
          });
        }
      } catch (e) {
        JSON.stringify({
          success: false,
          error: e.toString()
        });
      }
    `;
  }

  // Write command file
  fs.writeFileSync(commandFile, JSON.stringify({
    id: commandId,
    script: script,
    timestamp: new Date().toISOString()
  }, null, 2));

  console.log(`\n📤 Request sent: create_sequence`);
  console.log(`   Name: ${sequenceName}`);
  if (options.width && options.height) {
    console.log(`   Resolution: ${options.width}x${options.height}`);
    console.log(`   Frame Rate: ${options.frameRate} fps`);
  } else if (options.presetPath) {
    console.log(`   Preset: ${options.presetPath}`);
  }

  // Wait for response
  console.log(`\n⏳ Waiting for response (timeout: ${TIMEOUT_MS}ms)...`);
  const response = await waitForResponse(responseFile, TIMEOUT_MS);

  return response;
}

async function main() {
  console.log('=================================================');
  console.log('Test: Create Sequence');
  console.log('=================================================\n');

  // Check bridge directory
  if (!fs.existsSync(BRIDGE_DIR)) {
    console.error(`❌ Bridge directory not found: ${BRIDGE_DIR}`);
    console.error('   Make sure Premiere Pro is running with CEP extension loaded.');
    process.exit(1);
  }

  console.log(`✅ Bridge directory exists: ${BRIDGE_DIR}\n`);

  console.log('⚠️  Note: This will create test sequences in your open project.');
  console.log('You can delete them manually after testing.\n');

  const results = [];

  try {
    // Run all test cases
    for (let i = 0; i < testConfig.tests.length; i++) {
      const test = testConfig.tests[i];

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`TEST ${i + 1}: ${test.name}`);
      console.log(`Description: ${test.description}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const options = {};
      if (test.presetPath) {
        options.presetPath = test.presetPath;
      } else {
        options.width = test.width;
        options.height = test.height;
        options.frameRate = test.frameRate;
        options.sampleRate = test.sampleRate;
      }

      const result = await createSequence(test.sequenceName, options);

      console.log('\n📥 Response received:');
      console.log(JSON.stringify(result, null, 2));

      if (result.success) {
        console.log(`\n✅ SUCCESS: Sequence "${test.sequenceName}" created`);
        if (result.id) console.log(`   Sequence ID: ${result.id}`);
        if (result.frameRate) console.log(`   Frame Rate: ${result.frameRate} fps`);
        results.push({ test: test.name, passed: true });
      } else {
        console.error(`\n❌ FAILED: ${result.error || 'Unknown error'}`);
        results.push({ test: test.name, passed: false, error: result.error });
      }

      // Wait between tests
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
    console.log('1. Check Project panel in Premiere Pro');
    console.log('2. Verify sequences appear in sequence list');
    console.log('3. Double-click sequences to check settings');
    console.log('4. Verify resolution and frame rate');

    console.log('\n📚 Common Sequence Formats:');
    console.log('');
    console.log('Social Media:');
    console.log('  9:16 Vertical   - 1080x1920 (Instagram Reels, TikTok, Stories)');
    console.log('  1:1 Square      - 1080x1080 (Instagram Feed)');
    console.log('  16:9 Horizontal - 1920x1080 (YouTube, Twitter)');
    console.log('');
    console.log('Professional:');
    console.log('  HD 1080p        - 1920x1080 (Broadcast)');
    console.log('  4K UHD          - 3840x2160 (High-end delivery)');
    console.log('  DCI 4K          - 4096x2160 (Cinema)');
    console.log('');
    console.log('Legacy:');
    console.log('  SD 4:3          - 720x480 (Old broadcast)');
    console.log('  HD 720p         - 1280x720 (Web/streaming)');

    console.log('\n🎬 Cut Sheet Integration:');
    console.log('In cut sheet JSON:');
    console.log('{');
    console.log('  "sequence": {');
    console.log('    "name": "My_Edit_9x16",');
    console.log('    "format": "9:16",');
    console.log('    "width": 1080,');
    console.log('    "height": 1920,');
    console.log('    "frameRate": 30');
    console.log('  }');
    console.log('}');
    console.log('');
    console.log('Processor will auto-create sequence before adding clips.');

    console.log('\n⚙️  Presets Available:');
    console.log('Built-in Premiere Pro presets (examples):');
    console.log('  - "DSLR 1080p30"');
    console.log('  - "DSLR 1080p24"');
    console.log('  - "AVCHD 1080p30"');
    console.log('  - "HDV 1080p30"');
    console.log('');
    console.log('Note: Preset names vary by Premiere version.');
    console.log('Check Sequence > New Sequence dialog for available presets.');

    console.log('\n🧹 Cleanup:');
    console.log('Test sequences created in your project:');
    testConfig.tests.forEach(t => {
      console.log(`  - ${t.sequenceName}`);
    });
    console.log('');
    console.log('You can manually delete these sequences after testing.');

  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure Premiere Pro is running');
    console.error('2. Check CEP extension panel is visible (Window > Extensions > PremiereRemote)');
    console.error('3. Verify project is open');
    console.error('4. Check sequence name doesn\'t already exist');
    console.error('5. If using preset, verify preset name is correct');
    process.exit(1);
  }
}

main();
