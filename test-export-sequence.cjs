/**
 * Test: Export Sequence
 *
 * Tests sequence export functionality with various presets and formats.
 *
 * This test demonstrates:
 * 1. H.264 export (standard web/social media)
 * 2. Custom resolution export (1080x1920 for vertical video)
 * 3. Export with custom bitrate
 *
 * IMPORTANT: Update sequenceName with actual sequence from your project.
 * Use: node test-list-sequences.cjs to get valid sequence names.
 *
 * Note: Export operations can take time depending on sequence length.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BRIDGE_DIR = '/tmp/premiere-bridge';
const REQUEST_FILE = path.join(BRIDGE_DIR, 'request.json');
const RESPONSE_FILE = path.join(BRIDGE_DIR, 'response.json');
const TIMEOUT_MS = 30000; // 30 seconds for export queue

// Test parameters - UPDATE THESE
const testConfig = {
  sequenceName: 'Sequence 01',  // Update with your sequence name
  outputDir: '/tmp',  // Output directory

  // Test cases
  tests: [
    {
      name: 'H.264 1080p Export',
      format: 'H.264',
      resolution: '1920x1080',
      frameRate: 30,
      bitrate: 12,
      outputFile: '/tmp/test-export-1080p.mp4',
      description: 'Standard HD export for web/social'
    },
    {
      name: 'Vertical 9:16 Export',
      format: 'H.264',
      resolution: '1080x1920',
      frameRate: 30,
      bitrate: 10,
      outputFile: '/tmp/test-export-9x16.mp4',
      description: 'Vertical video for Instagram/TikTok'
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

async function exportSequence(sequenceName, outputPath, format, resolution, frameRate, bitrate) {
  // Create request
  const request = {
    operation: 'export_sequence',
    sequenceName: sequenceName,
    outputPath: outputPath,
    preset: null,  // Use default preset
    options: {
      format: format,
      resolution: resolution,
      frameRate: frameRate,
      bitrate: bitrate
    },
    timestamp: Date.now()
  };

  // Write request file
  fs.writeFileSync(REQUEST_FILE, JSON.stringify(request, null, 2));
  console.log(`\n📤 Request sent: export_sequence`);
  console.log(`   Sequence: ${sequenceName}`);
  console.log(`   Output: ${outputPath}`);
  console.log(`   Format: ${format}`);
  console.log(`   Resolution: ${resolution}`);
  console.log(`   Frame Rate: ${frameRate} fps`);
  console.log(`   Bitrate: ${bitrate} Mbps`);

  // Wait for response
  console.log(`\n⏳ Waiting for response (timeout: ${TIMEOUT_MS}ms)...`);
  console.log('   Note: Export will be queued, not necessarily complete');
  const response = await waitForResponse(TIMEOUT_MS);

  return response;
}

async function main() {
  console.log('=================================================');
  console.log('Test: Export Sequence');
  console.log('=================================================\n');

  // Check bridge directory
  if (!fs.existsSync(BRIDGE_DIR)) {
    console.error(`❌ Bridge directory not found: ${BRIDGE_DIR}`);
    console.error('   Make sure Premiere Pro is running with CEP extension loaded.');
    process.exit(1);
  }

  console.log(`✅ Bridge directory exists: ${BRIDGE_DIR}\n`);

  // Check output directory
  if (!fs.existsSync(testConfig.outputDir)) {
    console.error(`❌ Output directory not found: ${testConfig.outputDir}`);
    console.error('   Update testConfig.outputDir to valid path');
    process.exit(1);
  }

  console.log(`✅ Output directory exists: ${testConfig.outputDir}\n`);

  const results = [];

  try {
    // Run all test cases
    for (let i = 0; i < testConfig.tests.length; i++) {
      const test = testConfig.tests[i];

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`TEST ${i + 1}: ${test.name}`);
      console.log(`Description: ${test.description}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      const result = await exportSequence(
        testConfig.sequenceName,
        test.outputFile,
        test.format,
        test.resolution,
        test.frameRate,
        test.bitrate
      );

      console.log('\n📥 Response received:');
      console.log(JSON.stringify(result, null, 2));

      if (result.success) {
        console.log(`\n✅ SUCCESS: Export queued`);
        console.log(`   Output: ${test.outputFile}`);
        results.push({ test: test.name, passed: true });
      } else {
        console.error(`\n❌ FAILED: ${result.error || 'Unknown error'}`);
        results.push({ test: test.name, passed: false, error: result.error });
      }

      // Wait between tests
      if (i < testConfig.tests.length - 1) {
        console.log('\n⏱️  Waiting 2 seconds before next test...');
        await new Promise(resolve => setTimeout(resolve, 2000));
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
    console.log('1. Check Premiere Pro Export Queue (Window > Export Queue)');
    console.log('2. Monitor export progress in Adobe Media Encoder');
    console.log('3. Wait for export to complete');
    console.log('4. Verify output files exist at specified paths');
    console.log('5. Check video resolution and bitrate match settings');

    console.log('\n📚 Common Export Formats:');
    console.log('  H.264     - Standard web/social media (MP4)');
    console.log('  H.265     - Higher compression (HEVC)');
    console.log('  ProRes    - Professional archival/editing');
    console.log('  DNxHD     - Professional broadcast');

    console.log('\n📐 Common Resolutions:');
    console.log('  1920x1080 - HD 16:9 (YouTube, Vimeo)');
    console.log('  1080x1920 - Vertical 9:16 (Instagram, TikTok)');
    console.log('  3840x2160 - 4K UHD');
    console.log('  1280x720  - HD 720p');

    console.log('\n⚙️  Bitrate Guidelines (H.264):');
    console.log('  3-5 Mbps   - Low quality (streaming)');
    console.log('  8-12 Mbps  - Standard quality (social media)');
    console.log('  15-20 Mbps - High quality (YouTube 1080p)');
    console.log('  40-50 Mbps - Very high quality (4K)');

    console.log('\n🎬 Cut Sheet Final Step:');
    console.log('// After assembling entire cut sheet');
    console.log('await exportSequence(');
    console.log('  "DW_EP032_YetiLogo_9x16_v01",');
    console.log('  "/output/yeti_logo_final.mp4",');
    console.log('  "H.264",');
    console.log('  "1080x1920",');
    console.log('  30,');
    console.log('  12');
    console.log(');');

    console.log('\n⚠️  Important Notes:');
    console.log('- Export adds to queue but may not complete immediately');
    console.log('- Large sequences take significant time to export');
    console.log('- Adobe Media Encoder must be installed');
    console.log('- Check export queue for errors or warnings');

  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure Premiere Pro is running');
    console.error('2. Check CEP extension panel is visible (Window > Extensions > PremiereRemote)');
    console.error('3. Verify sequence name is correct (test-list-sequences.cjs)');
    console.error('4. Ensure output directory exists and is writable');
    console.error('5. Check Adobe Media Encoder is installed');
    console.error('6. Verify enough disk space for export');
    process.exit(1);
  }
}

main();
