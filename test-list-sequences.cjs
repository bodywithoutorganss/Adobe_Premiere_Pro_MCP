#!/usr/bin/env node

/**
 * Test the list_sequences operation that we fixed
 */

const fs = require('fs').promises;
const path = require('path');

const BRIDGE_DIR = '/tmp/premiere-bridge';
const TEST_TIMEOUT = 10000; // 10 seconds

async function testListSequences() {
  console.log('🧪 Testing list_sequences Operation\n');

  const commandId = `test-seq-${Date.now()}`;
  const commandFile = path.join(BRIDGE_DIR, `command-${commandId}.json`);
  const responseFile = path.join(BRIDGE_DIR, `response-${commandId}.json`);

  // This is the EXACT script from our fixed list_sequences method
  const listSequencesScript = `
    try {
      var sequences = [];
      for (var i = 0; i < app.project.sequences.numSequences; i++) {
        var seq = app.project.sequences[i];
        if (!seq) continue;
        var seqData = {
          id: seq.sequenceID,
          name: seq.name,
          width: seq.frameSizeHorizontal,
          height: seq.frameSizeVertical,
          videoTrackCount: seq.videoTracks.numTracks,
          audioTrackCount: seq.audioTracks.numTracks
        };
        sequences.push(seqData);
      }
      JSON.stringify({
        success: true,
        sequences: sequences,
        count: sequences.length
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
      script: listSequencesScript,
      timestamp: new Date().toISOString()
    }));

    console.log('📤 Sent list_sequences command');
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

      if (response.success) {
        console.log('🎉 SUCCESS! list_sequences is working!\n');
        console.log(`Found ${response.count} sequence(s):\n`);

        response.sequences.forEach((seq, index) => {
          console.log(`${index + 1}. ${seq.name}`);
          console.log(`   ID: ${seq.id}`);
          console.log(`   Resolution: ${seq.width}x${seq.height}`);
          console.log(`   Video Tracks: ${seq.videoTrackCount}`);
          console.log(`   Audio Tracks: ${seq.audioTrackCount}`);
          console.log('');
        });

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

testListSequences()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
