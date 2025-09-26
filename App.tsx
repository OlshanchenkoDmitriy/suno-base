import React, { useState, useEffect, useCallback, useMemo } from 'react';
import SongBuilder from './components/SongBuilder';
import SunoWorkspace from './components/SunoWorkspace';
import AdditionalHelpers from './components/AdditionalHelpers';
import { SongData, SongSection, SectionType, WritingControls } from './types';
import { INITIAL_SONG_DATA } from './constants';
import { FileTextIcon, CodeIcon, CopyIcon, RefreshCwIcon, UndoIcon, RedoIcon, MoreHorizontalIcon } from './components/icons';

const LOCAL_STORAGE_KEY = 'lyricsLabDraft';

interface HistoryEntry<T> {
  state: T;
  action: string;
}

interface SunoControls {
  styleOriginality: number;
  instrumentationOriginality: number;
}

const useHistoryState = <T,>(initialState: T | (() => T)): [
  T, // state
  (updater: React.SetStateAction<T>, action: string) => void, // setState
  () => void, // undo
  () => void, // redo
  boolean, // canUndo
  boolean, // canRedo
  (newState: T) => void, // reset
  string | undefined, // undoAction
  string | undefined // redoAction
] => {
  const [history, setHistory] = useState<HistoryEntry<T>[]>(() => {
    const resolvedInitialState =
      initialState instanceof Function ? initialState() : initialState;
    return [{ state: resolvedInitialState, action: 'Initial state' }];
  });
  const [pointer, setPointer] = useState(0);

  const state = useMemo(() => history[pointer].state, [history, pointer]);

  const setState = useCallback(
    (updater: React.SetStateAction<T>, action: string) => {
      const newState = updater instanceof Function ? updater(state) : updater;

      if (JSON.stringify(newState) === JSON.stringify(state)) {
        return;
      }

      const newHistory = history.slice(0, pointer + 1);
      newHistory.push({ state: newState, action });
      setHistory(newHistory);
      setPointer(newHistory.length - 1);
    },
    [history, pointer, state]
  );

  const undo = useCallback(() => {
    if (pointer > 0) {
      setPointer((p) => p - 1);
    }
  }, [pointer]);

  const redo = useCallback(() => {
    if (pointer < history.length - 1) {
      setPointer((p) => p + 1);
    }
  }, [pointer, history.length]);

  const reset = useCallback((newState: T) => {
    setHistory([{ state: newState, action: 'Reset Draft' }]);
    setPointer(0);
  }, []);

  const canUndo = pointer > 0;
  const canRedo = pointer < history.length - 1;
  
  const undoAction = canUndo ? history[pointer].action : undefined;
  const redoAction = canRedo ? history[pointer + 1].action : undefined;

  return [state, setState, undo, redo, canUndo, canRedo, reset, undoAction, redoAction];
};

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};


function App() {
  const [songData, setSongData, undo, redo, canUndo, canRedo, resetSongDataHistory, undoAction, redoAction] = useHistoryState<SongData>(() => {
    try {
      const savedDraft = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (savedDraft) {
        return JSON.parse(savedDraft);
      }
    } catch (error) {
      console.error("Failed to load or parse saved draft from localStorage:", error);
    }
    return INITIAL_SONG_DATA;
  });
  
  const [sunoPrompt, setSunoPrompt] = useState<string>('');
  const [syncedSongDataJSON, setSyncedSongDataJSON] = useState<string>('');
  const [isOutOfSync, setIsOutOfSync] = useState<boolean>(false);
  const [writingControls, setWritingControls] = useState<WritingControls>({
    metaphorLevel: 50,
    rhymeComplexity: 70,
    temperature: 80,
  });
  const [sunoControls, setSunoControls] = useState<SunoControls>({
    styleOriginality: 75,
    instrumentationOriginality: 85,
  });

  const [isActionsOpen, setIsActionsOpen] = useState(false);

  const debouncedSongData = useDebounce(songData, 500);
  const debouncedSunoControls = useDebounce(sunoControls, 200);

  // Auto-save songData to localStorage
  useEffect(() => {
    try {
      const draftJSON = JSON.stringify(debouncedSongData);
      localStorage.setItem(LOCAL_STORAGE_KEY, draftJSON);
    } catch (error) {
      console.error("Failed to save draft to localStorage:", error);
    }
  }, [debouncedSongData]);
  
  // Capacitor native integration
  useEffect(() => {
    const setupCapacitor = async () => {
      const capacitor = (window as any).Capacitor;
      if (capacitor && capacitor.isNativePlatform()) {
        const { StatusBar, Style } = capacitor.Plugins;
        if (StatusBar) {
          // Set status bar to dark style (light text) to match the app theme
          await StatusBar.setStyle({ style: Style.Dark });
        }
      }
    };
    setupCapacitor();
  }, []);


  useEffect(() => {
    const currentSongDataJSON = JSON.stringify(songData);
    if (syncedSongDataJSON) {
        setIsOutOfSync(currentSongDataJSON !== syncedSongDataJSON);
    }
  }, [songData, sunoControls, syncedSongDataJSON]);

  const generateSunoPrompt = useCallback((data: SongData, controls: SunoControls): string => {
    const styleDescription = `An ${data.mood.toLowerCase()} ${data.format.toLowerCase()} in the style of ${data.artist}.`;
    const lyrics = data.sections
      .map(section => `[${section.type}]\n${section.content}`)
      .join('\n\n');
      
    return `[Style Description: ${styleDescription}]

[Lyrics]
${lyrics}

[Style Originality: ${controls.styleOriginality}%]
[Instrumentation Originality: ${controls.instrumentationOriginality}%]`;
  }, []);

  const syncSuno = useCallback(() => {
    const prompt = generateSunoPrompt(songData, sunoControls);
    setSunoPrompt(prompt);
    setSyncedSongDataJSON(JSON.stringify(songData));
    setIsOutOfSync(false);
  }, [songData, sunoControls, generateSunoPrompt]);

  // Effect to auto-sync when controls change
  useEffect(() => {
    if(!isOutOfSync) {
        syncSuno();
    }
  }, [debouncedSunoControls, isOutOfSync, syncSuno]);


  useEffect(() => {
    syncSuno();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const importSections = (prompt: string) => {
    const lyricsMatch = prompt.match(/\[Lyrics\]\n([\s\S]*?)(?=\n\[(Style|Instrumentation) Originality|_END_)/);
    if (!lyricsMatch || !lyricsMatch[1]) {
      alert("Could not find [Lyrics] block in the prompt.");
      return;
    }
    
    const lyricsContent = lyricsMatch[1].trim();
    const sectionRegex = /\[(.*?)\]\n([\s\S]*?)(?=\n\[|$)/g;
    let match;
    const newSections: SongSection[] = [];
    
    while ((match = sectionRegex.exec(lyricsContent)) !== null) {
      const typeStr = match[1].trim();
      const content = match[2].trim();
      
      const sectionTypeKey = Object.keys(SectionType).find(key => SectionType[key as keyof typeof SectionType] === typeStr);

      if (sectionTypeKey) {
        newSections.push({
          id: `${typeStr}-${Date.now()}-${newSections.length}`,
          type: SectionType[sectionTypeKey as keyof typeof SectionType],
          content: content
        });
      }
    }

    if (newSections.length > 0) {
      setSongData(prev => ({ ...prev, sections: newSections }), `Import ${newSections.length} sections`);
      alert(`Imported ${newSections.length} sections.`);
    } else {
      alert("No recognizable sections (e.g., [Verse], [Chorus]) found in the [Lyrics] block.");
    }
  };
  
  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleExportTXT = () => {
    const content = songData.sections.map(s => `[${s.type}]\n${s.content}`).join('\n\n');
    downloadFile(content, `${songData.title.replace(/\s/g, '_')}.txt`, 'text/plain');
    setIsActionsOpen(false);
  };

  const handleExportJSON = () => {
    downloadFile(JSON.stringify(songData, null, 2), `${songData.title.replace(/\s/g, '_')}.json`, 'application/json');
    setIsActionsOpen(false);
  };
  
  const handleCopySuno = () => {
    navigator.clipboard.writeText(sunoPrompt);
    setIsActionsOpen(false);
  };
  
  const resetDraft = () => {
    if (window.confirm("Are you sure you want to reset the entire draft? This will clear your auto-saved work.")) {
      const newSongData = INITIAL_SONG_DATA;
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      resetSongDataHistory(newSongData);
      
      const prompt = generateSunoPrompt(newSongData, sunoControls);
      setSunoPrompt(prompt);
      setSyncedSongDataJSON(JSON.stringify(newSongData));
      setIsActionsOpen(false);
    }
  };

  return (
    <div className="bg-gray-950 font-sans px-4 sm:px-6 py-4 sm:py-6 min-h-screen">
      <header className="text-center mb-8">
        <h1 className="text-5xl font-bold text-white">Lyrics Lab 🔬</h1>
        <p className="text-gray-400 mt-2 text-lg">A digital workshop for your songs</p>
      </header>

      <div className="max-w-7xl mx-auto my-8">
        <div className="bg-gray-900 rounded-lg p-2 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button onClick={undo} disabled={!canUndo} className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed" title={undoAction ? `Undo: ${undoAction}` : 'Undo'}><UndoIcon className="w-4 h-4" /> <span className="hidden sm:inline">Undo</span></button>
            <button onClick={redo} disabled={!canRedo} className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed" title={redoAction ? `Redo: ${redoAction}` : 'Redo'}><RedoIcon className="w-4 h-4" /> <span className="hidden sm:inline">Redo</span></button>
          </div>
          
          <div className="hidden md:flex items-center gap-2 flex-wrap">
            <button onClick={handleExportTXT} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md text-sm"><FileTextIcon className="w-4 h-4" /> TXT</button>
            <button onClick={handleExportJSON} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md text-sm"><CodeIcon className="w-4 h-4" /> JSON</button>
            <button onClick={handleCopySuno} className="flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md text-sm"><CopyIcon className="w-4 h-4" /> Suno TXT</button>
            <button onClick={resetDraft} className="flex items-center gap-2 bg-red-800 hover:bg-red-700 px-3 py-2 rounded-md text-sm"><RefreshCwIcon className="w-4 h-4" /> Reset</button>
          </div>

          <div className="md:hidden">
            <button onClick={() => setIsActionsOpen(true)} className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-md text-sm"><MoreHorizontalIcon className="w-4 h-4" /> <span className="hidden sm:inline">More</span></button>
          </div>
        </div>
      </div>
      
      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">
        <div className="flex flex-col gap-8">
            <SongBuilder songData={songData} setSongData={setSongData} />
        </div>
        <div className="flex flex-col gap-8">
            <SunoWorkspace 
                sunoPrompt={sunoPrompt}
                setSunoPrompt={setSunoPrompt}
                isOutOfSync={isOutOfSync}
                syncSuno={syncSuno}
                importSections={importSections}
                sunoControls={sunoControls}
                setSunoControls={setSunoControls}
            />
        </div>
      </main>
      
      <div className="max-w-7xl mx-auto mt-8">
        <AdditionalHelpers 
          songData={songData} 
          writingControls={writingControls} 
          setWritingControls={setWritingControls} 
        />
      </div>

      <footer className="text-center text-gray-600 mt-8 text-sm">
        <p>Lyrics Lab © 2024</p>
      </footer>

      {/* Mobile Actions Modal (Bottom Sheet) */}
      {isActionsOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-end md:hidden" onClick={() => setIsActionsOpen(false)}>
              <div className="bg-gray-800 w-full rounded-t-2xl p-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                  <div className="w-12 h-1.5 bg-gray-600 rounded-full mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold text-center mb-4 text-gray-200">More Actions</h3>
                  <div className="grid grid-cols-2 gap-3 text-white">
                      <button onClick={handleExportTXT} className="flex flex-col items-center gap-2 bg-gray-700 hover:bg-gray-600 p-4 rounded-lg text-sm transition-colors"><FileTextIcon className="w-6 h-6" /> Export TXT</button>
                      <button onClick={handleExportJSON} className="flex flex-col items-center gap-2 bg-gray-700 hover:bg-gray-600 p-4 rounded-lg text-sm transition-colors"><CodeIcon className="w-6 h-6" /> Export JSON</button>
                      <button onClick={handleCopySuno} className="flex flex-col items-center gap-2 bg-gray-700 hover:bg-gray-600 p-4 rounded-lg text-sm transition-colors"><CopyIcon className="w-6 h-6" /> Copy Suno</button>
                      <button onClick={resetDraft} className="flex flex-col items-center gap-2 bg-red-800 hover:bg-red-700 p-4 rounded-lg text-sm text-red-100 transition-colors"><RefreshCwIcon className="w-6 h-6" /> Reset Draft</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
}

export default App;