import React from 'react';
import { CombinerSettings, OutputFormat } from '../types';
import { Settings, Download, RefreshCw, FileText } from 'lucide-react';

interface CombinerControlsProps {
  settings: CombinerSettings;
  onSettingsChange: (settings: CombinerSettings) => void;
  onCombine: () => void;
  canCombine: boolean;
  isCombining: boolean;
}

const CombinerControls: React.FC<CombinerControlsProps> = ({ 
  settings, 
  onSettingsChange, 
  onCombine,
  canCombine,
  isCombining
}) => {
  
  const handleFormatChange = (fmt: OutputFormat) => {
    onSettingsChange({ ...settings, outputFormat: fmt });
  };

  const toggleFilenames = () => {
    onSettingsChange({ ...settings, includeFilenames: !settings.includeFilenames });
  };

  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700 p-6 space-y-6">
      <div className="flex items-center gap-2 text-lg font-semibold text-slate-200">
        <Settings className="w-5 h-5 text-blue-400" />
        <h3>Output Configuration</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Output Format */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-400">Format</label>
          <div className="flex gap-2 p-1 bg-slate-900 rounded-lg border border-slate-700">
            {[OutputFormat.MARKDOWN, OutputFormat.TXT, OutputFormat.HTML].map((fmt) => (
              <button
                key={fmt}
                onClick={() => handleFormatChange(fmt)}
                className={`
                  flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all
                  ${settings.outputFormat === fmt 
                    ? 'bg-blue-600 text-white shadow-lg' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }
                `}
              >
                .{fmt}
              </button>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-slate-400">Options</label>
          <label className="flex items-center justify-between p-3 rounded-lg border border-slate-700 bg-slate-900/50 cursor-pointer hover:bg-slate-900 transition-colors">
            <span className="text-sm text-slate-300">Include Headers</span>
            <div 
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors duration-300 ${settings.includeFilenames ? 'bg-blue-600' : 'bg-slate-600'}`}
              onClick={toggleFilenames}
            >
              <div 
                className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${settings.includeFilenames ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </div>
          </label>
        </div>
      </div>

      {/* Separator Input */}
      <div className="space-y-2">
         <label className="text-sm font-medium text-slate-400">Custom Separator (optional)</label>
         <input 
            type="text" 
            value={settings.separator}
            onChange={(e) => onSettingsChange({...settings, separator: e.target.value})}
            placeholder="e.g., --- New File ---"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
         />
      </div>

      {/* Main Action */}
      <button
        onClick={onCombine}
        disabled={!canCombine || isCombining}
        className={`
          w-full py-4 px-6 rounded-xl flex items-center justify-center gap-3 font-semibold text-lg
          transition-all duration-300 shadow-xl
          ${!canCombine || isCombining
            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white hover:shadow-blue-500/25 active:scale-[0.98]'
          }
        `}
      >
        {isCombining ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" />
            Processing Files...
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Combine & Download
          </>
        )}
      </button>
    </div>
  );
};

export default CombinerControls;