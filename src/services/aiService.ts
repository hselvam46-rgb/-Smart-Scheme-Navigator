import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateEligibilityExplanation(schemeName: string, inputs: any, isEligible: boolean) {
  const prompt = `
    You are an expert in government schemes. 
    The user is checking eligibility for the scheme: "${schemeName}".
    User details: ${JSON.stringify(inputs)}.
    Eligibility Result: ${isEligible ? 'Eligible' : 'Not Eligible'}.
    
    Provide a simple, human-readable explanation of why they are ${isEligible ? 'eligible' : 'not eligible'}.
    Focus on the specific rules (Age, Income, Education, Category).
    
    Return the response in JSON format with two fields:
    - explanationEn: Simple English explanation.
    - explanationTa: Simple Tamil explanation.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      explanationEn: "Unable to generate explanation at this time.",
      explanationTa: "தற்போது விளக்கத்தை உருவாக்க முடியவில்லை."
    };
  }
}
