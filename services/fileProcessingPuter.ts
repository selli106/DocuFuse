import { readFileAsBase64, readFileAsText, isPlainTextFile } from '../utils/helpers';

// Use Gemini 2.5 Flash model via Puter.js for document parsing capabilities (PDF/Images)
const AI_MODEL_DOCS = 'gemini-2.5-flash';

// Declare puter as a global variable (loaded from script in index.html)
declare const puter: {
  ai: {
    chat: (
      prompt:
        | string
        | Array<{
            role: string;
            content:
              | string
              | Array<{ type: string; text?: string; puter_path?: string }>;
          }>,
      options?: { model?: string; stream?: boolean }
    ) => Promise<{ message: { content: string } }>;
    img2txt: (input: string | File, options?: { provider?: string; model?: string }) => Promise<string>;
  };
  fs: {
    write: (path: string, file: File | string) => Promise<{ path: string; read: () => Promise<string> }>;
    delete: (path: string) => Promise<void>;
  };
};

// Extract text from a puter.ai.chat response, handling both string and array content
const extractContent = (response: any): string => {
  const raw = response?.message?.content;
  if (!raw) return "";
  if (Array.isArray(raw)) {
    return raw.map((part: any) => part?.text ?? "").join("").trim();
  }
  return typeof raw === 'string' ? raw.trim() : String(raw).trim();
};

const getErrorMessage = (error: unknown): string => {
  if (error == null) return 'Unknown error';
  if (typeof error === 'string') return error;

  if (error instanceof Error) {
    const msg = error.message;
    if (typeof msg === 'string' && msg.trim()) return msg.trim();
    return error.name || 'Unknown error';
  }

  if (typeof error === 'object') {
    const err = error as Record<string, any>;
    const candidates = [
      err.message,
      err.error?.message,
      err.response?.message,
      err.response?.data?.message,
      err.statusText,
      err.code,
    ];

    for (const candidate of candidates) {
      if (typeof candidate === 'string' && candidate.trim()) {
        return candidate.trim();
      }
    }

    try {
      return JSON.stringify(err);
    } catch {
      return 'Unknown error';
    }
  }

  return String(error);
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

  if (!globalPuter.ai.img2txt) {
    console.warn('Puter.js img2txt not available; image processing may fall back to chat API');
  }
  
  return true;
};

export const processFileContent = async (file: File): Promise<string> => {
  // 0. Validation
  if (file.size === 0) {
    throw new Error("File appears to be empty (0 bytes).");
  }
  
  // Check file size - limit to 50MB for safety
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    throw new Error(`File is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 50MB.`);
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
  
  // 3. Construct PDF extraction prompt
  const pdfPrompt = "Extract all the text content from this PDF verbatim. Do not summarize. Do not add formatting that is not in the source. Return ONLY the extracted text content.";

  // 4. Handle images using puter.ai.img2txt
  if (mimeType.startsWith('image/')) {
    const base64Data = await readFileAsBase64(file);
    const dataUrl = `data:${mimeType};base64,${base64Data}`;
    console.log(`Processing image ${file.name} via puter.ai.img2txt...`);
    try {
      if (typeof puter.ai.img2txt !== 'function') {
        throw new Error("puter.ai.img2txt is not available in this version of Puter.js. Please refresh the page or try again later.");
      }
      const text = await puter.ai.img2txt(dataUrl);
      if (text && text.trim() !== '') {
        console.log(`Successfully processed image ${file.name}, extracted ${text.trim().length} characters`);
        return text.trim();
      }
      throw new Error("AI could not extract any text from this image. The image may contain no readable text.");
    } catch (error: any) {
      console.error("Image OCR error:", error);
      const msg = getErrorMessage(error) || "Failed to extract text from image.";
      throw new Error(msg);
    }
  }

  // 5. Handle PDFs by uploading to Puter FS and using puter_path
  if (mimeType === 'application/pdf') {
    console.log(`Processing PDF ${file.name} via puter.fs.write + puter.ai.chat with puter_path...`);
    let uploadedPath = '';
    try {
      // Upload the file to Puter's filesystem
      const tempName = `temp_docufuse_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const puterFile = await puter.fs.write(tempName, file);
      uploadedPath = puterFile.path;
      console.log(`Uploaded PDF to Puter FS at: ${uploadedPath}`);

      // Use the file content type with puter_path as documented
      const response = await puter.ai.chat(
        [
          {
            role: "user",
            content: [
              { type: "file", puter_path: uploadedPath },
              { type: "text", text: pdfPrompt }
            ]
          }
        ],
        { model: AI_MODEL_DOCS }
      );
      const content = extractContent(response);

      // Clean up the temporary file
      try { await puter.fs.delete(uploadedPath); } catch (_) { /* ignore cleanup errors */ }

      if (!content) {
        throw new Error("AI returned empty content for this PDF. The file may be scanned, encrypted, or contain no extractable text.");
      }
      console.log(`Successfully processed PDF ${file.name}, extracted ${content.length} characters`);
      return content;
    } catch (error: any) {
      // Clean up on error too
      if (uploadedPath) {
        try { await puter.fs.delete(uploadedPath); } catch (_) { /* ignore */ }
      }
      console.error("PDF processing error:", error);
      let msg = getErrorMessage(error);
      if (msg.includes("document has no pages")) {
        msg = "AI could not read pages from this PDF. It may be password-protected, encrypted, or contain unsupported formatting.";
      } else if (msg.includes("400") || msg.includes("INVALID_ARGUMENT")) {
        msg = "Could not parse PDF content. The file may be password-protected or use an unsupported format.";
      } else if (!msg.includes("empty content")) {
        msg = `Failed to extract text from PDF: ${msg}`;
      }
      throw new Error(msg);
    }
  }

  // 6. Handle RTF files
  if (file.name.endsWith('.rtf') || mimeType.includes('rtf')) {
    try {
      const rawRtf = await readFileAsText(file);
      const rtfResponse = await puter.ai.chat(
        `Decode the following RTF (Rich Text Format) data into plain text. Remove all control codes and formatting metadata. Return only the readable text content:\n\n${rawRtf.substring(0, 500000)}`,
        { model: AI_MODEL_DOCS }
      );
      return extractContent(rtfResponse) || "";
    } catch (err) {
      console.warn("RTF text extraction failed", err);
      throw new Error("Failed to process RTF file.");
    }
  }

  // 7. Fallback for other binary formats via uploading to Puter FS
  const fallbackPrompt = "Extract all the text content from this file verbatim. Do not summarize. Do not add formatting that is not in the source. Return ONLY the content.";

  console.log(`Processing ${file.name} (${file.type || mimeType}) via Puter.js AI...`);
  let uploadedPath = '';

  try {
    const tempName = `temp_docufuse_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const puterFile = await puter.fs.write(tempName, file);
    uploadedPath = puterFile.path;

    const response = await puter.ai.chat(
      [
        {
          role: "user",
          content: [
            { type: "file", puter_path: uploadedPath },
            { type: "text", text: fallbackPrompt }
          ]
        }
      ],
      { model: AI_MODEL_DOCS }
    );

    // Clean up
    try { await puter.fs.delete(uploadedPath); } catch (_) { /* ignore */ }

    const content = extractContent(response);
    console.log(`Successfully processed ${file.name}, extracted ${content.length} characters`);
    return content;
  } catch (error: any) {
    if (uploadedPath) {
      try { await puter.fs.delete(uploadedPath); } catch (_) { /* ignore */ }
    }
    console.error("Puter.js AI processing error:", error);

    let msg = getErrorMessage(error) || "Unknown error occurred";

    if (msg.includes("401") || msg.includes("unauthorized") || msg.includes("permission")) {
      msg = "Authentication failed. Please ensure Puter.js is properly configured.";
    } else if (msg.includes("429") || msg.includes("quota") || msg.includes("rate limit")) {
      msg = "API rate limit exceeded. Please wait a moment and try again.";
    } else if (msg.includes("timeout")) {
      msg = "Request timed out. The file may be too large or the API is slow. Please try again.";
    } else if (msg.includes("network") || msg.includes("fetch")) {
      msg = "Network error occurred. Please check your internet connection.";
    } else if (!msg || msg === "Unknown") {
      msg = `File processing failed: ${error?.status || 'unknown status'}. Please check the browser console for details.`;
    }

    console.error(`Error processing ${file.name}:`, {
      originalError: error,
      message: msg,
      status: error?.status,
      code: error?.code
    });

    throw new Error(msg);
  }
};

// No-op for compatibility - Puter.js handles auth automatically
export const resetAI = () => {};
