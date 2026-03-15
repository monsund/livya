import RunwayML from '@runwayml/sdk';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createRequire } from 'module';
import os from 'os';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const ffprobeInstaller = require('@ffprobe-installer/ffprobe');
ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobeInstaller.path);

const runway = new RunwayML({ apiKey: process.env.RUNWAYML_API_SECRET });

const s3 = new S3Client({ region: process.env.AWS_REGION });
const S3_BUCKET = process.env.S3_BUCKET_NAME;
const S3_BASE_URL = process.env.S3_BASE_URL || `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`;

/**
 * Download a Runway video + receive an audio buffer,
 * mux them together with ffmpeg (-c:v copy, -c:a aac, -shortest),
 * upload the merged MP4 to S3 and return the permanent URL.
 */
export async function mergeVideoWithAudio(runwayVideoUrl, audioBuffer, sceneId) {
  const tmpDir = os.tmpdir();
  const ts = Date.now();
  const videoFile  = path.join(tmpDir, `video-${sceneId}-${ts}.mp4`);
  const audioFile  = path.join(tmpDir, `audio-${sceneId}-${ts}.mp3`);
  const outputFile = path.join(tmpDir, `merged-${sceneId}-${ts}.mp4`);

  console.log(`[Merge] Downloading Runway video for scene ${sceneId}...`);
  const res = await fetch(runwayVideoUrl);
  if (!res.ok) throw new Error(`Failed to download Runway video: ${res.status}`);
  fs.writeFileSync(videoFile, Buffer.from(await res.arrayBuffer()));
  fs.writeFileSync(audioFile, audioBuffer);

  // Detect video duration using ffprobe
  const videoDuration = await new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoFile, (err, metadata) => {
        if (err) return reject(err);
        resolve(metadata.format.duration);
    });
  });

  // round to avoid floating precision issues
  const safeDuration = Math.ceil(videoDuration * 100) / 100;

  console.log(`[Merge] Detected video duration: ${safeDuration}s`);

  console.log(`[Merge] Muxing video + audio for scene ${sceneId}...`);
  await new Promise((resolve, reject) => {
    ffmpeg()
      .input(videoFile)
      .input(audioFile)
      .outputOptions([
        '-map 0:v:0',          // explicitly pick video stream from input 0
        '-map 1:a:0',          // explicitly pick audio stream from input 1
        '-c:v copy',           // copy video — no re-encode
        '-c:a aac',            // encode mp3 → aac (mp4-compatible)
        '-b:a 128k',
        '-af apad',
        `-t ${safeDuration}`,
        '-movflags +faststart',
      ])
      .on('start', cmd => console.log('[Merge] ffmpeg cmd:', cmd))
      .on('stderr', line => console.log('[Merge] ffmpeg:', line))
      .on('end', () => { console.log('[Merge] ffmpeg mux complete'); resolve(); })
      .on('error', (err) => { console.error('[Merge] ffmpeg error:', err.message); reject(err); })
      .save(outputFile);
  });

  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hh = String(hours % 12 || 12).padStart(2, '0');
  const timestamp = `${dd}-${mm}-${yyyy}-${hh}-${minutes}${ampm}`;
  const s3Key = `videos/scene-${sceneId}-${timestamp}.mp4`;

  const buffer = fs.readFileSync(outputFile);
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    Body: buffer,
    ContentType: 'video/mp4',
  }));

  [videoFile, audioFile, outputFile].forEach(f => { try { fs.unlinkSync(f); } catch (_) {} });

  const s3Url = `${S3_BASE_URL}/${s3Key}`;
  console.log(`[Merge] ✅ Scene ${sceneId} merged video uploaded: ${s3Url}`);
  return s3Url;
}

/**
 * Download a video from a temporary URL and upload it to S3.
 * Returns the permanent S3 URL.
 */
export async function uploadVideoToS3(runwayVideoUrl, sceneId) {
  const response = await fetch(runwayVideoUrl);
  if (!response.ok) throw new Error(`Failed to download video from Runway: ${response.status}`);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hh = String(hours % 12 || 12).padStart(2, '0');
  const timestamp = `${dd}-${mm}-${yyyy}-${hh}-${minutes}${ampm}`;
  const s3Key = `videos/scene-${sceneId}-${timestamp}.mp4`;
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    Body: buffer,
    ContentType: 'video/mp4',
  }));
  const s3Url = `${S3_BASE_URL}/${s3Key}`;
  console.log(`[Runway] Uploaded video for scene ${sceneId} to S3: ${s3Url}`);
  return s3Url;
}

/**
 * Download multiple videos, stitch them in order with ffmpeg, upload result to S3.
 * videoEntries: [{ scene_id, videoUrl }] — already sorted, missing scenes excluded by caller.
 */
export async function stitchVideosToS3(videoEntries) {
  const tmpDir = os.tmpdir();
  const normalizedFiles = [];
  videoEntries.sort((a, b) => a.scene_id - b.scene_id);
  // 🔹 Download while preserving order
  const inputFiles = await Promise.all(
    videoEntries.map(async (entry) => {
        const tmpFile = path.join(
        tmpDir,
        `scene-${entry.scene_id}-${Date.now()}.mp4`
        );

        const res = await fetch(entry.videoUrl);
        if (!res.ok)
        throw new Error(`Failed to download scene ${entry.scene_id}`);

        const buf = Buffer.from(await res.arrayBuffer());
        fs.writeFileSync(tmpFile, buf);

        return tmpFile;   // ✅ return instead of push
    })
 );

  // 2️⃣ Normalize each clip
  for (let i = 0; i < inputFiles.length; i++) {
    const normalized = path.join(tmpDir, `norm-${i}-${Date.now()}.mp4`);

    await new Promise((resolve, reject) => {
      ffmpeg(inputFiles[i])
        .outputOptions([
          '-vf scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2',
          '-r 30',                // force constant FPS
          '-fflags +genpts',
          '-reset_timestamps 1',
          '-avoid_negative_ts make_zero',
          '-c:v libx264',
          '-preset fast',
          '-crf 23',
          '-pix_fmt yuv420p',
          '-movflags +faststart'
        ])
        .on('end', resolve)
        .on('error', reject)
        .save(normalized);
    });

    normalizedFiles.push(normalized);
  }

  // 3️⃣ Create concat file list
  const listFile = path.join(tmpDir, `filelist-${Date.now()}.txt`);
  const outputFile = path.join(tmpDir, `stitched-${Date.now()}.mp4`);

  const fileListContent = normalizedFiles
    .map(f => `file '${f}'`)
    .join('\n');

  fs.writeFileSync(listFile, fileListContent);

  // 4️⃣ Stitch
  await new Promise((resolve, reject) => {
    ffmpeg()
      .input(listFile)
      .inputOptions(['-f concat', '-safe 0'])
      .outputOptions([
        '-c copy'
      ])
      .on('start', cmd => console.log('[Stitch] ffmpeg:', cmd))
      .on('end', resolve)
      .on('error', reject)
      .save(outputFile);
  });

  // 5️⃣ Upload
  const buffer = fs.readFileSync(outputFile);
  const s3Key = `videos/stitched-${Date.now()}.mp4`;

  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET,
    Key: s3Key,
    Body: buffer,
    ContentType: 'video/mp4'
  }));

  // Cleanup
  [...inputFiles, ...normalizedFiles, listFile, outputFile].forEach(f => {
    try { fs.unlinkSync(f); } catch (_) {}
  });

  return `${S3_BASE_URL}/${s3Key}`;
}

/**
 * Start a Runway image-to-video task.
 * Returns the task ID immediately — does NOT wait for completion.
 */
export async function startVideoGeneration({ imageUrl, promptText, duration = 5 }) {
  const task = await runway.imageToVideo.create({
    model: 'gen4_turbo',
    promptImage: imageUrl,
    promptText,
    duration,
    ratio: '1280:720',
  });
  // Log full response so we can inspect the actual shape if id is missing
  console.log('[Runway] imageToVideo.create response:', JSON.stringify(task));
  const taskId = task?.id ?? task?.taskId ?? task?.task_id;
  if (!taskId) {
    throw new Error(`Runway did not return a task ID. Full response: ${JSON.stringify(task)}`);
  }
  return taskId;
}

/**
 * Poll a Runway task by ID.
 * Returns { status, videoUrl, error }
 * status: PENDING | RUNNING | SUCCEEDED | FAILED
 */
export async function getVideoTaskStatus(taskId) {
  const task = await runway.tasks.retrieve(taskId);
  const videoUrl =
    task.status === 'SUCCEEDED' && task.output?.[0] ? task.output[0] : null;
  return { status: task.status, videoUrl, error: task.failure || null };
}