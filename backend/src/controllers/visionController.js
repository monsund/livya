import { extractVisionElements } from "../extractElements.js";
import { generateScenes } from "../generateScenes.js";
import { generateImagesForScenes } from "../generateImagesFromScenes.js";

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
