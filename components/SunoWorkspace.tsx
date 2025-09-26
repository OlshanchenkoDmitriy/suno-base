import React, { useState, useRef, useLayoutEffect } from 'react';
import { AlertTriangleIcon, CopyIcon, ChevronDownIcon, InfoIcon } from './icons';

interface SunoControls {
  styleOriginality: number;
  instrumentationOriginality: number;
}

interface SunoWorkspaceProps {
  sunoPrompt: string;
  setSunoPrompt: React.Dispatch<React.SetStateAction<string>>;
  isOutOfSync: boolean;
  syncSuno: () => void;
  importSections: (prompt: string) => void;
  sunoControls: SunoControls;
  setSunoControls: React.Dispatch<React.SetStateAction<SunoControls>>;
}

const SliderControl: React.FC<{
    label: string;
    name: keyof SunoControls;
    value: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}> = ({ label, name, value, onChange }) => (
    <div className="text-sm">
        <label className="flex justify-between text-gray-400">
            <span>{label}</span>
            <span>{value}%</span>
        </label>
        <input
            type="range"
            name={name}
            min="0"
            max="100"
            value={value}
            onChange={onChange}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
        />
    </div>
);


const SunoWorkspace: React.FC<SunoWorkspaceProps> = ({ sunoPrompt, setSunoPrompt, isOutOfSync, syncSuno, importSections, sunoControls, setSunoControls }) => {
  const [copied, setCopied] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'inherit';
      textarea.style.height = `${Math.max(textarea.scrollHeight, 250)}px`;
    }
  }, [sunoPrompt]);

  const handleCopy = () => {
    navigator.clipboard.writeText(sunoPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleControlsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSunoControls(prev => ({...prev, [name]: Number(value) }));
  };
  
  return (
    <div className="flex flex-col bg-gray-900 rounded-lg p-6 space-y-6">
      <h2 className="text-2xl font-bold text-gray-100 mb-2">Suno Workspace</h2>
      
      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={syncSuno}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
        >
          Sync Suno
        </button>
        <button
          onClick={() => importSections(sunoPrompt)}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
        >
          Import sections
        </button>
      </div>
      
      {isOutOfSync && (
        <div className="bg-yellow-900 border border-yellow-700 text-yellow-200 px-4 py-2 rounded-md flex items-center text-sm">
          <AlertTriangleIcon className="w-5 h-5 mr-3 flex-shrink-0" />
          <span>Lyrics and Suno prompt are out of sync. Click 'Sync Suno' to update.</span>
        </div>
      )}

      <div className="bg-gray-800 p-4 rounded-lg space-y-4">
        <h4 className="font-semibold text-gray-300 flex items-center">
          Creative Originality
          <div className="relative group ml-2">
            <InfoIcon className="w-4 h-4 text-gray-500" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 bg-gray-950 text-gray-300 text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              Controls how much creative freedom Suno has. Higher values can produce more unique results but may deviate more from your style prompt.
            </span>
          </div>
        </h4>
        <SliderControl 
          label="Style Originality"
          name="styleOriginality"
          value={sunoControls.styleOriginality}
          onChange={handleControlsChange}
        />
        <SliderControl 
          label="Instrumentation Originality"
          name="instrumentationOriginality"
          value={sunoControls.instrumentationOriginality}
          onChange={handleControlsChange}
        />
      </div>

      <div className="relative flex-grow flex flex-col">
        <textarea
          ref={textareaRef}
          value={sunoPrompt}
          onChange={(e) => setSunoPrompt(e.target.value)}
          placeholder="Click 'Sync Suno' to generate a prompt, or paste your own..."
          className="w-full flex-grow bg-gray-800 text-gray-300 rounded-md p-4 pr-12 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none overflow-hidden"
        />
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 text-gray-400 hover:text-white"
          title="Copy all"
        >
          {copied ? <span className="text-xs text-green-400">Copied!</span> : <CopyIcon className="w-5 h-5" />}
        </button>
      </div>

       <div className="bg-gray-800 rounded-lg">
        <button onClick={() => setIsGuideOpen(!isGuideOpen)} className="w-full flex justify-between items-center p-3 text-left">
          <h3 className="font-semibold text-gray-300">Prompt Guide</h3>
          <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isGuideOpen ? 'rotate-180' : ''}`} />
        </button>
        {isGuideOpen && (
          <div className="px-3 pb-3 text-sm text-gray-400 space-y-2">
            <p><strong>[Style Description]:</strong> Describes the genre, mood, and artist influences for the song.</p>
            <p><strong>[Lyrics]:</strong> This block contains the song structure and lyrics you wrote in the builder.</p>
            <p><strong>[Style Originality / Instrumentation Originality]:</strong> These values are now controlled by the sliders above. They give Suno creative freedom to interpret your prompt.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SunoWorkspace;