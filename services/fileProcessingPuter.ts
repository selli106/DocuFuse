import { readFileAsBase64, readFileAsText, isPlainTextFile } from '../utils/helpers';

// Use Gemini 2.5 Flash model via Puter.js for document parsing capabilities (PDF/Images)
const AI_MODEL_DOCS = 'gemini-2.5-flash';

// Declare puter as a global variable (loaded from script in index.html)
declare const puter: {
  ai: {
    chat: (
      prompt: string | Array<{ type: string; text?: string; imageUrl?: string }>,
      options?: { model?: string }
    ) => Promise<{ message: { content: string } }>;
  };
};

// Check if puter is available
const isPuterAvailable = (): boolean => {
  if (typeof window === 'undefined') {
    console.error('Window object not available');
    return false;
  }
  
  const globalPuter = (window as any).puter;
  
  if (!globalPuter) {
    console.error('Puter.js global object not found');
    return false;
  }
  
  if (!globalPuter.ai || !globalPuter.ai.chat) {
    console.error('Puter.js AI features not available');
    return false;
  }
  
  return true;
};

export const processFileContent = async (file: File): Promise<string> => {
  // 0. Validation
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

  // 2. Handle Complex Files (PDF, RTF, Images) via Puter.js AI
  if (!isPuterAvailable()) {
    throw new Error("Puter.js is not loaded. Please ensure the page is loaded correctly and try refreshing.");
  }
  
  const puter = (window as any).puter;
  
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
      const rtfResponse = await puter.ai.chat(
        `Decode the following RTF (Rich Text Format) data into plain text. Remove all control codes and formatting metadata. Return only the readable text content:\n\n${rawRtf.substring(0, 500000)}`,
        { model: AI_MODEL_DOCS }
      );
      return rtfResponse.message?.content || "";
    } catch (err) {
       console.warn("RTF Text extraction failed", err);
       throw new Error("Failed to process RTF file.");
    }
  }

  // 4. Process PDF / Binary / Images
  const base64Data = await readFileAsBase64(file);
  const dataUrl = `data:${mimeType};base64,${base64Data}`;
  
  try {
    // Use puter.ai.chat with image/document data URL for vision capabilities
    const response = await puter.ai.chat(
      [
        { type: "image", imageUrl: dataUrl },
        { type: "text", text: prompt }
      ],
      { model: AI_MODEL_DOCS }
    );

    return response.message?.content || "";
  } catch (error: any) {
    console.error("Puter.js AI processing error:", error);
    let msg = error.message || "Unknown error";
    
    if (msg.includes("document has no pages")) {
      msg = "AI could not read pages from this PDF. It may be password-protected, encrypted, or contain unsupported formatting.";
    } else if (msg.includes("400") || msg.includes("INVALID_ARGUMENT")) {
      msg = "Unsupported file format or content could not be parsed by AI.";
    }
    
    throw new Error(`${msg}`);
  }
};

// No-op for compatibility - Puter.js handles auth automatically
export const resetAI = () => {};
