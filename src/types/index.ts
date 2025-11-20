export type TimeSignature = '4/4' | '3/4' | '6/8' | '5/4' | '7/8' | '2/4';
export type NoteDuration = 'whole' | 'half' | 'quarter' | 'eighth' | 'sixteenth';
export type Pitch = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';
export type InstrumentType = 'drums' | 'bass' | 'synth' | 'piano' | 'guitar' | 'pad';
export type VisualizerType = 'waveform' | 'bars' | 'circular';
export type Theme = 'light' | 'dark';

export interface Note {
  id: string;
  trackId: string;
  pitch: Pitch;
  octave: number;
  duration: NoteDuration;
  position: number;
  velocity: number;
}

export interface Track {
  id: string;
  projectId: string;
  name: string;
  instrumentType: InstrumentType;
  timeSignature: TimeSignature;
  volume: number;
  muted: boolean;
  solo: boolean;
  orderIndex: number;
  notes: Note[];
  isExpanded: boolean;
}

export interface VisualizerSettings {
  id: string;
  projectId: string;
  visualizerType: VisualizerType;
  color: string;
  isActive: boolean;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  tempo: number;
  createdAt: string;
  updatedAt: string;
  tracks: Track[];
  visualizerSettings: VisualizerSettings[];
}

export interface UserPreferences {
  id: string;
  userId: string;
  theme: Theme;
  defaultTempo: number;
  defaultTimeSignature: TimeSignature;
}

export const COLOR_PALETTE = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#FFA07A',
  '#98D8C8',
  '#F7DC6F',
  '#BB8FCE',
  '#85C1E2',
  '#52BE80'
];
