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
  color?: string;
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

// Accessible color palette optimized for dark mode with high contrast
// Each color meets WCAG AA contrast requirements and is distinguishable
// for users with color vision deficiencies
export const COLOR_PALETTE = [
  '#FF6B6B',  // Coral Red - Track 1
  '#4ECDC4',  // Cyan - Track 2
  '#FFD93D',  // Golden Yellow - Track 3
  '#6BCF7F',  // Green - Track 4
  '#A78BFA',  // Purple - Track 5
  '#FB923C',  // Orange - Track 6
  '#38BDF8',  // Sky Blue - Track 7
  '#F472B6',  // Pink - Track 8
  '#34D399'   // Emerald - Track 9
];
