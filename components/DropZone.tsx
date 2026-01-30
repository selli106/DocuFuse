import React, { useCallback, useState } from 'react';
import { Upload, FileText, Plus } from 'lucide-react';

interface DropZoneProps {
  onFilesAdded: (files: File[]) => void;
}

const DropZone: React.FC<DropZoneProps> = ({ onFilesAdded }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesAdded(Array.from(e.dataTransfer.files));
    }
  }, [onFilesAdded]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesAdded(Array.from(e.target.files));
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative group cursor-pointer
        border-2 border-dashed rounded-2xl transition-all duration-300 ease-in-out
        ${isDragging 
          ? 'border-blue-500 bg-blue-500/10 scale-[1.01]' 
          : 'border-slate-700 bg-slate-800/50 hover:border-slate-500 hover:bg-slate-800'
        }
        h-48 flex flex-col items-center justify-center text-center p-6
      `}
    >
      <input
        type="file"
        multiple
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      
      <div className={`p-4 rounded-full bg-slate-700/50 mb-4 transition-transform duration-300 ${isDragging ? 'scale-110 bg-blue-500/20' : ''}`}>
        <Upload className={`w-8 h-8 ${isDragging ? 'text-blue-400' : 'text-slate-400'}`} />
      </div>
      
      <div className="space-y-1">
        <p className="text-lg font-medium text-slate-200">
          Drop documents here or click to upload
        </p>
        <p className="text-sm text-slate-400">
          Support for PDF, HTML, JS, RTF, TXT, MD, & more
        </p>
      </div>
    </div>
  );
};

export default DropZone;