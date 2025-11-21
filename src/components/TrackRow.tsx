import { useState, useRef, useEffect } from 'react';
import type { Track, Note, NoteDuration, Pitch } from '../types';

interface TrackRowProps {
  track: Track;
  isSelected: boolean;
  onAddNote: (trackId: string, note: Omit<Note, 'id' | 'trackId'>) => void;
  onUpdateNote: (noteId: string, updates: Partial<Note>) => void;
  onDeleteNote: (noteId: string) => void;
  onSelectTrack: (trackId: string) => void;
  onUpdateTrack: (trackId: string, updates: Partial<Track>) => void;
  selectedNoteId: string | null;
  onSelectNote: (noteId: string | null) => void;
}

interface DragState {
  noteId: string;
  startX: number;
  startPosition: number;
}

const GRID_SIZE = 60;
const DURATION_WIDTHS = {
  whole: 240,
  half: 120,
  quarter: 60,
  eighth: 30,
  sixteenth: 15
};

export function TrackRow({
  track,
  isSelected,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onSelectTrack,
  onUpdateTrack,
  selectedNoteId,
  onSelectNote
}: TrackRowProps) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const trackRowRef = useRef<HTMLDivElement>(null);

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.note-block')) {
      return;
    }

    const rect = trackRowRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const rawPosition = clickX / GRID_SIZE;
    const snappedPosition = Math.max(0, Math.round(rawPosition * 4) / 4);

    if (e.button === 0) {
      const existingNote = track.notes.find(note =>
        Math.abs(note.position - snappedPosition) < 0.01
      );

      if (!existingNote) {
        onAddNote(track.id, {
          pitch: 'C' as Pitch,
          octave: 4,
          duration: 'quarter' as NoteDuration,
          position: snappedPosition,
          velocity: 0.8
        });
      }
    }

    onSelectTrack(track.id);
  };

  const handleTrackContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('.note-block')) {
      return;
    }

    e.preventDefault();

    const rect = trackRowRef.current?.getBoundingClientRect();
    if (!rect) return;

    const clickX = e.clientX - rect.left;
    const rawPosition = clickX / GRID_SIZE;
    const snappedPosition = Math.max(0, Math.round(rawPosition * 4) / 4);

    const noteAtPosition = track.notes.find(note =>
      Math.abs(note.position - snappedPosition) < 0.01
    );

    if (noteAtPosition) {
      onDeleteNote(noteAtPosition.id);
      onSelectNote(null);
    }
  };

  const handleNoteDragStart = (noteId: string, e: React.MouseEvent) => {
    const note = track.notes.find(n => n.id === noteId);
    if (!note) return;

    setDragState({
      noteId,
      startX: e.clientX,
      startPosition: note.position
    });

    onSelectNote(noteId);
  };

  const handleNoteDrag = (e: React.MouseEvent) => {
    if (!dragState) return;

    const deltaX = e.clientX - dragState.startX;
    const deltaPosition = deltaX / GRID_SIZE;
    const newPosition = Math.max(0, Math.round((dragState.startPosition + deltaPosition) * 4) / 4);

    onUpdateNote(dragState.noteId, { position: newPosition });
  };

  const handleNoteDragEnd = () => {
    setDragState(null);
  };

  useEffect(() => {
    if (dragState) {
      const handleMouseMove = (e: MouseEvent) => handleNoteDrag(e as any);
      const handleMouseUp = () => handleNoteDragEnd();

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState]);

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateTrack(track.id, { muted: !track.muted });
  };

  const handleToggleSolo = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateTrack(track.id, { solo: !track.solo });
  };

  return (
    <div className={`track-row ${isSelected ? 'selected' : ''}`} style={{ backgroundColor: `${track.color}08` }}>
      {/* Track Controls - Left Side */}
      <div className="track-controls">
        <div className="track-info-with-buttons">
          <div className="track-info">
            <div className="track-name" title={track.name}>{track.name}</div>
            <div className="track-meta">{track.instrumentType} • {track.timeSignature}</div>
          </div>

          <div className="track-buttons">
            <button
              className={`control-btn ${track.muted ? 'active' : ''}`}
              onClick={handleToggleMute}
              title={track.muted ? 'Unmute' : 'Mute'}
            >
              M
            </button>
            <button
              className={`control-btn ${track.solo ? 'active' : ''}`}
              onClick={handleToggleSolo}
              title={track.solo ? 'Unsolo' : 'Solo'}
            >
              S
            </button>
          </div>
        </div>
      </div>

      {/* Track Timeline - Right Side */}
      <div
        className="track-timeline"
        ref={trackRowRef}
        onClick={handleTrackClick}
        onContextMenu={handleTrackContextMenu}
      >
        {/* Inline Timeline Ruler */}
        <div className="inline-ruler">
          {Array.from({ length: 128 }, (_, i) => (
            <div
              key={i}
              className={`inline-ruler-mark ${i % 4 === 0 ? 'major' : 'minor'}`}
              style={{ left: `${i * GRID_SIZE}px` }}
            >
              <span className="inline-ruler-label">{i + 1}</span>
            </div>
          ))}
        </div>

        {/* Notes */}
        {track.notes.map(note => (
          <div
            key={note.id}
            className={`note-block ${selectedNoteId === note.id ? 'selected' : ''}`}
            style={{
              left: `${note.position * GRID_SIZE}px`,
              width: `${DURATION_WIDTHS[note.duration]}px`,
              backgroundColor: track.color || '#4ECDC4',
              opacity: note.velocity
            }}
            onMouseDown={(e) => handleNoteDragStart(note.id, e)}
            title={`${note.pitch}${note.octave} (${note.duration}) - Position: ${note.position}`}
          >
            <span className="note-label">{note.pitch}{note.octave}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
