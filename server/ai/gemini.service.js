import { GoogleGenAI } from '@google/genai';
import config from '../config/env.js';
import logger from '../utils/logger.js';

const ai = new GoogleGenAI({ apiKey: config.gemini.apiKey || 'MOCK_KEY' });

export const enrichRecommendation = async (productName, ruleReason, suggestedAction) => {
  if (!config.gemini.apiKey) {
    return {
      reason: ruleReason,
      suggestedAction: suggestedAction,
      expectedOutcome: 'Based on standard inventory rules',
      estimatedRevenueSaved: 0,
      estimatedLossPrevented: 0,
      confidenceScore: 50,
      source: 'rule'
    };
  }

  const prompt = `
  You are an expert AI inventory analyst.
  Product: ${productName}
  Rule-based reason: ${ruleReason}
  System suggested action: ${suggestedAction}

  Please provide a human-readable explanation of why this action is necessary, the exact action to take, and the expected business outcome (e.g. revenue saved, stockout prevented).
  Also, estimate the potential revenue saved and loss prevented in Indian Rupees (₹) as integers (0 if not applicable).
  Finally, provide a confidence score from 0 to 100 for this recommendation.
  Keep explanations concise (1-2 sentences each).

  Return ONLY a valid JSON object exactly like this, with no markdown formatting or code blocks:
  {
    "reason": "string",
    "suggestedAction": "string",
    "expectedOutcome": "string",
    "estimatedRevenueSaved": number,
    "estimatedLossPrevented": number,
    "confidenceScore": number
  }
  `;

  const TIMEOUT_MS = 20000;
  const MAX_ATTEMPTS = 2;

  const fallback = () => ({
    reason: ruleReason,
    suggestedAction: suggestedAction,
    expectedOutcome: 'Based on standard inventory rules',
    estimatedRevenueSaved: 0,
    estimatedLossPrevented: 0,
    confidenceScore: 50,
    source: 'rule',
  });

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const responsePromise = ai.models.generateContent({
        model: config.gemini.model,
        contents: prompt,
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`timeout after ${TIMEOUT_MS}ms`)), TIMEOUT_MS),
      );

      const response = await Promise.race([responsePromise, timeoutPromise]);
      let text = (typeof response.text === 'function' ? response.text() : response.text);
      if (!text) text = response?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      text = String(text).trim();

      if (text.startsWith('```json')) text = text.slice(7);
      if (text.startsWith('```')) text = text.slice(3);
      if (text.endsWith('```')) text = text.slice(0, -3);

      const result = JSON.parse(text.trim());
      return {
        ...result,
        source: 'ai',
      };
    } catch (error) {
      logger.error(`Gemini enrichment failed (attempt ${attempt}/${MAX_ATTEMPTS}):`, error.message);
      if (attempt === MAX_ATTEMPTS) return fallback();
    }
  }
  return fallback();
};
