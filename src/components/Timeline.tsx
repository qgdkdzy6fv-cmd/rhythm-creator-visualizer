import { useState, useRef, useEffect } from 'react';
import type { Track, Note, NoteDuration } from '../types';

interface TimelineProps {
  track: Track;
  onUpdateNote: (noteId: string, updates: Partial<Note>) => void;
  onDeleteNote: (noteId: string) => void;
}

interface DragState {
  noteId: string;
  startX: number;
  startPosition: number;
}

interface ContextMenuState {
  noteId: string;
  x: number;
  y: number;
}

export function Timeline({ track, onUpdateNote, onDeleteNote }: TimelineProps) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Duration mapping for visual representation
  const durationMap: Record<NoteDuration, number> = {
    whole: 4,
    half: 2,
    quarter: 1,
    eighth: 0.5,
    sixteenth: 0.25
  };

  // Grid cell width in pixels (each represents 1 beat)
  const GRID_SIZE = 60;

  /**
   * Note Selection: Handle click to select note
   * Distinguishes between click (selection) and drag
   */
  const handleNoteClick = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    setSelectedNoteId(note.id);
  };

  /**
   * Feature 1: Drag and Drop Notes
   * Handles the start of a drag operation when left mouse button is pressed
   */
  const handleNoteMouseDown = (e: React.MouseEvent, note: Note) => {
    if (e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    setDragState({
      noteId: note.id,
      startX: e.clientX,
      startPosition: note.position
    });
  };

  /**
   * Feature 1: Drag and Drop Notes
   * Handles mouse movement during drag operation with grid snapping
   */
  useEffect(() => {
    if (!dragState) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragState.startX;
      const deltaBeats = deltaX / GRID_SIZE;

      // Calculate new position with grid snapping (0.25 beat increments)
      let newPosition = dragState.startPosition + deltaBeats;
      newPosition = Math.max(0, Math.round(newPosition * 4) / 4); // Snap to 16th notes

      // Update note position
      onUpdateNote(dragState.noteId, { position: newPosition });
    };

    const handleMouseUp = () => {
      setDragState(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, onUpdateNote]);

  /**
   * Feature 2: Right-Click Note Deletion
   * Opens context menu on right-click
   */
  const handleNoteContextMenu = (e: React.MouseEvent, note: Note) => {
    e.preventDefault();
    e.stopPropagation();

    setContextMenu({
      noteId: note.id,
      x: e.clientX,
      y: e.clientY
    });
  };

  /**
   * Feature 2: Right-Click Note Deletion
   * Executes note deletion directly without confirmation
   */
  const handleDeleteFromContextMenu = () => {
    if (contextMenu) {
      onDeleteNote(contextMenu.noteId);
      setContextMenu(null);
    }
  };

  /**
   * Velocity Control: Update note velocity
   */
  const handleVelocityChange = (velocity: number) => {
    if (selectedNoteId) {
      onUpdateNote(selectedNoteId, { velocity });
    }
  };

  /**
   * Deselect note when clicking outside
   */
  const handleTimelineClick = () => {
    setSelectedNoteId(null);
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  // Handle Escape key to deselect note
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedNoteId(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Get selected note data
  const selectedNote = selectedNoteId
    ? track.notes.find(note => note.id === selectedNoteId)
    : null;

  return (
    <div className="timeline-container">
      <div className="timeline-view">
        <h3>Timeline</h3>
        <div className="piano-roll" ref={timelineRef} onClick={handleTimelineClick}>
          <div className="piano-roll-grid">
            {/* Bar lines with labels */}
            {Array.from({ length: 16 }, (_, i) => (
              <div key={i} className={`bar-line ${i % 4 === 0 ? 'measure-start' : ''}`}>
                <span className="bar-label">{i}</span>
              </div>
            ))}

            {/* Render notes with selection, drag, and context menu handlers */}
            {track.notes.map(note => {
              const width = durationMap[note.duration] * GRID_SIZE;
              const left = note.position * GRID_SIZE;
              const isDragging = dragState?.noteId === note.id;
              const isSelected = selectedNoteId === note.id;

              // Visual feedback: opacity based on velocity (0.4 - 1.0 range)
              const velocityOpacity = 0.4 + (note.velocity * 0.6);

              return (
                <div
                  key={note.id}
                  className={`note-block ${isDragging ? 'dragging' : ''} ${isSelected ? 'selected' : ''}`}
                  style={{
                    left: `${left}px`,
                    width: `${width}px`,
                    opacity: velocityOpacity
                  }}
                  onClick={(e) => handleNoteClick(e, note)}
                  onMouseDown={(e) => handleNoteMouseDown(e, note)}
                  onContextMenu={(e) => handleNoteContextMenu(e, note)}
                  title={`${note.pitch}${note.octave} • ${note.duration} • Pos: ${note.position} • Velocity: ${Math.round(note.velocity * 127)}\nClick to select • Drag to move • Right-click to delete`}
                >
                  <span className="note-label">{note.pitch}{note.octave}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Velocity Control Panel */}
      {selectedNote && (
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
      )}

      {/* Context Menu for right-click */}
      {contextMenu && (
        <div
          className="context-menu"
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={handleDeleteFromContextMenu} className="context-menu-item danger">
            Delete Note
          </button>
        </div>
      )}

    </div>
  );
}
