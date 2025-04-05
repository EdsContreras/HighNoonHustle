import { useEffect, useState } from 'react';
import { apiRequest } from '../lib/queryClient';
import '../styles/leaderboard.css';

export interface HighScore {
  id: number;
  playerName: string;
  score: number;
  level: number;
  date: string;
}

interface LeaderboardDisplayProps {
  onClose?: () => void;
  onBack?: () => void;
  onReturnToStart?: () => void; // New prop for returning to start screen
  playerScore?: number;
}

const LeaderboardDisplay: React.FC<LeaderboardDisplayProps> = ({ 
  onClose,
  onBack,
  onReturnToStart,
  playerScore 
}) => {
  const [highScores, setHighScores] = useState<HighScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHighScores = async () => {
      try {
        setLoading(true);
        const scores = await apiRequest('/api/highscores', {
          method: 'GET',
          on401: 'returnNull'
        });
        
        if (scores) {
          setHighScores(scores as HighScore[]);
        }
      } catch (err) {
        console.error('Failed to fetch high scores:', err);
        setError('Failed to load high scores');
      } finally {
        setLoading(false);
      }
    };

    fetchHighScores();
  }, []);

  // Function to determine if the player's current score would make the leaderboard
  const wouldMakeLeaderboard = () => {
    if (!playerScore || highScores.length < 10) return true;
    const lowestScore = highScores[highScores.length - 1]?.score || 0;
    return playerScore > lowestScore;
  };

  return (
    <div 
      className="absolute inset-0 flex items-center justify-center"
      style={{
        backgroundImage: 'url(/assets/MostWanted.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Semi-transparent overlay to improve text legibility */}
      <div className="absolute inset-0 bg-black/30" />
      
      <div className="leaderboard-container bg-black/70 border-2 border-amber-800 z-10">
        {/* Removed the image since we're using it as background */}
        <h2 className="leaderboard-title">TOP OUTLAWS</h2>
        
        {loading ? (
          <p className="loading-text">Loading high scores...</p>
        ) : error ? (
          <p className="error-text">{error}</p>
        ) : (
          <div className="scores-table-container">
            <table className="scores-table">
              <thead>
                <tr>
                  <th className="rank-column">RANK</th>
                  <th className="name-column">NAME</th>
                  <th className="score-column">BOUNTY</th>
                  <th className="level-column">LEVEL</th>
                </tr>
              </thead>
              <tbody>
                {highScores.map((score, index) => (
                  <tr key={score.id} className={playerScore === score.score ? 'your-score' : ''}>
                    <td className="rank-column">{index + 1}</td>
                    <td className="name-column">{score.playerName}</td>
                    <td className="score-column">${score.score}</td>
                    <td className="level-column">{score.level}</td>
                  </tr>
                ))}
                {highScores.length === 0 && (
                  <tr>
                    <td colSpan={4} className="no-scores">No outlaws yet. Be the first to make the wanted list!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {playerScore && (
          <div className="player-score-info">
            <p>Your bounty: ${playerScore}</p>
            {wouldMakeLeaderboard() ? (
              <p className="make-leaderboard">You're on the WANTED list!</p>
            ) : (
              <p className="no-leaderboard">Commit more crimes to make the WANTED list!</p>
            )}
          </div>
        )}
        
        <div className="button-container">
          <button 
            className="start-button" 
            onClick={onReturnToStart}
          >
            Return to Saloon
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardDisplay;