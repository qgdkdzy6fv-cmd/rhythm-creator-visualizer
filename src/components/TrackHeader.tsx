import { useState, useRef, useEffect } from 'react';
import type { Track } from '../types';

interface TrackHeaderProps {
  track: Track;
  isSelected: boolean;
  onSelect: () => void;
  onUpdateTrack: (updates: Partial<Track>) => void;
  onDelete: () => void;
}

export function TrackHeader({ track, onUpdateTrack, onDelete }: TrackHeaderProps) {
  /**
   * Feature 3: Track Name Editing
   */
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(track.name);
  const [nameError, setNameError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Character limits and validation
  const MIN_NAME_LENGTH = 1;
  const MAX_NAME_LENGTH = 50;
  const VALID_NAME_PATTERN = /^[a-zA-Z0-9\s\-_]+$/;

  /**
   * Feature 3: Track Name Editing
   * Handles double-click to enter edit mode
   */
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(track.name);
    setNameError(null);
  };

  /**
   * Feature 3: Track Name Editing
   * Validates track name input
   */
  const validateTrackName = (name: string): string | null => {
    if (name.length < MIN_NAME_LENGTH) {
      return 'Track name is required';
    }
    if (name.length > MAX_NAME_LENGTH) {
      return `Track name must be ${MAX_NAME_LENGTH} characters or less`;
    }
    if (!VALID_NAME_PATTERN.test(name)) {
      return 'Track name can only contain letters, numbers, spaces, hyphens, and underscores';
    }
    return null;
  };

  /**
   * Feature 3: Track Name Editing
   * Saves the edited track name after validation
   */
  const handleSaveName = () => {
    const trimmedName = editValue.trim();
    const error = validateTrackName(trimmedName);

    if (error) {
      setNameError(error);
      return;
    }

    onUpdateTrack({ name: trimmedName });
    setIsEditing(false);
    setNameError(null);
  };

  /**
   * Feature 3: Track Name Editing
   * Cancels editing and reverts to original name
   */
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditValue(track.name);
    setNameError(null);
  };

  /**
   * Feature 3: Track Name Editing
   * Handles keyboard shortcuts during editing
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveName();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  /**
   * Feature 4: Track Minimize/Expand
   * Toggles track expansion state
   */
  const toggleExpanded = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdateTrack({ isExpanded: !track.isExpanded });
  };

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  return (
    <div className="track-header">
      <div className="track-header-left">
        {/* Track Color Indicator */}
        {track.color && (
          <div
            className="track-color-indicator"
            style={{ backgroundColor: track.color }}
            title={`Track color: ${track.color}`}
          />
        )}

        {/* Feature 4: Expand/Collapse Button */}
        <button
          onClick={toggleExpanded}
          className="expand-toggle"
          aria-label={track.isExpanded ? 'Collapse track' : 'Expand track'}
          title={track.isExpanded ? 'Collapse track' : 'Expand track'}
        >
          {track.isExpanded ? '▼' : '▶'}
        </button>

        <div className="track-info">
          {/* Feature 3: Editable Track Name */}
          {isEditing ? (
            <div className="track-name-editor">
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSaveName}
                className={`track-name-input ${nameError ? 'error' : ''}`}
                maxLength={MAX_NAME_LENGTH}
                onClick={(e) => e.stopPropagation()}
              />
              {nameError && <span className="error-message">{nameError}</span>}
              <div className="edit-hint">
                Press Enter to save, Escape to cancel
              </div>
            </div>
          ) : (
            <h3
              onDoubleClick={handleDoubleClick}
              className="track-name"
              title="Double-click to edit track name"
            >
              {track.name}
            </h3>
          )}

          {/* Track Metadata */}
          {!isEditing && (
            <span className="track-meta">
              {track.instrumentType} • {track.timeSignature} • {track.notes.length} notes
            </span>
          )}
        </div>
      </div>

      {/* Delete Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="delete-track-btn"
        aria-label="Delete track"
        title="Delete track"
      >
        ×
      </button>
    </div>
  );
}
