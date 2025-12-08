/**
 * Cut Sheet Processor
 *
 * Reads a JSON cut sheet with timecodes and executes MCP operations
 * to automatically assemble the edit in Premiere Pro.
 *
 * Usage:
 *   node process-cutsheet.cjs cutsheet-yeti-logo-timecode.json
 *
 * This demonstrates:
 * - Reading timecode-based cut sheets
 * - Converting timecodes to seconds
 * - Executing MCP operations in sequence
 * - Complete automated assembly workflow
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BRIDGE_DIR = '/tmp/premiere-bridge';
const REQUEST_FILE = path.join(BRIDGE_DIR, 'request.json');
const RESPONSE_FILE = path.join(BRIDGE_DIR, 'response.json');
const TIMEOUT_MS = 10000;

// Timecode utilities (inline for CJS compatibility)
function timecodeToSeconds(timecode, options = {}) {
  if (typeof timecode === 'number') {
    return timecode;
  }
  if (timecode === null || timecode === undefined) {
    return null;
  }

  const tc = timecode.trim();
  const parts = tc.split(':');

  if (parts.length < 2 || parts.length > 4) {
    throw new Error(`Invalid timecode format: ${timecode}`);
  }

  let hours = 0;
  let minutes = 0;
  let seconds = 0;

  if (parts.length === 2) {
    minutes = parseInt(parts[0], 10);
    seconds = parts[1].includes('.') ? parseFloat(parts[1]) : parseInt(parts[1], 10);
  } else if (parts.length === 3) {
    hours = parseInt(parts[0], 10);
    minutes = parseInt(parts[1], 10);
    seconds = parts[2].includes('.') ? parseFloat(parts[2]) : parseInt(parts[2], 10);
  } else if (parts.length === 4) {
    hours = parseInt(parts[0], 10);
    minutes = parseInt(parts[1], 10);
    seconds = parseInt(parts[2], 10);
    const frames = parseInt(parts[3], 10);

    if (!options.frameRate) {
      throw new Error('frameRate required for frame-based timecodes');
    }
    seconds += frames / options.frameRate;
  }

  return hours * 3600 + minutes * 60 + seconds;
}

function calculateDuration(inTime, outTime, frameRate) {
  const inSeconds = timecodeToSeconds(inTime, { frameRate });
  const outSeconds = timecodeToSeconds(outTime, { frameRate });

  if (outSeconds < inSeconds) {
    throw new Error(`Out time (${outTime}) is before in time (${inTime})`);
  }

  return outSeconds - inSeconds;
}

function waitForResponse(timeout) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkInterval = 100;

    const check = () => {
      if (fs.existsSync(RESPONSE_FILE)) {
        try {
          const response = JSON.parse(fs.readFileSync(RESPONSE_FILE, 'utf-8'));
          fs.unlinkSync(RESPONSE_FILE);
          resolve(response);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      } else if (Date.now() - startTime > timeout) {
        reject(new Error('Timeout waiting for response'));
      } else {
        setTimeout(check, checkInterval);
      }
    };

    check();
  });
}

async function executeMCPOperation(operation, clipId) {
  const request = {
    operation: operation.type,
    clipId: clipId,
    ...operation.params,
    timestamp: Date.now()
  };

  fs.writeFileSync(REQUEST_FILE, JSON.stringify(request, null, 2));
  console.log(`   → ${operation.type}: ${operation.description || JSON.stringify(operation.params || {})}`);

  const response = await waitForResponse(TIMEOUT_MS);

  if (!response.success) {
    throw new Error(`Operation failed: ${response.error}`);
  }

  return response;
}

async function processShot(shot, frameRate) {
  console.log(`\n📹 Processing: ${shot.id} - ${shot.description}`);

  // Convert timecodes to seconds
  const timelineStartSeconds = timecodeToSeconds(shot.timelineStart, { frameRate });
  const sourceInSeconds = timecodeToSeconds(shot.sourceIn, { frameRate });
  const sourceOutSeconds = timecodeToSeconds(shot.sourceOut, { frameRate });

  console.log(`   Timeline: ${shot.timelineStart} (${timelineStartSeconds}s)`);
  if (shot.sourceIn && shot.sourceOut) {
    const duration = sourceOutSeconds - sourceInSeconds;
    console.log(`   Source: ${shot.sourceIn} → ${shot.sourceOut} (${duration}s)`);
  }

  // Step 1: Add to timeline
  const addRequest = {
    operation: 'add_to_timeline',
    sequenceName: 'SEQUENCE_NAME_PLACEHOLDER',  // Would come from cut sheet context
    projectItemId: shot.clipName,
    trackIndex: shot.track,
    time: timelineStartSeconds,
    timestamp: Date.now()
  };

  if (sourceInSeconds !== null && sourceOutSeconds !== null) {
    addRequest.sourceIn = sourceInSeconds;
    addRequest.sourceOut = sourceOutSeconds;
  }

  fs.writeFileSync(REQUEST_FILE, JSON.stringify(addRequest, null, 2));
  console.log(`   → add_to_timeline: ${shot.clipName} at ${timelineStartSeconds}s`);

  const addResponse = await waitForResponse(TIMEOUT_MS);

  if (!addResponse.success) {
    throw new Error(`Failed to add clip: ${addResponse.error}`);
  }

  const clipId = addResponse.clipId || addResponse.clip?.nodeId;
  console.log(`   ✅ Added (clipId: ${clipId})`);

  // Step 2: Execute operations
  if (shot.operations && shot.operations.length > 0) {
    console.log(`   Applying ${shot.operations.length} operation(s):`);

    for (const operation of shot.operations) {
      await executeMCPOperation(operation, clipId);
      console.log(`   ✅ ${operation.type} applied`);

      // Small delay between operations
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return clipId;
}

async function processAudioClip(audioClip, frameRate) {
  console.log(`\n🔊 Processing Audio: ${audioClip.id} - ${audioClip.description}`);

  const timelineStartSeconds = timecodeToSeconds(audioClip.timelineStart, { frameRate });
  const sourceInSeconds = timecodeToSeconds(audioClip.sourceIn, { frameRate });
  const sourceOutSeconds = timecodeToSeconds(audioClip.sourceOut, { frameRate });

  console.log(`   Timeline: ${audioClip.timelineStart} (${timelineStartSeconds}s)`);
  const duration = sourceOutSeconds - sourceInSeconds;
  console.log(`   Duration: ${duration}s`);

  // Add to timeline
  const addRequest = {
    operation: 'add_to_timeline',
    sequenceName: 'SEQUENCE_NAME_PLACEHOLDER',
    projectItemId: audioClip.clipName,
    trackIndex: audioClip.track,
    time: timelineStartSeconds,
    sourceIn: sourceInSeconds,
    sourceOut: sourceOutSeconds,
    timestamp: Date.now()
  };

  fs.writeFileSync(REQUEST_FILE, JSON.stringify(addRequest, null, 2));
  console.log(`   → add_to_timeline: ${audioClip.clipName}`);

  const addResponse = await waitForResponse(TIMEOUT_MS);

  if (!addResponse.success) {
    throw new Error(`Failed to add audio: ${addResponse.error}`);
  }

  const clipId = addResponse.clipId || addResponse.clip?.nodeId;
  console.log(`   ✅ Added (clipId: ${clipId})`);

  // Execute operations
  if (audioClip.operations && audioClip.operations.length > 0) {
    console.log(`   Applying ${audioClip.operations.length} operation(s):`);

    for (const operation of audioClip.operations) {
      await executeMCPOperation(operation, clipId);
      console.log(`   ✅ ${operation.type} applied`);

      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return clipId;
}

async function main() {
  console.log('=================================================');
  console.log('Cut Sheet Processor - Timecode-Based Assembly');
  console.log('=================================================\n');

  // Get cut sheet file from command line
  const cutSheetFile = process.argv[2] || 'cutsheet-yeti-logo-timecode.json';

  if (!fs.existsSync(cutSheetFile)) {
    console.error(`❌ Cut sheet file not found: ${cutSheetFile}`);
    console.error('\nUsage: node process-cutsheet.cjs <cutsheet.json>');
    console.error('Example: node process-cutsheet.cjs cutsheet-yeti-logo-timecode.json');
    process.exit(1);
  }

  console.log(`📄 Loading cut sheet: ${cutSheetFile}`);

  let cutSheet;
  try {
    const cutSheetData = fs.readFileSync(cutSheetFile, 'utf-8');
    cutSheet = JSON.parse(cutSheetData);
  } catch (error) {
    console.error(`❌ Failed to parse cut sheet: ${error.message}`);
    process.exit(1);
  }

  console.log(`✅ Cut sheet loaded: ${cutSheet.project}`);
  console.log(`   Sequence: ${cutSheet.sequence.name} (${cutSheet.sequence.resolution} @ ${cutSheet.sequence.frameRate}fps)`);
  console.log(`   Duration: ${cutSheet.sequence.duration}`);
  console.log(`   Shots: ${cutSheet.shots.length}`);
  console.log(`   Audio: ${cutSheet.audio.length}`);

  // Check bridge
  if (!fs.existsSync(BRIDGE_DIR)) {
    console.error(`\n❌ Bridge directory not found: ${BRIDGE_DIR}`);
    console.error('   Ensure Premiere Pro is running with CEP extension loaded.');
    process.exit(1);
  }

  console.log(`✅ Bridge directory exists\n`);

  const frameRate = cutSheet.sequence.frameRate;

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('PROCESSING VIDEO SHOTS');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    // Process shots
    for (let i = 0; i < cutSheet.shots.length; i++) {
      const shot = cutSheet.shots[i];

      console.log(`\n[${i + 1}/${cutSheet.shots.length}]`);
      await processShot(shot, frameRate);

      // Small delay between shots
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n✅ All video shots processed');

    // Process audio
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('PROCESSING AUDIO CLIPS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    for (let i = 0; i < cutSheet.audio.length; i++) {
      const audioClip = cutSheet.audio[i];

      console.log(`\n[${i + 1}/${cutSheet.audio.length}]`);
      await processAudioClip(audioClip, frameRate);

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log('\n✅ All audio clips processed');

    // Summary
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('ASSEMBLY COMPLETE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`✅ Successfully assembled cut sheet: ${cutSheet.project}`);
    console.log(`   ${cutSheet.shots.length} video shots`);
    console.log(`   ${cutSheet.audio.length} audio clips`);
    console.log(`   Total duration: ${cutSheet.sequence.duration}`);

    if (cutSheet.export) {
      console.log('\n💡 Next Step: Export');
      console.log(`   Format: ${cutSheet.export.format}`);
      console.log(`   Resolution: ${cutSheet.export.resolution}`);
      console.log(`   Output: ${cutSheet.export.outputPath}`);
      console.log('\n   To export, use:');
      console.log(`   node test-export-sequence.cjs`);
    }

    console.log('\n📊 Estimated Time Savings:');
    console.log(`   Manual assembly: ${cutSheet.metadata.manualAssemblyTime}`);
    console.log(`   Automated: ${cutSheet.metadata.estimatedAssemblyTime}`);
    console.log(`   Savings: ${cutSheet.metadata.timeSavings}`);

    console.log('\n🎬 Cut sheet automation complete!');

  } catch (error) {
    console.error(`\n❌ ERROR during processing: ${error.message}`);
    console.error('\nTroubleshooting:');
    console.error('1. Ensure Premiere Pro is running');
    console.error('2. Check CEP extension panel is visible (Window > Extensions > PremiereRemote)');
    console.error('3. Verify all clip names exist in project');
    console.error('4. Check bridge communication with: node test-bridge.cjs');
    process.exit(1);
  }
}

main();
