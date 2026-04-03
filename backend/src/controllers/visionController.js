import { extractVisionElements } from "../extractElements.js";
import { generateScenes } from "../generateScenes.js";
import { generateImagesForScenes } from "../generateImagesFromScenes.js";
import { startVideoGeneration, getVideoTaskStatus, uploadVideoToS3, stitchVideosToS3, mergeVideoWithAudio } from "../services/runwayService.js";
import { imageQueue, imageQueueEvents } from "../queues/imageQueue.js";
import { openai } from "../openai.js";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import Project from "../models/Project.js";
import Image from "../models/Images.js";
import SceneVideo from "../models/SceneVideo.js";
import FinalVideo from "../models/FinalVideo.js";
import Scene from "../models/Scene.js";

const s3 = new S3Client({ region: process.env.AWS_REGION });
const S3_BUCKET = process.env.S3_BUCKET_NAME;
const S3_BASE_URL = process.env.S3_BASE_URL || `https://${S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com`;

// Stores { scene } keyed by Runway taskId so getVideoStatus can mux voiceover on completion
const taskSceneMap = new Map();

// Fetch all projects for the authenticated user
export const getUserProjects = async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

// Fetch all scenes for a given project
export const getScenesByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const scenes = await Scene.find({ projectId }).sort({ index: 1 });
    // Map fields for frontend compatibility
    const mappedScenes = scenes.map(scene => ({
      scene_id: scene._id,
      title: scene.title || `Scene ${scene.index}`,
      visual: scene.visual || "",
      environment: scene.environment || "",
      actions: scene.actions || "",
      mood: scene.mood || "",
      camera: scene.camera || "",
      voiceover: scene.voiceovers?.[0]?.script || "",
      imageUrl: scene.imageUrl || "",
      status: scene.status,
      index: scene.index,
      projectId: scene.projectId,
      createdAt: scene.createdAt,
      updatedAt: scene.updatedAt,
    }));
    res.json(mappedScenes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch scenes' });
  }
};

// Fetch all images for a given project
export const getImagesByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const imageDocs = await Image.find({ projectId });
    // Return flat structure: each scene_id mapped to its images array + default url
    const mapped = imageDocs.map(doc => {
      const defaultImg = doc.images.find(i => i.isDefault) || doc.images[doc.images.length - 1];
      return {
        scene_id: doc.sceneId,
        image_path: defaultImg?.url || null,
        images: doc.images,
        projectId: doc.projectId,
        _id: doc._id,
      };
    });
    res.json(mapped);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch images' });
  }
};

// Update a scene's editable fields
export const updateScene = async (req, res) => {
  try {
    const { sceneId } = req.params;
    const { title, visual, environment, actions, mood, camera, voiceover } = req.body;
    const $set = { title, visual, environment, actions, mood, camera };
    // Update voiceovers[0].script if a voiceover string was provided
    if (typeof voiceover === 'string') {
      $set['voiceovers.0.script'] = voiceover;
    }
    const updated = await Scene.findByIdAndUpdate(
      sceneId,
      { $set },
      { returnDocument: 'after' }
    );
    if (!updated) return res.status(404).json({ error: 'Scene not found' });
    res.json({ scene_id: updated._id, title: updated.title, visual: updated.visual, environment: updated.environment, actions: updated.actions, mood: updated.mood, camera: updated.camera, voiceover: updated.voiceovers?.[0]?.script || '' });
  } catch (err) {
    console.error('[UpdateScene] ❌ Error:', err);
    res.status(500).json({ error: 'Failed to update scene', details: err.message });
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

    const { vision, duration, protagonistBase64, protagonistGender } = req.body;
    const images = req.files;

    if (!vision && (!images || images.length === 0)) {
      console.warn('[Stream] Rejected: no vision text or images provided');
      send('error', { message: 'Either vision text or at least one image is required' });
      return res.end();
    }

    console.log(`[Stream] Input: ${vision ? `text (${vision.length} chars)` : 'image upload'} (${images && images.length ? `${images.length} images` : 'no file'})${duration ? ` | duration: ${duration}s` : ''}${protagonistBase64 ? ' | protagonist: yes' : ''}${protagonistGender ? ` | gender: ${protagonistGender}` : ''}`);

    // For now, just use the first image for element extraction (can be extended)
    let imageBase64 = null;
    if (images && images.length > 0) {
      imageBase64 = images[0].buffer.toString('base64');
    }

    // Step 1: Extract elements
    console.log('[Stream] Step 1/3 — Extracting elements...');
    const elements = await extractVisionElements(vision || '', imageBase64);
    console.log(`[Stream] Elements extracted: ${Object.keys(elements).join(', ')} (+${Date.now() - t0}ms)`);

    // Step 2: Generate scenes
    console.log('[Stream] Step 2/3 — Generating scenes...');
    const scenes = await generateScenes(elements, duration ? Number(duration) : null, protagonistGender || null);
    console.log(`[Stream] ${scenes.length} scenes generated (+${Date.now() - t0}ms) — sending to client now`);

    // Create Project in DB
    const userId = req.user?._id;
    const project = await Project.create({
      userId,
      title: vision?.slice(0, 60) || 'Untitled Vision',
      status: 'processing',
    });

    // Save scenes to DB — map all AI-generated fields to schema fields
    const sceneDocs = await Scene.insertMany(scenes.map((scene, idx) => ({
      projectId: project._id,
      index: idx + 1,
      title: scene.title || '',
      visual: scene.visual || '',
      environment: scene.environment || '',
      actions: scene.actions || '',
      mood: scene.mood || '',
      camera: scene.camera || '',
      imageUrl: null,
      voiceovers: scene.voiceovers?.length
        ? scene.voiceovers.map(v => ({ script: v.script || '', isDefault: true }))
        : (scene.voiceover ? [{ script: scene.voiceover, isDefault: true }] : []),
      status: 'pending',
    })));

    // Send elements + all scenes immediately — UI renders at this point
    send('elements', elements);
    send('scenes', scenes);

    // Step 3: Queue image generation for every scene (concurrency=3 in worker)
    console.log(`[Stream] Step 3/3 — Queuing ${scenes.length} image jobs...`);
    const jobs = await Promise.all(
      scenes.map(scene => imageQueue.add('generate-image', { scene, protagonistBase64: protagonistBase64 || null, protagonistGender: protagonistGender || null }))
    );
    console.log(`[Stream] ${jobs.length} jobs queued (ids: ${jobs.map(j => j.id).join(', ')})`);

    // Stream each image result back as it finishes
    let imagesDone = 0;
    await Promise.all(
      jobs.map(job =>
        job.waitUntilFinished(imageQueueEvents)
          .then(async result => {
            imagesDone++;
            console.log(`[Stream] Image ${imagesDone}/${jobs.length} ready — scene ${result.scene_id} (+${Date.now() - t0}ms)`);
            // Save image to DB — upsert Image doc for scene, push new image item
            const sceneDocId = sceneDocs[result.scene_id - 1]?._id;
            await Image.findOneAndUpdate(
              { projectId: project._id, sceneId: sceneDocId },
              {
                $set: { 'images.$[].isDefault': false },
              },
              { new: false }
            );
            await Image.findOneAndUpdate(
              { projectId: project._id, sceneId: sceneDocId },
              {
                $push: { images: { url: result.image_path, status: 'completed', isDefault: true } },
                $setOnInsert: { projectId: project._id, sceneId: sceneDocId },
              },
              { upsert: true, returnDocument: 'after' }
            );
            // Update Scene with imageUrl and status
            await Scene.updateOne(
              { projectId: project._id, index: result.scene_id },
              { imageUrl: result.image_path, status: 'completed' }
            );
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
    // Mark project as completed
    await Project.findByIdAndUpdate(project._id, { status: 'completed' });
    send('done', { projectId: project._id });
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
    const { scene, protagonistBase64, protagonistGender } = req.body;
    if (!scene || !scene.scene_id) {
      console.warn('[RegenerateImage] Rejected: missing or invalid scene object');
      return res.status(400).json({ error: "A valid scene object is required" });
    }
    console.log(`[RegenerateImage] Regenerating image for scene ${scene.scene_id}${protagonistBase64 ? ' [with protagonist]' : ''}${protagonistGender ? ` [${protagonistGender}]` : ''}...`);
    const results = await generateImagesForScenes([scene], protagonistBase64 || null, protagonistGender || null);
    const result = results[0];
    if (!result || result.error) {
      console.error(`[RegenerateImage] ❌ Failed for scene ${scene.scene_id}: ${result?.error}`);
      return res.status(500).json({ error: result?.error || "Image generation failed" });
    }
    // scene.scene_id is the MongoDB _id (string) when coming from the REST endpoint
    await Scene.findByIdAndUpdate(scene.scene_id, { imageUrl: result.image_path, status: 'completed' });
    // Unset all previous isDefault, then push new image as default
    await Image.findOneAndUpdate(
      { sceneId: scene.scene_id },
      { $set: { 'images.$[].isDefault': false } }
    );
    await Image.findOneAndUpdate(
      { sceneId: scene.scene_id },
      {
        $push: { images: { url: result.image_path, status: 'completed', isDefault: true } },
        $setOnInsert: { projectId: scene.projectId, sceneId: scene.scene_id },
      },
      { upsert: true, returnDocument: 'after' }
    );
    console.log(`[RegenerateImage] ✅ Scene ${result.scene_id} done in ${Date.now() - t0}ms: ${result.image_path}`);
    res.json({ scene_id: result.scene_id, image_path: result.image_path });
  } catch (error) {
    console.error(`[RegenerateImage] ❌ Error after ${Date.now() - t0}ms:`, error);
    res.status(500).json({ error: "Failed to regenerate image" });
  }
};

// Set the isDefault image for a scene (user selecting a previous image)
export const selectImage = async (req, res) => {
  try {
    const { sceneId } = req.params;
    const { imageId } = req.body;
    if (!imageId) return res.status(400).json({ error: 'imageId is required' });
    // Unset all, then set the chosen one as default
    await Image.findOneAndUpdate(
      { sceneId },
      { $set: { 'images.$[].isDefault': false } }
    );
    await Image.findOneAndUpdate(
      { sceneId, 'images._id': imageId },
      { $set: { 'images.$.isDefault': true } }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('[SelectImage] error:', err);
    res.status(500).json({ error: 'Failed to select image' });
  }
};

export const regenerateScenes = async (req, res) => {
  const t0 = Date.now();
  console.log('[RegenerateScenes] Regenerating all scenes...');
  try {
    const { elements, duration, protagonistGender } = req.body;
    if (!elements || typeof elements !== 'object') {
      console.warn('[RegenerateScenes] Rejected: invalid elements payload');
      return res.status(400).json({ error: "Valid elements object is required" });
    }
    console.log(`[RegenerateScenes] Elements theme: "${elements.theme || '(none)'}"${duration ? ` | duration: ${duration}s` : ''}${protagonistGender ? ` | gender: ${protagonistGender}` : ''}`);
    const scenes = await generateScenes(elements, duration ? Number(duration) : null, protagonistGender || null);
    console.log(`[RegenerateScenes] ${scenes.length} scenes generated (+${Date.now() - t0}ms) — generating images...`);
    const images = await generateImagesForScenes(scenes, null, protagonistGender || null);
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
    // Save SceneVideo as processing — url is empty until completed
    // Auto-increment version and unset isLatest on previous docs for this scene
    const { projectId, scene_id } = scene;
    const existingLatest = await SceneVideo.findOne({ sceneId: scene_id, projectId }).sort({ version: -1 });
    const nextVersion = existingLatest ? existingLatest.version + 1 : 1;
    if (existingLatest) {
      await SceneVideo.updateMany({ sceneId: scene_id, projectId }, { isLatest: false });
    }
    const videoDoc = await SceneVideo.create({ projectId, sceneId: scene_id, url: '', status: 'processing', version: nextVersion, isLatest: true });
    // Store scene so getVideoStatus can mux voiceover when the task completes
    if (scene.voiceover) {
      taskSceneMap.set(taskId, scene);
      console.log(`[GenerateVideo] Voiceover stored for task ${taskId} (will be muxed on completion)`);
    }
    console.log(`[GenerateVideo] ✅ Task created: ${taskId} for scene ${scene.scene_id}`);
    res.json({ taskId, videoId: videoDoc._id });
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
    // When succeeded, mux voiceover into video (if available) then upload to S3
    if (result.status === 'SUCCEEDED' && result.videoUrl) {
      const scene = taskSceneMap.get(taskId);
      console.log(`[VideoStatus] taskSceneMap lookup for ${taskId}: ${scene ? `scene ${scene.scene_id} WITH voiceover=${!!scene.voiceover}` : 'NOT FOUND (no voiceover mux)'}`);
      try {
        if (scene?.voiceover) {
          console.log(`[VideoStatus] Generating TTS for scene ${sceneId || taskId} (${scene.voiceover.length} chars)...`);
          const mp3 = await openai.audio.speech.create({
            model: 'tts-1',
            voice: 'alloy',
            input: scene.voiceover,
          });
          const audioBuffer = Buffer.from(await mp3.arrayBuffer());
          console.log(`[VideoStatus] TTS done (${audioBuffer.length} bytes) — merging with video...`);
          const s3Url = await mergeVideoWithAudio(result.videoUrl, audioBuffer, sceneId || taskId);
          console.log(`[VideoStatus] ✅ Merged video+audio uploaded: ${s3Url}`);
          result.videoUrl = s3Url;
        } else {
          console.log(`[VideoStatus] No voiceover — uploading raw video for scene ${sceneId || taskId}...`);
          const s3Url = await uploadVideoToS3(result.videoUrl, sceneId || taskId);
          console.log(`[VideoStatus] ✅ S3 upload done: ${s3Url}`);
          result.videoUrl = s3Url;
        }
        // Update SceneVideo in DB — videoId is passed from frontend
        if (req.query.videoId) {
          await SceneVideo.findByIdAndUpdate(req.query.videoId, { url: result.videoUrl, status: 'completed' });
        } else if (sceneId) {
          // Fallback: update by sceneId if videoId not provided
          await SceneVideo.findOneAndUpdate(
            { sceneId, isLatest: true },
            { url: result.videoUrl, status: 'completed' }
          );
        }
      } catch (err) {
        console.error(`[VideoStatus] ❌ Merge/upload failed for scene ${sceneId || taskId}:`, err.message);
        console.error(err.stack);
        // Still return the result so the frontend isn’t stuck, but flag it
        result.mergeError = err.message;
      } finally {
        taskSceneMap.delete(taskId);
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
    const { videos, scenes, projectId } = req.body;
    if (!Array.isArray(videos) || videos.length < 2) {
      console.warn(`[Stitch] Rejected: received ${videos?.length ?? 0} video(s), need at least 2`);
      return res.status(400).json({ error: 'At least 2 video entries are required to stitch' });
    }
    // Build a sceneId → scene.index map so we can sort by scene order
    const sceneIndexMap = {};
    if (Array.isArray(scenes)) {
      scenes.forEach(s => { sceneIndexMap[String(s.scene_id)] = s.index ?? 999; });
    }
    // Normalise: accept either `url` (DB field) or `videoUrl` (legacy), filter missing URLs
    const sorted = videos
      .map(v => ({ ...v, videoUrl: v.videoUrl || v.url }))
      .filter(v => v.videoUrl)
      .sort((a, b) => {
        const ia = sceneIndexMap[String(a.sceneId)] ?? 999;
        const ib = sceneIndexMap[String(b.sceneId)] ?? 999;
        return ia - ib;
      });
    if (sorted.length < 2) {
      console.warn(`[Stitch] Rejected: only ${sorted.length} video(s) had valid URLs`);
      return res.status(400).json({ error: 'At least 2 videos with valid URLs are required' });
    }
    console.log(`[Stitch] Starting stitch of ${sorted.length} scenes: [${sorted.map(v => v.sceneId).join(', ')}]`);
    const stitchedUrl = await stitchVideosToS3(sorted);
    console.log(`[Stitch] ✅ Done in ${Date.now() - t0}ms: ${stitchedUrl}`);

    // Save FinalVideo to DB
    const sceneVideoIds = videos.filter(v => v._id).map(v => v._id);
    if (projectId) {
      // Mark any existing FinalVideo for this project as not latest
      await FinalVideo.updateMany({ projectId, isLatest: true }, { isLatest: false });
      const lastFinal = await FinalVideo.findOne({ projectId }).sort({ version: -1 });
      const version = lastFinal ? lastFinal.version + 1 : 1;
      await FinalVideo.create({
        projectId,
        sceneVideoIds,
        url: stitchedUrl,
        totalDuration: sorted.length * 5,
        status: 'completed',
        version,
        isLatest: true,
      });
    }

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
