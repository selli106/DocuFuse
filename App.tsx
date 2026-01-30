import React, { useState, useCallback, useEffect } from 'react';
import { FileStatus, UploadedFile, OutputFormat, CombinerSettings } from './types';
import { generateId, downloadBlob } from './utils/helpers';
import { processFileContent, resetAI } from './services/fileProcessing';

import DropZone from './components/DropZone';
import FileItem from './components/FileItem';
import CombinerControls from './components/CombinerControls';
import { Sparkles, Layers, FileStack, AlertTriangle, Key } from 'lucide-react';

const App: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [settings, setSettings] = useState<CombinerSettings>({
    outputFormat: OutputFormat.MARKDOWN,
    includeFilenames: true,
    separator: '\n\n---\n\n',
  });
  
  // API Key State for GH Pages / Static hosting
  const [localApiKey, setLocalApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
  const [tempApiKey, setTempApiKey] = useState('');
  
  const hasValidKey = !!process.env.API_KEY || !!localApiKey;

  // Derived state
  const isProcessingFiles = files.some(f => f.status === FileStatus.PENDING || f.status === FileStatus.PROCESSING);
  const hasCompletedFiles = files.some(f => f.status === FileStatus.COMPLETED);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempApiKey.trim()) return;
    
    localStorage.setItem('gemini_api_key', tempApiKey.trim());
    setLocalApiKey(tempApiKey.trim());
    setTempApiKey('');
    resetAI(); // Reset the AI service to use the new key
  };

  const clearKey = () => {
    localStorage.removeItem('gemini_api_key');
    setLocalApiKey('');
    resetAI();
  };

  // Auto-process files when they are added
  useEffect(() => {
    const pendingFiles = files.filter(f => f.status === FileStatus.PENDING);
    
    if (pendingFiles.length === 0) return;

    // 1. Mark pending files as PROCESSING immediately to prevent duplicate triggers
    setFiles(prev => prev.map(f => 
      f.status === FileStatus.PENDING ? { ...f, status: FileStatus.PROCESSING } : f
    ));

    // 2. Process each file
    pendingFiles.forEach(async (fileItem) => {
      try {
        const content = await processFileContent(fileItem.file);
        
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: FileStatus.COMPLETED, content } 
            : f
        ));
      } catch (error: any) {
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id 
            ? { ...f, status: FileStatus.ERROR, errorMessage: error.message } 
            : f
        ));
      }
    });
  }, [files]);

  const handleFilesAdded = useCallback((newFiles: File[]) => {
    const uploadedFiles: UploadedFile[] = newFiles.map(file => ({
      id: generateId(),
      file,
      status: FileStatus.PENDING,
      content: null,
      originalName: file.name,
      type: file.type
    }));

    setFiles(prev => [...prev, ...uploadedFiles]);
  }, []);

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    setFiles(prev => {
      const newFiles = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      
      if (targetIndex >= 0 && targetIndex < newFiles.length) {
        [newFiles[index], newFiles[targetIndex]] = [newFiles[targetIndex], newFiles[index]];
      }
      return newFiles;
    });
  };

  const handleCombineAndDownload = () => {
    const readyFiles = files.filter(f => f.status === FileStatus.COMPLETED && f.content);
    
    if (readyFiles.length === 0) return;

    let finalContent = '';
    let mimeType = 'text/plain;charset=utf-8';

    // 1. Structured Data Formats
    if (settings.outputFormat === OutputFormat.JSON) {
      const data = readyFiles.map(f => ({
        filename: f.originalName,
        type: f.type,
        content: f.content
      }));
      finalContent = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
    
    } else if (settings.outputFormat === OutputFormat.XML) {
      const escapeXml = (unsafe: string) => unsafe.replace(/[<>&'"]/g, c => {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
          case '"': return '&quot;';
          default: return c;
        }
      });
      
      finalContent = '<?xml version="1.0" encoding="UTF-8"?>\n<documents>\n' + 
        readyFiles.map(f => 
          `  <document>\n` +
          `    <filename>${escapeXml(f.originalName)}</filename>\n` +
          `    <content><![CDATA[${f.content}]]></content>\n` +
          `  </document>`
        ).join('\n') + 
        '\n</documents>';
      mimeType = 'application/xml';

    } else if (settings.outputFormat === OutputFormat.CSV) {
      // Simple CSV generation: filename, content
      const escapeCsv = (str: string) => {
        const escaped = str.replace(/"/g, '""'); 
        return `"${escaped}"`;
      };
      
      finalContent = 'filename,content\n' + 
        readyFiles.map(f => `${escapeCsv(f.originalName)},${escapeCsv(f.content || '')}`).join('\n');
      mimeType = 'text/csv';

    } else {
      // 2. Text-Based Formats (MD, TXT, HTML)
      finalContent = readyFiles.map(f => {
        let section = '';
        
        // Add Header
        if (settings.includeFilenames) {
          if (settings.outputFormat === OutputFormat.MARKDOWN) {
            section += `# File: ${f.originalName}\n\n`;
          } else if (settings.outputFormat === OutputFormat.HTML) {
            section += `<h2>File: ${f.originalName}</h2>\n`;
          } else {
            section += `=== File: ${f.originalName} ===\n\n`;
          }
        }

        // Add Content
        section += f.content;

        return section;
      }).join(settings.separator || '\n\n');

      if (settings.outputFormat === OutputFormat.HTML) {
        mimeType = 'text/html';
        finalContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Combined Documents</title>
  <style>body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; line-height: 1.5; padding: 0 1rem; }</style>
</head>
<body>
${finalContent}
</body>
</html>`;
      }
    }

    // Download
    const blob = new Blob([finalContent], { type: mimeType });
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    downloadBlob(blob, `combined_docs_${timestamp}.${settings.outputFormat}`);
  };

  return (
    <div className="min-h-screen p-6 md:p-12 flex justify-center">
      <div className="w-full max-w-4xl space-y-8">
        
        {/* Header */}
        <header className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-blue-600/20 rounded-2xl mb-2 ring-1 ring-blue-500/40">
            <Layers className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
            DocuFuse
          </h1>
          <p className="text-slate-400 max-w-lg mx-auto text-lg leading-relaxed">
            Combine <span className="text-blue-400 font-medium">PDF, Docs, Code, & Web</span> files into a single unified document. 
            Powered by Gemini AI for intelligent extraction.
          </p>
        </header>

        {/* API Key Configuration for Static Hosting */}
        {!hasValidKey ? (
           <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
             <div className="flex items-start gap-3">
               <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
               <div className="flex-1">
                 <h3 className="text-sm font-semibold text-yellow-200 mb-1">Missing API Key</h3>
                 <p className="text-sm text-yellow-200/80 mb-3">
                   To use AI features (PDF/Image processing), please enter your Gemini API Key. 
                   It will be stored locally in your browser.
                 </p>
                 <form onSubmit={handleSaveKey} className="flex gap-2 max-w-md">
                   <input 
                     type="password" 
                     value={tempApiKey}
                     onChange={(e) => setTempApiKey(e.target.value)}
                     placeholder="Enter Gemini API Key"
                     className="flex-1 bg-slate-900/50 border border-yellow-500/30 rounded px-3 py-2 text-sm text-yellow-100 placeholder-yellow-500/30 focus:outline-none focus:border-yellow-500 transition-colors"
                   />
                   <button 
                     type="submit"
                     disabled={!tempApiKey}
                     className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-200 text-sm font-medium rounded transition-colors disabled:opacity-50"
                   >
                     Save Key
                   </button>
                 </form>
               </div>
             </div>
           </div>
        ) : !process.env.API_KEY && (
          // Show "Managed Key" state if using local storage
          <div className="flex justify-end">
            <button 
              onClick={clearKey}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 transition-colors"
            >
              <Key className="w-3 h-3" />
              Clear Local API Key
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Input */}
          <div className="lg:col-span-2 space-y-6">
            <DropZone onFilesAdded={handleFilesAdded} />
            
            {/* File List */}
            {files.length > 0 && (
              <div className="space-y-3">
                 <div className="flex items-center justify-between px-2">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <FileStack className="w-4 h-4" />
                      Queue ({files.length})
                    </h2>
                    <button 
                      onClick={() => setFiles([])} 
                      className="text-xs text-red-400 hover:text-red-300 transition-colors"
                    >
                      Clear All
                    </button>
                 </div>
                 
                 <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                   {files.map((file, idx) => (
                     <FileItem 
                       key={file.id} 
                       file={file} 
                       index={idx} 
                       total={files.length}
                       onRemove={removeFile}
                       onMoveUp={(i) => moveFile(i, 'up')}
                       onMoveDown={(i) => moveFile(i, 'down')}
                     />
                   ))}
                 </div>
              </div>
            )}
          </div>

          {/* Right Column: Controls */}
          <div className="lg:col-span-1">
             <div className="sticky top-8">
               <CombinerControls 
                 settings={settings}
                 onSettingsChange={setSettings}
                 onCombine={handleCombineAndDownload}
                 canCombine={hasCompletedFiles && !isProcessingFiles}
                 isCombining={isProcessingFiles}
               />

               {/* Hint Box */}
               <div className="mt-6 p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 backdrop-blur-sm">
                 <div className="flex items-center gap-2 mb-2 text-blue-400">
                   <Sparkles className="w-4 h-4" />
                   <span className="text-sm font-semibold">Pro Tip</span>
                 </div>
                 <p className="text-xs text-slate-400 leading-5">
                   DocuFuse uses <strong>Gemini 2.5</strong> to intelligently read complex formats like PDFs and Images. 
                   Code and text files are processed locally for instant speed.
                 </p>
               </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default App;