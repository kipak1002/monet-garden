// services/geminiService.ts

// The proxy function endpoint
const PROXY_ENDPOINT = '/.netlify/functions/geminiProxy';

// No longer need to create AI client on the frontend
// No more direct imports from @google/genai are needed here,
// as the proxy handles all API interactions.

export const generateArtworkDescription = async (imageUrl: string): Promise<string> => {
  try {
    const response = await fetch(PROXY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'describe',
        imageUrl: imageUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Request failed with status ${response.status}`);
    }

    const data = await response.json();
    if (!data.text) {
        throw new Error("Failed to generate description: The AI response was empty.");
    }
    return data.text;
  } catch (error) {
    console.error("Error generating artwork description:", error);
    if (error instanceof Error) {
        return `Failed to generate description: ${error.message}. Please check the server logs for more details.`;
    }
    return "An unknown error occurred while generating the description.";
  }
};

export const generateArtworkImage = async (prompt: string): Promise<string> => {
    try {
        const response = await fetch(PROXY_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'generate',
            prompt: prompt,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Request failed with status ${response.status}`);
        }
    
        const data = await response.json();
        if (!data.imageUrl) {
          throw new Error("No image data found in response.");
        }
        return data.imageUrl;
    } catch (error) {
        console.error("Error generating artwork image:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate image: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the image.");
    }
};
