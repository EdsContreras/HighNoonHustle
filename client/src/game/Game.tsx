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
  
  const { 
    setBackgroundMusic, 
    setHitSound, 
    setSuccessSound,
    setGruntSound,
    setGameOverSound,
    setWompWompSound,
    toggleMute, 
    backgroundMusic 
  } = useAudio();
  
  // Update ref when gameState changes
  useEffect(() => {
    gameStateRef.current = gameState;
    console.log("Game state ref updated to:", gameState);
  }, [gameState]);

  // Helper function to test audio loading
  const testLoadAudio = (path: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const audio = new Audio(path);
      audio.addEventListener('canplaythrough', () => {
        console.log(`Audio file loaded successfully: ${path}`);
        resolve(true);
      });
      audio.addEventListener('error', (e) => {
        console.error(`Error loading audio file: ${path}`, e);
        resolve(false);
      });
      // Set a timeout in case the event never fires
      setTimeout(() => {
        if (!audio.readyState) {
          console.warn(`Audio loading timed out: ${path}`);
          resolve(false);
        }
      }, 3000);
    });
  };

  // Initialize audio
  useEffect(() => {
    console.log("Initializing audio...");
    
    // Try multiple base URL patterns for more robust loading
    // First try the current origin, then try relative paths
    const baseUrlOptions = [
      window.location.origin,
      '',
      '.',
      '/client/public'
    ];
    
    // Try multiple directory patterns
    const dirOptions = [
      '/assets/sounds/',
      '/sounds/'
    ];
    
    console.log("Trying multiple base URL options for audio:", baseUrlOptions);
    
    // Function to try loading audio from multiple base URLs and directories
    const tryLoadAudio = async (filename: string, volume: number = 0.5): Promise<HTMLAudioElement> => {
      // Try each base URL and directory combination
      for (const baseUrl of baseUrlOptions) {
        for (const dir of dirOptions) {
          const fullPath = `${baseUrl}${dir}${filename}`;
          console.log(`Attempting to load audio from: ${fullPath}`);
          try {
            // First test if we can load it
            const success = await testLoadAudio(fullPath);
            if (success) {
              console.log(`Successfully loaded audio from: ${fullPath}`);
              const audio = new Audio(fullPath);
              audio.volume = volume;
              return audio;
            }
          } catch (error) {
            console.warn(`Failed to load audio from ${fullPath}:`, error);
          }
        }
      }
      
      // If we get here, we couldn't load from any path
      console.error(`Failed to load audio file ${filename} from any path`);
      
      // Use hit.mp3 as a fallback for most sounds since we know it works
      if (filename !== 'hit.mp3' && filename !== 'background.mp3') {
        try {
          console.log(`Trying to use hit.mp3 as fallback for ${filename}`);
          for (const baseUrl of baseUrlOptions) {
            const fallbackPath = `${baseUrl}/assets/sounds/hit.mp3`;
            const success = await testLoadAudio(fallbackPath);
            if (success) {
              console.log(`Using fallback audio from: ${fallbackPath} for ${filename}`);
              const audio = new Audio(fallbackPath);
              audio.volume = volume;
              return audio;
            }
          }
        } catch (error) {
          console.error(`Fallback also failed:`, error);
        }
      }
      
      // Last resort - create dummy audio element
      return new Audio();
    };
    
    let bgMusic: HTMLAudioElement;
    
    // We'll only use standard audio files

    // We'll use the standard grunt.mp3 which is working fine

    // Load all audio files with the robust method
    Promise.all([
      tryLoadAudio('background.mp3', 0.3),
      tryLoadAudio('hit.mp3', 0.5),
      tryLoadAudio('success.mp3', 0.5),
      tryLoadAudio('grunt.mp3', 1.0), // Use the regular grunt sound as a backup
      tryLoadAudio('gameover.mp3', 0.5),
      tryLoadAudio('wompwomp.mp3', 0.6)
    ]).then(results => {
      const [bgMusicLoaded, hitSfx, successSfx, gruntSfx, gameOverSfx, wompWompSfx] = results;
      console.log("All audio files loaded (or attempted to load)");
      
      // Set properties
      bgMusicLoaded.loop = true;
      bgMusic = bgMusicLoaded;
      
      // Store in global state
      setBackgroundMusic(bgMusicLoaded);
      setHitSound(hitSfx);
      setSuccessSound(successSfx);
      // Just use the regular grunt sound
      setGruntSound(gruntSfx);
      setGameOverSound(gameOverSfx);
      setWompWompSound(wompWompSfx);
      
      console.log("Audio initialization complete");
    }).catch(error => {
      console.error("Audio loading failed:", error);
    });
    
    // Clean up
    return () => {
      if (bgMusic) {
        bgMusic.pause();
        bgMusic.currentTime = 0;
      }
    };
  }, [setBackgroundMusic, setHitSound, setSuccessSound, setGruntSound, setGameOverSound, setWompWompSound]);

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
        p.background(200);
        
        // Draw a test rectangle to see if p5 is working at all
        p.fill(0, 255, 0);
        p.rect(50, 50, 50, 50);
        
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
      
      // We'll change from continuous key handling to single-press key handling
      // to fix the issue with movement continuing after a key press
      const keyPressed: Record<number, boolean> = {}; // Track which keys were already handled
      
      // Check for keys that were just pressed
      const checkKeys = () => {
        if (gameStateRef.current === 'playing') {
          // Only process keys that are pressed (true in keyStates) and haven't been handled yet
          [KEYS.UP, KEYS.DOWN, KEYS.LEFT, KEYS.RIGHT, KEYS.W, KEYS.A, KEYS.S, KEYS.D].forEach(keyCode => {
            // Only handle the key if it's pressed and hasn't been handled before
            if (keyStates[keyCode] && !keyPressed[keyCode]) {
              // Mark this key as handled to prevent continuous movement
              keyPressed[keyCode] = true;
              
              // Try to move the player
              gameManager.handleKeyPress(keyCode);
            } 
            // If key is released, reset its handled state
            else if (!keyStates[keyCode]) {
              keyPressed[keyCode] = false;
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
    
    // Log audio state for debugging
    console.log("Audio state when starting game:", {
      isMuted: audioStore.isMuted,
      hasGruntSound: !!audioStore.gruntSound,
      hasGameOverSound: !!audioStore.gameOverSound
    });
    
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
