import { GoogleGenAI } from "@google/genai";

// API Keys from environment only
const GEMINI_KEY = process.env.GEMINI_API_KEY || "";
const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
const SAMBANOVA_KEY = process.env.SAMBANOVA_API_KEY || "";
const STUDYAI_KEY = process.env.STUDYAI_API_KEY || "";
const EXTRA_KEY = process.env.EXTRA_API_KEY || "";
const LONG_TOKEN = process.env.LONG_TOKEN_100 || "";
const SUNRA_KEY = process.env.SUNRA_API_KEY || "";
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || "";

// Initialize Gemini
export const genAI = new GoogleGenAI({ apiKey: GEMINI_KEY || "" });

// Provider Types
export type AIProvider = 'gemini' | 'openai' | 'sambanova' | 'studyai' | 'sunra' | 'pollinations' | 'openrouter';

// Configuration for other providers
export const AI_CONFIG = {
  gemini: {
    apiKey: GEMINI_KEY,
    model: "gemini-3-flash-preview",
  },
  openai: {
    apiKey: OPENAI_KEY,
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4o",
  },
  sambanova: {
    apiKey: SAMBANOVA_KEY,
    baseUrl: "https://api.sambanova.ai/v1",
    model: "llama3-70b",
  },
  studyai: {
    apiKey: STUDYAI_KEY,
    model: "study-ai-v1",
  },
  extra: {
    apiKey: EXTRA_KEY,
  },
  longToken: {
    token: LONG_TOKEN,
  },
  sunra: {
    apiKey: SUNRA_KEY,
    baseUrl: "https://api.sunra.ai/v1",
  },
  openrouter: {
    apiKey: OPENROUTER_KEY,
    baseUrl: "https://openrouter.ai/api/v1",
    model: "google/gemini-2.0-flash-exp:free", // Default free model
  }
};

/**
 * Generic function to call different AI providers
 */
export async function callAI(provider: AIProvider, prompt: string) {
  switch (provider) {
    case 'pollinations':
      try {
        // Try POST first (better for long prompts)
        try {
          const response = await fetch('https://text.pollinations.ai/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [{ role: 'user', content: prompt }],
              model: 'openai',
              private: true
            })
          });
          if (response.ok) return await response.text();
        } catch (postError) {
          console.warn("Pollinations POST failed, trying GET...", postError);
        }

        // Fallback to GET for better compatibility
        const encodedPrompt = encodeURIComponent(prompt.substring(0, 2000)); // Limit for GET
        const response = await fetch(`https://text.pollinations.ai/${encodedPrompt}?model=openai&private=true`);
        
        if (!response.ok) throw new Error("Pollinations API Error");
        return await response.text();
      } catch (error) {
        console.error("Pollinations AI Error:", error);
        throw error; // Throw so safeGenerateContent can fallback to Gemini
      }

    case 'openrouter':
      try {
        const response = await fetch(`${AI_CONFIG.openrouter.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AI_CONFIG.openrouter.apiKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'NIRAJ SmartStudy AI',
          },
          body: JSON.stringify({
            model: AI_CONFIG.openrouter.model,
            messages: [{ role: 'user', content: prompt }],
          })
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err?.error?.message || "OpenRouter API Error");
        }
        const data = await response.json();
        return data.choices[0].message.content;
      } catch (error) {
        console.error("OpenRouter AI Error:", error);
        throw error;
      }

    case 'gemini':
      if (!genAI || !GEMINI_KEY) return "AI connect nahi ho raha. Kripya internet check karein.";
      const model = genAI.models.generateContent({
        model: AI_CONFIG.gemini.model,
        contents: prompt,
      });
      return (await model).text;
    
    case 'openai':
      // Placeholder for OpenAI fetch call
      console.log("Calling OpenAI with key:", AI_CONFIG.openai.apiKey.substring(0, 8) + "...");
      return "OpenAI response placeholder";

    case 'sambanova':
      // Placeholder for SambaNova fetch call
      console.log("Calling SambaNova with key:", AI_CONFIG.sambanova.apiKey.substring(0, 8) + "...");
      return "SambaNova response placeholder";

    case 'sunra':
      // Placeholder for Sunra.ai fetch call
      console.log("Calling Sunra.ai with key:", AI_CONFIG.sunra.apiKey.substring(0, 8) + "...");
      return "Sunra.ai response placeholder";

    default:
      throw new Error(`Provider ${provider} not supported yet.`);
  }
}
