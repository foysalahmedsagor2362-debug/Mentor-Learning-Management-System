import { GoogleGenAI, Type } from "@google/genai";
import { GEMINI_FLASH_MODEL, GEMINI_PRO_MODEL } from "../constants";

const getAiClient = () => {
  // Try to retrieve API key from various common environment variable patterns
  // Vite uses import.meta.env.VITE_API_KEY
  // Create React App uses process.env.REACT_APP_API_KEY
  // Standard Node uses process.env.API_KEY
  
  // @ts-ignore - Handle potential TS errors if types aren't set for import.meta
  const apiKey = import.meta.env?.VITE_API_KEY || 
                 process.env.REACT_APP_API_KEY || 
                 process.env.API_KEY;

  if (!apiKey) {
    console.error("API_KEY is missing. Please set VITE_API_KEY in your environment variables.");
    throw new Error("API Key missing");
  }
  return new GoogleGenAI({ apiKey });
};

// --- Routine Generation ---
export const generateRoutine = async (
  profile: string,
  weaknesses: string,
  hoursPerDay: number,
  goal: string,
  duration: 'Daily' | 'Weekly' | 'Monthly',
  topics: string
) => {
  const ai = getAiClient();
  const prompt = `
    You are an expert academic counselor for "Aimers", a platform for Bangladeshi students.
    Create a ${duration} study routine for a Class 11/12 student.
    
    Student Goal: ${goal}
    Student Profile: ${profile}
    Specific Topics to Cover: ${topics}
    Weaknesses: ${weaknesses}
    Study Hours/Day: ${hoursPerDay}
    
    Instructions:
    - If "Daily", provide a detailed hour-by-hour breakdown for 1 day.
    - If "Weekly", provide a plan for 7 days.
    - If "Monthly", provide a plan for 4 weeks (summarized focus per week/day).
    
    Focus Logic:
    - Medical: Biology/Chemistry details.
    - Engineering: Math/Physics problem solving.
    - GPA 5: Balance all subjects.

    Return a JSON object with a list of schedule slots/items.
  `;

  const response = await ai.models.generateContent({
    model: GEMINI_FLASH_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          routine: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                day: { type: Type.STRING, description: "e.g., 'Monday', 'Day 1', or 'Week 1'" },
                timeSlot: { type: Type.STRING, description: "e.g., '6:00 AM - 8:00 AM'" },
                subject: { type: Type.STRING },
                activity: { type: Type.STRING }
              }
            }
          },
          advice: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

// --- Mock Test Generation ---
export const generateMockTest = async (
  subject: string, 
  topic: string, 
  goal: string,
  pdfData?: string
) => {
  const ai = getAiClient();
  
  let prompt = "";
  let parts: any[] = [];
  
  if (pdfData) {
    // If PDF is provided, we prioritize the PDF content for "detection"
    parts.push({
      inlineData: {
        mimeType: "application/pdf",
        data: pdfData
      }
    });
    prompt = `
      Analyze the attached PDF document. Identify the subject and key topics automatically.
      Create a 10-question MCQ mock test based STRICTLY on the content of this PDF.
      
      Target Audience: HSC Student preparing for ${goal}.
      The questions should be relevant to the detected subject in the PDF.
      
      Return strictly JSON.
    `;
  } else {
    // Standard generation based on dropdowns
    prompt = `
      Create a 10-question MCQ mock test for HSC level ${subject} on the topic "${topic}".
      
      Target Audience: Student preparing for ${goal}.
      - For Medical: Questions should be knowledge-based, precise, biology/chemistry heavy.
      - For Engineering: Questions should be conceptual, mathematical, problem-solving based.
      - For GPA 5: Standard Board standard creative questions converted to MCQ.

      Return strictly JSON.
    `;
  }
  
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: GEMINI_PRO_MODEL,
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.INTEGER },
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.INTEGER, description: "Index of correct option (0-3)" },
                explanation: { type: Type.STRING }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text || "{}");
};

// --- Smart Notes / Summarization ---
export const processStudyMaterial = async (
  text: string | null,
  link: string | null,
  fileData?: { mimeType: string; data: string }
) => {
  const ai = getAiClient();
  const parts: any[] = [];

  if (link) {
    // Specific instruction for YouTube or generic links to ensure content is actually processed
    parts.push({ text: `
      Analyze the content from this link: ${link}. 
      CRITICAL: If this is a YouTube link or a video URL, you MUST use the Google Search tool to find the video transcript, summary, or description to understand the content. 
      Do NOT just return the title. Write a detailed summary based on the actual educational content found at the link.
    `});
  }
  if (text) {
    parts.push({ text: `Content text: ${text}` });
  }
  if (fileData) {
    parts.push({
      inlineData: {
        mimeType: fileData.mimeType,
        data: fileData.data
      }
    });
  }

  const jsonInstruction = `
    Generate a study summary for a Bangladeshi HSC student.
    Include: 
    1. A concise summary. 
    2. Key bullet points. 
    3. Important formulas (if any). 
    4. 3 potential short questions with answers.

    IMPORTANT: Return the response as a raw JSON object (no markdown formatting like \`\`\`json) with this exact structure:
    {
      "title": "Topic Title",
      "summary": "Full summary text...",
      "keyPoints": ["Point 1", "Point 2"],
      "formulas": ["Formula 1", "Formula 2"],
      "potentialQuestions": [{"question": "Q1", "answer": "A1"}]
    }
  `;
  parts.push({ text: jsonInstruction });

  const config: any = {};
  
  // Rules: 
  // 1. If googleSearch is used, responseSchema and responseMimeType are NOT allowed.
  // 2. We use googleSearch if a link is provided.
  if (link) {
    config.tools = [{ googleSearch: {} }];
  } else {
    // If no link, we can safely use responseSchema for robust JSON generation
    config.responseMimeType = "application/json";
    config.responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        summary: { type: Type.STRING },
        keyPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
        formulas: { type: Type.ARRAY, items: { type: Type.STRING } },
        potentialQuestions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING },
              answer: { type: Type.STRING }
            }
          }
        }
      }
    };
  }

  const response = await ai.models.generateContent({
    model: GEMINI_FLASH_MODEL,
    contents: { parts },
    config: config
  });

  let jsonStr = response.text || "{}";

  // If we used search, the model might output Markdown code blocks even if we asked for raw JSON.
  // We need to strip them.
  if (link) {
    jsonStr = jsonStr.replace(/```json/gi, '').replace(/```/g, '').trim();
  }

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse JSON response:", jsonStr);
    // Return a fallback object so the UI doesn't crash
    return {
      title: "Processing Error",
      summary: "Could not parse the AI response. It might be due to a complex website layout. Try pasting the text directly.",
      keyPoints: [],
      formulas: [],
      potentialQuestions: []
    };
  }
};

// --- AI Chat ---
export const sendChatMessage = async (
  history: { role: string; parts: { text: string }[] }[],
  newMessage: string,
  attachment?: { mimeType: string; data: string },
  language: 'bengali' | 'english' = 'bengali'
) => {
  const ai = getAiClient();
  
  const systemInstruction = language === 'bengali'
    ? "You are 'Aimers AI Teacher', a friendly and expert tutor for HSC students in Bangladesh. You MUST answer all questions in BENGALI (Bangla). You can explain Physics, Chemistry, Math, and Biology topics. You can read images and PDFs uploaded by the student to solve problems step-by-step or generate MCQ questions from them. Be encouraging and use emojis."
    : "You are 'Aimers AI Teacher', a friendly and expert tutor for HSC students in Bangladesh. You MUST answer all questions in ENGLISH. You can explain Physics, Chemistry, Math, and Biology topics. You can read images and PDFs uploaded by the student to solve problems step-by-step or generate MCQ questions from them. Be encouraging and use emojis.";

  const chat = ai.chats.create({
    model: GEMINI_PRO_MODEL,
    history: history.map(h => ({
      role: h.role,
      parts: h.parts
    })),
    config: {
      systemInstruction: systemInstruction
    }
  });

  const parts: any[] = [{ text: newMessage }];
  if (attachment) {
    parts.push({
      inlineData: {
        mimeType: attachment.mimeType,
        data: attachment.data
      }
    });
  }

  const result = await chat.sendMessage({
    message: parts
  });

  return result.text;
};