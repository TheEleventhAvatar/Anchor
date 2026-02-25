import React from 'react';
import { Transcript } from '../types';
import './TranscriptList.css';

interface TranscriptListProps {
  transcripts: Transcript[];
  selectedTranscript: Transcript | null;
  onSelectTranscript: (transcript: Transcript) => void;
}

export const TranscriptList: React.FC<TranscriptListProps> = ({
  transcripts,
  selectedTranscript,
  onSelectTranscript,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="transcript-list">
      <div className="transcript-list-header">
        <h3>Transcripts</h3>
        <span className="transcript-count">{transcripts.length}</span>
      </div>
      
      <div className="transcript-items">
        {transcripts.length === 0 ? (
          <div className="empty-state">
            <p>No transcripts yet</p>
            <p className="empty-hint">Connect your phone to start receiving transcripts</p>
          </div>
        ) : (
          transcripts.map((transcript) => (
            <div
              key={transcript.id}
              className={`transcript-item ${
                selectedTranscript?.id === transcript.id ? 'selected' : ''
              }`}
              onClick={() => onSelectTranscript(transcript)}
            >
              <div className="transcript-header">
                <h4 className="transcript-title">{transcript.title}</h4>
                <div className="transcript-meta">
                  <span className="transcript-date">{formatDate(transcript.created_at)}</span>
                  {!transcript.synced && (
                    <span className="unsynced-badge">Unsynced</span>
                  )}
                </div>
              </div>
              <p className="transcript-preview">
                {transcript.content.length > 100
                  ? `${transcript.content.substring(0, 100)}...`
                  : transcript.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
