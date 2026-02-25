import React, { useState } from 'react';
import { Transcript } from '../types';
import './TranscriptDetail.css';

interface TranscriptDetailProps {
  transcript: Transcript | null;
  onMarkSynced: (id: number) => void;
  isOnline: boolean;
}

export const TranscriptDetail: React.FC<TranscriptDetailProps> = ({
  transcript,
  onMarkSynced,
  isOnline,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEdit = () => {
    if (transcript) {
      setEditedTitle(transcript.title);
      setEditedContent(transcript.content);
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedTitle('');
    setEditedContent('');
  };

  if (!transcript) {
    return (
      <div className="transcript-detail">
        <div className="empty-detail">
          <div className="empty-icon">📝</div>
          <h3>Select a transcript</h3>
          <p>Choose a transcript from the list to view its details</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transcript-detail">
      <div className="detail-header">
        <div className="detail-meta">
          <span className="detail-id">ID: {transcript.id}</span>
          <span className="detail-date">{formatDate(transcript.created_at)}</span>
          <span className={`sync-status ${transcript.synced ? 'synced' : 'unsynced'}`}>
            {transcript.synced ? '✓ Synced' : '○ Unsynced'}
          </span>
        </div>
        
        <div className="detail-actions">
          {!isEditing && (
            <>
              <button className="edit-btn" onClick={handleEdit}>
                Edit
              </button>
              {!transcript.synced && isOnline && (
                <button 
                  className="sync-btn" 
                  onClick={() => onMarkSynced(transcript.id)}
                >
                  Mark as Synced
                </button>
              )}
            </>
          )}
          
          {isEditing && (
            <>
              <button className="save-btn" onClick={handleSave}>
                Save
              </button>
              <button className="cancel-btn" onClick={handleCancel}>
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      <div className="detail-content">
        {isEditing ? (
          <div className="edit-form">
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              className="edit-title"
              placeholder="Transcript title"
            />
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="edit-content"
              placeholder="Transcript content"
              rows={10}
            />
          </div>
        ) : (
          <>
            <h2 className="detail-title">{transcript.title}</h2>
            <div className="detail-text">{transcript.content}</div>
          </>
        )}
      </div>
    </div>
  );
};
