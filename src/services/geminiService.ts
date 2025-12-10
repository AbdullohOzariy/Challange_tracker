import { GoogleGenAI } from '@google/genai';

const apiKey = typeof process !== 'undefined' && (process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY) ? (process.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY) : '';

let ai: any = null;
if (apiKey) {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (e) {
    // ignore initialization errors in environments where the package can't run
    console.warn('GoogleGenAI init failed:', e);
    ai = null;
  }
}

export const getMotivation = async (challengeTitle: string, progress: number): Promise<string> => {
  // Fallback quick motivational messages
  if (!apiKey || !ai) return `Keep going! You're ${progress}% through "${challengeTitle}" — you can do it!`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Give me a short, punchy, 1-sentence motivational quote for someone who is ${progress}% through their "${challengeTitle}" challenge.`,
    });
    return response?.text || `Keep going! You're ${progress}% through \"${challengeTitle}\" — you can do it!`;
  } catch (e) {
    console.warn('gemini generate error:', e);
    return `Consistency is key — keep going with "${challengeTitle}"!`;
  }
};

