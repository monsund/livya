import "dotenv/config";
import { extractVisionElements } from "./extractElements.js";
import { generateScenes } from "./generateScenes.js";
import { generateImagePrompts } from "./generateImagePrompts.js";

async function run() {
  const visionInput = `
Remote work
Building meaningful products
Financial freedom
Calm mornings
Minimal workspace
Confidence
Time for health and family
`;

  const elements = await extractVisionElements(visionInput);
  console.log("\n--- ELEMENTS ---\n");
  console.dir(elements, { depth: null });

  const scenes = await generateScenes(elements);
  console.log("\n--- SCENES ---\n");
  console.dir(scenes, { depth: null });

  const imagePrompts = await generateImagePrompts(scenes);
  console.log("\n--- IMAGE PROMPTS ---\n");
  console.dir(imagePrompts, { depth: null });
}

run();
