import { apiRequest } from './queryClient';
import type { HighScore } from '../components/LeaderboardDisplay';

// Cache scores to avoid frequent refetching
let cachedScores: HighScore[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 minute cache

/**
 * Fetch high scores from the API
 */
export async function fetchHighScores(): Promise<HighScore[]> {
  // Use cached scores if available and not expired
  const now = Date.now();
  if (cachedScores && now - lastFetchTime < CACHE_DURATION) {
    return cachedScores;
  }
  
  try {
    const scores = await apiRequest('/api/highscores', {
      method: 'GET',
      on401: 'returnNull'
    }) as HighScore[];
    
    if (scores) {
      cachedScores = scores;
      lastFetchTime = now;
      return scores;
    }
    
    return []; // Return empty array if no scores available
  } catch (error) {
    console.error('Failed to fetch high scores:', error);
    return cachedScores || []; // Return cached scores on error, or empty array
  }
}

/**
 * Check if a score qualifies for the leaderboard
 */
export async function isHighScore(score: number): Promise<boolean> {
  try {
    const highScores = await fetchHighScores();
    
    // If there are fewer than 10 scores, any score qualifies
    if (highScores.length < 10) {
      return true;
    }
    
    // Check if the score is higher than the lowest score on the leaderboard
    const lowestScore = highScores[highScores.length - 1]?.score || 0;
    return score > lowestScore;
  } catch (error) {
    console.error('Failed to check high score:', error);
    return true; // On error, assume it's a high score to be safe
  }
}

/**
 * Submit a high score to the leaderboard
 */
export async function submitHighScore(
  playerName: string, 
  score: number, 
  level: number
): Promise<HighScore | null> {
  try {
    const result = await apiRequest('/api/highscores', {
      method: 'POST',
      body: JSON.stringify({
        playerName: playerName.toUpperCase().slice(0, 4),
        score,
        level
      }),
      headers: {
        'Content-Type': 'application/json'
      },
      on401: 'throw'
    }) as HighScore;
    
    // Clear the cache so next fetch gets the updated leaderboard
    cachedScores = null;
    
    return result;
  } catch (error) {
    console.error('Failed to submit high score:', error);
    return null;
  }
}