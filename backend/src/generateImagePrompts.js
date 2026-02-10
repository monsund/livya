import { openai } from "./openai.js";
import { parseJSON } from "./utils/parseJSON.js";

export async function generateImagePrompts(scenes) {
  try {
    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      throw new Error("Invalid scenes data provided");
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You convert visual scenes into high-quality AI image prompts.

Rules:
- One prompt per scene
- Prompt must be visually rich and concrete
- Do NOT add new story elements
- Use natural language (not bullet points)
- Include:
  subject, environment, lighting, mood, camera
- Avoid brand names or copyrighted styles

Return ONLY valid JSON array.

Schema:
{
  "scene_id": number,
  "prompt": string
}
        `.trim()
        },
        {
          role: "user",
          content: JSON.stringify(scenes)
        }
      ],
      temperature: 0.4
    });

    if (!response.choices?.[0]?.message?.content) {
      throw new Error("No response content from OpenAI");
    }

    return parseJSON(response.choices[0].message.content);
  } catch (error) {
    console.error("Error generating image prompts:", error);
    throw new Error(`Failed to generate image prompts: ${error.message}`);
  }
}
