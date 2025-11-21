import { useState, useRef, useEffect } from 'react';
import type { Track, Note, NoteDuration } from '../types';

interface TimelineProps {
  track: Track;
  onUpdateNote: (noteId: string, updates: Partial<Note>) => void;
  onDeleteNote: (noteId: string) => void;
  selectedNoteId: string | null;
  onSelectNote: (noteId: string | null) => void;
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

export function Timeline({ track, onUpdateNote, onDeleteNote, selectedNoteId, onSelectNote }: TimelineProps) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
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
    onSelectNote(note.id);
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
   * Deselect note when clicking outside
   */
  const handleTimelineClick = () => {
    onSelectNote(null);
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
        onSelectNote(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onSelectNote]);

  return (
    <div className="timeline-container">
      <div className="timeline-view">
        <div className="piano-roll" ref={timelineRef} onClick={handleTimelineClick}>
          <div className="piano-roll-grid">
            {/* Bar lines with labels (1-based counting) - Extended to 128 bars */}
            {Array.from({ length: 128 }, (_, i) => (
              <div
                key={i}
                className={`bar-line ${i % 4 === 0 ? 'measure-start' : ''}`}
                style={{ left: `${i * GRID_SIZE}px` }}
              >
                <span className="bar-label">{i + 1}</span>
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
                    '--note-velocity-opacity': velocityOpacity,
                    '--note-color': track.color || '#4ECDC4'
                  } as React.CSSProperties}
                  onClick={(e) => handleNoteClick(e, note)}
                  onMouseDown={(e) => handleNoteMouseDown(e, note)}
                  onContextMenu={(e) => handleNoteContextMenu(e, note)}
                  title={`${note.pitch}${note.octave} • ${note.duration} • Pos: ${note.position + 1} • Velocity: ${Math.round(note.velocity * 127)}\nClick to select • Drag to move • Right-click to delete`}
                >
                  <span className="note-label">{note.pitch}{note.octave}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

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
