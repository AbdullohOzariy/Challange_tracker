import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getMotivation = async (challengeTitle: string, progress: number): Promise<string> => {
  if (!apiKey) return "Keep going! You're doing great!";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Give me a short, punchy, 1-sentence motivational quote for someone who is ${progress}% through their "${challengeTitle}" challenge.`,
    });
    return response.text || "You've got this!";
  } catch (e) {
    return "Consistency is key!";
  }
};
