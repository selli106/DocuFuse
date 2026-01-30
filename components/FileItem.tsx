import React from 'react';
import { FileStatus, UploadedFile } from '../types';
import { FileIcon, Loader2, CheckCircle, AlertCircle, X, ArrowUp, ArrowDown, FileText, Code, FileCode, FileImage } from 'lucide-react';

interface FileItemProps {
  file: UploadedFile;
  index: number;
  total: number;
  onRemove: (id: string) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
}

const getFileIcon = (filename: string) => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['js', 'ts', 'tsx', 'jsx', 'json'].includes(ext || '')) return <Code className="w-5 h-5 text-yellow-400" />;
  if (['html', 'css', 'xml'].includes(ext || '')) return <FileCode className="w-5 h-5 text-orange-400" />;
  if (['png', 'jpg', 'jpeg', 'webp'].includes(ext || '')) return <FileImage className="w-5 h-5 text-purple-400" />;
  if (['pdf'].includes(ext || '')) return <FileText className="w-5 h-5 text-red-400" />;
  return <FileText className="w-5 h-5 text-blue-400" />;
};

const FileItem: React.FC<FileItemProps> = ({ file, index, total, onRemove, onMoveUp, onMoveDown }) => {
  return (
    <div className="flex items-center gap-4 p-3 bg-slate-800/80 border border-slate-700 rounded-xl group hover:border-slate-600 transition-all">
      {/* Drag Handle / Index */}
      <div className="flex flex-col items-center justify-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={() => onMoveUp(index)}
          disabled={index === 0}
          className="p-1 hover:bg-slate-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowUp className="w-3 h-3 text-slate-300" />
        </button>
        <button 
          onClick={() => onMoveDown(index)}
          disabled={index === total - 1}
          className="p-1 hover:bg-slate-700 rounded disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ArrowDown className="w-3 h-3 text-slate-300" />
        </button>
      </div>

      {/* Icon */}
      <div className="p-2 bg-slate-900 rounded-lg">
        {getFileIcon(file.originalName)}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium text-slate-200 truncate" title={file.originalName}>
            {file.originalName}
          </p>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-700 text-slate-400 uppercase tracking-wider">
            {file.originalName.split('.').pop()?.substring(0, 4)}
          </span>
        </div>
        
        {/* Status Bar */}
        <div className="flex items-center gap-2 text-xs">
          {file.status === FileStatus.PENDING && (
            <span className="text-slate-500">Waiting...</span>
          )}
          {file.status === FileStatus.PROCESSING && (
            <span className="flex items-center gap-1 text-blue-400">
              <Loader2 className="w-3 h-3 animate-spin" />
              Extracting content...
            </span>
          )}
          {file.status === FileStatus.COMPLETED && (
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle className="w-3 h-3" />
              Ready
            </span>
          )}
          {file.status === FileStatus.ERROR && (
            <span className="flex items-center gap-1 text-red-400 truncate max-w-[200px]" title={file.errorMessage}>
              <AlertCircle className="w-3 h-3" />
              {file.errorMessage || 'Failed'}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <button 
        onClick={() => onRemove(file.id)}
        className="p-2 hover:bg-red-500/10 hover:text-red-400 text-slate-500 rounded-lg transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

export default FileItem;