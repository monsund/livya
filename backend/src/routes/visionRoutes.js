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
router.post("/vision-stream", upload.array('images'), processVisionStream);
router.post("/regenerate-image", regenerateImage);
router.post("/regenerate-scenes", regenerateScenes);
router.post("/generate-video", generateVideo);
router.get("/video-status/:taskId", getVideoStatus);
router.post("/stitch-videos", stitchVideos);
router.post("/generate-voiceover", generateVoiceover);

export default router;
