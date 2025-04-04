import { useState } from 'react';
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

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Restrict to 4 characters max, convert to uppercase
    const name = e.target.value.slice(0, 4).toUpperCase();
    setPlayerName(name);
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
    <div className="high-score-entry">
      <h2 className="entry-title">CONGRATULATIONS!</h2>
      <p className="entry-score">Your score: {score}</p>
      <p className="entry-description">Enter your name for the leaderboard:</p>
      
      <form onSubmit={handleSubmit} className="entry-form">
        <div className="input-container">
          <input
            type="text"
            value={playerName}
            onChange={handleNameChange}
            maxLength={4}
            placeholder="XXXX"
            disabled={submitting}
            className="name-input"
            autoFocus
          />
          <div className="char-count">{playerName.length}/4</div>
        </div>
        
        {error && <p className="error-message">{error}</p>}
        
        <div className="button-container">
          <button 
            type="submit" 
            disabled={submitting} 
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