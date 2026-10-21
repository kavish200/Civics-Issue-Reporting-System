const { GoogleGenAI } = require('@google/genai');

/**
 * Validates civic issue reports and attached photos using Google Gemini Vision.
 * Detects whether the photo actually depicts the claimed civic problem (pothole, garbage, leak, etc.)
 * or if it is spam, a meme, selfie, or unrelated image.
 *
 * @param {Object} params
 * @param {string} params.category - 'road_damage' | 'garbage' | 'streetlight' | 'water' | 'drainage'
 * @param {string} params.description - Citizen's issue description
 * @param {Object} [params.file] - Multer file object containing image buffer and mimetype
 * @returns {Promise<{ isLegit: boolean, confidence: number, suggestedPriority?: string, reason?: string, skipped?: boolean }>}
 */
async function verifyWithGemini({ category, description, file }) {
  const apiKey = process.env.GEMINI_API_KEY;

  // Graceful fallback if no API key is set yet
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return {
      isLegit: true,
      skipped: true,
      reason: 'Gemini API key not configured; skipping AI image inspection.'
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an AI Civic Inspection Officer for a municipal government.
Analyze this submitted citizen grievance report:
- Stated Category: "${category}"
- Stated Description: "${description || 'None provided'}"

Evaluate the legitimacy of this complaint.
If an image is attached, inspect the image closely:
1. Does it depict a genuine municipal/civic issue (e.g., damaged road/pothole, uncollected garbage/dump, faulty street lamp, leaking water pipe, overflowing drain)?
2. Is the image fake, spam, a selfie, a meme, an indoor room/gaming screenshot, or completely unrelated to civic infrastructure?
3. What is the severity (Low, Medium, High, Critical) and confidence level (0.0 to 1.0)?

Return a JSON object in exactly this format:
{
  "isLegit": boolean,
  "confidence": number,
  "detectedCategory": "road_damage" | "garbage" | "streetlight" | "water" | "drainage" | "other" | "none",
  "suggestedPriority": "Low" | "Medium" | "High" | "Critical",
  "reason": "Brief 1-2 sentence explanation of your inspection findings."
}`;

    const contents = [];

    // Attach image if uploaded
    if (file && file.buffer) {
      contents.push({
        inlineData: {
          data: file.buffer.toString('base64'),
          mimeType: file.mimetype || 'image/jpeg'
        }
      });
    }

    contents.push(prompt);

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text?.trim() || '{}';
    const result = JSON.parse(text);

    return {
      isLegit: result.isLegit !== false,
      confidence: typeof result.confidence === 'number' ? result.confidence : 0.85,
      detectedCategory: result.detectedCategory || category,
      suggestedPriority: result.suggestedPriority || 'Medium',
      reason: result.reason || 'Verified by AI Civic Inspector.'
    };
  } catch (error) {
    console.warn('Gemini AI Verification warning (proceeding with fallback):', error.message);
    // On API error or quota issue, do not block the citizen report
    return {
      isLegit: true,
      skipped: true,
      reason: `AI inspection service warning: ${error.message}`
    };
  }
}

module.exports = {
  verifyWithGemini
};
