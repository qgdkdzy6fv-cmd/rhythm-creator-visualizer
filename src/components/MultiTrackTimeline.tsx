import { useState } from 'react';
import { TimelineRuler } from './TimelineRuler';
import { TrackRow } from './TrackRow';
import type { Track, Note } from '../types';

interface MultiTrackTimelineProps {
  tracks: Track[];
  onAddNote: (trackId: string, note: Omit<Note, 'id' | 'trackId'>) => void;
  onUpdateNote: (noteId: string, updates: Partial<Note>) => void;
  onDeleteNote: (noteId: string) => void;
  onUpdateTrack: (trackId: string, updates: Partial<Track>) => void;
  onReorderTracks: (tracks: Track[]) => void;
  selectedNoteId: string | null;
  onSelectNote: (noteId: string | null) => void;
}

export function MultiTrackTimeline({
  tracks,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onUpdateTrack,
  onReorderTracks,
  selectedNoteId,
  onSelectNote
}: MultiTrackTimelineProps) {
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [draggedTrackId, setDraggedTrackId] = useState<string | null>(null);
  const [dragOverTrackId, setDragOverTrackId] = useState<string | null>(null);

  const sortedTracks = [...tracks].sort((a, b) => a.orderIndex - b.orderIndex);

  const handleTrackDragStart = (trackId: string, e: React.DragEvent) => {
    setDraggedTrackId(trackId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTrackDragOver = (trackId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTrackId(trackId);
  };

  const handleTrackDrop = (targetTrackId: string, e: React.DragEvent) => {
    e.preventDefault();

    if (!draggedTrackId || draggedTrackId === targetTrackId) {
      setDraggedTrackId(null);
      setDragOverTrackId(null);
      return;
    }

    const draggedIndex = sortedTracks.findIndex(t => t.id === draggedTrackId);
    const targetIndex = sortedTracks.findIndex(t => t.id === targetTrackId);

    if (draggedIndex === -1 || targetIndex === -1) return;

    const reordered = [...sortedTracks];
    const [draggedTrack] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, draggedTrack);

    const updatedTracks = reordered.map((track, index) => ({
      ...track,
      orderIndex: index
    }));

    onReorderTracks(updatedTracks);
    setDraggedTrackId(null);
    setDragOverTrackId(null);
  };

  const handleTrackDragEnd = () => {
    setDraggedTrackId(null);
    setDragOverTrackId(null);
  };

  if (tracks.length === 0) {
    return (
      <div className="multi-track-timeline empty">
        <div className="empty-timeline-message">
          <h3>No tracks yet</h3>
          <p>Add a track to start composing</p>
        </div>
      </div>
    );
  }

  return (
    <div className="multi-track-timeline">
      <TimelineRuler totalBars={128} />

      <div className="tracks-container">
        {sortedTracks.map((track) => (
          <div
            key={track.id}
            className={`track-row-wrapper ${dragOverTrackId === track.id ? 'drag-over' : ''}`}
            draggable
            onDragStart={(e) => handleTrackDragStart(track.id, e)}
            onDragOver={(e) => handleTrackDragOver(track.id, e)}
            onDrop={(e) => handleTrackDrop(track.id, e)}
            onDragEnd={handleTrackDragEnd}
          >
            <div className="drag-handle" title="Drag to reorder tracks">
              <span>⋮⋮</span>
            </div>
            <TrackRow
              track={track}
              isSelected={selectedTrackId === track.id}
              onAddNote={onAddNote}
              onUpdateNote={onUpdateNote}
              onDeleteNote={onDeleteNote}
              onSelectTrack={setSelectedTrackId}
              onUpdateTrack={onUpdateTrack}
              selectedNoteId={selectedNoteId}
              onSelectNote={onSelectNote}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
