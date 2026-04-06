import { safeGenerateContent } from "./gemini";

const CACHE_KEY = 'niraj_ai_mascot_v1';

export async function generateMascot() {
  // Try to get from cache first to save quota
  const cached = localStorage.getItem(CACHE_KEY);
  if (cached) return cached;

  try {
    const response = await safeGenerateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: 'A professional 3D Pixar-style mascot of a friendly young Indian male student with short black hair, wearing a white shirt and black trousers. He is holding a book in one hand and pointing upwards with the other, with a bright smile. The background MUST be pure black (#000000) to blend with the splash screen. High quality 3D render, vibrant colors.',
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "3:4",
        },
      },
    });
    
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64 = `data:image/png;base64,${part.inlineData.data}`;
        // Cache it for future use
        try {
          localStorage.setItem(CACHE_KEY, base64);
        } catch (e) {
          // LocalStorage might be full
        }
        return base64;
      }
    }
  } catch (err) {
    console.error("Mascot generation failed:", err);
  }
  
  // Fallback static image if AI fails or quota is reached
  return "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=60";
}
