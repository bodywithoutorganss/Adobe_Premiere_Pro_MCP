#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const BRIDGE_DIR = '/tmp/premiere-bridge';
const TEST_TIMEOUT = 15000;

async function testAddToTimeline() {
  console.log('🧪 Testing add_to_timeline Operation\n');

  // Use the Test sequence and first clip we found
  const clipId = '000f4241'; // YETI Presents The Midnight Hour
  const sequenceId = 'e6f82896-6744-4511-ac98-1799e1575928'; // Test sequence
  const trackIndex = 0;
  const time = 0; // Start of timeline

  console.log(`Clip: YETI Presents The Midnight Hour (${clipId})`);
  console.log(`Sequence: Test (${sequenceId})`);
  console.log(`Track: Video ${trackIndex}`);
  console.log(`Time: ${time} seconds\n`);

  const commandId = `test-add-${Date.now()}`;
  const commandFile = path.join(BRIDGE_DIR, `command-${commandId}.json`);
  const responseFile = path.join(BRIDGE_DIR, `response-${commandId}.json`);

  // This is the EXACT script from our fixed add_to_timeline
  const script = `
    try {
      // Find sequence by ID
      var sequence = null;
      for (var i = 0; i < app.project.sequences.numSequences; i++) {
        if (app.project.sequences[i].sequenceID === "${sequenceId}") {
          sequence = app.project.sequences[i];
          break;
        }
      }
      if (!sequence) {
        JSON.stringify({ success: false, error: "Sequence not found" });
      }

      // Find project item by searching through project recursively
      function findProjectItem(parent, targetId) {
        for (var i = 0; i < parent.children.numItems; i++) {
          var item = parent.children[i];
          if (item.nodeId === targetId || item.treePath === targetId) {
            return item;
          }
          if (item.type === ProjectItemType.BIN && item.children) {
            var found = findProjectItem(item, targetId);
            if (found) return found;
          }
        }
        return null;
      }

      var projectItem = findProjectItem(app.project.rootItem, "${clipId}");
      if (!projectItem) {
        JSON.stringify({ success: false, error: "Project item not found" });
      }

      // Use sequence.insertClip() with proper parameters
      var insertedClip = sequence.insertClip(projectItem, ${time}, ${trackIndex}, 0);

      JSON.stringify({
        success: true,
        message: "Clip inserted successfully!",
        sequenceName: sequence.name,
        itemName: projectItem.name
      });
    } catch (e) {
      JSON.stringify({
        success: false,
        error: e.toString()
      });
    }
  `;

  try {
    await fs.writeFile(commandFile, JSON.stringify({
      id: commandId,
      script: script,
      timestamp: new Date().toISOString()
    }));

    console.log('📤 Sending add_to_timeline command...');
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

      if (response.success) {
        console.log('🎉 SUCCESS! Clip added to timeline!');
        console.log(`   Sequence: ${response.sequenceName}`);
        console.log(`   Clip: ${response.itemName}`);
        console.log('\n✅ Check Premiere Pro - the clip should now be on the timeline!');
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

testAddToTimeline()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
