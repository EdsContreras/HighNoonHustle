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
    <div 
      className="absolute inset-0 flex items-center justify-center"
      style={{
        backgroundImage: 'url(/assets/IntroBackground.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Semi-transparent overlay to improve text legibility */}
      <div className="absolute inset-0 bg-black/20" />
      
      <div className="high-score-entry bg-black/50 border-2 border-amber-800 z-10">
        <div className="most-wanted-header">
          <img 
            src="/assets/MostWanted.png" 
            alt="The Most Wanted Outlaws" 
            className="most-wanted-image-small" 
          />
        </div>
        <h2 className="entry-title">WANTED!</h2>
        <p className="entry-score">Bounty: ${score}</p>
        <p className="entry-description">You've made it to the Most Wanted list!</p>
        <p className="entry-description">Enter your outlaw name (up to 4 letters):</p>
        
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
            <p className="help-text">Enter your outlaw alias (4 letters max)</p>
          }
          
          <div className="button-container">
            <button 
              type="submit" 
              disabled={submitting || playerName.length === 0} 
              className="submit-button"
            >
              {submitting ? 'Posting Wanted...' : 'Post Bounty'}
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
              Remain Anonymous
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HighScoreEntry;