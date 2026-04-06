import { GoogleGenAI, Type, ThinkingLevel, Modality } from "@google/genai";
import { callAI } from "./ai-providers";

import { NIRAJ_PHOTO_URL, CREATOR_INFO } from "../constants";

const getApiKey = () => {
  const customKey = typeof window !== 'undefined' ? localStorage.getItem('custom_gemini_api_key') : null;
  // Fallback to the key provided by the user if environment key is missing or failing
  const providedKey = "AIzaSyAdnAEsiOlRMNNysWa82dBXBkhibByn9Yw";
  return customKey || process.env.GEMINI_API_KEY || providedKey || "";
};

export const ai = new GoogleGenAI({ apiKey: getApiKey() });

// Helper to get a fresh instance with the latest key
export const getAiInstance = () => {
  return new GoogleGenAI({ apiKey: getApiKey() });
};

// Other keys from environment only
export const EXTRA_KEYS = {
  openai: process.env.OPENAI_API_KEY || "",
  sambanova: process.env.SAMBANOVA_API_KEY || "",
  studyai: process.env.STUDYAI_API_KEY || "",
  extra: process.env.EXTRA_API_KEY || "",
  longToken: process.env.LONG_TOKEN_100 || "",
  sunra: process.env.SUNRA_API_KEY || ""
};

export const geminiModel = "gemini-3-flash-preview";
export const fallbackModel = "gemini-1.5-flash-latest";
export const liveModel = "gemini-3.1-flash-live-preview";
export const imageModel = "gemini-2.5-flash-image";
export const videoModel = "veo-3.1-lite-generate-preview";

export async function checkApiKey() {
  try {
    const key = getApiKey();
    if (!key) return false;
    const localAi = getAiInstance();
    const response = await localAi.models.generateContent({
      model: geminiModel,
      contents: "hi",
    });
    return !!response.text;
  } catch (err) {
    console.error("API Key check failed:", err);
    return false;
  }
}

let quotaExhaustedUntil = 0;

/**
 * Generates a response from Gemini with retry logic and error handling.
 */
export async function safeGenerateContent(params: any, retries = 5, delay = 5000) {
  // Check if we are in a cooling period
  if (Date.now() < quotaExhaustedUntil) {
    throw new Error("AI is resting. Please try again in a minute.");
  }

  let currentModel = params.model || geminiModel;

  for (let i = 0; i < retries; i++) {
    try {
      const key = getApiKey();
      if (!key) {
        throw new Error("AI connect nahi ho raha. Kripya internet check karein.");
      }
      const localAi = getAiInstance();
      // Use the current model for this attempt
      const response = await localAi.models.generateContent({
        ...params,
        model: currentModel
      });
      return response;
    } catch (error: any) {
      console.error(`Gemini API Error (Attempt ${i + 1} with ${currentModel}):`, error);
      
      let errorData = error;
      // Try to parse error message if it's a JSON string
      if (typeof error?.message === 'string' && error.message.trim().startsWith('{')) {
        try {
          errorData = JSON.parse(error.message);
        } catch (e) {
          // Not JSON, ignore
        }
      }

      // Check for quota exceeded (429) or Permission Denied (403)
      const isQuotaError = 
        error?.message?.includes("429") || 
        error?.status === "RESOURCE_EXHAUSTED" || 
        error?.message?.includes("quota") ||
        error?.code === 429 ||
        errorData?.code === 429 ||
        errorData?.error?.code === 429 ||
        errorData?.status === "RESOURCE_EXHAUSTED" ||
        errorData?.error?.status === "RESOURCE_EXHAUSTED" ||
        (typeof error?.message === 'string' && (
          error.message.includes("RESOURCE_EXHAUSTED") || 
          error.message.includes("429") || 
          error.message.includes("quota exceeded")
        )) ||
        (error?.response?.status === 429);

      const isPermissionError = 
        error?.message?.includes("403") || 
        error?.status === "PERMISSION_DENIED" ||
        error?.code === 403 ||
        errorData?.code === 403 ||
        errorData?.error?.code === 403 ||
        errorData?.status === "PERMISSION_DENIED" ||
        errorData?.error?.status === "PERMISSION_DENIED" ||
        (typeof error?.message === 'string' && (
          error.message.includes("PERMISSION_DENIED") || 
          error.message.includes("403")
        ));
      
      if (isQuotaError || isPermissionError) {
        // Switch to fallback model immediately if permission denied or quota hit
        if (currentModel === geminiModel) {
          console.log("Switching to fallback model due to error...");
          currentModel = fallbackModel;
          continue; // Retry immediately with fallback model
        }

        // SMART FALLBACK: If Gemini is exhausted or blocked, try Pollinations (Free & Unlimited)
        // Only for text-only prompts to ensure stability
        let textPrompt = "";
        if (typeof params === 'string') {
          textPrompt = params;
        } else if (typeof params.contents === 'string') {
          textPrompt = params.contents;
        } else if (Array.isArray(params.contents) && params.contents.length === 1 && params.contents[0].parts) {
          const parts = params.contents[0].parts;
          if (Array.isArray(parts) && parts.length === 1 && parts[0].text) {
            textPrompt = parts[0].text;
          }
        }

        if (textPrompt) {
          console.log("Gemini quota exceeded. Falling back to Pollinations AI...");
          try {
            const text = await callAI('pollinations', textPrompt);
            if (text && text.trim()) {
              return {
                text,
                candidates: [{
                  content: {
                    parts: [{ text }]
                  }
                }]
              } as any;
            }
          } catch (pollError) {
            console.error("Pollinations fallback failed:", pollError);
          }
        }

        // On the 3rd attempt, try switching to the fallback model if we haven't already
        if (i === 2 && currentModel === geminiModel) {
          console.log("Switching to fallback model due to quota...");
          currentModel = fallbackModel;
        }

        if (i < retries - 1) {
          // Add some jitter to the delay (±20%)
          const jitter = delay * 0.2 * (Math.random() * 2 - 1);
          const finalDelay = Math.max(1000, delay + jitter);
          
          console.log(`Quota exceeded, retrying in ${Math.round(finalDelay)}ms...`);
          await new Promise(resolve => setTimeout(resolve, finalDelay));
          delay *= 2; // Exponential backoff
          continue;
        } else {
          // Set cooling period for 60 seconds if all retries fail
          quotaExhaustedUntil = Date.now() + 60000;
          throw new Error("QUOTA_EXCEEDED: AI limit khatam ho gaya hai. Kripya 1 minute baad try karein. (AI limit reached. Please try again in 1 minute.)");
        }
      }
      
      // Check for safety filters
      if (error?.message?.includes("SAFETY") || (error?.error && error.error.message?.includes("SAFETY"))) {
        throw new Error("SAFETY_ERROR: Maaf kijiye, main is sawal ka jawab nahi de sakta kyunki yeh safety guidelines ke khilaaf hai. (Safety filter blocked the response.)");
      }

      const actualErrorMessage = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
      throw new Error(`AI_ERROR: Kuch galat ho gaya. (${actualErrorMessage})`);
    }
  }
  throw new Error("AI_ERROR: Maximum retries reached.");
}

export async function solveFromImage(base64Image: string, language: 'hindi' | 'english' | 'hinglish' = 'hinglish') {
    const localAi = getAiInstance();
    const response = await localAi.models.generateContent({
      model: geminiModel,
      contents: [
        {
          parts: [
            { text: `Solve this study question. 
            Language: ${language}. 
            Provide: 1. Step-by-step solution, 2. Simple explanation, 3. Real-life example, 4. Short trick to remember.
            IMPORTANT: For math formulas, ALWAYS use standard LaTeX with $ for inline math and $ for block math. 
            Example: Use $E=mc^2$ for inline and $\frac{-b \pm \sqrt{b^2-4ac}}{2a}$ for blocks.
            If language is Hindi, use Hindi. If English, use English. If Hinglish, use a mix of Hindi and English.` },
            { inlineData: { data: base64Image, mimeType: "image/jpeg" } }
          ]
        }
      ],
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      }
    });
  return response.text;
}

export async function summarizeNotes(text: string) {
  const response = await safeGenerateContent({
    model: geminiModel,
    contents: `Summarize these notes into key points and bullet notes. Highlight important lines:\n\n${text}`,
  });
  return response.text;
}

export async function summarizeFromImage(base64Image: string) {
  const response = await safeGenerateContent({
    model: geminiModel,
    contents: [
      {
        parts: [
          { text: "Extract text from this image and summarize it into key points and bullet notes. Highlight important lines. Provide the summary in a mix of Hindi and English if relevant." },
          { inlineData: { data: base64Image, mimeType: "image/jpeg" } }
        ]
      }
    ]
  });
  return response.text;
}

export async function askVoiceAssistant(query: string) {
  const prompt = `You are a smart, fast and helpful AI study assistant for the app "NIRAJ SmartStudy AI".
Your creator is NIRAJ KUMAR KANNAUJIYA.

CREATOR INFORMATION RULES:
1. If anyone asks "Who created you?" or "Who made you?" or "Tumhe kisne banaya?" or "Creator kaun hai?", ALWAYS reply with: "मुझे नीरज कुमार कन्नौजिया द्वारा डेवलप किया गया है।" (English: "I have been developed by NIRAJ KUMAR KANNAUJIYA.")
2. If anyone asks for full details about the creator, or asks "Tell me more about him" or "Uske bare mein batao", reply with the full detailed biography:
   HINDI: "${CREATOR_INFO.detailed.hi}"
   ENGLISH: "${CREATOR_INFO.detailed.en}"
3. If asked specifically about family members or location, provide ONLY that specific information:
   - Father: ${CREATOR_INFO.family.father.hi} (${CREATOR_INFO.family.father.en})
   - Mother: ${CREATOR_INFO.family.mother.hi} (${CREATOR_INFO.family.mother.en})
   - Brother: ${CREATOR_INFO.family.brother.hi} (${CREATOR_INFO.family.brother.en})
   - Sister: ${CREATOR_INFO.family.sister.hi} (${CREATOR_INFO.family.sister.en})
   - Current Location: ${CREATOR_INFO.family.location.hi} (${CREATOR_INFO.family.location.en})
   - Current Class: ${CREATOR_INFO.family.currentClass.hi} (${CREATOR_INFO.family.currentClass.en})
4. Answer in the language of the query.

SELF-CORRECTION RULE:
If the user tells you that you have written something wrong or suggests a correction, admit the mistake humbly and provide the corrected version.

Rules:
1. Answer in simple language.
2. Support both Hindi and English.
3. Keep answers VERY SHORT and CLEAR (max 2-3 sentences) unless asked for details.
4. Do not use any markdown symbols like *, #, _, etc. in your response as it will be read aloud.

User Query: ${query}`;

  try {
    const response = await safeGenerateContent({
      model: geminiModel,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        tools: [{ googleSearch: {} }]
      }
    });
    return response.text;
  } catch (err) {
    console.error(err);
    return "Maaf kijiye, main abhi connect nahi kar paa raha hoon. Kripya phir se try karein. (Sorry, I'm having trouble connecting. Please try again.)";
  }
}

/**
 * Cleans a string that might be wrapped in Markdown code blocks before parsing as JSON.
 */
function cleanJsonString(str: string): string {
  if (!str) return "";
  // Remove Markdown code blocks if present
  let cleaned = str.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }
  return cleaned;
}

export async function generateQuiz(topic: string, count: number = 5, studentClass?: string) {
  let prompt = `Generate ${count} multiple choice questions on the topic: ${topic}. `;
  if (studentClass) prompt += `Level: Class ${studentClass} (Follow CBSE and UP Board syllabus). `;
  prompt += "IMPORTANT: Provide questions and options in BOTH Hindi and English (Bilingual). For example: 'What is the capital of India? / भारत की राजधानी क्या है?'. ";
  prompt += "Return as a JSON array of objects with 'question', 'options' (array of 4 strings), 'correctIndex' (0-3), and 'explanation'.";

  const response = await safeGenerateContent({
    model: geminiModel,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "correctIndex", "explanation"]
        }
      }
    }
  });
  return JSON.parse(cleanJsonString(response.text || "[]"));
}

export async function generateAutoStudyPlan(history: any[]) {
    const localAi = getAiInstance();
    const response = await localAi.models.generateContent({
      model: geminiModel,
      contents: `Based on this student's history: ${JSON.stringify(history)}, decide what they should study today. Identify weak topics and suggest: 1. A specific topic to focus on, 2. A quick revision note, 3. A practice goal. Return as JSON with keys 'topic', 'reason', 'revisionNote', 'goal'.`,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            reason: { type: Type.STRING },
            revisionNote: { type: Type.STRING },
            goal: { type: Type.STRING }
          },
          required: ["topic", "reason", "revisionNote", "goal"]
        }
      }
    });
  return JSON.parse(cleanJsonString(response.text || "{}"));
}

export async function generateMixedQuiz(type: string, studentClass?: string) {
  let prompt = `Generate a 5-question MCQ quiz. Type: ${type}. `;
  if (studentClass) prompt += `Level: Class ${studentClass} (Follow CBSE and UP Board syllabus). `;
  prompt += "IMPORTANT: Provide questions and options in BOTH Hindi and English (Bilingual). ";
  
  if (type === 'mixed') {
    prompt += "Include questions from Math, Science, GK, Current Affairs, and Reasoning. ";
  } else if (type === 'mind') {
    prompt += "Focus on IQ, logic, and brain teasers. ";
  } else if (type === 'current_affairs') {
    prompt += "Focus on recent global and national events (Live Current Affairs). ";
  }

  prompt += "Return as a JSON array of objects with 'question', 'options' (4 strings), 'correctIndex' (0-3), and 'explanation'.";

  const response = await safeGenerateContent({
    model: geminiModel,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correctIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING }
          },
          required: ["question", "options", "correctIndex", "explanation"]
        }
      }
    }
  });
  return JSON.parse(cleanJsonString(response.text || "[]"));
}

export async function askDoubtTeacherStyle(question: string, base64Image?: string, language: 'hindi' | 'english' | 'hinglish' = 'hinglish') {
  let prompt = `Question: ${question}\n\n
    SYSTEM INSTRUCTIONS:
    1. You are a polite, expert teacher named NIRAJ AI.
    2. Respond STRICTLY in the selected language: ${language}.
    3. If language is Hindi, use ONLY Hindi. If English, use ONLY English. If Hinglish, use a mix of Hindi and English.
    4. Be very concise. Answer ONLY what is asked. Do not give long unnecessary details.
    5. Greet the user ONLY if they say "hello", "hi", "namaste", or if it is the very first message. For all other questions, answer the question DIRECTLY without repeating "Namaste! Main NIRAJ AI hoon".
    
    CREATOR INFORMATION RULES:
    1. If anyone asks "Who created you?" or "Who made you?" or "Tumhe kisne banaya?" or "Creator kaun hai?", ALWAYS reply with: "मुझे नीरज कुमार कन्नौजिया द्वारा डेवलप किया गया है।" (English: "I have been developed by NIRAJ KUMAR KANNAUJIYA.")
    2. If anyone asks for full details about the creator, or asks "Tell me more about him" or "Uske bare mein batao", reply with the full detailed biography:
       HINDI: "${CREATOR_INFO.detailed.hi}"
       ENGLISH: "${CREATOR_INFO.detailed.en}"
    3. If asked specifically about family members or location, provide ONLY that specific information:
       - Father: ${CREATOR_INFO.family.father.hi} (${CREATOR_INFO.family.father.en})
       - Mother: ${CREATOR_INFO.family.mother.hi} (${CREATOR_INFO.family.mother.en})
       - Brother: ${CREATOR_INFO.family.brother.hi} (${CREATOR_INFO.family.brother.en})
       - Sister: ${CREATOR_INFO.family.sister.hi} (${CREATOR_INFO.family.sister.en})
       - Current Location: ${CREATOR_INFO.family.location.hi} (${CREATOR_INFO.family.location.en})
       - Current Class: ${CREATOR_INFO.family.currentClass.hi} (${CREATOR_INFO.family.currentClass.en})
    4. Answer in the language of the query.

    6. SELF-CORRECTION RULE: If the user points out a mistake or provides a correction (e.g., "इसे ऐसे लिखा जाता है"), verify it carefully and provide the corrected explanation humbly.
    7. Use simple language and analogies.
    8. End with a short 'Teacher's Tip' in the selected language.
    9. For math formulas, ALWAYS use standard LaTeX with $ for inline math and $$ for block math.
    10. You have access to real-time world knowledge. Use it to provide accurate and up-to-date information.`;

  const config = {
    tools: [{ googleSearch: {} }]
  };

  if (base64Image) {
    const response = await safeGenerateContent({
      model: geminiModel,
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { data: base64Image, mimeType: "image/jpeg" } }
          ]
        }
      ],
      config
    });
    return response.text;
  } else {
    const response = await safeGenerateContent({
      model: geminiModel,
      contents: prompt,
      config
    });
    return response.text;
  }
}

export async function translateText(text: string, targetLanguage: string) {
  const response = await safeGenerateContent({
    model: geminiModel,
    contents: `Translate the following text to ${targetLanguage}. Return ONLY the translated text, no extra words:\n\n${text}`,
  });
  return response.text;
}

export async function generateSpeech(text: string, voice: 'Puck' | 'Charon' | 'Kore' | 'Fenrir' | 'Zephyr' = 'Kore') {
  try {
    const key = getApiKey();
    if (!key) return null;
    const localAi = getAiInstance();
    const response = await localAi.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text.replace(/[#*`_]/g, '') }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio;
  } catch (err) {
    console.error("Speech generation failed:", err);
    return null;
  }
}

export async function generateVoiceExplanation(topic: string, language: 'hindi' | 'english') {
  // Check if the topic is about the creator
  const lowerTopic = topic.toLowerCase();
  if (lowerTopic.includes("niraj") && lowerTopic.includes("kumar") && lowerTopic.includes("kannaujiya")) {
    return language === 'hindi' ? CREATOR_INFO.detailed.hi : CREATOR_INFO.detailed.en;
  }

  const prompt = `Explain this topic simply for a student: ${topic}. 
  Language: ${language === 'hindi' ? 'Hindi' : 'English'}. 
  Keep it under 100 words. Make it easy to understand.`;

  const response = await safeGenerateContent({
    model: geminiModel,
    contents: prompt,
  });
  return response.text;
}

export async function generateImage(prompt: string, base64Image?: string, aspectRatio: "1:1" | "16:9" | "9:16" = "1:1") {
  try {
    const localAi = getAiInstance();
    const parts: any[] = [{ text: prompt }];
    if (base64Image) {
      parts.push({
        inlineData: {
          data: base64Image.split(',')[1] || base64Image,
          mimeType: "image/jpeg"
        }
      });
    }

    const response = await localAi.models.generateContent({
      model: imageModel,
      contents: {
        parts
      },
      config: {
        imageConfig: {
          aspectRatio,
          imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (err) {
    console.error("Image generation failed:", err);
    throw err;
  }
}

export async function generateVideo(prompt: string) {
  try {
    // Create a new instance right before the call to use the latest selected API key
    const currentApiKey = (process.env as any).API_KEY || getApiKey() || "";
    const localAi = new GoogleGenAI({ apiKey: currentApiKey });

    let operation = await localAi.models.generateVideos({
      model: videoModel,
      prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await localAi.operations.getVideosOperation({ operation });
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) return null;

    const response = await fetch(downloadLink, {
      method: 'GET',
      headers: {
        'x-goog-api-key': currentApiKey,
      },
    });
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (err) {
    console.error("Video generation failed:", err);
    throw err;
  }
}

export async function recognizeHandwriting(base64Image: string) {
  const response = await safeGenerateContent({
    model: geminiModel,
    contents: [
      {
        parts: [
          { text: "Extract all handwritten text from this image. Convert it into clean, editable digital text. If there are diagrams, describe them briefly. Maintain the original structure of the notes as much as possible." },
          { inlineData: { data: base64Image, mimeType: "image/jpeg" } }
        ]
      }
    ]
  });
  return response.text;
}

export async function analyzePerformance(stats: any, quizResults: any[], notesCount: number, tasksStats: any) {
  const prompt = `Analyze this student's learning performance:
    - Average Quiz Score: ${stats.avgScore}%
    - Total Quizzes: ${stats.totalQuizzes}
    - Best Subject: ${stats.bestSubject}
    - Notes Created: ${notesCount}
    - Tasks Completed: ${tasksStats.completed}/${tasksStats.total}
    - Recent Quiz History: ${JSON.stringify(quizResults.slice(0, 5))}

    Provide a deep, professional analysis of their study habits, weak areas, and a smart recommendation for improvement. 
    Keep it professional, encouraging, and modern. 
    Return as a JSON object with keys: 'summary', 'strengths' (array), 'weaknesses' (array), 'recommendation'.`;

    const localAi = getAiInstance();
    const response = await localAi.models.generateContent({
      model: geminiModel,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            recommendation: { type: Type.STRING }
          },
          required: ["summary", "strengths", "weaknesses", "recommendation"]
        }
      }
    });
  return JSON.parse(cleanJsonString(response.text || "{}"));
}
