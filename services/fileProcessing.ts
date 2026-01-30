import { GoogleGenAI } from "@google/genai";
import { readFileAsBase64, readFileAsText, isPlainTextFile } from '../utils/helpers';
import { UploadedFile } from '../types';

const AI_MODEL_TEXT = 'gemini-3-flash-preview';

let genAI: GoogleGenAI | null = null;

const getAI = () => {
  if (!genAI) {
    if (!process.env.API_KEY) {
      console.warn("API Key not found in process.env.API_KEY");
      // We don't throw here to allow plain text processing even without API key
    }
    genAI = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }
  return genAI;
};

export const processFileContent = async (file: File): Promise<string> => {
  // 1. Handle Plain Text locally to save tokens and time
  if (isPlainTextFile(file.type, file.name)) {
    try {
      return await readFileAsText(file);
    } catch (e) {
      console.error("Local text read failed, falling back to AI if possible", e);
    }
  }

  // 2. Handle Complex Files (PDF, RTF, Images) via Gemini
  const ai = getAI();
  if (!ai) throw new Error("AI Service unavailable");
  
  const base64Data = await readFileAsBase64(file);
  
  // Construct prompt based on file type
  let prompt = "Extract all the text content from this file verbatim. Do not summarize. Do not add markdown formatting unless it exists in the source. Return ONLY the content.";
  
  if (file.type.includes('image')) {
    prompt = "Transcribe the text found in this image accurately. Return only the text.";
  } else if (file.name.endsWith('.rtf') || file.type.includes('rtf')) {
    // For RTF, we might send the raw text if it's small enough, but base64 is safer for the model to "see" the file structure if treated as a doc.
    // However, Gemini Flash supports PDF and Image directly. RTF is not a native "part" mime type usually, so we treat it as text processing if possible, or an image if it was a screenshot.
    // Strategy: Read RTF as text (raw control codes) and ask Gemini to decode.
    try {
      const rawRtf = await readFileAsText(file);
      const rtfResponse = await ai.models.generateContent({
        model: AI_MODEL_TEXT,
        contents: `Decode the following RTF (Rich Text Format) data into plain text. Remove all control codes and formatting metadata. Return only the readable text content:\n\n${rawRtf.substring(0, 500000)}`, // Limit to avoid hitting limits if huge
      });
      return rtfResponse.text || "";
    } catch (err) {
       console.warn("RTF Text extraction failed, trying fallback", err);
       // Fallback to base64 if needed, but text prompt is usually better for RTF logic
       throw err;
    }
  }

  // PDF or other supported binaries
  try {
    const response = await ai.models.generateContent({
      model: AI_MODEL_TEXT,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: file.type,
              data: base64Data
            }
          },
          {
            text: prompt
          }
        ]
      }
    });

    return response.text || "";
  } catch (error: any) {
    console.error("Gemini processing error:", error);
    throw new Error(`Failed to process file with AI: ${error.message || "Unknown error"}`);
  }
};
