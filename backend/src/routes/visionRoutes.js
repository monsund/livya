import { getSceneVideosByProject, getFinalVideosByProject, selectVideo } from "../controllers/sceneVideoController.js";
import {
  getUserProjects,
  getScenesByProject,
  getImagesByProject,
  updateScene,
  selectImage,
} from "../controllers/visionController.js";
import express from "express";
import multer from "multer";
import { 
  // processVision,
  processVisionStream,
  regenerateImage, 
  regenerateScenes, 
  generateVideo, 
  getVideoStatus, 
  stitchVideos,
  generateVoiceover
} from "../controllers/visionController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per file
    fieldSize: 10 * 1024 * 1024, // 10MB per text field (default is only 1MB)
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
  }
});

// router.post("/vision", upload.single('image'), processVision);
router.post("/vision-stream", protect, upload.array('images'), processVisionStream);
router.post("/regenerate-image", protect, regenerateImage);
router.post("/regenerate-scenes", protect, regenerateScenes);
router.post("/generate-video", protect, generateVideo);
router.get("/video-status/:taskId", protect, getVideoStatus);
router.post("/stitch-videos", protect, stitchVideos);
router.post("/generate-voiceover", protect, generateVoiceover);

// Fetch all projects for the authenticated user
router.get("/projects", protect, getUserProjects);

// Fetch all scenes for a project
router.get("/projects/:projectId/scenes", protect, getScenesByProject);

// Update a scene
router.put("/projects/:projectId/scenes/:sceneId", protect, updateScene);

// Fetch all images for a project
router.get("/projects/:projectId/images", protect, getImagesByProject);

// Set default image for a scene (user selecting a previous image)
router.put("/projects/:projectId/scenes/:sceneId/select-image", protect, selectImage);

// Fetch all scene videos for a project
router.get("/projects/:projectId/scene-videos", protect, getSceneVideosByProject);

// Set active version of a scene video (user switching between generated videos)
router.put("/projects/:projectId/scenes/:sceneId/select-video", protect, selectVideo);

// Fetch all final videos for a project
router.get("/projects/:projectId/final-videos", protect, getFinalVideosByProject);

export default router;
