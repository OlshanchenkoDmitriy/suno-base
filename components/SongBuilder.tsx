import React, { useRef, useLayoutEffect } from 'react';
import { SongData, SongSection, SectionType } from '../types';
import { SECTION_TYPE_TRANSLATIONS, SONG_STRUCTURE_TEMPLATES } from '../constants';
import { PlusCircleIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from './icons';

interface SongBuilderProps {
  songData: SongData;
  setSongData: (updater: React.SetStateAction<SongData>, action: string) => void;
}

const AutoResizingTextarea = ({ value, onChange, placeholder, className }: { value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; placeholder: string; className: string; }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'inherit'; // Reset height to recalculate
      textarea.style.height = `${Math.max(textarea.scrollHeight, 96)}px`; // 96px is h-24
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      rows={1}
    />
  );
};


const SongBuilder: React.FC<SongBuilderProps> = ({ songData, setSongData }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const actionLabel = name.charAt(0).toUpperCase() + name.slice(1);
    setSongData((prev) => ({ ...prev, [name]: value }), `Edit ${actionLabel}`);
  };

  const handleSectionChange = (id: string, field: keyof SongSection, value: string) => {
    let action = 'Edit Section';
    const section = songData.sections.find(s => s.id === id);
    if (field === 'type') {
        action = `Change Section Type to ${value}`;
    } else if (field === 'content') {
        action = `Edit ${section?.type || 'Section'} Content`;
    }

    setSongData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === id ? { ...section, [field]: value } : section
      ),
    }), action);
  };

  const addSection = () => {
    const newSection: SongSection = {
      id: `${SectionType.Verse}-${Date.now()}`,
      type: SectionType.Verse,
      content: '',
    };
    setSongData((prev) => ({
      ...prev,
      sections: [...prev.sections, newSection],
    }), 'Add Section');
  };

  const deleteSection = (id: string) => {
    const sectionType = songData.sections.find(s => s.id === id)?.type || 'Section';
    setSongData((prev) => ({
      ...prev,
      sections: prev.sections.filter((section) => section.id !== id),
    }), `Delete ${sectionType}`);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...songData.sections];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSections.length) return;
    
    const sectionType = newSections[index].type;
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]];
    setSongData((prev) => ({ ...prev, sections: newSections }), `Move ${sectionType} ${direction}`);
  };
  
  const applyTemplate = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateName = e.target.value;
    e.target.value = ""; // Reset dropdown immediately for better UX
    if (!templateName) return;

    const apply = () => {
      const template = SONG_STRUCTURE_TEMPLATES[templateName];
      const newSections: SongSection[] = template.map((type, index) => ({
        id: `${type}-${Date.now()}-${index}`,
        type,
        content: '',
      }));
      setSongData(prev => ({
        ...prev,
        sections: newSections,
      }), `Apply Template: ${templateName}`);
    };

    if (songData.sections.some(s => s.content.trim() !== '')) {
      if (window.confirm('Applying a template will replace all existing sections. Continue?')) {
        apply();
      }
    } else {
      apply();
    }
  };


  return (
    <div className="flex flex-col bg-gray-900 rounded-lg p-6 space-y-8">
      <h2 className="text-2xl font-bold text-gray-100">Song Builder</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputField label="Title" name="title" value={songData.title} onChange={handleInputChange} />
        <InputField label="Artist" name="artist" value={songData.artist} onChange={handleInputChange} />
        <InputField label="Mood" name="mood" value={songData.mood} onChange={handleInputChange} />
        <InputField label="Format" name="format" value={songData.format} onChange={handleInputChange} />
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-200">Sections</h3>
            <select
              onChange={applyTemplate}
              className="bg-gray-700 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              defaultValue=""
              aria-label="Apply a song structure template"
            >
              <option value="" disabled>Apply template...</option>
              {Object.keys(SONG_STRUCTURE_TEMPLATES).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
        </div>
        <div className="space-y-6">
            {songData.sections.map((section, index) => (
            <div key={section.id} className="bg-gray-800 p-4 rounded-lg flex flex-col">
                <div className="flex items-center justify-between mb-3">
                <select
                    value={section.type}
                    onChange={(e) => handleSectionChange(section.id, 'type', e.target.value)}
                    className="bg-gray-700 text-white rounded px-2 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {Object.values(SectionType).map((type) => (
                    <option key={type} value={type}>
                        {SECTION_TYPE_TRANSLATIONS[type]}
                    </option>
                    ))}
                </select>
                <div className="flex items-center space-x-2">
                    <button onClick={() => moveSection(index, 'up')} disabled={index === 0} className="text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                        <ArrowUpIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => moveSection(index, 'down')} disabled={index === songData.sections.length - 1} className="text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed">
                        <ArrowDownIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => deleteSection(section.id)} className="text-red-400 hover:text-red-300">
                    <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
                </div>
                <AutoResizingTextarea
                    value={section.content}
                    onChange={(e) => handleSectionChange(section.id, 'content', e.target.value)}
                    placeholder={`Lyrics for "${SECTION_TYPE_TRANSLATIONS[section.type]}"...`}
                    className="w-full bg-gray-900 text-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden"
                />
                <div className="text-xs text-gray-500 mt-2 flex justify-end items-center space-x-4">
                    <span>Words: {section.content.match(/\b\w+\b/g)?.length || 0}</span>
                    <span>Lines: {section.content.split('\n').filter(l => l.trim() !== '').length}</span>
                </div>
            </div>
            ))}
        </div>
      </div>


      <button
        onClick={addSection}
        className="flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-md transition-colors"
      >
        <PlusCircleIcon className="w-5 h-5 mr-2" />
        Add Section
      </button>
    </div>
  );
};


interface InputFieldProps {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const InputField: React.FC<InputFieldProps> = ({ label, name, value, onChange }) => (
    <div>
        <label htmlFor={name} className="block text-base font-medium text-gray-400 mb-2">{label}</label>
        <input
            type="text"
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className="w-full bg-gray-800 border-gray-700 border text-gray-200 rounded-md px-3 py-2.5 text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
    </div>
);


export default SongBuilder;