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
  playerScore?: number;
}

const LeaderboardDisplay: React.FC<LeaderboardDisplayProps> = ({ 
  onClose,
  onBack,
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
    <div className="leaderboard-container">
      <h2 className="leaderboard-title">TOP SCORES</h2>
      
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
                <th className="score-column">SCORE</th>
                <th className="level-column">LEVEL</th>
              </tr>
            </thead>
            <tbody>
              {highScores.map((score, index) => (
                <tr key={score.id} className={playerScore === score.score ? 'your-score' : ''}>
                  <td className="rank-column">{index + 1}</td>
                  <td className="name-column">{score.playerName}</td>
                  <td className="score-column">{score.score}</td>
                  <td className="level-column">{score.level}</td>
                </tr>
              ))}
              {highScores.length === 0 && (
                <tr>
                  <td colSpan={4} className="no-scores">No high scores yet. Be the first!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {playerScore && (
        <div className="player-score-info">
          <p>Your score: {playerScore}</p>
          {wouldMakeLeaderboard() ? (
            <p className="make-leaderboard">You made the leaderboard!</p>
          ) : (
            <p className="no-leaderboard">Keep trying to make the leaderboard!</p>
          )}
        </div>
      )}
      
      {(onClose || onBack) && (
        <button 
          className="close-button" 
          onClick={onBack || onClose}
        >
          {onBack ? 'Back' : 'Close'}
        </button>
      )}
    </div>
  );
};

export default LeaderboardDisplay;