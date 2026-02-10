/**
 * Parse JSON from OpenAI responses that may be wrapped in markdown code blocks
 */
export function parseJSON(text) {
  // Remove markdown code blocks if present
  let cleaned = text.trim();
  
  // Remove ```json or ``` from start
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  
  // Remove ``` from end
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  
  return JSON.parse(cleaned.trim());
}
