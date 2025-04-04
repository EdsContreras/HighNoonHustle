import { useEffect, useRef, useState } from 'react';
import p5 from 'p5';
import { GameManager } from './GameManager';
import StartScreen from '../components/StartScreen';
import GameOverScreen from '../components/GameOverScreen';
import LevelCompleteScreen from '../components/LevelCompleteScreen';
import VictoryScreen from '../components/VictoryScreen';
import HUD from '../components/HUD';
import { useAudio } from '../lib/stores/useAudio';
import { KEYS, PLAYER_MOVE_COOLDOWN, GameState } from './constants';

// Game component that manages the p5.js sketch
const Game = () => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const p5InstanceRef = useRef<p5 | null>(null);
  const gameManagerRef = useRef<GameManager | null>(null);
  const gameStateRef = useRef<'start' | 'playing' | 'gameOver' | 'levelComplete' | 'victory'>('start');
  const [gameState, setGameState] = useState<'start' | 'playing' | 'gameOver' | 'levelComplete' | 'victory'>('start');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { setBackgroundMusic, setHitSound, setSuccessSound, toggleMute, backgroundMusic } = useAudio();
  
  // Update ref when gameState changes
  useEffect(() => {
    gameStateRef.current = gameState;
    console.log("Game state ref updated to:", gameState);
  }, [gameState]);

  // Initialize audio
  useEffect(() => {
    console.log("Initializing audio...");
    // Load sound effects with error handling
    try {
      const bgMusic = new Audio('/sounds/background.mp3');
      bgMusic.loop = true;
      bgMusic.volume = 0.3;
      
      // Preload audio to check for errors
      bgMusic.preload = 'auto';
      
      const hitSfx = new Audio('/sounds/hit.mp3');
      hitSfx.volume = 0.5;
      hitSfx.preload = 'auto';
      
      const successSfx = new Audio('/sounds/success.mp3');
      successSfx.volume = 0.5;
      successSfx.preload = 'auto';
      
      // Set the audio elements in the store
      setBackgroundMusic(bgMusic);
      setHitSound(hitSfx);
      setSuccessSound(successSfx);
      
      console.log("Audio initialization complete");
      
      // Clean up
      return () => {
        bgMusic.pause();
        bgMusic.currentTime = 0;
      };
    } catch (error) {
      console.error("Error initializing audio:", error);
      // Continue without audio if there's an error
    }
  }, [setBackgroundMusic, setHitSound, setSuccessSound]);

  // Initialize p5.js sketch
  useEffect(() => {
    console.log("Initializing p5.js sketch...", gameContainerRef.current, p5InstanceRef.current);
    if (!gameContainerRef.current || p5InstanceRef.current) return;

    // Create the p5 sketch
    const sketch = (p: p5) => {
      console.log("Setting up p5 sketch");
      // Create a game manager
      const gameManager = new GameManager(p, {
        onGameOver: () => {
          console.log("Game over!");
          setGameState('gameOver');
        },
        onLevelComplete: (levelScore: number) => {
          console.log("Level complete!");
          setScore(prevScore => prevScore + levelScore);
          setGameState('levelComplete');
        },
        onLifeLost: (remainingLives: number) => {
          console.log("Life lost, remaining:", remainingLives);
          setLives(remainingLives);
        },
        updateScore: (newScore: number) => {
          setScore(newScore);
        },
        onVictory: (finalScore: number) => {
          console.log("Victory! Game completed with score:", finalScore);
          setScore(finalScore);
          setGameState('victory');
        }
      });
      
      gameManagerRef.current = gameManager;
      
      // No subscription needed - we'll use the gameStateRef directly

      p.setup = () => {
        console.log("P5 setup running");
        // Create canvas that fills the container
        const canvas = p.createCanvas(
          gameContainerRef.current?.clientWidth || 800, 
          gameContainerRef.current?.clientHeight || 600
        );
        
        if (gameContainerRef.current) {
          canvas.parent(gameContainerRef.current);
          console.log("Canvas created with dimensions:", p.width, p.height);
        } else {
          console.error("Game container ref is null in p5 setup");
        }
        
        // Set up game
        gameManager.setup();
        setIsInitialized(true);
      };

      p.draw = () => {
        // Always draw something even if not playing - helps with debugging
        p.background(20); // Darker background for better visibility
        
        // Display current game state visibly on canvas
        p.fill(255);
        p.textSize(16);
        p.text(`Game State: ${gameStateRef.current}`, 20, 30);
        p.text(`Canvas Size: ${p.width}x${p.height}`, 20, 50);
        p.text(`Frame: ${p.frameCount}`, 20, 70);
        
        // Draw a test rectangle to see if p5 is working at all
        p.fill(0, 255, 0);
        p.rect(50, 100, 50, 50);
        
        // Use ref instead of the React state to avoid closure issues
        if (gameStateRef.current === 'playing') {
          // Only log occasionally to avoid console spam
          if (p.frameCount % 60 === 0) {
            console.log("Game is playing, frame:", p.frameCount);
          }
          
          // Check for keyboard input
          checkKeys();
          
          // Update and draw game
          gameManager.update();
          gameManager.draw();
        } else {
          // Just occasionally log non-playing states to confirm things are working
          if (p.frameCount % 300 === 0) {
            console.log("Game is in state:", gameStateRef.current, "- frame:", p.frameCount);
          }
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

      // Store key states for continuous key detection
      const keyStates: Record<number, boolean> = {};
      const lastKeyHandled: Record<number, number> = {};
      
      // Handle keyboard input - record key down events
      p.keyPressed = () => {
        keyStates[p.keyCode] = true;
        return false; // prevent default browser behavior
      };
      
      // Handle key release
      p.keyReleased = () => {
        keyStates[p.keyCode] = false;
        return false; // prevent default browser behavior
      };
      
      // Check for held keys in the draw loop
      const checkKeys = () => {
        if (gameStateRef.current === 'playing') {
          // Check relevant keys
          [KEYS.UP, KEYS.DOWN, KEYS.LEFT, KEYS.RIGHT, KEYS.W, KEYS.A, KEYS.S, KEYS.D].forEach(keyCode => {
            if (keyStates[keyCode]) {
              // Use the full cooldown for held keys to prevent movement queuing issues
              const now = p.millis();
              if (!lastKeyHandled[keyCode] || now - lastKeyHandled[keyCode] > PLAYER_MOVE_COOLDOWN) {
                // Only attempt to move if game manager accepts the movement
                const moved = gameManager.handleKeyPress(keyCode);
                if (moved) {
                  lastKeyHandled[keyCode] = now;
                }
              }
            } else {
              // Reset the last handled time when key is released
              // This helps with responsive movement after releasing and pressing again
              delete lastKeyHandled[keyCode];
            }
          });
        }
      };
    };

    // Create new p5 instance
    try {
      console.log("Creating p5 instance");
      p5InstanceRef.current = new p5(sketch);
    } catch (error) {
      console.error("Error creating p5 instance:", error);
    }

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
    console.log("Game state or level changed:", gameState, currentLevel);
    if (gameManagerRef.current && gameState === 'playing') {
      console.log("Starting level:", currentLevel);
      gameManagerRef.current.startLevel(currentLevel);
      
      // Get audio functions from store
      const audioStore = useAudio.getState();
      
      // Play background music when game is playing
      if (audioStore.backgroundMusic && !audioStore.isMuted) {
        console.log("Attempting to play background music");
        audioStore.playBackgroundMusic();
      }
    }
  }, [currentLevel, gameState]);

  // Handle game state changes
  const startGame = () => {
    console.log("Starting game");
    setScore(0);
    setLives(3);
    setCurrentLevel(1);
    
    // Get audio functions from store
    const audioStore = useAudio.getState();
    
    // Unmute audio if needed
    if (audioStore.isMuted) {
      toggleMute();
    }
    
    // Update game state to playing
    setGameState('playing');
  };

  const continueToNextLevel = () => {
    console.log("Continuing to next level");
    setCurrentLevel(prev => prev + 1);
    setGameState('playing');
  };

  const restartGame = () => {
    console.log("Restarting game");
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

        {gameState === 'victory' && (
          <VictoryScreen finalScore={score} onRestart={restartGame} />
        )}
      </div>
    </div>
  );
};

export default Game;
