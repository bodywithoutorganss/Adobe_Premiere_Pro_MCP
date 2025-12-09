/**
 * Timecode Utility Functions
 *
 * Handles conversion between timecode strings (HH:MM:SS:FF or HH:MM:SS.mmm) and seconds.
 * Essential for cut sheet workflows where timing is specified in timecodes.
 *
 * Supported formats:
 * - "00:15:23" (HH:MM:SS) - minutes and seconds
 * - "00:15:23.500" (HH:MM:SS.mmm) - with milliseconds
 * - "00:15:23:12" (HH:MM:SS:FF) - with frames (at specified framerate)
 * - "15:23" (MM:SS) - shorthand
 * - 923.5 (number) - already in seconds, pass through
 */

export interface TimecodeOptions {
  frameRate?: number;  // For frame-based timecodes (23.976, 24, 29.97, 30, etc.)
}

/**
 * Convert timecode string to seconds
 *
 * @param timecode - Timecode string or number (seconds)
 * @param options - Conversion options (framerate, etc.)
 * @returns Time in seconds
 *
 * @example
 * timecodeToSeconds("00:15:23") // 923
 * timecodeToSeconds("00:15:23.500") // 923.5
 * timecodeToSeconds("00:15:23:12", { frameRate: 24 }) // 923.5
 * timecodeToSeconds("15:23") // 923
 * timecodeToSeconds(923.5) // 923.5 (pass through)
 */
export function timecodeToSeconds(
  timecode: string | number,
  options: TimecodeOptions = {}
): number {
  // If already a number, pass through
  if (typeof timecode === 'number') {
    return timecode;
  }

  // Remove any whitespace
  const tc = timecode.trim();

  // Split by colons
  const parts = tc.split(':');

  if (parts.length < 2 || parts.length > 4) {
    throw new Error(`Invalid timecode format: ${timecode}. Expected HH:MM:SS, HH:MM:SS.mmm, HH:MM:SS:FF, or MM:SS`);
  }

  let hours = 0;
  let minutes = 0;
  let seconds = 0;
  let frames = 0;

  if (parts.length === 2) {
    // MM:SS format
    minutes = parseInt(parts[0]!, 10);

    // Check if seconds has decimal or frames
    if (parts[1]!.includes('.')) {
      seconds = parseFloat(parts[1]!);
    } else {
      seconds = parseInt(parts[1]!, 10);
    }
  } else if (parts.length === 3) {
    // HH:MM:SS or HH:MM:SS.mmm format
    hours = parseInt(parts[0]!, 10);
    minutes = parseInt(parts[1]!, 10);

    // Check if seconds has decimal
    if (parts[2]!.includes('.')) {
      seconds = parseFloat(parts[2]!);
    } else {
      seconds = parseInt(parts[2]!, 10);
    }
  } else if (parts.length === 4) {
    // HH:MM:SS:FF format (with frames)
    hours = parseInt(parts[0]!, 10);
    minutes = parseInt(parts[1]!, 10);
    seconds = parseInt(parts[2]!, 10);
    frames = parseInt(parts[3]!, 10);

    if (!options.frameRate) {
      throw new Error('frameRate required for frame-based timecodes (HH:MM:SS:FF)');
    }

    // Convert frames to seconds
    const frameSeconds = frames / options.frameRate;
    seconds += frameSeconds;
  }

  // Validate ranges
  if (minutes < 0 || minutes > 59) {
    throw new Error(`Invalid minutes: ${minutes}. Must be 0-59`);
  }
  if (seconds < 0 || seconds >= 60) {
    throw new Error(`Invalid seconds: ${seconds}. Must be 0-59.999`);
  }
  if (frames < 0 || (options.frameRate && frames >= options.frameRate)) {
    throw new Error(`Invalid frames: ${frames}. Must be 0-${(options.frameRate || 0) - 1}`);
  }

  // Calculate total seconds
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Convert seconds to timecode string
 *
 * @param seconds - Time in seconds
 * @param options - Conversion options (framerate for frame display)
 * @returns Timecode string in HH:MM:SS.mmm or HH:MM:SS:FF format
 *
 * @example
 * secondsToTimecode(923) // "00:15:23.000"
 * secondsToTimecode(923.5) // "00:15:23.500"
 * secondsToTimecode(923.5, { frameRate: 24 }) // "00:15:23:12"
 */
export function secondsToTimecode(
  seconds: number,
  options: TimecodeOptions = {}
): string {
  if (seconds < 0) {
    throw new Error('Negative time values not supported');
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  let secs = seconds % 60;

  if (options.frameRate) {
    // Frame-based timecode (HH:MM:SS:FF)
    const wholeSeconds = Math.floor(secs);
    const fractionalSeconds = secs - wholeSeconds;
    const frames = Math.floor(fractionalSeconds * options.frameRate);

    return `${pad(hours)}:${pad(minutes)}:${pad(wholeSeconds)}:${pad(frames)}`;
  } else {
    // Decimal timecode (HH:MM:SS.mmm)
    const wholeSeconds = Math.floor(secs);
    const milliseconds = Math.round((secs - wholeSeconds) * 1000);

    return `${pad(hours)}:${pad(minutes)}:${pad(wholeSeconds)}.${pad(milliseconds, 3)}`;
  }
}

/**
 * Pad number with leading zeros
 */
function pad(num: number, length: number = 2): string {
  return num.toString().padStart(length, '0');
}

/**
 * Parse a cut sheet time specification
 * Accepts either timecode string or seconds number
 *
 * @param time - Time as timecode string or seconds
 * @param frameRate - Frame rate for frame-based timecodes
 * @returns Time in seconds
 *
 * @example
 * parseTime("00:15:23") // 923
 * parseTime(923.5) // 923.5
 * parseTime("00:15:23:12", 24) // 923.5
 */
export function parseTime(time: string | number, frameRate?: number): number {
  return timecodeToSeconds(time, frameRate !== undefined ? { frameRate } : {});
}

/**
 * Calculate duration from in/out timecodes
 *
 * @param inTime - Start time (timecode or seconds)
 * @param outTime - End time (timecode or seconds)
 * @param frameRate - Frame rate for frame-based timecodes
 * @returns Duration in seconds
 *
 * @example
 * calculateDuration("00:15:00", "00:15:11") // 11
 * calculateDuration(900, 911) // 11
 */
export function calculateDuration(
  inTime: string | number,
  outTime: string | number,
  frameRate?: number
): number {
  const inSeconds = parseTime(inTime, frameRate);
  const outSeconds = parseTime(outTime, frameRate);

  if (outSeconds < inSeconds) {
    throw new Error(`Out time (${outTime}) is before in time (${inTime})`);
  }

  return outSeconds - inSeconds;
}

/**
 * Validate timecode format
 *
 * @param timecode - Timecode string to validate
 * @returns True if valid format
 */
export function isValidTimecode(timecode: string): boolean {
  if (typeof timecode !== 'string') {
    return false;
  }

  // Check format with regex
  const patterns = [
    /^\d{1,2}:\d{2}$/,                          // MM:SS
    /^\d{2}:\d{2}:\d{2}$/,                      // HH:MM:SS
    /^\d{2}:\d{2}:\d{2}\.\d{1,3}$/,            // HH:MM:SS.mmm
    /^\d{2}:\d{2}:\d{2}:\d{2}$/,               // HH:MM:SS:FF
  ];

  return patterns.some(pattern => pattern.test(timecode.trim()));
}

/**
 * Common frame rates for reference
 */
export const FRAME_RATES = {
  FILM: 24,
  FILM_DIGITAL: 23.976,
  PAL: 25,
  NTSC: 29.97,
  NTSC_WHOLE: 30,
  WEB: 30,
  HIGH_FRAME_RATE_60: 60,
  HIGH_FRAME_RATE_59_94: 59.94,
} as const;

/**
 * Example usage for cut sheets:
 *
 * const cutSheet = {
 *   shots: [
 *     {
 *       clipName: "interview_ben",
 *       sourceIn: "00:15:00",      // Uses timecode
 *       sourceOut: "00:15:11",     // Uses timecode
 *       timelineStart: "00:00:04", // Uses timecode
 *     },
 *     {
 *       clipName: "broll_cattle",
 *       sourceIn: 0,               // Can mix with seconds
 *       sourceOut: 2.5,
 *       timelineStart: 15,
 *     }
 *   ]
 * };
 *
 * // Convert to seconds for MCP operations:
 * const shot = cutSheet.shots[0];
 * const sourceInSeconds = parseTime(shot.sourceIn);
 * const sourceOutSeconds = parseTime(shot.sourceOut);
 * const duration = calculateDuration(shot.sourceIn, shot.sourceOut);
 */
