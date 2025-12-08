/**
 * Test: Create Proxy Media
 *
 * Tests proxy media generation for high-resolution footage.
 *
 * This test demonstrates:
 * 1. Creating proxies with default preset
 * 2. Creating proxies with custom preset
 * 3. Proxy workflow for performance editing
 *
 * IMPORTANT: Update projectItemIds with actual high-res clips from your project.
 * Use: node test-list-items.cjs to get valid project item IDs.
 *
 * Note: Proxy generation is async and can take significant time.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BRIDGE_DIR = '/tmp/premiere-bridge';
const REQUEST_FILE = path.join(BRIDGE_DIR, 'request.json');
const RESPONSE_FILE = path.join(BRIDGE_DIR, 'response.json');
const TIMEOUT_MS = 20000; // 20 seconds for proxy queue

// Test parameters - UPDATE THESE
const testConfig = {
  // Project item IDs for high-res clips (4K, 6K, RAW, etc.)
  projectItemIds: [
    'item001',  // Replace with actual project item ID
    'item002',  // Replace with actual project item ID
  ],

  // Proxy preset name (from Premiere Pro > Preferences > Ingest Settings)
  proxyPreset: 'H.264 Low Resolution Proxy',  // Default proxy preset

  // Test cases
  tests: [
    {
      name: 'Single Clip Proxy',
      itemCount: 1,
      preset: 'H.264 Low Resolution Proxy',
      description: 'Create proxy for one 4K clip'
    },
    {
      name: 'Batch Proxy Generation',
      itemCount: 2,
      preset: 'H.264 Low Resolution Proxy',
      description: 'Create proxies for multiple clips'
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

async function createProxies(projectItemIds, preset) {
  // Create request
  const request = {
    operation: 'create_proxy_media',
    projectItemIds: projectItemIds,
    proxyPreset: preset,
    timestamp: Date.now()
  };

  // Write request file
  fs.writeFileSync(REQUEST_FILE, JSON.stringify(request, null, 2));
  console.log(`\n📤 Request sent: create_proxy_media`);
  console.log(`   Items: ${projectItemIds.length} clip(s)`);
  console.log(`   IDs: ${projectItemIds.join(', ')}`);
  console.log(`   Preset: ${preset}`);

  // Wait for response
  console.log(`\n⏳ Waiting for response (timeout: ${TIMEOUT_MS}ms)...`);
  console.log('   Note: Proxy generation starts but may not complete immediately');
  const response = await waitForResponse(TIMEOUT_MS);

  return response;
}

async function main() {
  console.log('=================================================');
  console.log('Test: Create Proxy Media');
  console.log('=================================================\n');

  // Check bridge directory
  if (!fs.existsSync(BRIDGE_DIR)) {
    console.error(`❌ Bridge directory not found: ${BRIDGE_DIR}`);
    console.error('   Make sure Premiere Pro is running with CEP extension loaded.');
    process.exit(1);
  }

  console.log(`✅ Bridge directory exists: ${BRIDGE_DIR}\n`);

  console.log('⚠️  SETUP REQUIRED:');
  console.log('1. Run: node test-list-items.cjs');
  console.log('2. Find high-res clips (4K, 6K, RAW)');
  console.log('3. Update testConfig.projectItemIds with actual IDs');
  console.log('4. Verify proxy preset exists (Premiere > Preferences > Ingest Settings)\n');

  const results = [];

  try {
    // Run all test cases
    for (let i = 0; i < testConfig.tests.length; i++) {
      const test = testConfig.tests[i];

      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`TEST ${i + 1}: ${test.name}`);
      console.log(`Description: ${test.description}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Get subset of items for this test
      const itemsToProxy = testConfig.projectItemIds.slice(0, test.itemCount);

      if (itemsToProxy.length === 0) {
        console.warn('⚠️  No project items configured - skipping test');
        results.push({ test: test.name, passed: false, error: 'No items configured' });
        continue;
      }

      const result = await createProxies(itemsToProxy, test.preset);

      console.log('\n📥 Response received:');
      console.log(JSON.stringify(result, null, 2));

      if (result.success) {
        console.log(`\n✅ SUCCESS: Proxy generation queued for ${itemsToProxy.length} item(s)`);
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
    console.log('1. Check Project panel - clips should show "Proxy: Queued" or "Proxy: Attaching"');
    console.log('2. Monitor progress in Media Encoder queue');
    console.log('3. Wait for proxy generation to complete');
    console.log('4. Toggle proxy mode: Button in Program Monitor');
    console.log('5. Verify smooth playback with proxies enabled');

    console.log('\n📚 What Are Proxies?');
    console.log('Proxies are low-resolution versions of high-res footage that enable:');
    console.log('  - Smooth editing on slower computers');
    console.log('  - Faster scrubbing and preview');
    console.log('  - Reduced CPU/GPU load');
    console.log('  - Automatic switch to full-res on export');

    console.log('\n🎯 When to Use Proxies:');
    console.log('  ✅ 4K/6K/8K footage');
    console.log('  ✅ RAW camera files (RED, ARRI, etc.)');
    console.log('  ✅ High-bitrate codecs');
    console.log('  ✅ Editing on laptop/older hardware');
    console.log('  ❌ Already editing with 1080p H.264 (overkill)');

    console.log('\n⚙️  Common Proxy Presets:');
    console.log('  H.264 Low Resolution Proxy  - 1/4 resolution, fast');
    console.log('  ProRes Proxy               - Higher quality, larger files');
    console.log('  DNxHD Proxy                - Avid workflow');
    console.log('  Custom                     - Define in Ingest Settings');

    console.log('\n🔄 Proxy Workflow:');
    console.log('1. Import high-res footage');
    console.log('2. Create proxies (this operation)');
    console.log('3. Toggle proxy mode ON for editing');
    console.log('4. Edit as normal (fast playback)');
    console.log('5. Export: Premiere automatically uses full-res');

    console.log('\n⚠️  Important Notes:');
    console.log('- Proxy generation is ASYNC and can take hours for large projects');
    console.log('- Proxies stored in project location (check Ingest Settings)');
    console.log('- Can toggle between proxy/full-res anytime');
    console.log('- Export always uses full-resolution originals');
    console.log('- Proxies linked to originals - moving files breaks link');

    console.log('\n💾 Storage Impact:');
    console.log('Example: 100GB of 4K footage');
    console.log('  → H.264 Low Res Proxies: ~10-15GB additional');
    console.log('  → ProRes Proxies: ~30-40GB additional');

  } catch (error) {
    console.error(`\n❌ ERROR: ${error.message}`);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure Premiere Pro is running');
    console.error('2. Check CEP extension panel is visible (Window > Extensions > PremiereRemote)');
    console.error('3. Update projectItemIds with valid IDs from test-list-items.cjs');
    console.error('4. Verify proxy preset exists (Preferences > Ingest Settings)');
    console.error('5. Check disk space for proxy files');
    console.error('6. Ensure Adobe Media Encoder is installed');
    process.exit(1);
  }
}

main();
