#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

const BRIDGE_DIR = '/tmp/premiere-bridge';
const TEST_TIMEOUT = 10000;

async function listTimelineClips() {
  console.log('🧪 Listing clips on Test sequence timeline\n');

  const sequenceId = 'e6f82896-6744-4511-ac98-1799e1575928'; // Test sequence

  const commandId = `test-timeline-${Date.now()}`;
  const commandFile = path.join(BRIDGE_DIR, `command-${commandId}.json`);
  const responseFile = path.join(BRIDGE_DIR, `response-${commandId}.json`);

  const script = `
    (function() {
      try {
        // Find Test sequence
        var sequence = null;
        for (var i = 0; i < app.project.sequences.numSequences; i++) {
          if (app.project.sequences[i].sequenceID === "${sequenceId}") {
            sequence = app.project.sequences[i];
            break;
          }
        }

        if (!sequence) {
          return JSON.stringify({ ok: false, error: "Sequence not found" });
        }

        var clips = [];

        // List video track clips
        for (var t = 0; t < sequence.videoTracks.numTracks; t++) {
          var track = sequence.videoTracks[t];
          for (var c = 0; c < track.clips.numItems; c++) {
            var clip = track.clips[c];
            clips.push({
              id: clip.nodeId,
              name: clip.name,
              track: 'Video ' + t,
              start: clip.start.seconds,
              end: clip.end.seconds,
              duration: (clip.end.seconds - clip.start.seconds).toFixed(2)
            });
          }
        }

        // List audio track clips
        for (var t = 0; t < sequence.audioTracks.numTracks; t++) {
          var track = sequence.audioTracks[t];
          for (var c = 0; c < track.clips.numItems; c++) {
            var clip = track.clips[c];
            clips.push({
              id: clip.nodeId,
              name: clip.name,
              track: 'Audio ' + t,
              start: clip.start.seconds,
              end: clip.end.seconds,
              duration: (clip.end.seconds - clip.start.seconds).toFixed(2)
            });
          }
        }

        return JSON.stringify({
          ok: true,
          sequenceName: sequence.name,
          clips: clips,
          count: clips.length
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

    console.log('📤 Getting timeline clips...');
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
      if (response.ok) {
        console.log(`✅ Found ${response.count} clip(s) on "${response.sequenceName}" timeline:\n`);

        response.clips.forEach((clip, idx) => {
          console.log(`${idx + 1}. ${clip.name}`);
          console.log(`   ID: ${clip.id}`);
          console.log(`   Track: ${clip.track}`);
          console.log(`   Time: ${clip.start}s - ${clip.end}s (${clip.duration}s)`);
          console.log('');
        });

        if (response.clips.length > 0) {
          console.log('📝 Use first clip ID for testing remove/move/trim operations');
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

listTimelineClips()
  .then(exitCode => process.exit(exitCode))
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
