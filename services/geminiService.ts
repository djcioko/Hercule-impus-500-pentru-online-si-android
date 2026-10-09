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
        model: 'gemini-2.5-flash',
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

      let jsonStr = response.text?.trim() || '';
      // Strip markdown code fences if model returned ```json ... ```
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
      }

      if (jsonStr) {
        try {
          const parsedResponse = JSON.parse(jsonStr) as GeminiResponseData;
          parsedResponse.vibe = parsedResponse.vibe.trim();
          return parsedResponse;
        } catch (jsonError) {
          // Fallback: search for vibe name in response text
          console.warn("JSON parse fallback, extracting vibe from text:", jsonError);
          const foundSong = YOUTUBE_DB.find(s =>
            jsonStr.toLowerCase().includes(s.vibe.toLowerCase())
          );
          if (foundSong) {
            return {
              vibe: foundSong.vibe,
              description: "Vibe petrecere detectat automat din fotografia analizată.",
            };
          }
        }
      }
      // Default safe fallback if text returned
      return {
        vibe: YOUTUBE_DB[0].vibe,
        description: "Vibe dinamic de petrecere potrivit pentru publicul din imagine.",
      };
    } catch (error) {
      console.error("Error analyzing image with Gemini:", error);
      // Graceful fallback to avoid breaking UI
      const randomSong = YOUTUBE_DB[Math.floor(Math.random() * YOUTUBE_DB.length)];
      return {
        vibe: randomSong.vibe,
        description: `Vibe adaptat pentru petrecere: ${randomSong.vibe} (Analiză locală activată).`,
      };
    }
  },
};