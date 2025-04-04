import { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../lib/queryClient';
import LeaderboardDisplay, { HighScore } from './LeaderboardDisplay';
import '../styles/leaderboard.css';

interface HighScoreEntryProps {
  score: number;
  level: number;
  onClose?: () => void;
  onComplete?: () => void;
}

const HighScoreEntry: React.FC<HighScoreEntryProps> = ({ score, level, onClose, onComplete }) => {
  const [playerName, setPlayerName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [highScore, setHighScore] = useState<HighScore | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus the input field when component mounts
  useEffect(() => {
    // Give the DOM time to render before focusing
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        console.log("Input field focused");
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Handle key press directly to ensure it works
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    console.log("Key pressed:", e.key);
    
    // Allow only letters and numbers
    if (/^[a-zA-Z0-9]$/.test(e.key) && playerName.length < 4) {
      setPlayerName(prev => (prev + e.key).toUpperCase().slice(0, 4));
    } else if (e.key === 'Backspace') {
      setPlayerName(prev => prev.slice(0, -1));
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Restrict to 4 characters max, convert to uppercase
    const name = e.target.value.slice(0, 4).toUpperCase();
    setPlayerName(name);
    console.log("Name changed to:", name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      setError('Please enter your name (1-4 letters)');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      console.log("Submitting score with name:", playerName);
      
      const result = await apiRequest('/api/highscores', {
        method: 'POST',
        body: JSON.stringify({
          playerName: playerName.trim(),
          score,
          level
        }),
        headers: {
          'Content-Type': 'application/json'
        },
        on401: 'throw'
      });
      
      console.log("Score submitted successfully:", result);
      setHighScore(result as HighScore);
      setSubmitted(true);
      
      // Call onComplete if provided
      if (onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error('Failed to submit high score:', err);
      setError('Failed to save your score. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted && highScore) {
    return <LeaderboardDisplay playerScore={score} onClose={onClose} />;
  }

  return (
    <div className="high-score-entry" onClick={() => inputRef.current?.focus()}>
      <h2 className="entry-title">CONGRATULATIONS!</h2>
      <p className="entry-score">Your score: {score}</p>
      <p className="entry-description">Enter your name for the leaderboard:</p>
      
      <form onSubmit={handleSubmit} className="entry-form">
        <div className="input-container">
          <input
            ref={inputRef}
            type="text"
            value={playerName}
            onChange={handleNameChange}
            onKeyDown={handleKeyPress}
            maxLength={4}
            placeholder="XXXX"
            disabled={submitting}
            className="name-input"
            autoFocus
            style={{ caretColor: 'transparent' }}
          />
          <div className="char-count">{playerName.length}/4</div>
        </div>
        
        {error && <p className="error-message">{error}</p>}
        {playerName.length === 0 && 
          <p className="help-text">Type up to 4 letters for your name</p>
        }
        
        <div className="button-container">
          <button 
            type="submit" 
            disabled={submitting || playerName.length === 0} 
            className="submit-button"
          >
            {submitting ? 'Saving...' : 'Submit Score'}
          </button>
          
          <button 
            type="button" 
            onClick={() => {
              // Call onComplete if provided, otherwise call onClose
              if (onComplete) {
                onComplete();
              } else if (onClose) {
                onClose();
              }
            }} 
            disabled={submitting}
            className="skip-button"
          >
            Skip
          </button>
        </div>
      </form>
    </div>
  );
};

export default HighScoreEntry;