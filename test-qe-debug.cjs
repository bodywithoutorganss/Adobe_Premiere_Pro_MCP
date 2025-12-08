#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const BRIDGE_DIR = '/tmp/premiere-bridge';
const TEST_TIMEOUT = 10000;

async function testQEDebug() {
  console.log('🧪 Testing QE DOM Access\n');

  const commandId = `test-qe-${Date.now()}`;
  const commandFile = path.join(BRIDGE_DIR, `command-${commandId}.json`);
  const responseFile = path.join(BRIDGE_DIR, `response-${commandId}.json`);

  const script = `
    (function() {
      try {
        var info = {};

        // Try to enable QE
        try {
          app.enableQE();
          info.qeEnabled = true;
        } catch (e) {
          info.qeError = e.toString();
          return JSON.stringify({ success: false, info: info });
        }

        // Try to access global qe
        try {
          info.qeGlobalExists = typeof qe !== "undefined";
        } catch (e) {
          info.qeGlobalError = e.toString();
        }

        // Try to get project
        try {
          var qeProject = qe.project;
          info.projectExists = !!qeProject;
        } catch (e) {
          info.projectError = e.toString();
          return JSON.stringify({ success: false, info: info });
        }

        // Try to get active sequence
        try {
          var qeSequence = qeProject.getActiveSequence();
          info.activeSequenceExists = !!qeSequence;
          if (qeSequence) {
            info.sequenceName = qeSequence.name || "unnamed";
          }
        } catch (e) {
          info.activeSequenceError = e.toString();
        }

        // Try to get video effect
        try {
          var lumetri = qeProject.getVideoEffectByName("Lumetri Color");
          info.lumetriExists = !!lumetri;
        } catch (e) {
          info.lumetriError = e.toString();
        }

        return JSON.stringify({
          success: true,
          info: info
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

    console.log('📤 Sending QE debug command...');
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
      console.log(JSON.stringify(response, null, 2));
      return response.success ? 0 : 1;
    } else {
      console.log('❌ No response (timeout)');
      return 1;
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    return 1;
  }
}

testQEDebug()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
