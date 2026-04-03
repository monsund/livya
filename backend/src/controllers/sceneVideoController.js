import SceneVideo from "../models/SceneVideo.js";
import FinalVideo from "../models/FinalVideo.js";

// Fetch all scene videos for a given project (all versions, sorted newest first per scene)
export const getSceneVideosByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const videos = await SceneVideo.find({ projectId }).sort({ sceneId: 1, version: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch scene videos' });
  }
};

// Fetch all final videos for a given project
export const getFinalVideosByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const videos = await FinalVideo.find({ projectId, isLatest: true }).sort({ version: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch final videos' });
  }
};

// Set isLatest on a chosen SceneVideo version (user switching active video for a scene)
export const selectVideo = async (req, res) => {
  try {
    const { sceneId } = req.params;
    const { videoId } = req.body;
    if (!videoId) return res.status(400).json({ error: 'videoId is required' });
    await SceneVideo.updateMany({ sceneId }, { isLatest: false });
    await SceneVideo.findByIdAndUpdate(videoId, { isLatest: true });
    res.json({ success: true });
  } catch (err) {
    console.error('[SelectVideo] error:', err);
    res.status(500).json({ error: 'Failed to select video' });
  }
};

