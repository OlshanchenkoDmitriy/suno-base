import React, { useState, useMemo } from 'react';
import { SongData, WritingControls } from '../types';
import { ChevronDownIcon, InfoIcon } from './icons';

interface AdditionalHelpersProps {
  songData: SongData;
  writingControls: WritingControls;
  setWritingControls: React.Dispatch<React.SetStateAction<WritingControls>>;
}

const AdditionalHelpers: React.FC<AdditionalHelpersProps> = ({ songData, writingControls, setWritingControls }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [stopWords, setStopWords] = useState('');

  const handleControlsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setWritingControls((prev) => ({...prev, [name]: Number(value) }));
  };
  
  const wordFrequency = useMemo(() => {
    const allText = songData.sections.map(s => s.content).join(' ');
    if (!allText.trim()) return [];
    
    const words = allText.toLowerCase().match(/\b(\w+)\b/g) || [];
    const counts: { [key: string]: number } = {};

    words.forEach(word => {
        counts[word] = (counts[word] || 0) + 1;
    });

    return Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10);
  }, [songData]);

  return (
    <div className="bg-gray-900 rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 text-left"
      >
        <h2 className="text-xl font-bold text-gray-100">Additional Helpers</h2>
        <ChevronDownIcon className={`w-6 h-6 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="p-4 pt-0 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-300 mb-2 flex items-center">
              Style Palette
              <div className="relative group ml-2">
                <InfoIcon className="w-4 h-4 text-gray-500" />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-950 text-gray-300 text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  Shows the most frequent words in your lyrics to help analyze your vocabulary.
                </span>
              </div>
            </h4>
            <div className="text-sm text-gray-400 space-y-1">
              {wordFrequency.length > 0 ? wordFrequency.map(([word, count]) => (
                <div key={word} className="flex justify-between">
                  <span>{word}</span>
                  <span>{count}</span>
                </div>
              )) : <p>No data to analyze.</p>}
            </div>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-300 mb-2 flex items-center">
              Creative Guardrails
               <div className="relative group ml-2">
                <InfoIcon className="w-4 h-4 text-gray-500" />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-gray-950 text-gray-300 text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  List words you want to avoid. The AI assistant (coming soon) will respect these constraints.
                </span>
              </div>
            </h4>
            <textarea
              value={stopWords}
              onChange={(e) => setStopWords(e.target.value)}
              placeholder="Stop words, one per line..."
              className="w-full h-24 bg-gray-900 text-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="bg-gray-800 p-4 rounded-lg space-y-4">
            <h4 className="font-semibold text-gray-300">Writing Controls</h4>
            <SliderControl 
              label="Metaphor Level"
              name="metaphorLevel"
              value={writingControls.metaphorLevel}
              onChange={handleControlsChange}
            />
            <SliderControl 
              label="Rhyme Complexity"
              name="rhymeComplexity"
              value={writingControls.rhymeComplexity}
              onChange={handleControlsChange}
            />
            <SliderControl 
              label="Temperature"
              name="temperature"
              value={writingControls.temperature}
              onChange={handleControlsChange}
            />
          </div>
        </div>
      )}
    </div>
  );
};


interface SliderControlProps {
    label: string;
    name: keyof WritingControls;
    value: number;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SliderControl: React.FC<SliderControlProps> = ({ label, name, value, onChange }) => (
    <div className="text-sm">
        <label className="flex justify-between text-gray-400">
            <span>{label}</span>
            <span>{value}</span>
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


export default AdditionalHelpers;