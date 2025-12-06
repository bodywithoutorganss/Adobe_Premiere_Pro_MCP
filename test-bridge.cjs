#!/usr/bin/env node

/**
 * Simple test script to verify the Premiere Pro bridge is working
 *
 * This script creates a test command file and checks for a response,
 * simulating what the CEP extension does.
 */

const fs = require('fs').promises;
const path = require('path');

const BRIDGE_DIR = '/tmp/premiere-bridge';
const TEST_TIMEOUT = 5000; // 5 seconds

async function testBridge() {
  console.log('🧪 Testing Premiere Pro Bridge Communication\n');

  // Check if bridge directory exists
  try {
    await fs.access(BRIDGE_DIR);
    console.log('✅ Bridge directory exists:', BRIDGE_DIR);
  } catch (error) {
    console.log('❌ Bridge directory not found:', BRIDGE_DIR);
    console.log('   Run: mkdir -p /tmp/premiere-bridge');
    process.exit(1);
  }

  // Create a simple test command
  const commandId = `test-${Date.now()}`;
  const commandFile = path.join(BRIDGE_DIR, `command-${commandId}.json`);
  const responseFile = path.join(BRIDGE_DIR, `response-${commandId}.json`);

  const testScript = `
    try {
      if (typeof app !== 'undefined' && app.project) {
        JSON.stringify({
          success: true,
          projectName: app.project.name,
          projectPath: app.project.path,
          numSequences: app.project.sequences.numSequences
        });
      } else {
        JSON.stringify({
          success: false,
          error: "Premiere Pro not available or no project open"
        });
      }
    } catch (e) {
      JSON.stringify({
        success: false,
        error: e.toString()
      });
    }
  `;

  try {
    // Write command file
    await fs.writeFile(commandFile, JSON.stringify({
      id: commandId,
      script: testScript,
      timestamp: new Date().toISOString()
    }));

    console.log('📤 Sent test command:', commandId);
    console.log('⏳ Waiting for response (timeout: 5s)...\n');

    // Wait for response
    const startTime = Date.now();
    let response = null;

    while (Date.now() - startTime < TEST_TIMEOUT) {
      try {
        const responseData = await fs.readFile(responseFile, 'utf8');
        response = JSON.parse(responseData);
        break;
      } catch (error) {
        // File doesn't exist yet, wait a bit
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Clean up files
    try {
      await fs.unlink(commandFile);
      if (response) await fs.unlink(responseFile);
    } catch (error) {
      // Ignore cleanup errors
    }

    // Display results
    if (response) {
      console.log('✅ Response received!\n');
      console.log('Response:', JSON.stringify(response, null, 2));

      if (response.success) {
        console.log('\n🎉 SUCCESS! Premiere Pro bridge is working!');
        console.log('   Project:', response.projectName);
        console.log('   Sequences:', response.numSequences);
        return 0;
      } else {
        console.log('\n⚠️  Premiere Pro responded but with an error:');
        console.log('   ', response.error);
        console.log('\n💡 Make sure:');
        console.log('   1. Premiere Pro is running');
        console.log('   2. A project is open');
        console.log('   3. The CEP extension panel is visible (Window > Extensions > PremiereRemote)');
        return 1;
      }
    } else {
      console.log('❌ No response received (timeout)');
      console.log('\n💡 Troubleshooting:');
      console.log('   1. Is Premiere Pro running?');
      console.log('   2. Is a project open in Premiere Pro?');
      console.log('   3. Is the CEP extension panel visible?');
      console.log('      → Window > Extensions > PremiereRemote');
      console.log('   4. Check the CEP extension console for errors:');
      console.log('      → Right-click the panel > Inspect Element / Debug');
      console.log('   5. Verify PlayerDebugMode is enabled:');
      console.log('      → defaults read com.adobe.CSXS.12 PlayerDebugMode');
      console.log('      → Should return 1');
      console.log('\n   Command file still exists at:', commandFile);
      console.log('   (The CEP extension should be watching for it)');
      return 1;
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error);
    return 1;
  }
}

// Run the test
testBridge()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
