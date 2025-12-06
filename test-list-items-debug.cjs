#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const BRIDGE_DIR = '/tmp/premiere-bridge';
const TEST_TIMEOUT = 10000;

async function testListProjectItems() {
  console.log('🧪 Testing list_project_items with better error handling\n');

  const commandId = `test-items-debug-${Date.now()}`;
  const commandFile = path.join(BRIDGE_DIR, `command-${commandId}.json`);
  const responseFile = path.join(BRIDGE_DIR, `response-${commandId}.json`);

  // Simplified version with better error handling
  const listItemsScript = `
    (function() {
      try {
        if (!app.project) {
          return JSON.stringify({ ok: false, error: 'No project open' });
        }
        if (!app.project.rootItem) {
          return JSON.stringify({ ok: false, error: 'No rootItem in project' });
        }

        var items = [];
        var rootItem = app.project.rootItem;

        // Simple iteration - just get top level items first
        for (var i = 0; i < rootItem.children.numItems; i++) {
          var child = rootItem.children[i];
          try {
            var itemData = {
              id: child.nodeId || 'no-id-' + i,
              name: child.name || 'unnamed',
              type: 'unknown'
            };

            // Determine type
            if (child.type === ProjectItemType.CLIP) {
              itemData.type = 'footage';
            } else if (child.type === ProjectItemType.BIN) {
              itemData.type = 'bin';
            } else if (child.type === ProjectItemType.SEQUENCE) {
              itemData.type = 'sequence';
            }

            items.push(itemData);
          } catch (childError) {
            items.push({
              id: 'error-' + i,
              name: 'ERROR: ' + childError.toString(),
              type: 'error'
            });
          }
        }

        return JSON.stringify({
          ok: true,
          items: items,
          count: items.length
        });

      } catch (e) {
        return JSON.stringify({
          ok: false,
          error: e.toString(),
          message: e.message || 'No message',
          stack: e.stack || 'No stack'
        });
      }
    })();
  `;

  try {
    await fs.writeFile(commandFile, JSON.stringify({
      id: commandId,
      script: listItemsScript,
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
      console.log(JSON.stringify(response, null, 2));

      if (response.ok) {
        console.log(`\n🎉 Found ${response.count} top-level items`);
        return 0;
      } else {
        console.log('\n❌ Error details above');
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

testListProjectItems()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
