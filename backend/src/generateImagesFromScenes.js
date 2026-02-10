import { openai } from "./openai.js";
import fs from "fs";
import path from "path";

export async function generateImagesForScenes(scenes) {
  const results = [];

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

    const image = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      size: "1024x1024"
    });

    const image_base64 = image.data[0].b64_json;
    const buffer = Buffer.from(image_base64, "base64");

    const filePath = path.join("images", `scene-${scene_id}.png`);
    fs.writeFileSync(filePath, buffer);

    results.push({
      scene_id,
      image_path: filePath,
      prompt_used: prompt
    });
  }

  return results;
}
