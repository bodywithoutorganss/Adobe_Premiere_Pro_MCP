#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const BRIDGE_DIR = '/tmp/premiere-bridge';
const TEST_TIMEOUT = 10000;

async function testBinContents() {
  console.log('🧪 Looking inside B-Roll bin for footage\n');

  const commandId = `test-bin-${Date.now()}`;
  const commandFile = path.join(BRIDGE_DIR, `command-${commandId}.json`);
  const responseFile = path.join(BRIDGE_DIR, `response-${commandId}.json`);

  const script = `
    (function() {
      try {
        var rootItem = app.project.rootItem;
        var bRollBin = null;

        // Find the B-Roll bin
        for (var i = 0; i < rootItem.children.numItems; i++) {
          var child = rootItem.children[i];
          if (child.name === 'B-Roll' && child.type === ProjectItemType.BIN) {
            bRollBin = child;
            break;
          }
        }

        if (!bRollBin) {
          return JSON.stringify({ ok: false, error: 'B-Roll bin not found' });
        }

        var items = [];

        // List contents of B-Roll bin
        for (var i = 0; i < bRollBin.children.numItems; i++) {
          var item = bRollBin.children[i];
          var itemData = {
            id: item.nodeId || 'no-id',
            name: item.name,
            type: item.type === ProjectItemType.CLIP ? 'clip' :
                  item.type === ProjectItemType.BIN ? 'bin' :
                  item.type === ProjectItemType.FILE ? 'file' : 'unknown'
          };

          // Try to get media path if it's a clip
          if (item.getMediaPath) {
            try {
              itemData.mediaPath = item.getMediaPath();
            } catch (e) {}
          }

          items.push(itemData);
        }

        return JSON.stringify({
          ok: true,
          binName: bRollBin.name,
          items: items,
          count: items.length
        });

      } catch (e) {
        return JSON.stringify({
          ok: false,
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

    console.log('📤 Sent command');
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

      if (response.ok) {
        console.log(`🎉 Found ${response.count} item(s) in "${response.binName}":\n`);

        response.items.forEach((item, index) => {
          console.log(`${index + 1}. ${item.name}`);
          console.log(`   ID: ${item.id}`);
          console.log(`   Type: ${item.type}`);
          if (item.mediaPath) {
            console.log(`   Path: ${item.mediaPath}`);
          }
          console.log('');
        });

        // Save first clip ID for add_to_timeline test
        const firstClip = response.items.find(i => i.type === 'clip' || i.type === 'file');
        if (firstClip) {
          console.log('📝 Can use this for add_to_timeline test:');
          console.log(`   Clip ID: ${firstClip.id}`);
          console.log(`   Clip Name: ${firstClip.name}`);
        }

        return 0;
      } else {
        console.log('❌ Error:', response.error);
        return 1;
      }
    } else {
      console.log('❌ No response (timeout)');
      return 1;
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    return 1;
  }
}

testBinContents()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
