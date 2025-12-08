#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const BRIDGE_DIR = '/tmp/premiere-bridge';
const TEST_TIMEOUT = 10000;

async function findAllClips() {
  console.log('🧪 Finding ALL clips in project (checking all item types)\n');

  const commandId = `test-all-${Date.now()}`;
  const commandFile = path.join(BRIDGE_DIR, `command-${commandId}.json`);
  const responseFile = path.join(BRIDGE_DIR, `response-${commandId}.json`);

  const script = `
    (function() {
      try {
        var allClips = [];

        function walkProject(item, depth, path) {
          if (depth > 10) return;

          var itemInfo = {
            id: item.nodeId || 'no-id',
            name: item.name,
            path: path,
            type: 'unknown',
            typeNum: item.type
          };

          // Check all type values
          if (item.type === ProjectItemType.CLIP) itemInfo.type = 'CLIP';
          else if (item.type === ProjectItemType.BIN) itemInfo.type = 'BIN';
          else if (item.type === ProjectItemType.ROOT) itemInfo.type = 'ROOT';
          else if (item.type === ProjectItemType.FILE) itemInfo.type = 'FILE';

          // Try to get media info
          try {
            if (item.getMediaPath) {
              itemInfo.mediaPath = item.getMediaPath();
            }
          } catch (e) {}

          // Add non-bins to our list
          if (item.type !== ProjectItemType.BIN && item.type !== ProjectItemType.ROOT) {
            allClips.push(itemInfo);
          }

          // Recurse into bins
          if ((item.type === ProjectItemType.BIN || item.type === ProjectItemType.ROOT) && item.children) {
            for (var i = 0; i < item.children.numItems; i++) {
              walkProject(item.children[i], depth + 1, path + '/' + item.name);
            }
          }
        }

        walkProject(app.project.rootItem, 0, '');

        return JSON.stringify({
          ok: true,
          clips: allClips,
          count: allClips.length
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

    console.log('📤 Searching entire project recursively...');
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
        console.log(`🎉 Found ${response.count} item(s) in project:\n`);

        // Group by type
        const byType = {};
        response.clips.forEach(clip => {
          if (!byType[clip.type]) byType[clip.type] = [];
          byType[clip.type].push(clip);
        });

        // Show summary by type
        Object.keys(byType).forEach(type => {
          console.log(`\n${type} items (${byType[type].length}):`);
          byType[type].slice(0, 5).forEach((item, idx) => {
            console.log(`  ${idx + 1}. ${item.name} (ID: ${item.id})`);
            if (item.mediaPath) {
              console.log(`     Path: ${item.mediaPath.substring(0, 80)}...`);
            }
          });
          if (byType[type].length > 5) {
            console.log(`  ... and ${byType[type].length - 5} more`);
          }
        });

        // Find first usable clip
        const usableClip = response.clips.find(c => c.type === 'CLIP' || c.type === 'FILE');
        if (usableClip) {
          console.log('\n📝 First usable clip for testing:');
          console.log(`   ID: ${usableClip.id}`);
          console.log(`   Name: ${usableClip.name}`);
          console.log(`   Type: ${usableClip.type}`);
          if (usableClip.mediaPath) {
            console.log(`   Path: ${usableClip.mediaPath}`);
          }
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

findAllClips()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
