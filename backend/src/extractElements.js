import { openai } from "./openai.js";
import { parseJSON } from "./utils/parseJSON.js";

export async function extractVisionElements(input, imageBase64 = null) {
  try {
    const systemPrompt = `
You extract structured vision elements from user input (text and/or images).

When analyzing vision boards, images, or text descriptions:
- Extract ALL visible and mentioned elements comprehensively
- Look for work scenes, hobbies, activities, environments, relationships, emotions, and ALL visible objects, symbols, motifs, or notable items (for example, any distinct shapes, icons, patterns, or visual features)
- Identify ONE unifying theme that ties everything together
- Group ALL extracted items into these categories:
  - career: work-related goals, professional aspirations, meetings, collaborations
  - lifestyle: hobbies, passions, activities (e.g., playing guitar, sports, travel)
  - environment: physical spaces, workspaces, home settings, nature
  - emotions: feelings, moods, states of being
  - symbols: visible objects, symbols, motifs, or any other notable items (for example, any distinct shapes, icons, patterns, or visual features)

Rules for extraction:
- Extract EVERY distinct element you see or read
- Do NOT skip any visible items in images, including symbols or motifs
- Do NOT invent elements not present
- Normalize wording (short, clear phrases)
- Be thorough but conservative
- Combine text input and image analysis when both provided

Return ONLY valid JSON in this format:

{
  "theme": "",
  "career": [],
  "lifestyle": [],
  "environment": [],
  "emotions": [],
  "symbols": []
}
  `.trim();

    const userContent = imageBase64
      ? [
          {
            type: "text",
            text: input || "Analyze this vision board image thoroughly. Extract ALL visible elements including: work/career scenes, hobbies and passions, lifestyle activities, environments, and emotions. Be comprehensive and capture every distinct element you can identify."
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`
            }
          }
        ]
      : input;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: userContent
        }
      ],
      temperature: 0.2
    });

    if (!response.choices?.[0]?.message?.content) {
      throw new Error("No response content from OpenAI");
    } 

    return parseJSON(response.choices[0].message.content);
  } catch (error) {
    console.error("Error extracting vision elements:", error);
    throw new Error(`Failed to extract vision elements: ${error.message}`);
  }
}
