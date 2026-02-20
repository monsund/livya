import { openai } from "./openai.js";
import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
// S3 config from env
const S3_BUCKET = process.env.S3_BUCKET_NAME;
const S3_REGION = process.env.AWS_REGION;
const S3_BASE_URL = process.env.S3_BASE_URL || `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com`;

const s3 = new S3Client({ region: S3_REGION });

export async function generateImagesForScenes(scenes) {
  console.log("generateImagesForScenes called with scenes:", Array.isArray(scenes) ? scenes.length : scenes);
  const results = [];
  const scenesDir = path.join("images", "scenes");
  try {
    if (!fs.existsSync(scenesDir)) {
      fs.mkdirSync(scenesDir, { recursive: true });
      console.log(`Created directory: ${scenesDir}`);
    }
  } catch (dirErr) {
    console.error(`Error creating directory ${scenesDir}:`, dirErr);
    throw dirErr;
  }

  for (const scene of scenes) {
    const { scene_id, visual, environment, actions, mood, camera } = scene;

    const prompt = `
${visual}.
Environment: ${environment}.
Action: ${actions}.
Mood: ${mood}.
Camera: ${camera}.
High quality, realistic, cinematic lighting.
    `.trim();

    console.log(`Generating image for scene ${scene_id}...`);
    let image, image_base64, buffer;
    try {
      image = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        size: "1024x1024"
      });
      if (!image.data || !image.data[0] || !image.data[0].b64_json) {
        throw new Error(`No image data returned for scene ${scene_id}`);
      }
      image_base64 = image.data[0].b64_json;
      buffer = Buffer.from(image_base64, "base64");
    } catch (imgErr) {
      console.error(`Error generating image for scene ${scene_id}:`, imgErr);
      results.push({
        scene_id,
        image_path: null,
        prompt_used: prompt,
        error: imgErr.message
      });
      continue;
    }

    const filePath = path.join(scenesDir, `scene-${scene_id}.png`);
    let s3Url = null;
    try {
      fs.writeFileSync(filePath, buffer);
      console.log(`Saved image for scene ${scene_id} at ${filePath}`);

      // Upload to S3
      const s3Key = `scenes/scene-${scene_id}-${Date.now()}.png`;
      await s3.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: s3Key,
        Body: buffer,
        ContentType: 'image/png',
        // ACL: 'public-read'
      }));
      s3Url = `${S3_BASE_URL}/${s3Key}`;
      console.log(`Uploaded image for scene ${scene_id} to S3: ${s3Url}`);
    } catch (saveErr) {
      console.error(`Error saving/uploading image for scene ${scene_id}:`, saveErr);
      results.push({
        scene_id,
        image_path: null,
        prompt_used: prompt,
        error: saveErr.message
      });
      continue;
    }

    results.push({
      scene_id,
      image_path: s3Url || filePath,
      prompt_used: prompt
    });
  }

  return results;
}
