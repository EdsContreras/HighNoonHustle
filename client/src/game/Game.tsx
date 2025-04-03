import { useEffect, useRef, useState } from 'react';
import p5 from 'p5';
import { GameManager } from './GameManager';
import StartScreen from '../components/StartScreen';
import GameOverScreen from '../components/GameOverScreen';
import LevelCompleteScreen from '../components/LevelCompleteScreen';
import HUD from '../components/HUD';
import { useAudio } from '../lib/stores/useAudio';

// Game component that manages the p5.js sketch
const Game = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null);
  const gameManagerRef = useRef<GameManager | null>(null);
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver' | 'levelComplete'>('start');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  
  const { setBackgroundMusic, setHitSound, setSuccessSound, toggleMute } = useAudio();

  // Initialize audio
  useEffect(() => {
    // Load sound effects
    const bgMusic = new Audio('/sounds/background.mp3');
    bgMusic.loop = true;
    bgMusic.volume = 0.3;

    const hitSfx = new Audio('/sounds/hit.mp3');
    hitSfx.volume = 0.5;

    const successSfx = new Audio('/sounds/success.mp3');
    successSfx.volume = 0.5;

    setBackgroundMusic(bgMusic);
    setHitSound(hitSfx);
    setSuccessSound(successSfx);

    // Clean up
    return () => {
      bgMusic.pause();
      bgMusic.currentTime = 0;
    };
  }, [setBackgroundMusic, setHitSound, setSuccessSound]);

  // Initialize p5.js sketch
  useEffect(() => {
    if (!gameContainerRef.current || p5InstanceRef.current) return;

    // Create the p5 sketch
    const sketch = (p: p5) => {
      // Create a game manager
      const gameManager = new GameManager(p, {
        onGameOver: () => {
          setGameState('gameOver');
        },
        onLevelComplete: (levelScore: number) => {
          setScore(prevScore => prevScore + levelScore);
          setGameState('levelComplete');
        },
        onLifeLost: (remainingLives: number) => {
          setLives(remainingLives);
        },
        updateScore: (newScore: number) => {
          setScore(newScore);
        }
      });
      
      gameManagerRef.current = gameManager;

      p.setup = () => {
        // Create canvas that fills the container
        const canvas = p.createCanvas(
          gameContainerRef.current?.clientWidth || 800, 
          gameContainerRef.current?.clientHeight || 600
        );
        canvas.parent(gameContainerRef.current!);
        
        // Set up game
        gameManager.setup();
      };

      p.draw = () => {
        if (gameState === 'playing') {
          gameManager.update();
          gameManager.draw();
        }
      };

      // Handle window resizing
      p.windowResized = () => {
        if (gameContainerRef.current) {
          p.resizeCanvas(
            gameContainerRef.current.clientWidth,
            gameContainerRef.current.clientHeight
          );
          gameManager.handleResize();
        }
      };

      // Handle keyboard input
      p.keyPressed = () => {
        if (gameState === 'playing') {
          gameManager.handleKeyPress(p.keyCode);
        }
      };
    };

    // Create new p5 instance
    p5InstanceRef.current = new p5(sketch);

    // Cleanup function
    return () => {
      if (p5InstanceRef.current) {
        p5InstanceRef.current.remove();
        p5InstanceRef.current = null;
      }
    };
  }, []);

  // Update game manager when level changes
  useEffect(() => {
    if (gameManagerRef.current && gameState === 'playing') {
      gameManagerRef.current.startLevel(currentLevel);
    }
  }, [currentLevel, gameState]);

  // Handle game state changes
  const startGame = () => {
    setScore(0);
    setLives(3);
    setCurrentLevel(1);
    setGameState('playing');
    toggleMute(); // Unmute audio when the game starts
  };

  const continueToNextLevel = () => {
    setCurrentLevel(prev => prev + 1);
    setGameState('playing');
  };

  const restartGame = () => {
    setScore(0);
    setLives(3);
    setCurrentLevel(1);
    setGameState('playing');
  };

  return (
    <div className="w-full h-full flex flex-col relative">
      <div 
        ref={gameContainerRef} 
        className="flex-grow relative"
        style={{ touchAction: 'none' }} // Prevent touch scrolling on mobile
      >
        {/* Game canvas will be inserted here by p5 */}
        
        {/* Overlay UI based on game state */}
        {gameState === 'start' && (
          <StartScreen onStart={startGame} />
        )}
        
        {gameState === 'gameOver' && (
          <GameOverScreen score={score} onRestart={restartGame} />
        )}
        
        {gameState === 'levelComplete' && (
          <LevelCompleteScreen 
            level={currentLevel} 
            score={score} 
            onContinue={continueToNextLevel} 
          />
        )}
        
        {gameState === 'playing' && (
          <HUD score={score} level={currentLevel} lives={lives} />
        )}
      </div>
    </div>
  );
};

export default Game;
