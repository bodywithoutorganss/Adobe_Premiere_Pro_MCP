#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const BRIDGE_DIR = '/tmp/premiere-bridge';
const TEST_TIMEOUT = 10000;

async function findClip() {
  console.log('🧪 Searching for an actual video clip\n');

  const commandId = `test-find-${Date.now()}`;
  const commandFile = path.join(BRIDGE_DIR, `command-${commandId}.json`);
  const responseFile = path.join(BRIDGE_DIR, `response-${commandId}.json`);

  const script = `
    (function() {
      try {
        // Recursive function to find first video clip
        function findFirstClip(item, depth) {
          if (depth > 5) return null; // Prevent infinite recursion

          // If this is a clip with media, return it
          if (item.type === ProjectItemType.CLIP) {
            try {
              var mediaPath = item.getMediaPath ? item.getMediaPath() : null;
              if (mediaPath && mediaPath.length > 0) {
                return {
                  id: item.nodeId,
                  name: item.name,
                  mediaPath: mediaPath
                };
              }
            } catch (e) {}
          }

          // If it's a bin, search its children
          if (item.type === ProjectItemType.BIN && item.children) {
            for (var i = 0; i < item.children.numItems; i++) {
              var result = findFirstClip(item.children[i], depth + 1);
              if (result) return result;
            }
          }

          return null;
        }

        var clip = findFirstClip(app.project.rootItem, 0);

        if (clip) {
          return JSON.stringify({
            ok: true,
            clip: clip
          });
        } else {
          return JSON.stringify({
            ok: false,
            error: 'No video clips found in project'
          });
        }

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

    console.log('📤 Searching project recursively for video clips...');
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
        console.log('🎉 Found a video clip!\n');
        console.log(`Name: ${response.clip.name}`);
        console.log(`ID: ${response.clip.id}`);
        console.log(`Path: ${response.clip.mediaPath}\n`);

        console.log('📝 Ready to test add_to_timeline with:');
        console.log(`   Clip ID: ${response.clip.id}`);
        console.log(`   Sequence ID: e6f82896-6744-4511-ac98-1799e1575928 (Test sequence)`);

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

findClip()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
