/**
 * Test: Import Media
 *
 * Tests the import_media operation which imports video/audio/image files
 * into the Premiere Pro project.
 *
 * This demonstrates:
 * 1. Importing single media file
 * 2. Importing to specific bin
 * 3. Returning imported clip info
 *
 * IMPORTANT: Update filePaths with actual media files before running.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BRIDGE_DIR = '/tmp/premiere-bridge';
const REQUEST_FILE = path.join(BRIDGE_DIR, 'request.json');
const RESPONSE_FILE = path.join(BRIDGE_DIR, 'response.json');
const TIMEOUT_MS = 15000; // 15 seconds for import

// Test parameters - UPDATE THESE WITH YOUR ACTUAL MEDIA FILES
const testConfig = {
  // Single file import
  tests: [
    {
      name: 'Import Single Video File',
      filePath: '/path/to/your/video.mov',  // UPDATE THIS
      binName: undefined,  // Import to root
      description: 'Import video file to project root'
    },
    {
      name: 'Import to Specific Bin',
      filePath: '/path/to/your/video.mov',  // UPDATE THIS
      binName: 'Imports',  // Import to "Imports" bin
      description: 'Import to specific bin folder'
    },
    {
      name: 'Import Audio File',
      filePath: '/path/to/your/audio.wav',  // UPDATE THIS
      binName: 'Audio',
      description: 'Import audio file to Audio bin'
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

async function importMedia(filePath, binName) {
  // Create request
  const request = {
    operation: 'import_media',
    filePath: filePath,
    binName: binName,
    timestamp: Date.now()
  };

  // Write request file
  fs.writeFileSync(REQUEST_FILE, JSON.stringify(request, null, 2));
  console.log(`\n📤 Request sent: import_media`);
  console.log(`   File: ${filePath}`);
  if (binName) {
    console.log(`   Bin: ${binName}`);
  }

  // Wait for response
  console.log(`\n⏳ Waiting for response (timeout: ${TIMEOUT_MS}ms)...`);
  console.log('   Note: Import may take time for large files');
  const response = await waitForResponse(TIMEOUT_MS);

  return response;
}

async function main() {
  console.log('=================================================');
  console.log('Test: Import Media');
  console.log('=================================================\n');

  // Check bridge directory
  if (!fs.existsSync(BRIDGE_DIR)) {
    console.error(`❌ Bridge directory not found: ${BRIDGE_DIR}`);
    console.error('   Make sure Premiere Pro is running with CEP extension loaded.');
    process.exit(1);
  }

  console.log(`✅ Bridge directory exists: ${BRIDGE_DIR}\n`);

  console.log('⚠️  SETUP REQUIRED:');
  console.log('Update testConfig.tests with actual media file paths before running.\n');

  const results = [];

  try {
    // Run all test cases
    for (let i = 0; i < testConfig.tests.length; i++) {
      const test = testConfig.tests[i];

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`TEST ${i + 1}: ${test.name}`);
      console.log(`Description: ${test.description}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Check if file exists
      if (!test.filePath.startsWith('/path/to/')) {
        if (!fs.existsSync(test.filePath)) {
          console.warn(`⚠️  File not found: ${test.filePath}`);
          console.warn('   Skipping test - update testConfig with valid path');
          results.push({ test: test.name, passed: false, error: 'File not found' });
          continue;
        }
      } else {
        console.warn('⚠️  Test file path not configured');
        console.warn('   Update testConfig.tests[].filePath with actual media file');
        results.push({ test: test.name, passed: false, error: 'Path not configured' });
        continue;
      }

      const result = await importMedia(test.filePath, test.binName);

      console.log('\n📥 Response received:');
      console.log(JSON.stringify(result, null, 2));

      if (result.success) {
        console.log(`\n✅ SUCCESS: Media imported`);
        if (result.id) console.log(`   Clip ID: ${result.id}`);
        if (result.name) console.log(`   Clip Name: ${result.name}`);
        if (result.duration) console.log(`   Duration: ${result.duration}s`);
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
    console.log('2. Verify imported files appear');
    console.log('3. Check bins if specified');
    console.log('4. Verify file types and metadata');

    console.log('\n📚 Supported Media Types:');
    console.log('  Video: .mov, .mp4, .avi, .mxf, .r3d (RED), etc.');
    console.log('  Audio: .wav, .mp3, .aif, .aac');
    console.log('  Image: .jpg, .png, .tif, .psd');

    console.log('\n🎬 Cut Sheet Integration:');
    console.log('In cut sheet JSON:');
    console.log('{');
    console.log('  "media": {');
    console.log('    "import": [');
    console.log('      {');
    console.log('        "path": "/path/to/interview.mov",');
    console.log('        "name": "interview_ben",');
    console.log('        "bin": "Interviews"');
    console.log('      }');
    console.log('    ]');
    console.log('  }');
    console.log('}');

    console.log('\n⚠️  Important Notes:');
    console.log('- Import can be slow for large files (4K, RAW)');
    console.log('- Bins must exist or will be created');
    console.log('- File paths must be absolute');
    console.log('- Premiere must have permissions to access files');

  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure Premiere Pro is running');
    console.error('2. Check CEP extension panel is visible (Window > Extensions > PremiereRemote)');
    console.error('3. Verify file paths are correct and absolute');
    console.error('4. Check file permissions');
    console.error('5. Ensure media format is supported by Premiere');
    process.exit(1);
  }
}

main();
