// netlify/functions/geminiProxy.ts

import { GoogleGenAI, Modality } from "@google/genai";
import type { Handler, HandlerEvent, HandlerContext } from "@netlify/functions";
import { Buffer } from "buffer";

// API 키는 Netlify 환경 변수에서 가져옵니다.
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

async function imageToGenerativePart(base64: string, mimeType: string) {
  return {
    inlineData: {
      data: base64,
      mimeType,
    },
  };
}

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }
  
  try {
    const { type, imageUrl, prompt } = JSON.parse(event.body || '{}');

    if (type === 'describe') {
      if (!imageUrl) {
        return { statusCode: 400, body: JSON.stringify({ message: 'imageUrl is required for describe' }) };
      }
      
      // Fetch image and convert to base64 on the server side
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
      }
      const imageBuffer = await imageResponse.arrayBuffer();
      const base64 = Buffer.from(imageBuffer).toString('base64');
      const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

      const imagePart = await imageToGenerativePart(base64, mimeType);
      const textPart = {
        text: "Describe this artwork in detail. Analyze its style, mood, composition, color palette, and potential meaning. Be eloquent and insightful, as if you were an art curator presenting it in a gallery.",
      };

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, textPart] },
      });
      
      return {
        statusCode: 200,
        body: JSON.stringify({ text: response.text }),
      };

    } else if (type === 'generate') {
      if (!prompt) {
        return { statusCode: 400, body: JSON.stringify({ message: 'prompt is required for generate' }) };
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [{ text: prompt }] },
        config: {
          responseModalities: [Modality.IMAGE],
        },
      });

      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const base64ImageBytes: string = part.inlineData.data;
          const dataUrl = `data:image/png;base64,${base64ImageBytes}`;
          return {
            statusCode: 200,
            body: JSON.stringify({ imageUrl: dataUrl }),
          };
        }
      }
      throw new Error("No image data found in response.");

    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid type specified' }),
      };
    }

  } catch (error) {
    console.error("Error in geminiProxy function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error instanceof Error ? error.message : 'An internal server error occurred' }),
    };
  }
};

export { handler };
