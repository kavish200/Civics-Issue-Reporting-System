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
  const configuredTimeout = Number.parseInt(process.env.GEMINI_TIMEOUT_MS, 10);
  const timeout =
    Number.isFinite(configuredTimeout) && configuredTimeout > 0
      ? configuredTimeout
      : 12000;
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite';

  // Graceful fallback if no API key is set yet
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return {
      isLegit: true,
      skipped: true,
      reason: 'Gemini API key not configured; skipping AI image inspection.'
    };
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        timeout,
        retryOptions: { attempts: 1 }
      }
    });

    const prompt = `Check this civic issue report. Category: "${category}". Description: "${description || 'None provided'}".
If there is an image, decide whether it shows this kind of civic issue and assess severity.
Return JSON only: {"isLegit":boolean,"confidence":number,"detectedCategory":"road_damage"|"garbage"|"streetlight"|"water"|"drainage"|"other"|"none","suggestedPriority":"Low"|"Medium"|"High"|"Critical","reason":"brief explanation"}`;

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
      model,
      contents,
      config: {
        responseMimeType: 'application/json',
        maxOutputTokens: 160,
        temperature: 0
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
