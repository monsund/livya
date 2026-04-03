import { openai } from "./openai.js";
import { parseJSON } from "./utils/parseJSON.js";

// duration in seconds → approximate number of 5-second scenes needed
const durationToSceneCount = (duration) => {
  if (!duration) return null;
  return Math.max(3, Math.round(duration / 5));
};

export async function generateScenes(elements, duration = null, protagonistGender = null) {
  try {
    if (!elements || typeof elements !== 'object') {
      throw new Error("Invalid elements data provided");
    }

    const targetCount = durationToSceneCount(duration);
    const sceneCountGuidance = targetCount
      ? `- Generate around ${targetCount} scenes.
        - Each scene represents roughly 4–7 seconds of video.
        - The full sequence should roughly match a ${duration}-second video.`
      : `- Generate as many meaningful, non-redundant scenes as the input allows.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `
You generate cinematic life scenes from the provided structured vision elements.
The scenes should form a meaningful life journey.
${protagonistGender ? `The protagonist is ${protagonistGender}. Use the correct pronouns (${protagonistGender === 'male' ? 'he/him' : 'she/her'}) in voiceovers and refer to the protagonist's gender consistently across all scenes.` : ''}

The sequence should feel like a progression:
dream → effort → growth → achievement → fulfillment.
The final scene should feel emotionally satisfying and represent fulfillment or peace.

Input:
- theme
- career
- lifestyle
- environment
- emotions
- symbols (visible objects, motifs, or notable items)

Output rules:
${sceneCountGuidance}
- Generate unique and visually concrete scenes using only the provided elements.
- Do NOT invent new life goals or add elements not present in the input.
- Each scene must be self-contained and visually distinct.
- Mood must come from emotions.
- Scenes must follow a natural progression rather than random life moments.
- Environment must align with environment inputs.
- If symbols are present, ensure they are visually represented in relevant scenes.
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
  "camera": string,
  "visualPrompt": string,
  "voiceovers": [
    {
      "script": string
    }
  ]
}

Rules:
- "index" must start from 1 and increment sequentially.
- "visualPrompt" should combine visual + environment + actions into a clean, detailed image generation prompt.
- "voiceovers" must contain exactly ONE object initially.
- Do NOT include any "voiceover" field outside the voiceovers array.

voiceovers[0].script:
- One short narration sentence (10–14 words)
- Inspirational, emotional, and personal
- Should enhance emotion, not just describe visuals

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
