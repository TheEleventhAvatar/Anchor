import React, { useState } from 'react';
import './AddTranscriptForm.css';

interface AddTranscriptFormProps {
  onAddTranscript: (title: string, content: string) => void;
}

export const AddTranscriptForm: React.FC<AddTranscriptFormProps> = ({
  onAddTranscript,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && content.trim()) {
      onAddTranscript(title.trim(), content.trim());
      setTitle('');
      setContent('');
      setIsExpanded(false);
    }
  };

  const handleCancel = () => {
    setTitle('');
    setContent('');
    setIsExpanded(false);
  };

  if (!isExpanded) {
    return (
      <div className="add-transcript-form">
        <button 
          className="add-transcript-btn"
          onClick={() => setIsExpanded(true)}
        >
          + Add Transcript
        </button>
      </div>
    );
  }

  return (
    <div className="add-transcript-form expanded">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Transcript title..."
            className="title-input"
            autoFocus
          />
        </div>
        
        <div className="form-group">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Transcript content..."
            className="content-input"
            rows={4}
          />
        </div>
        
        <div className="form-actions">
          <button type="submit" className="submit-btn">
            Add Transcript
          </button>
          <button type="button" className="cancel-btn" onClick={handleCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};
