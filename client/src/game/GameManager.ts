import p5 from 'p5';
import { Player } from './Player';
import { Lane } from './Lane';
import { Goal } from './Goal';
import { Coin } from './Coin';
import { loadImage } from './assets';
import { 
  COLORS, 
  GRID_CELLS_X, 
  GRID_CELLS_Y,
  VISIBLE_CELLS_Y,
  KEYS,
  POINTS_FOR_CROSSING,
  POINTS_FOR_GOAL,
  POINTS_FOR_COIN,
  STARTING_LIVES,
  COIN_WIDTH,
  COIN_HEIGHT,
  COINS_PER_LANE,
  ObstacleType,
  LEVELS
} from './constants';
import { useAudio } from '../lib/stores/useAudio';

// Interface for callbacks from game to UI
interface GameCallbacks {
  onGameOver: () => void;
  onLevelComplete: (score: number) => void;
  onLifeLost: (livesRemaining: number) => void;
  updateScore: (score: number) => void;
}

export class GameManager {
  private p: p5;
  private callbacks: GameCallbacks;
  private player: Player | null;
  private lanes: Lane[];
  private goals: Goal[];
  private coins: Coin[];
  private cellWidth: number;
  private cellHeight: number;
  private lives: number;
  private score: number;
  private level: number;  // Used to track difficulty now, not actual levels
  private gameStartTime: number;  // Track overall game time
  private difficulty: number;    // Current difficulty factor (increases over time)
  private backgroundImage: p5.Image | null;
  private cameraOffsetY: number; // Camera offset for scrolling
  private targetCameraY: number; // Target camera position for smooth transitions
  private farthestPosition: number; // Track the farthest the player has traveled (lower y value = farther)
  
  constructor(p: p5, callbacks: GameCallbacks) {
    this.p = p;
    this.callbacks = callbacks;
    this.player = null;
    this.lanes = [];
    this.goals = [];
    this.coins = [];
    this.cellWidth = 0;
    this.cellHeight = 0;
    this.lives = STARTING_LIVES;
    this.score = 0;
    this.level = 1;
    this.difficulty = 1;
    this.gameStartTime = 0;
    this.backgroundImage = null;
    this.cameraOffsetY = 0;
    this.targetCameraY = 0; // Initialize target camera position
    this.farthestPosition = 1000; // Initialize with a high value (player starts at bottom)
    
    this.loadAssets();
  }
  
  private async loadAssets() {
    try {
      this.backgroundImage = await loadImage(this.p, '/assets/background.svg');
    } catch (error) {
      console.error('Failed to load background image:', error);
    }
  }
  
  public setup() {
    this.calculateGrid();
    
    // Initialize player in a position closer to the obstacles
    const startX = Math.floor(GRID_CELLS_X / 2);
    // Start player higher up on the screen (only 10% from the bottom)
    const startY = Math.floor(GRID_CELLS_Y * 0.9);
    
    this.player = new Player(this.p, startX, startY, this.cellWidth, this.cellHeight);
  }
  
  private calculateGrid() {
    this.cellWidth = this.p.width / GRID_CELLS_X;
    // Increase the height of cells by 80% to make lanes wider vertically
    this.cellHeight = (this.p.height / GRID_CELLS_Y) * 1.8;
  }
  
  public startLevel(level: number = 1) {
    // Reset game variables
    this.lives = STARTING_LIVES;
    this.score = 0;
    this.level = level;
    this.difficulty = level;
    this.gameStartTime = this.p.millis();
    
    // Reset game state
    this.lanes = [];
    this.goals = [];
    this.coins = [];
    this.cameraOffsetY = 0; // Reset camera position
    this.targetCameraY = 0; // Reset target camera position
    this.farthestPosition = 1000; // Reset farthest position
    
    // Calculate grid
    this.calculateGrid();
    
    // Reset player - starting higher up on the screen
    const startX = Math.floor(GRID_CELLS_X / 2);
    // Start player at 45% from the bottom
    const startY = Math.floor(GRID_CELLS_Y * 0.55);
    if (this.player) {
      this.player.reset(startX, startY);
      this.player.handleResize(this.cellWidth, this.cellHeight);
    }
    
    // Generate the game content based on the current difficulty
    this.generateGameContent();
  }
  
  // Generate infinite scrolling game content
  private generateGameContent() {
    // Use a template from the most difficult level design for more variety
    const templateIndex = Math.min(3, Math.floor(this.difficulty));
    const levelConfig = LEVELS[templateIndex] || LEVELS[1];
    
    // Create a very large number of lanes so the player can move forward "forever"
    // Instead of goals at the top, we'll have an endless pattern of lanes
    const totalLanes = 1000; // Very large number of lanes for "infinite" scrolling
    const laneHeight = this.cellHeight;
    
    const lanePatterns = levelConfig.lanes;
    const patternLength = lanePatterns.length;
    
    // Create a starting safe zone
    const startLane = new Lane(
      this.p,
      (totalLanes - 1) * laneHeight + laneHeight / 2,
      'safe',
      1,
      undefined,
      0,
      Math.floor(this.difficulty),
      this.cellHeight
    );
    
    this.lanes.push(startLane);
    
    // Generate the infinite lane pattern going upward (lower y values)
    for (let i = 0; i < totalLanes - 1; i++) {
      // Get lane config from pattern (cycling through the pattern)
      const laneConfigIndex = i % patternLength;
      let laneConfig = {...lanePatterns[laneConfigIndex]};
      
      // For extreme distances, increase difficulty
      const distanceFactor = 1 + Math.floor(i / patternLength) * 0.1;
      const effectiveDifficulty = this.difficulty * distanceFactor;
      
      // Calculate y position (going up from bottom)
      const laneY = (totalLanes - 2 - i) * laneHeight + laneHeight / 2;
      
      // Increase obstacle frequency based on difficulty
      if (laneConfig.obstacleFrequency) {
        // Gradually increase frequency based on difficulty (max 100% increase)
        const difficultyFactor = Math.min(2, 1 + (effectiveDifficulty - 1) * 0.2);
        laneConfig.obstacleFrequency *= difficultyFactor;
      }
      
      // Randomly flip direction for more variety as you go higher
      const directionFlip = Math.random() > 0.5 ? -1 : 1;
      const direction = laneConfig.direction === 'right' ? directionFlip : -directionFlip;
      
      const lane = new Lane(
        this.p,
        laneY,
        laneConfig.type,
        direction,
        laneConfig.obstacleType,
        laneConfig.obstacleFrequency || 0,
        Math.floor(effectiveDifficulty), // Use scaled difficulty for speed calculation
        this.cellHeight
      );
      
      this.lanes.push(lane);
      
      // Add coins to safe zones (with some randomness)
      if (laneConfig.type === 'safe' && i % 3 === 0) { // Distribute coins more evenly
        // More coins at higher difficulties (up to 2x the base amount)
        const maxCoins = Math.floor(COINS_PER_LANE * Math.min(2, 1 + (effectiveDifficulty - 1) * 0.2));
        const coinsForLane = Math.floor(Math.random() * (maxCoins + 1));
        
        for (let j = 0; j < coinsForLane; j++) {
          const x = Math.floor(Math.random() * GRID_CELLS_X) * this.cellWidth + this.cellWidth / 2;
          const y = laneY;
          
          this.coins.push(new Coin(this.p, x, y, COIN_WIDTH, COIN_HEIGHT));
        }
      }
    }
    
    console.log(`Generated infinite scrolling content with initial difficulty ${this.difficulty}`);
  }
  
  // Camera smoothing factor controls how quickly the camera follows the player
  private readonly CAMERA_SMOOTHING = 0.12; // Lower = smoother but slower transitions
    
  public update() {
    if (!this.player) return;
    
    // Update player
    this.player.update();
    
    // Update camera position based on player
    if (this.player) {
      const playerGridY = this.player.getGridPosition().y;
      
      // Adjusted ideal camera position (positioning player 45% from bottom)
      // This makes the player see more of what's ahead by placing player at the 45% mark
      const idealCameraY = (playerGridY - (VISIBLE_CELLS_Y * 0.55)) * this.cellHeight;
      
      // Set target camera position with bounds checking
      this.targetCameraY = Math.max(0, Math.min(
        (GRID_CELLS_Y - VISIBLE_CELLS_Y) * this.cellHeight, // Max camera Y
        idealCameraY
      ));
      
      // Smoothly interpolate current camera position towards target
      // This creates a more fluid camera movement
      const delta = this.targetCameraY - this.cameraOffsetY;
      
      // If player is moving, use faster transition for more responsive feel
      const smoothingFactor = this.player.isMoving() ? this.CAMERA_SMOOTHING * 1.5 : this.CAMERA_SMOOTHING;
      
      // Apply smooth transition
      this.cameraOffsetY += delta * smoothingFactor;
    }
    
    // Update lanes and check collisions
    for (const lane of this.lanes) {
      lane.update(this.p.width);
      
      // Skip collision detection if player is still moving
      if (this.player.isMoving()) continue;
      
      // Check collisions with obstacles
      const playerRect = this.player.getRect();
      const collisions = lane.checkCollisions(playerRect);
      
      if (collisions.length > 0) {
        console.log("Collision detected!", {
          playerPos: this.player.getGridPosition(),
          playerRect,
          obstacles: collisions.map(o => ({
            type: o.type,
            x: o.x,
            y: o.y,
            rect: o.getRect()
          }))
        });
        this.handleCollision();
      }
    }
    
    // Check for coin collisions
    if (this.player && !this.player.isMoving()) {
      const playerRect = this.player.getRect();
      
      for (let i = this.coins.length - 1; i >= 0; i--) {
        const coin = this.coins[i];
        
        if (!coin.isCollected() && coin.contains(
          playerRect.x, 
          playerRect.y, 
          playerRect.width, 
          playerRect.height
        )) {
          // Collect the coin
          coin.collect();
          
          // Add points for collecting coin
          this.score += POINTS_FOR_COIN;
          this.callbacks.updateScore(this.score);
          
          // Play success sound
          const { playSuccess } = useAudio.getState();
          playSuccess();
        }
      }
    }
    
    // Instead of goals, award points for distance traveled
    const playerPos = this.player.getGridPosition();
    
    // Track the highest position (smallest y value) the player has reached
    if (playerPos.y < this.farthestPosition) {
      // Award bonus points for reaching a new farthest position
      const newPositionsReached = this.farthestPosition - playerPos.y;
      this.score += POINTS_FOR_CROSSING * newPositionsReached;
      this.callbacks.updateScore(this.score);
      
      // Update the farthest position
      this.farthestPosition = playerPos.y;
      
      // Every 10 rows forward, increase difficulty and play success sound
      if (newPositionsReached >= 10) {
        this.difficulty += 0.2;
        console.log(`Distance milestone reached! Difficulty increased to ${this.difficulty}`);
        
        // Play success sound
        const { playSuccess } = useAudio.getState();
        playSuccess();
      }
    }
    
    // Gradually increase difficulty over time
    const elapsedTime = this.p.millis() - this.gameStartTime;
    // Increase difficulty every 30 seconds by 0.5, starting after first minute
    if (elapsedTime > 60000) { // After first minute
      const newDifficulty = 1 + Math.floor((elapsedTime - 60000) / 30000) * 0.5;
      
      if (newDifficulty > this.difficulty) {
        console.log(`Difficulty increased to ${newDifficulty} based on time`);
        this.difficulty = newDifficulty;
      }
    }
  }
  
  public draw() {
    // Draw background
    this.p.background(COLORS.BACKGROUND);
    
    // Save current transformation
    this.p.push();
    
    // Apply camera offset for scrolling
    this.p.translate(0, -this.cameraOffsetY);
    
    if (this.backgroundImage) {
      this.p.image(this.backgroundImage, 0, 0, this.p.width, this.p.height);
    }
    
    // Draw lanes
    for (const lane of this.lanes) {
      lane.draw(this.p.width);
    }
    
    // We're not using goals in infinite mode, so we don't need to draw them
    // But we'll keep the code commented out in case we need it later
    /*
    for (const goal of this.goals) {
      goal.draw();
    }
    */
    
    // Draw coins
    for (const coin of this.coins) {
      if (!coin.isCollected()) {
        coin.draw(this.cameraOffsetY);
      }
    }
    
    // Draw player
    if (this.player) {
      this.player.draw();
    }
    
    // Restore transformation
    this.p.pop();
    
    // Draw HUD elements (outside of camera transform)
    // This is intentionally left blank as HUD is handled by React components
  }
  
  public handleKeyPress(keyCode: number) {
    if (!this.player) return false;
    
    const moved = this.player.handleKeyPress(keyCode);
    
    if (moved) {
      // Award points for moving forward
      const playerPos = this.player.getGridPosition();
      
      // Specific check for upward movement
      if (keyCode === KEYS.UP || keyCode === KEYS.W) {
        this.score += POINTS_FOR_CROSSING;
        this.callbacks.updateScore(this.score);
      }
    }
    
    return moved;
  }
  
  private handleCollision() {
    // Play hit sound
    const { playHit } = useAudio.getState();
    playHit();
    
    this.lives--;
    this.callbacks.onLifeLost(this.lives);
    
    if (this.lives <= 0) {
      this.handleGameOver();
    } else {
      // Reset player position to starting position (45% from bottom)
      if (this.player) {
        this.player.reset(Math.floor(GRID_CELLS_X / 2), Math.floor(GRID_CELLS_Y * 0.55));
      }
    }
  }
  
  private handleGameOver() {
    this.callbacks.onGameOver();
  }
  
  // Handle when all goals are reached in continuous mode
  private handleAllGoalsReached() {
    // Increase difficulty
    this.difficulty += 0.5;
    this.level = Math.floor(this.difficulty);
    
    // Add bonus points for completing all goals
    const bonus = POINTS_FOR_GOAL * this.goals.length;
    this.score += bonus;
    this.callbacks.updateScore(this.score);
    
    console.log(`All goals reached! Difficulty increased to ${this.difficulty}. Bonus: ${bonus} points.`);
    
    // Generate new game content with higher difficulty
    this.generateGameContent();
    
    // Play success sound
    const { playSuccess } = useAudio.getState();
    playSuccess();
  }
  
  // This is a legacy method that might still be called by the Game component
  private handleLevelComplete() {
    // This is just here for compatibility, we're using handleAllGoalsReached instead
    // We shouldn't reach here, but just in case:
    this.difficulty += 0.5;
    this.score += POINTS_FOR_GOAL;
    this.callbacks.updateScore(this.score);
    
    console.log("Legacy level complete called - shouldn't happen in continuous mode");
    
    // Generate new game content with higher difficulty
    this.generateGameContent();
    
    // Don't trigger onLevelComplete callback as we're in continuous mode
  }
  
  public handleResize() {
    this.calculateGrid();
    
    // Update player and game objects
    if (this.player) {
      this.player.handleResize(this.cellWidth, this.cellHeight);
    }
    
    // Update lanes
    for (const lane of this.lanes) {
      lane.handleResize(this.cellHeight);
    }
    
    // Update coins
    for (const coin of this.coins) {
      coin.handleResize(this.cellWidth, this.cellHeight);
    }
  }
}