import { useEffect, useState } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProjectProvider, useProject } from './contexts/ProjectContext';
import { useTheme } from './contexts/ThemeContext';
import { audioEngine } from './lib/audioEngine';
import { WaveformVisualizer } from './components/visualizers/WaveformVisualizer';
import { MultiTrackTimeline } from './components/MultiTrackTimeline';
import { TrackHeader } from './components/TrackHeader';
import { COLOR_PALETTE, type Pitch, type NoteDuration, type InstrumentType, type TimeSignature } from './types';
import './App.css';

const TIME_SIGNATURES: TimeSignature[] = ['4/4', '3/4', '6/8', '5/4', '7/8', '2/4'];
const INSTRUMENT_TYPES: InstrumentType[] = ['drums', 'bass', 'synth', 'piano', 'guitar', 'pad'];
const PITCHES: Pitch[] = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const NOTE_DURATIONS: NoteDuration[] = ['whole', 'half', 'quarter', 'eighth', 'sixteenth'];
const OCTAVES = [1, 2, 3, 4, 5, 6, 7, 8];

function AppContent() {
  const { project, createProject, currentTrack, setCurrentTrack, addTrack, updateTrack, deleteTrack, reorderTracks, addNote, updateNote, deleteNote, updateProject, updateVisualizerSettings } = useProject();
  const { theme, toggleTheme } = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState({
    pitch: 'C' as Pitch,
    octave: 4,
    duration: 'quarter' as NoteDuration,
    position: 0,
    velocity: 0.8
  });

  useEffect(() => {
    if (!project) {
      createProject('My Beat Project', 'demo-user-id');
    }
  }, []);

  useEffect(() => {
    return () => {
      audioEngine.stop();
    };
  }, []);

  const initAudio = async () => {
    if (!isInitialized) {
      await audioEngine.initialize();
      setIsInitialized(true);
    }
  };

  const handlePlay = async () => {
    if (!project || project.tracks.length === 0) return;

    await initAudio();

    if (isPlaying) {
      audioEngine.stop();
      setIsPlaying(false);
    } else {
      project.tracks.forEach(track => {
        audioEngine.createInstrument(track.id, track.instrumentType);
      });

      audioEngine.play(project.tracks, project.tempo);
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    audioEngine.stop();
    setIsPlaying(false);
  };

  const handleTempoChange = (tempo: number) => {
    if (!project) return;
    updateProject({ tempo });
    if (isPlaying) {
      audioEngine.setTempo(tempo);
    }
  };

  const handleAddTrack = () => {
    if (!project) return;
    const trackNumber = project.tracks.length + 1;
    addTrack(`Track ${trackNumber}`, 'synth');
  };

  const handleAddNote = () => {
    if (!currentTrack) return;
    addNote(currentTrack.id, newNote);
    setNewNote(prev => ({
      ...prev,
      position: prev.position + 1
    }));
  };

  const handleColorChange = (color: string) => {
    if (!project) return;
    const activeVisualizer = project.visualizerSettings.find(vs => vs.isActive);
    if (activeVisualizer) {
      updateVisualizerSettings({
        id: activeVisualizer.id,
        color
      });
    }
  };

  if (!project) {
    return (
      <div className="loading-screen">
        <p>Loading...</p>
      </div>
    );
  }

  const activeVisualizer = project.visualizerSettings.find(vs => vs.isActive);

  return (
    <div className="app">
      <header className="project-header">
        <div className="header-left">
          <div className="site-title">Beat Box Visualizer</div>
          <div className="project-info">
            <input
              type="text"
              value={project.name}
              onChange={(e) => updateProject({ name: e.target.value })}
              className="project-name-input"
            />
            <span className="project-meta">
              {project.tracks.length} tracks • {project.tempo} BPM
            </span>
          </div>
        </div>

        <div className="header-actions">
          <button onClick={toggleTheme} className="theme-toggle" aria-label="Toggle theme">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      {/* Multi-Track Timeline - Always Visible from Startup */}
      <div className="timeline-tile">
        <div className="timeline-tile-header">
          <h2>Multi-Track Timeline</h2>
          <span className="timeline-meta">
            {project?.tracks.length || 0} tracks • {project?.tracks.reduce((sum, t) => sum + t.notes.length, 0) || 0} notes total
          </span>
        </div>
        <MultiTrackTimeline
          tracks={project?.tracks || []}
          onAddNote={addNote}
          onUpdateNote={updateNote}
          onDeleteNote={deleteNote}
          onUpdateTrack={updateTrack}
          onReorderTracks={reorderTracks}
          selectedNoteId={selectedNoteId}
          onSelectNote={setSelectedNoteId}
          defaultPitch={newNote.pitch}
          defaultOctave={newNote.octave}
          defaultDuration={newNote.duration}
        />
      </div>

      <main className={`main-content ${currentTrack ? 'with-timeline' : ''}`}>
        <div className="left-panel">
          <div className="playback-controls">
            <div className="transport-buttons">
              <button
                onClick={handlePlay}
                className={`play-btn ${isPlaying ? 'playing' : ''}`}
                disabled={project.tracks.length === 0}
              >
                {isPlaying ? '⏸ Pause' : '▶ Play'}
              </button>
              <button
                onClick={handleStop}
                className="stop-btn"
                disabled={!isPlaying}
              >
                ⏹ Stop
              </button>
            </div>

            <div className="tempo-control">
              <label>Tempo: {project.tempo} BPM</label>
              <input
                type="range"
                min="60"
                max="200"
                value={project.tempo}
                onChange={(e) => handleTempoChange(parseInt(e.target.value))}
                className="tempo-slider"
              />
            </div>
          </div>

          <div className="visualizer-panel">
            <div className="visualizer-controls">
              <div className="visualizer-type-selector">
                <label>Waveform Visualizer</label>
                <p style={{ fontSize: '0.85rem', opacity: 0.7, margin: '0.5rem 0' }}>
                  More types coming soon
                </p>
              </div>

              {activeVisualizer && (
                <div className="color-palette">
                  <label className="color-palette-label">Color</label>
                  <div className="color-swatches">
                    {COLOR_PALETTE.map((color) => (
                      <button
                        key={color}
                        className={`color-swatch ${activeVisualizer.color === color ? 'selected' : ''}`}
                        style={{ backgroundColor: color }}
                        onClick={() => handleColorChange(color)}
                        aria-label={`Select color ${color}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="visualizer-display">
              {activeVisualizer && (
                <WaveformVisualizer color={activeVisualizer.color} isActive={true} />
              )}
            </div>
          </div>
        </div>

        <div className="center-panel">
          <div className="track-list">
            <div className="track-list-header">
              <h2>Tracks</h2>
              <button onClick={handleAddTrack} className="add-track-btn">
                + Add Track
              </button>
            </div>

            <div className="tracks">
              {project.tracks.length === 0 ? (
                <div className="empty-state">
                  <p>No tracks yet. Add your first track to get started!</p>
                </div>
              ) : (
                project.tracks.map(track => (
                  <div
                    key={track.id}
                    className={`track-item ${currentTrack?.id === track.id ? 'selected' : ''} ${!track.isExpanded ? 'collapsed' : ''}`}
                    onClick={() => setCurrentTrack(track)}
                  >
                    <TrackHeader
                      track={track}
                      isSelected={currentTrack?.id === track.id}
                      onSelect={() => setCurrentTrack(track)}
                      onUpdateTrack={(updates) => updateTrack(track.id, updates)}
                      onDelete={() => deleteTrack(track.id)}
                    />

                    {track.isExpanded && (
                      <div className="track-controls">
                        <div className="control-group">
                          <label>Instrument</label>
                          <select
                            value={track.instrumentType}
                            onChange={(e) => updateTrack(track.id, { instrumentType: e.target.value as InstrumentType })}
                          >
                            {INSTRUMENT_TYPES.map(type => (
                              <option key={type} value={type}>
                                {type.charAt(0).toUpperCase() + type.slice(1)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="control-group">
                          <label>Time Signature</label>
                          <select
                            value={track.timeSignature}
                            onChange={(e) => updateTrack(track.id, { timeSignature: e.target.value as TimeSignature })}
                          >
                            {TIME_SIGNATURES.map(sig => (
                              <option key={sig} value={sig}>{sig}</option>
                            ))}
                          </select>
                        </div>

                        <div className="control-group">
                          <label>Volume: {Math.round(track.volume * 100)}%</label>
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={track.volume}
                            onChange={(e) => updateTrack(track.id, { volume: parseFloat(e.target.value) })}
                            className="volume-slider"
                          />
                        </div>

                        <div className="control-group button-row">
                          <button
                            className={track.muted ? 'active' : ''}
                            onClick={() => updateTrack(track.id, { muted: !track.muted })}
                          >
                            {track.muted ? 'Unmute' : 'Mute'}
                          </button>
                          <button
                            className={track.solo ? 'active' : ''}
                            onClick={() => updateTrack(track.id, { solo: !track.solo })}
                          >
                            Solo
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="note-editor">
            {!currentTrack ? (
              <div className="empty-state">
                <p>Select a track to add notes</p>
              </div>
            ) : (
              <>
                <div className="note-editor-header">
                  <h2>Note Editor - {currentTrack.name}</h2>
                </div>

                <div className="note-controls">
                  <div className="control-row">
                    <div className="control-group">
                      <label>Pitch</label>
                      <select
                        value={newNote.pitch}
                        onChange={(e) => setNewNote({ ...newNote, pitch: e.target.value as Pitch })}
                      >
                        {PITCHES.map(pitch => (
                          <option key={pitch} value={pitch}>{pitch}</option>
                        ))}
                      </select>
                    </div>

                    <div className="control-group">
                      <label>Octave</label>
                      <select
                        value={newNote.octave}
                        onChange={(e) => setNewNote({ ...newNote, octave: parseInt(e.target.value) })}
                      >
                        {OCTAVES.map(octave => (
                          <option key={octave} value={octave}>{octave}</option>
                        ))}
                      </select>
                    </div>

                    <div className="control-group">
                      <label>Duration</label>
                      <select
                        value={newNote.duration}
                        onChange={(e) => setNewNote({ ...newNote, duration: e.target.value as NoteDuration })}
                      >
                        {NOTE_DURATIONS.map(duration => (
                          <option key={duration} value={duration}>
                            {duration.charAt(0).toUpperCase() + duration.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="control-group">
                      <label>Position</label>
                      <input
                        type="number"
                        min="0"
                        step="0.25"
                        value={newNote.position}
                        onChange={(e) => setNewNote({ ...newNote, position: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>

                  <button onClick={handleAddNote} className="add-note-btn">
                    Add Note
                  </button>
                </div>

                <div className="notes-list">
                  <h3>Notes ({currentTrack.notes.length})</h3>
                  {currentTrack.notes.length === 0 ? (
                    <p className="empty-state">No notes yet</p>
                  ) : (
                    <div className="notes-grid">
                      {currentTrack.notes
                        .sort((a, b) => a.position - b.position)
                        .map(note => (
                          <div key={note.id} className="note-item">
                            <span className="note-info">
                              {note.pitch}{note.octave} • {note.duration} • Pos: {note.position}
                            </span>
                            <button
                              onClick={() => deleteNote(note.id)}
                              className="delete-note-btn"
                              aria-label="Delete note"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Velocity Control Panel */}
                {selectedNoteId && (() => {
                  const selectedNote = currentTrack.notes.find(note => note.id === selectedNoteId);
                  if (!selectedNote) return null;

                  const handleVelocityChange = (velocity: number) => {
                    updateNote(selectedNoteId, { velocity });
                  };

                  return (
                    <div className="velocity-control-panel">
                      <div className="velocity-control-header">
                        <h4>Velocity Control</h4>
                        <button
                          className="close-btn"
                          onClick={() => setSelectedNoteId(null)}
                          aria-label="Close velocity control"
                        >
                          ×
                        </button>
                      </div>

                      <div className="velocity-info">
                        <span className="note-info">
                          {selectedNote.pitch}{selectedNote.octave} • {selectedNote.duration}
                        </span>
                        <span className="velocity-value">
                          {Math.round(selectedNote.velocity * 127)}
                        </span>
                      </div>

                      <div className="velocity-slider-container">
                        <label htmlFor="velocity-slider">
                          Velocity (0-127)
                        </label>
                        <input
                          id="velocity-slider"
                          type="range"
                          min="0"
                          max="127"
                          value={Math.round(selectedNote.velocity * 127)}
                          onChange={(e) => handleVelocityChange(parseInt(e.target.value) / 127)}
                          className="velocity-slider"
                        />
                        <div className="velocity-markers">
                          <span>0 (Silent)</span>
                          <span>64 (Medium)</span>
                          <span>127 (Full)</span>
                        </div>
                      </div>

                      <div className="velocity-presets">
                        <button onClick={() => handleVelocityChange(0.2)}>pp</button>
                        <button onClick={() => handleVelocityChange(0.4)}>p</button>
                        <button onClick={() => handleVelocityChange(0.6)}>mf</button>
                        <button onClick={() => handleVelocityChange(0.8)}>f</button>
                        <button onClick={() => handleVelocityChange(1.0)}>ff</button>
                      </div>

                      <div className="velocity-hint">
                        Press Escape to deselect
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <ProjectProvider>
        <AppContent />
      </ProjectProvider>
    </ThemeProvider>
  );
}

export default App;
