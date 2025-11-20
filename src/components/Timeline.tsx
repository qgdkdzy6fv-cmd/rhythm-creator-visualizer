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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
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
   * Feature 1: Drag and Drop Notes
   * Handles the start of a drag operation when left mouse button is pressed
   */
  const handleNoteMouseDown = (e: React.MouseEvent, note: Note) => {
    // Only handle left click for dragging
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
   * Initiates delete confirmation dialog
   */
  const handleDeleteFromContextMenu = () => {
    if (contextMenu) {
      setNoteToDelete(contextMenu.noteId);
      setShowDeleteConfirm(true);
      setContextMenu(null);
    }
  };

  /**
   * Feature 2: Right-Click Note Deletion
   * Confirms and executes note deletion
   */
  const confirmDelete = () => {
    if (noteToDelete) {
      onDeleteNote(noteToDelete);
      setNoteToDelete(null);
      setShowDeleteConfirm(false);
    }
  };

  /**
   * Feature 2: Right-Click Note Deletion
   * Cancels deletion
   */
  const cancelDelete = () => {
    setNoteToDelete(null);
    setShowDeleteConfirm(false);
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  return (
    <div className="timeline-container">
      <div className="timeline-view">
        <h3>Timeline</h3>
        <div className="piano-roll" ref={timelineRef}>
          <div className="piano-roll-grid">
            {/* Bar lines with labels */}
            {Array.from({ length: 16 }, (_, i) => (
              <div key={i} className={`bar-line ${i % 4 === 0 ? 'measure-start' : ''}`}>
                <span className="bar-label">{i}</span>
              </div>
            ))}

            {/* Render notes with drag and context menu handlers */}
            {track.notes.map(note => {
              const width = durationMap[note.duration] * GRID_SIZE;
              const left = note.position * GRID_SIZE;
              const isDragging = dragState?.noteId === note.id;

              return (
                <div
                  key={note.id}
                  className={`note-block ${isDragging ? 'dragging' : ''}`}
                  style={{
                    left: `${left}px`,
                    width: `${width}px`
                  }}
                  onMouseDown={(e) => handleNoteMouseDown(e, note)}
                  onContextMenu={(e) => handleNoteContextMenu(e, note)}
                  title={`${note.pitch}${note.octave} • ${note.duration} • Pos: ${note.position}\nLeft-click to drag • Right-click to delete`}
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

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Deletion</h3>
            <p>Are you sure you want to delete this note? This action cannot be undone.</p>
            <div className="modal-actions">
              <button onClick={cancelDelete} className="btn-secondary">
                Cancel
              </button>
              <button onClick={confirmDelete} className="btn-danger">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
