export enum SectionType {
  Verse = 'Verse',
  Chorus = 'Chorus',
  Bridge = 'Bridge',
  Intro = 'Intro',
  Outro = 'Outro',
  PreChorus = 'Pre-Chorus',
  Hook = 'Hook',
  Solo = 'Solo',
}

export interface SongSection {
  id: string;
  type: SectionType;
  content: string;
}

export interface SongData {
  title: string;
  artist: string;
  mood: string;
  format: string;
  sections: SongSection[];
}

export interface WritingControls {
  metaphorLevel: number;
  rhymeComplexity: number;
  temperature: number;
}
