
import { GoogleGenAI } from "@google/genai";
import { Patient, CareTask } from "../types";

export async function getPatientInsight(patient: Patient, tasks: CareTask[]) {
  try {
    // Initializing GoogleGenAI right before the API call to ensure use of the correct environment configuration
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const taskSummary = tasks.map(t => `- ${t.title} (${t.status})`).join('\n');
    const prompt = `
      As a clinical coordinator assistant, summarize the status for:
      Patient: ${patient.name} (${patient.age}, ${patient.gender})
      Diagnosis: ${patient.diagnosis}
      Current Condition: ${patient.condition}
      
      Recent Workflow Tasks:
      ${taskSummary}
      
      Provide a concise 2-sentence clinical summary and one "Next Action" suggestion for the medical team.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    // Directly access the .text property from the GenerateContentResponse object
    return response.text || "Insight unavailable at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The clinical AI assistant is currently offline.";
  }
}
