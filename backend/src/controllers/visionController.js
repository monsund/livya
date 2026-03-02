import { extractVisionElements } from "../extractElements.js";
import { generateScenes } from "../generateScenes.js";
import { generateImagesForScenes } from "../generateImagesFromScenes.js";
import { startVideoGeneration, getVideoTaskStatus, uploadVideoToS3, stitchVideosToS3 } from "../services/runwayService.js";

export const processVision = async (req, res) => {
  try {
    const { vision } = req.body;
    const image = req.file;

    // Must have either vision text or image
    if (!vision && !image) {
      return res.status(400).json({ 
        error: "Either vision text or image is required" 
      });
    }

    // Convert image to base64 if provided
    let imageBase64 = null;
    if (image) {
      imageBase64 = image.buffer.toString('base64');
    }

    const elements = await extractVisionElements(vision || "", imageBase64);
    const scenes = await generateScenes(elements);
    const images = await generateImagesForScenes(scenes);

    res.json({
      elements,
      scenes,
      images
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to process vision" });
  }
};

export const regenerateImage = async (req, res) => {
  try {
    const { scene } = req.body;
    if (!scene || !scene.scene_id) {
      return res.status(400).json({ error: "A valid scene object is required" });
    }
    const results = await generateImagesForScenes([scene]);
    const result = results[0];
    if (!result || result.error) {
      return res.status(500).json({ error: result?.error || "Image generation failed" });
    }
    res.json({ scene_id: result.scene_id, image_path: result.image_path });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to regenerate image" });
  }
};

export const regenerateScenes = async (req, res) => {
  try {
    const { elements } = req.body;
    if (!elements || typeof elements !== 'object') {
      return res.status(400).json({ error: "Valid elements object is required" });
    }
    const scenes = await generateScenes(elements);
    const images = await generateImagesForScenes(scenes);
    res.json({ scenes, images });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to regenerate scenes" });
  }
};

export const generateVideo = async (req, res) => {
  try {
    const { imageUrl, scene } = req.body;
    if (!imageUrl || !scene) {
      return res.status(400).json({ error: "imageUrl and scene are required" });
    }
    // Build a motion-focused prompt — Runway responds best to natural descriptions
    // of what moves, how it moves, and camera direction, not label/metadata format.
    const parts = [
      scene.visual,                                          // scene description as base
      scene.actions && `${scene.actions}`,                  // what's happening / motion
      scene.camera && `${scene.camera}`,                    // camera movement (high priority for Runway)
      scene.mood && `${scene.mood} atmosphere`,             // mood as atmosphere qualifier
    ].filter(Boolean);
    // Keep under 512 chars (Runway limit) — truncate visual if needed
    const promptText = parts.join(', ').slice(0, 512);
    const taskId = await startVideoGeneration({ imageUrl, promptText, duration: 5 });
    res.json({ taskId });
  } catch (error) {
    console.error('Generate video error:', error);
    res.status(500).json({ error: error.message || 'Failed to start video generation' });
  }
};

export const getVideoStatus = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { sceneId } = req.query;
    if (!taskId) return res.status(400).json({ error: 'taskId is required' });
    const result = await getVideoTaskStatus(taskId);
    // When succeeded, upload the Runway temp video to S3 for permanent storage
    if (result.status === 'SUCCEEDED' && result.videoUrl) {
      try {
        const s3Url = await uploadVideoToS3(result.videoUrl, sceneId || taskId);
        result.videoUrl = s3Url;
      } catch (uploadErr) {
        console.error('S3 video upload failed, falling back to Runway URL:', uploadErr.message);
        // Non-fatal: still return the temporary Runway URL
      }
    }
    res.json(result);
  } catch (error) {
    console.error('Get video status error:', error);
    res.status(500).json({ error: error.message || 'Failed to get video status' });
  }
};

export const stitchVideos = async (req, res) => {
  try {
    const { videos } = req.body; // [{ scene_id, videoUrl }] sorted by scene_id
    if (!Array.isArray(videos) || videos.length < 2) {
      return res.status(400).json({ error: 'At least 2 video entries are required to stitch' });
    }
    // Sort by scene_id and filter out any missing URLs
    const sorted = videos
      .filter(v => v.videoUrl)
      .sort((a, b) => a.scene_id - b.scene_id);
    if (sorted.length < 2) {
      return res.status(400).json({ error: 'At least 2 videos with valid URLs are required' });
    }
    console.log(`[Stitch] Stitching ${sorted.length} scenes: ${sorted.map(v => v.scene_id).join(', ')}`);
    const stitchedUrl = await stitchVideosToS3(sorted);
    res.json({ stitchedUrl, sceneCount: sorted.length });
  } catch (error) {
    console.error('Stitch videos error:', error);
    res.status(500).json({ error: error.message || 'Failed to stitch videos' });
  }
};
