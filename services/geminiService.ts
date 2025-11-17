import { GoogleGenAI } from "@google/genai";

/**
 * Converts a data URL string into a GoogleGenerativeAI.Part object.
 * @param dataUrl The data URL of the image.
 * @returns An object suitable for the Gemini API.
 */
function dataUrlToGoogleGenerativeAI_Part(dataUrl: string) {
  const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid data URL format');
  }
  const mimeType = match[1];
  const base64Data = match[2];

  return {
    inlineData: {
      mimeType,
      data: base64Data,
    },
  };
}

/**
 * Generates an artwork description using the Gemini API.
 * @param imageDataUrl The data URL of the artwork image.
 * @returns A string containing the generated memo.
 */
export async function generateArtworkMemo(imageDataUrl: string): Promise<string> {
  // Assume process.env.API_KEY is available in the environment
  if (!process.env.API_KEY) {
    console.error("API_KEY environment variable not set.");
    throw new Error("API key is not configured.");
  }
  
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const imagePart = dataUrlToGoogleGenerativeAI_Part(imageDataUrl);
    const textPart = { text: "이 그림을 보고 작품에 대한 설명을 500자 이내로 생성해줘. 그림의 스타일, 기법, 분위기, 주된 색감 등을 포함해서 전문가처럼 설명해줘." };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error generating artwork memo with Gemini:", error);
    throw new Error("AI로 메모를 생성하는 데 실패했습니다. 네트워크 연결을 확인하거나 나중에 다시 시도해주세요.");
  }
}
