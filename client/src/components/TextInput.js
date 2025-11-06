import React, { useState } from 'react';
import './TextInput.css';

function TextInput({ imageData, onSubmit }) {
  const [text, setText] = useState('');
  const maxLength = 50;

  const handleSubmit = () => {
    if (text.trim().length === 0) {
      alert('Please enter a description');
      return;
    }
    onSubmit(text.trim());
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="text-input-container">
      <div className="text-input-card">
        <div className="image-section">
          <h2>What do you see?</h2>
          <div className="image-display">
            <img src={imageData} alt="Drawing to describe" />
          </div>
        </div>

        <div className="input-section">
          <label htmlFor="text-input">
            Write a word or phrase describing what you see:
          </label>
          <textarea
            id="text-input"
            value={text}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= maxLength) {
                setText(value);
              }
            }}
            onKeyPress={handleKeyPress}
            placeholder="Type your answer here..."
            rows="3"
            maxLength={maxLength}
            className="text-area"
          />
          <div className="char-count">
            {text.length}/{maxLength} characters
          </div>
        </div>

        <div className="submit-section">
          <button
            className="btn-submit-text"
            onClick={handleSubmit}
            disabled={text.trim().length === 0}
          >
            Submit Answer
          </button>
        </div>
      </div>
    </div>
  );
}

export default TextInput;

