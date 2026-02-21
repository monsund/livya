import express from "express";
import multer from "multer";
import { processVision, regenerateImage, regenerateScenes } from "../controllers/visionController.js";

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
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

router.post("/vision", upload.single('image'), processVision);
router.post("/regenerate-image", regenerateImage);
router.post("/regenerate-scenes", regenerateScenes);

export default router;
