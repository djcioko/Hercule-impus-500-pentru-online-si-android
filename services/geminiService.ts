import { GoogleGenAI, Type } from "@google/genai";
import { GeminiResponseData } from '../types';
import { YOUTUBE_DB } from '../constants'; // Import YOUTUBE_DB to get available vibes

interface AnalyzeImageConfig {
  base64Image: string;
  mimeType: string;
}

/**
 * Encapsulates Gemini API calls for image analysis.
 */
export const geminiService = {
  async analyzeImage(config: AnalyzeImageConfig): Promise<GeminiResponseData | null> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Dynamically get the list of available vibes from YOUTUBE_DB for the prompt
    const availableVibes = YOUTUBE_DB.map(song => song.vibe).join('\n- ');

    const prompt = `Analyze the mood, visual style, and overall 'vibe' of this image. Based on your analysis, select the single most fitting primary music genre or 'vibe' from the following *exact* list:
- ${availableVibes}

Respond ONLY with a JSON object containing two properties:
1. "vibe": The chosen concise string from the list above.
2. "description": A brief explanation (one sentence) of why this vibe was chosen based on the image's characteristics.`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image', // Directly specify the model here
        contents: {
          parts: [
            {
              inlineData: {
                data: config.base64Image,
                mimeType: config.mimeType,
              },
            },
            { text: prompt },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              vibe: {
                type: Type.STRING,
                description: "The dominant music vibe of the image, chosen from the provided list.",
              },
              description: {
                type: Type.STRING,
                description: "Explanation for the chosen vibe.",
              },
            },
            required: ["vibe", "description"],
            propertyOrdering: ["vibe", "description"],
          },
        },
      });

      const jsonStr = response.text?.trim();
      if (jsonStr) {
        // Attempt to parse JSON. Add a console log for debugging if parsing fails.
        try {
          const parsedResponse = JSON.parse(jsonStr) as GeminiResponseData;
          // Normalize the vibe from Gemini for consistent matching
          parsedResponse.vibe = parsedResponse.vibe.trim();
          return parsedResponse;
        } catch (jsonError) {
          console.error("Failed to parse Gemini response JSON:", jsonError);
          console.error("Raw Gemini response text:", jsonStr);
          throw new Error("Gemini returned invalid JSON format.");
        }
      }
      return null;
    } catch (error) {
      console.error("Error analyzing image with Gemini:", error);
      throw new Error(`Failed to analyze image: ${error instanceof Error ? error.message : String(error)}`);
    }
  },
};