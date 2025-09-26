import { SectionType, SongData } from './types';

export const SECTION_TYPE_TRANSLATIONS: Record<SectionType, string> = {
  [SectionType.Verse]: 'Verse',
  [SectionType.Chorus]: 'Chorus',
  [SectionType.Bridge]: 'Bridge',
  [SectionType.Intro]: 'Intro',
  [SectionType.Outro]: 'Outro',
  [SectionType.PreChorus]: 'Pre-Chorus',
  [SectionType.Hook]: 'Hook',
  [SectionType.Solo]: 'Solo',
};

export const INITIAL_SONG_DATA: SongData = {
  title: 'New Song',
  artist: 'Unknown Artist',
  mood: 'Melancholic',
  format: 'Single',
  sections: [
    { id: `verse-${Date.now()}`, type: SectionType.Verse, content: 'First lines here...' },
    { id: `chorus-${Date.now() + 1}`, type: SectionType.Chorus, content: 'A catchy chorus...' },
  ],
};

export const SONG_STRUCTURE_TEMPLATES: Record<string, SectionType[]> = {
  'Verse-Chorus-Verse-Chorus': [
    SectionType.Verse,
    SectionType.Chorus,
    SectionType.Verse,
    SectionType.Chorus,
  ],
  'Verse-Chorus-Verse-Chorus-Bridge-Chorus': [
    SectionType.Verse,
    SectionType.Chorus,
    SectionType.Verse,
    SectionType.Chorus,
    SectionType.Bridge,
    SectionType.Chorus,
  ],
  'Intro-Verse-Chorus-Outro': [
    SectionType.Intro,
    SectionType.Verse,
    SectionType.Chorus,
    SectionType.Outro,
  ],
   'Verse-PreChorus-Chorus (x2)': [
    SectionType.Verse,
    SectionType.PreChorus,
    SectionType.Chorus,
    SectionType.Verse,
    SectionType.PreChorus,
    SectionType.Chorus,
  ],
};
