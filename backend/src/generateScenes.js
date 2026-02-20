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
You generate as many distinct visual life scenes as possible from the provided structured vision elements.

Input:
- theme
- career
- lifestyle
- environment
- emotions
- symbols (visible objects, motifs, or notable items)

Output rules:
- Generate ALL possible unique and visually concrete scenes using only the provided elements.
- There is NO upper limit to the number of scenes: create a scene for every unique combination or grouping of the provided elements, including all symbols, as long as each scene is meaningful and non-redundant.
- Do NOT invent new life goals or add elements not present in the input.
- Each scene must be self-contained and visually distinct, suitable for later selection for video creation (e.g., 30s, 60s, 90s videos).
- Mood must come from emotions.
- Environment must align with environment inputs.
- If symbols are present, ensure they are visually represented in the relevant scenes.
- Follow the schema strictly.

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

Note: The number of scenes may be used to create videos of different lengths (30s, 60s, 90s), so maximize the number of meaningful, non-redundant scenes. Do not default to 5 scenes—generate as many as the input allows.
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
