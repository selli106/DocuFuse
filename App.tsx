import React, { useState, useCallback, useEffect } from 'react';
import { FileStatus, UploadedFile, OutputFormat, CombinerSettings } from './types';
import { generateId, downloadBlob } from './utils/helpers';
import { processFileContent } from './services/fileProcessing';

import DropZone from './components/DropZone';
import FileItem from './components/FileItem';
import CombinerControls from './components/CombinerControls';
import { Sparkles, Layers, FileStack, AlertTriangle } from 'lucide-react';

const App: React.FC = () => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [settings, setSettings] = useState<CombinerSettings>({
    outputFormat: OutputFormat.MARKDOWN,
    includeFilenames: true,
    separator: '\n\n---\n\n',
  });

  // Derived state
  const isProcessingFiles = files.some(f => f.status === FileStatus.PENDING || f.status === FileStatus.PROCESSING);
  const hasCompletedFiles = files.some(f => f.status === FileStatus.COMPLETED);

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

    const combinedContent = readyFiles.map(f => {
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

    // Download
    const blob = new Blob([combinedContent], { type: 'text/plain;charset=utf-8' });
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

        {!process.env.API_KEY && (
           <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
             <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
             <div className="text-sm text-yellow-200">
               <p className="font-semibold">Missing API Key</p>
               <p className="opacity-80">AI features for PDF/Image extraction are disabled. Only plain text files will be processed locally.</p>
             </div>
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