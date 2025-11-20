import { createContext, useContext, useState, type ReactNode } from 'react';
import type { Project, Track, Note, VisualizerSettings, InstrumentType } from '../types';

interface ProjectContextType {
  project: Project | null;
  currentTrack: Track | null;
  setCurrentTrack: (track: Track | null) => void;
  createProject: (name: string, userId: string) => Promise<void>;
  updateProject: (updates: Partial<Project>) => void;
  addTrack: (name: string, instrumentType: InstrumentType) => void;
  updateTrack: (trackId: string, updates: Partial<Track>) => void;
  deleteTrack: (trackId: string) => void;
  addNote: (trackId: string, note: Omit<Note, 'id' | 'trackId'>) => void;
  deleteNote: (noteId: string) => void;
  updateVisualizerSettings: (settings: Partial<VisualizerSettings>) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: ReactNode }) {
  const [project, setProject] = useState<Project | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);

  const createProject = async (name: string, userId: string) => {
    const newProject: Project = {
      id: crypto.randomUUID(),
      userId,
      name,
      tempo: 120,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tracks: [],
      visualizerSettings: [
        { id: crypto.randomUUID(), projectId: '', visualizerType: 'waveform', color: '#4ECDC4', isActive: true },
        { id: crypto.randomUUID(), projectId: '', visualizerType: 'bars', color: '#FF6B6B', isActive: false },
        { id: crypto.randomUUID(), projectId: '', visualizerType: 'circular', color: '#45B7D1', isActive: false }
      ]
    };

    newProject.visualizerSettings.forEach(vs => vs.projectId = newProject.id);
    setProject(newProject);
  };

  const updateProject = (updates: Partial<Project>) => {
    if (!project) return;
    setProject({ ...project, ...updates, updatedAt: new Date().toISOString() });
  };

  const addTrack = (name: string, instrumentType: InstrumentType) => {
    if (!project) return;

    const newTrack: Track = {
      id: crypto.randomUUID(),
      projectId: project.id,
      name,
      instrumentType,
      timeSignature: '4/4',
      volume: 0.7,
      muted: false,
      solo: false,
      orderIndex: project.tracks.length,
      notes: []
    };

    setProject({
      ...project,
      tracks: [...project.tracks, newTrack]
    });
  };

  const updateTrack = (trackId: string, updates: Partial<Track>) => {
    if (!project) return;

    setProject({
      ...project,
      tracks: project.tracks.map(track =>
        track.id === trackId ? { ...track, ...updates } : track
      )
    });
  };

  const deleteTrack = (trackId: string) => {
    if (!project) return;

    setProject({
      ...project,
      tracks: project.tracks.filter(track => track.id !== trackId)
    });

    if (currentTrack?.id === trackId) {
      setCurrentTrack(null);
    }
  };

  const addNote = (trackId: string, note: Omit<Note, 'id' | 'trackId'>) => {
    if (!project) return;

    const newNote: Note = {
      id: crypto.randomUUID(),
      trackId,
      ...note
    };

    const updatedTracks = project.tracks.map(track =>
      track.id === trackId
        ? { ...track, notes: [...track.notes, newNote] }
        : track
    );

    setProject({
      ...project,
      tracks: updatedTracks
    });

    if (currentTrack?.id === trackId) {
      const updatedCurrentTrack = updatedTracks.find(t => t.id === trackId);
      if (updatedCurrentTrack) {
        setCurrentTrack(updatedCurrentTrack);
      }
    }
  };

  const deleteNote = (noteId: string) => {
    if (!project) return;

    const updatedTracks = project.tracks.map(track => ({
      ...track,
      notes: track.notes.filter(note => note.id !== noteId)
    }));

    setProject({
      ...project,
      tracks: updatedTracks
    });

    if (currentTrack) {
      const updatedCurrentTrack = updatedTracks.find(t => t.id === currentTrack.id);
      if (updatedCurrentTrack) {
        setCurrentTrack(updatedCurrentTrack);
      }
    }
  };

  const updateVisualizerSettings = (settings: Partial<VisualizerSettings>) => {
    if (!project || !settings.id) return;

    setProject({
      ...project,
      visualizerSettings: project.visualizerSettings.map(vs =>
        vs.id === settings.id ? { ...vs, ...settings } : vs
      )
    });
  };

  return (
    <ProjectContext.Provider
      value={{
        project,
        currentTrack,
        setCurrentTrack,
        createProject,
        updateProject,
        addTrack,
        updateTrack,
        deleteTrack,
        addNote,
        deleteNote,
        updateVisualizerSettings
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}
