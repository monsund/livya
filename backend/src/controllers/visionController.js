import { extractVisionElements } from "../extractElements.js";
import { generateScenes } from "../generateScenes.js";
import { generateImagesForScenes } from "../generateImagesFromScenes.js";
import { startVideoGeneration, getVideoTaskStatus, uploadVideoToS3, stitchVideosToS3 } from "../services/runwayService.js";
import { imageQueue, imageQueueEvents } from "../queues/imageQueue.js";
import { openai } from "../openai.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const S3_BUCKET = process.env.S3_BUCKET_NAME;
const S3_BASE_URL = process.env.S3_BASE_URL || `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`;

export const processVision = async (req, res) => {
  const t0 = Date.now();
  console.log('[Vision] POST /vision — blocking mode started');
  try {
    const { vision } = req.body;
    const image = req.file;

    // Must have either vision text or image
    if (!vision && !image) {
      console.warn('[Vision] Rejected: no vision text or image provided');
      return res.status(400).json({ 
        error: "Either vision text or image is required" 
      });
    }

    console.log(`[Vision] Input: ${vision ? `text (${vision.length} chars)` : 'image upload'} (${image ? `${(image.size / 1024).toFixed(1)} KB` : 'no file'})`);

    // Convert image to base64 if provided
    let imageBase64 = null;
    if (image) {
      imageBase64 = image.buffer.toString('base64');
    }

    console.log('[Vision] Step 1/3 — Extracting elements...');
    const elements = await extractVisionElements(vision || "", imageBase64);
    console.log(`[Vision] Elements extracted: ${Object.keys(elements).join(', ')}`);

    console.log('[Vision] Step 2/3 — Generating scenes...');
    const scenes = await generateScenes(elements);
    console.log(`[Vision] ${scenes.length} scenes generated`);

    console.log('[Vision] Step 3/3 — Generating images...');
    const images = await generateImagesForScenes(scenes);
    const ok = images.filter(i => !i.error).length;
    console.log(`[Vision] Images done: ${ok}/${images.length} succeeded | total ${Date.now() - t0}ms`);

    res.json({ elements, scenes, images });
  } catch (error) {
    console.error(`[Vision] Fatal error after ${Date.now() - t0}ms:`, error);
    res.status(500).json({ error: "Failed to process vision" });
  }
};

export const processVisionStream = async (req, res) => {
  const t0 = Date.now();
  console.log('[Stream] POST /vision-stream — SSE stream started');

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (type, data) => {
    res.write(`data: ${JSON.stringify({ type, data })}\n\n`);
  };

  try {
    const { vision } = req.body;
    const image = req.file;

    if (!vision && !image) {
      console.warn('[Stream] Rejected: no vision text or image provided');
      send('error', { message: 'Either vision text or image is required' });
      return res.end();
    }

    console.log(`[Stream] Input: ${vision ? `text (${vision.length} chars)` : 'image upload'} (${image ? `${(image.size / 1024).toFixed(1)} KB` : 'no file'})`);

    let imageBase64 = null;
    if (image) {
      imageBase64 = image.buffer.toString('base64');
    }

    // Step 1: Extract elements
    console.log('[Stream] Step 1/3 — Extracting elements...');
    const elements = await extractVisionElements(vision || '', imageBase64);
    console.log(`[Stream] Elements extracted: ${Object.keys(elements).join(', ')} (+${Date.now() - t0}ms)`);

    // Step 2: Generate scenes
    console.log('[Stream] Step 2/3 — Generating scenes...');
    const scenes = await generateScenes(elements);
    console.log(`[Stream] ${scenes.length} scenes generated (+${Date.now() - t0}ms) — sending to client now`);

    // Send elements + all scenes immediately — UI renders at this point
    send('elements', elements);
    send('scenes', scenes);

    // Step 3: Queue image generation for every scene (concurrency=3 in worker)
    console.log(`[Stream] Step 3/3 — Queuing ${scenes.length} image jobs...`);
    const jobs = await Promise.all(
      scenes.map(scene => imageQueue.add('generate-image', { scene }))
    );
    console.log(`[Stream] ${jobs.length} jobs queued (ids: ${jobs.map(j => j.id).join(', ')})`);

    // Stream each image result back as it finishes
    let imagesDone = 0;
    await Promise.all(
      jobs.map(job =>
        job.waitUntilFinished(imageQueueEvents)
          .then(result => {
            imagesDone++;
            console.log(`[Stream] Image ${imagesDone}/${jobs.length} ready — scene ${result.scene_id} (+${Date.now() - t0}ms)`);
            send('image', result);
          })
          .catch(err => {
            const sceneId = job.data?.scene?.scene_id;
            console.error(`[Stream] ❌ Image failed for scene ${sceneId}: ${err.message}`);
            send('image-error', { scene_id: sceneId, error: err.message });
          })
      )
    );

    console.log(`[Stream] ✅ All done — ${scenes.length} scenes, ${imagesDone} images in ${Date.now() - t0}ms`);
    send('done', {});
    res.end();
  } catch (error) {
    console.error(`[Stream] ❌ Fatal error after ${Date.now() - t0}ms:`, error);
    send('error', { message: error.message || 'Failed to process vision' });
    res.end();
  }
};

export const regenerateImage = async (req, res) => {
  const t0 = Date.now();
  try {
    const { scene } = req.body;
    if (!scene || !scene.scene_id) {
      console.warn('[RegenerateImage] Rejected: missing or invalid scene object');
      return res.status(400).json({ error: "A valid scene object is required" });
    }
    console.log(`[RegenerateImage] Regenerating image for scene ${scene.scene_id}...`);
    const results = await generateImagesForScenes([scene]);
    const result = results[0];
    if (!result || result.error) {
      console.error(`[RegenerateImage] ❌ Failed for scene ${scene.scene_id}: ${result?.error}`);
      return res.status(500).json({ error: result?.error || "Image generation failed" });
    }
    console.log(`[RegenerateImage] ✅ Scene ${result.scene_id} done in ${Date.now() - t0}ms: ${result.image_path}`);
    res.json({ scene_id: result.scene_id, image_path: result.image_path });
  } catch (error) {
    console.error(`[RegenerateImage] ❌ Error after ${Date.now() - t0}ms:`, error);
    res.status(500).json({ error: "Failed to regenerate image" });
  }
};

export const regenerateScenes = async (req, res) => {
  const t0 = Date.now();
  console.log('[RegenerateScenes] Regenerating all scenes...');
  try {
    const { elements } = req.body;
    if (!elements || typeof elements !== 'object') {
      console.warn('[RegenerateScenes] Rejected: invalid elements payload');
      return res.status(400).json({ error: "Valid elements object is required" });
    }
    console.log(`[RegenerateScenes] Elements theme: "${elements.theme || '(none)'}"`);
    const scenes = await generateScenes(elements);
    console.log(`[RegenerateScenes] ${scenes.length} scenes generated (+${Date.now() - t0}ms) — generating images...`);
    const images = await generateImagesForScenes(scenes);
    const ok = images.filter(i => !i.error).length;
    console.log(`[RegenerateScenes] ✅ Done — ${ok}/${images.length} images in ${Date.now() - t0}ms`);
    res.json({ scenes, images });
  } catch (error) {
    console.error(`[RegenerateScenes] ❌ Error after ${Date.now() - t0}ms:`, error);
    res.status(500).json({ error: "Failed to regenerate scenes" });
  }
};

export const generateVideo = async (req, res) => {
  try {
    const { imageUrl, scene } = req.body;
    if (!imageUrl || !scene) {
      console.warn('[GenerateVideo] Rejected: missing imageUrl or scene');
      return res.status(400).json({ error: "imageUrl and scene are required" });
    }
    console.log(`[GenerateVideo] Starting video for scene ${scene.scene_id}...`);
    // Build a motion-focused prompt — Runway responds best to natural descriptions
    // of what moves, how it moves, and camera direction, not label/metadata format.
    const parts = [
      scene.visual,
      scene.actions && `${scene.actions}`,
      scene.camera && `${scene.camera}`,
      scene.mood && `${scene.mood} atmosphere`,
    ].filter(Boolean);
    // Keep under 512 chars (Runway limit) — truncate visual if needed
    const promptText = parts.join(', ').slice(0, 512);
    console.log(`[GenerateVideo] Prompt (${promptText.length} chars): ${promptText.slice(0, 120)}${promptText.length > 120 ? '...' : ''}`);
    const taskId = await startVideoGeneration({ imageUrl, promptText, duration: 5 });
    console.log(`[GenerateVideo] ✅ Task created: ${taskId} for scene ${scene.scene_id}`);
    res.json({ taskId });
  } catch (error) {
    console.error('[GenerateVideo] ❌ Error:', error);
    res.status(500).json({ error: error.message || 'Failed to start video generation' });
  }
};

export const getVideoStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { sceneId } = req.query;
    if (!taskId) {
      console.warn('[VideoStatus] Rejected: taskId missing');
      return res.status(400).json({ error: 'taskId is required' });
    }
    console.log(`[VideoStatus] Polling task ${taskId} (scene ${sceneId || 'unknown'})...`);
    const result = await getVideoTaskStatus(taskId);
    console.log(`[VideoStatus] Task ${taskId} → status: ${result.status}`);
    // When succeeded, upload the Runway temp video to S3 for permanent storage
    if (result.status === 'SUCCEEDED' && result.videoUrl) {
      console.log(`[VideoStatus] Uploading completed video to S3 for scene ${sceneId || taskId}...`);
      try {
        const s3Url = await uploadVideoToS3(result.videoUrl, sceneId || taskId);
        console.log(`[VideoStatus] ✅ S3 upload done: ${s3Url}`);
        result.videoUrl = s3Url;
      } catch (uploadErr) {
        console.error('[VideoStatus] ⚠️ S3 upload failed, falling back to Runway URL:', uploadErr.message);
        // Non-fatal: still return the temporary Runway URL
      }
    }
    res.json(result);
  } catch (error) {
    console.error('[VideoStatus] ❌ Error:', error);
    res.status(500).json({ error: error.message || 'Failed to get video status' });
  }
};

export const stitchVideos = async (req, res) => {
  const t0 = Date.now();
  try {
    const { videos } = req.body; // [{ scene_id, videoUrl }] sorted by scene_id
    if (!Array.isArray(videos) || videos.length < 2) {
      console.warn(`[Stitch] Rejected: received ${videos?.length ?? 0} video(s), need at least 2`);
      return res.status(400).json({ error: 'At least 2 video entries are required to stitch' });
    }
    // Sort by scene_id and filter out any missing URLs
    const sorted = videos
      .filter(v => v.videoUrl)
      .sort((a, b) => a.scene_id - b.scene_id);
    if (sorted.length < 2) {
      console.warn(`[Stitch] Rejected: only ${sorted.length} video(s) had valid URLs`);
      return res.status(400).json({ error: 'At least 2 videos with valid URLs are required' });
    }
    console.log(`[Stitch] Starting stitch of ${sorted.length} scenes: [${sorted.map(v => v.scene_id).join(', ')}]`);
    const stitchedUrl = await stitchVideosToS3(sorted);
    console.log(`[Stitch] ✅ Done in ${Date.now() - t0}ms: ${stitchedUrl}`);
    res.json({ stitchedUrl, sceneCount: sorted.length });
  } catch (error) {
    console.error(`[Stitch] ❌ Error after ${Date.now() - t0}ms:`, error);
    res.status(500).json({ error: error.message || 'Failed to stitch videos' });
  }
};

export const generateVoiceover = async (req, res) => {
  const t0 = Date.now();
  try {
    const { scene_id, text } = req.body;
    if (!scene_id || !text) {
      console.warn('[Voiceover] Rejected: scene_id and text are required');
      return res.status(400).json({ error: 'scene_id and text are required' });
    }
    console.log(`[Voiceover] Generating TTS for scene ${scene_id} (${text.length} chars)...`);

    const mp3 = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text,
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    const key = `voiceovers/scene-${scene_id}-${Date.now()}.mp3`;

    await s3.send(new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'audio/mpeg',
    }));

    const audioUrl = `${S3_BASE_URL}/${key}`;
    console.log(`[Voiceover] ✅ Scene ${scene_id} done in ${Date.now() - t0}ms: ${audioUrl}`);
    res.json({ scene_id, audio_url: audioUrl });
  } catch (error) {
    console.error(`[Voiceover] ❌ Error after ${Date.now() - t0}ms:`, error);
    res.status(500).json({ error: error.message || 'Failed to generate voiceover' });
  }
};
