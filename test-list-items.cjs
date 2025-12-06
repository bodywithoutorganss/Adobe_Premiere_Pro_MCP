#!/usr/bin/env node

/**
 * Test the list_project_items operation
 */

const fs = require('fs').promises;
const path = require('path');

const BRIDGE_DIR = '/tmp/premiere-bridge';
const TEST_TIMEOUT = 10000;

async function testListProjectItems() {
  console.log('🧪 Testing list_project_items Operation\n');

  const commandId = `test-items-${Date.now()}`;
  const commandFile = path.join(BRIDGE_DIR, `command-${commandId}.json`);
  const responseFile = path.join(BRIDGE_DIR, `response-${commandId}.json`);

  // This is from our bridge's listProjectItems method
  const listItemsScript = `
    try {
      if (!app.project || !app.project.rootItem) {
        throw new Error('No open project');
      }
      function walk(item) {
        var results = [];
        if (item.type === ProjectItemType.BIN) {
          for (var i = 0; i < item.children.numItems; i++) {
            results = results.concat(walk(item.children[i]));
          }
        } else {
          results.push({
            id: item.nodeId || item.treePath || item.name,
            name: item.name,
            type: item.type === ProjectItemType.BIN ? 'bin' : (item.type === ProjectItemType.SEQUENCE ? 'sequence' : 'footage'),
            mediaPath: item.getMediaPath ? item.getMediaPath() : undefined,
            duration: item.getOutPoint ? (item.getOutPoint() - item.getInPoint()) : undefined,
            frameRate: item.getVideoFrameRate ? item.getVideoFrameRate() : undefined
          });
        }
        return results;
      }
      var items = walk(app.project.rootItem);
      JSON.stringify({ ok: true, items, count: items.length });
    } catch (e) {
      JSON.stringify({ ok: false, error: String(e) });
    }
  `;

  try {
    await fs.writeFile(commandFile, JSON.stringify({
      id: commandId,
      script: listItemsScript,
      timestamp: new Date().toISOString()
    }));

    console.log('📤 Sent list_project_items command');
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
      console.log('✅ Response received!\n');

      if (response.ok) {
        console.log(`🎉 SUCCESS! Found ${response.count} project item(s):\n`);

        // Show first 10 items
        const displayItems = response.items.slice(0, 10);
        displayItems.forEach((item, index) => {
          console.log(`${index + 1}. ${item.name}`);
          console.log(`   ID: ${item.id}`);
          console.log(`   Type: ${item.type}`);
          if (item.mediaPath) console.log(`   Path: ${item.mediaPath.substring(0, 60)}...`);
          console.log('');
        });

        if (response.count > 10) {
          console.log(`... and ${response.count - 10} more items\n`);
        }

        // Save a few IDs for future tests
        const videoItems = response.items.filter(i => i.type === 'footage' && i.mediaPath);
        if (videoItems.length > 0) {
          console.log('📝 Sample footage IDs for testing add_to_timeline:');
          console.log(`   ${videoItems[0].id} - ${videoItems[0].name}`);
          if (videoItems[1]) {
            console.log(`   ${videoItems[1].id} - ${videoItems[1].name}`);
          }
        }

        return 0;
      } else {
        console.log('❌ Error from Premiere Pro:');
        console.log('   ', response.error);
        return 1;
      }
    } else {
      console.log('❌ No response received (timeout)');
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
