import { GoogleGenAI } from "@google/genai";
import { readFileAsBase64, readFileAsText, isPlainTextFile } from '../utils/helpers';
import { UploadedFile } from '../types';

// Use Pro model for better document parsing capabilities (PDF/Images)
const AI_MODEL_DOCS = 'gemini-3-pro-preview';

let genAI: GoogleGenAI | null = null;

export const resetAI = () => {
  genAI = null;
};

const getAI = () => {
  if (!genAI) {
    const apiKey = process.env.API_KEY || localStorage.getItem('gemini_api_key') || '';
    if (!apiKey) {
      console.warn("API Key not found in process.env.API_KEY or localStorage");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
};

export const processFileContent = async (file: File): Promise<string> => {
  // 0. Validation
  // Relaxed 0-byte check slightly or ensure message is clear. 
  // If file.size is truly 0, FileReader often fails or returns empty string anyway.
  if (file.size === 0) {
    throw new Error("File appears to be empty (0 bytes).");
  }

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
  
  // Ensure we have a valid mimeType.
  let mimeType = file.type;
  if (!mimeType) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    const mimeMap: Record<string, string> = {
      'pdf': 'application/pdf',
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'webp': 'image/webp',
      'heic': 'image/heic',
      'heif': 'image/heif',
    };
    mimeType = mimeMap[ext || ''] || '';
  }

  if (!mimeType) {
    throw new Error(`Could not determine file type for ${file.name}. Please try converting it to a supported format (PDF, Image, Text).`);
  }
  
  // 3. Construct Prompt
  let prompt = "Extract all the text content from this file verbatim. Do not summarize. Do not add markdown formatting unless it exists in the source. Return ONLY the content.";
  
  if (mimeType.startsWith('image/')) {
    prompt = "Transcribe the text found in this image accurately. Return only the text.";
  } else if (file.name.endsWith('.rtf') || mimeType.includes('rtf')) {
    try {
      const rawRtf = await readFileAsText(file);
      const rtfResponse = await ai.models.generateContent({
        model: AI_MODEL_DOCS,
        contents: `Decode the following RTF (Rich Text Format) data into plain text. Remove all control codes and formatting metadata. Return only the readable text content:\n\n${rawRtf.substring(0, 500000)}`,
      });
      return rtfResponse.text || "";
    } catch (err) {
       console.warn("RTF Text extraction failed", err);
       throw new Error("Failed to process RTF file.");
    }
  }

  // 4. Process PDF / Binary / Images
  const base64Data = await readFileAsBase64(file);
  
  try {
    const response = await ai.models.generateContent({
      model: AI_MODEL_DOCS, // Using Pro model for better PDF handling
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
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
    let msg = error.message || "Unknown error";
    
    if (msg.includes("API key")) {
        msg = "Invalid or missing API Key. Please configure it above.";
    } else if (msg.includes("document has no pages")) {
        // This specific error from Gemini means it parsed the PDF structure but found no renderable pages.
        msg = "Gemini could not read pages from this PDF. It may be password-protected, encrypted, or contain unsupported formatting.";
    } else if (msg.includes("400") || msg.includes("INVALID_ARGUMENT")) {
        msg = "Unsupported file format or content could not be parsed by AI.";
    }
    
    throw new Error(`${msg}`);
  }
};