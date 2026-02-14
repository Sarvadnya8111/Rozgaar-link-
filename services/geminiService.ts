
import { GoogleGenAI } from "@google/genai";
import { ShopType, JobRole, Language } from '../types';

let aiClient: GoogleGenAI | null = null;

const getAiClient = () => {
    if (!aiClient) {
        // Fallback for demo purposes if env var is missing to avoid crashing immediately,
        // though strictly we should expect it.
        const apiKey = process.env.API_KEY || ''; 
        if (apiKey) {
            aiClient = new GoogleGenAI({ apiKey });
        }
    }
    return aiClient;
};

export const generateJobDescription = async (
    role: JobRole,
    shopType: ShopType,
    location: string,
    salaryRange: string,
    allowances: string[] = [],
    education: string = "None",
    language: Language = 'en'
): Promise<string> => {
    const client = getAiClient();
    
    // Map language for the prompt instruction
    const langMap: Record<Language, string> = {
        'en': 'English',
        'hi': 'Hindi',
        'mr': 'Marathi'
    };
    const targetLang = langMap[language];

    // Fallback if client is not available or key is missing
    if (!client) {
        console.warn("API Key not found, returning mock description");
        return `We are looking for a ${role} at our ${shopType} in ${location}. Salary is ${salaryRange}. ${allowances.length > 0 ? `Benefits: ${allowances.join(', ')}.` : ''} Please apply if interested.`;
    }

    try {
        const allowanceText = allowances.length > 0 ? `Benefits: ${allowances.join(', ')}` : 'Benefits: Standard';
        const educationText = education !== 'None' ? `Education: ${education}` : 'Education: Not required';

        // Optimized prompt for speed and conciseness
        const prompt = `
Act as a fast, efficient HR Assistant.

Task:
Generate a concise Job Description for the role of: ${role} at a ${shopType} in ${location}.

Details provided:
- Salary Range: ₹${salaryRange}
- ${allowanceText}
- ${educationText}

Constraints for Speed:
1. STRICT WORD LIMIT: Do not exceed 150 words total.
2. NO FLUFF: Do not write introductory or concluding paragraphs.
3. FORMAT: Use bullet points only.
4. LANGUAGE: Translate the output to ${targetLang}.

Output Structure:
* **Role Title**
* **One-line Summary** (Max 15 words)
* **Key Responsibilities** (List exactly 3 bullet points)
* **Requirements** (List exactly 3 bullet points)
* **Salary & Benefits**

Tone:
Simple, direct, and easy to understand.
`;

        const response = await client.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: {
                // Disable thinking to ensure fast response and avoid timeouts
                thinkingConfig: { thinkingBudget: 0 }
            }
        });

        return response.text || "Description unavailable.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        // Robust fallback on API failure
        return `We are hiring a ${role} for our ${shopType} in ${location}. Competitive salary of ₹${salaryRange}. ${allowances.length > 0 ? `Includes ${allowances.join(', ')}.` : ''} Immediate joining.`;
    }
};

export const generateInterviewQuestions = async (role: JobRole): Promise<string[]> => {
     const client = getAiClient();
     if(!client) return ["Tell us about your experience.", "When can you join?"];

     try {
         const prompt = `List 3 simple interview questions in English for a ${role} candidate in India. Return as a JSON array of strings only.`;
         const response = await client.models.generateContent({
             model: 'gemini-3-flash-preview',
             contents: prompt,
             config: { 
                 responseMimeType: 'application/json',
                 // Disable thinking to ensure fast response
                 thinkingConfig: { thinkingBudget: 0 }
             }
         });
         
         const text = response.text;
         if(text) return JSON.parse(text);
         return ["Tell us about yourself.", "Do you have prior experience?"];
     } catch (e) {
         // Silent fallback
         return ["Tell us about yourself.", "Do you have prior experience?"];
     }
}
