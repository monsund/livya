import { openai } from "./openai.js";
import { parseJSON } from "./utils/parseJSON.js";

export async function generateScenes(elements) {
  try {
    if (!elements || typeof elements !== 'object') {
      throw new Error("Invalid elements data provided");
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You generate visual life scenes from structured vision elements.

Input:
- theme
- career
- lifestyle
- environment
- emotions

Output rules:
- Generate EXACTLY 5 scenes
- Follow this schema strictly
- Keep scenes visually concrete
- Do NOT invent new life goals
- Reuse provided elements only
- Mood must come from emotions
- Environment must align with environment inputs

Return ONLY valid JSON array.

Scene schema:
{
  "scene_id": number,
  "title": string,
  "visual": string,
  "environment": string,
  "actions": string,
  "mood": string,
  "camera": string
}

Camera options (pick one per scene):
- wide shot
- medium shot
- close-up
- slow pan
        `.trim()
        },
        {
          role: "user",
          content: JSON.stringify(elements)
        }
      ],
      temperature: 0.3
    });

    if (!response.choices?.[0]?.message?.content) {
      throw new Error("No response content from OpenAI");
    }

    return parseJSON(response.choices[0].message.content);
  } catch (error) {
    console.error("Error generating scenes:", error);
    throw new Error(`Failed to generate scenes: ${error.message}`);
  }
}
