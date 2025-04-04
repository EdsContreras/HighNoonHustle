import p5 from 'p5';
import { Player } from './Player';
import { Lane } from './Lane';
import { Goal } from './Goal';
import { Coin } from './Coin';
import { 
  GRID_CELLS_X,
  GRID_CELLS_Y,
  VISIBLE_CELLS_Y,
  STARTING_LIVES,
  POINTS_FOR_CROSSING,
  POINTS_FOR_MONEYBAG,
  POINTS_FOR_COIN,
  COIN_WIDTH,
  COIN_HEIGHT,
  COINS_PER_LANE,
  TIME_BONUS_FACTOR,
  KEYS,
  LEVELS,
  COLORS
} from './constants';
import { useAudio } from '../lib/stores/useAudio';
import { loadImage } from './assets';

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
  private level: number;
  private levelStartTime: number;
  private levelTimeLimit: number;
  private backgroundImage: p5.Image | null;
  private cameraOffsetY: number; // Camera offset for scrolling
  private targetCameraY: number; // Target camera position for smooth transitions
  
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
    this.levelStartTime = 0;
    this.levelTimeLimit = 0;
    this.backgroundImage = null;
    this.cameraOffsetY = 0;
    this.targetCameraY = 0; // Initialize target camera position
    
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
  
  public startLevel(level: number) {
    this.level = level;
    
    // Get level configuration
    const levelConfig = LEVELS[level] || LEVELS[1]; // Fallback to level 1 if config not found
    
    // Reset game state
    this.lanes = [];
    this.goals = [];
    this.coins = [];
    this.cameraOffsetY = 0; // Reset camera position
    this.targetCameraY = 0; // Reset target camera position
    this.levelStartTime = this.p.millis();
    this.levelTimeLimit = levelConfig.timeLimit * 1000; // Convert to milliseconds
    
    // Reset lives based on level number
    if (level === 1) {
      // Level 1: Start with default lives (3)
      this.lives = STARTING_LIVES;
      this.score = 0;
      console.log("Starting level 1 with", this.lives, "lives");
    } else if (level === 2) {
      // Level 2: Always start with 4 lives regardless of previous level
      this.lives = 4;
      console.log("Starting level 2 with", this.lives, "lives");
    } else if (level === 3) {
      // Level 3: Always start with 5 lives regardless of previous level
      this.lives = 5;
      console.log("Starting level 3 with", this.lives, "lives");
    }
    
    // Update the UI
    this.callbacks.onLifeLost(this.lives);
    this.callbacks.updateScore(this.score);
    
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
    
    // Create lanes
    const laneHeight = this.cellHeight;
    for (let i = 0; i < levelConfig.lanes.length; i++) {
      const laneConfig = levelConfig.lanes[i];
      const laneY = i * laneHeight + laneHeight / 2;
      
      const lane = new Lane(
        this.p,
        laneY,
        laneConfig.type,
        laneConfig.direction === 'right' ? 1 : -1,
        laneConfig.obstacleType,
        laneConfig.obstacleFrequency || 0,
        this.level,
        this.cellHeight
      );
      
      this.lanes.push(lane);
      
      // Add coins to safe zones (with some randomness)
      if (laneConfig.type === 'safe' && i > 0 && i < levelConfig.lanes.length - 1) {
        // Don't add coins to the start or end zones
        const coinsForLane = Math.floor(Math.random() * (COINS_PER_LANE + 1)); // 0 to COINS_PER_LANE coins
        
        for (let j = 0; j < coinsForLane; j++) {
          const x = Math.floor(Math.random() * GRID_CELLS_X) * this.cellWidth + this.cellWidth / 2;
          const y = laneY;
          
          this.coins.push(new Coin(this.p, x, y, COIN_WIDTH, COIN_HEIGHT));
        }
      }
    }
    
    // Create goals
    const goalCount = levelConfig.goalCount;
    const goalWidth = this.p.width / goalCount;
    
    for (let i = 0; i < goalCount; i++) {
      const goalX = i * goalWidth + goalWidth / 2;
      const goalY = laneHeight / 2; // Top of the screen
      
      this.goals.push(new Goal(this.p, goalX, goalY, goalWidth * 0.8, laneHeight * 0.8));
    }
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
      
      // Skip collision detection if player is still moving or invincible
      if (this.player.isMoving() || this.player.isInvincible()) continue;
      
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
    
    // Check if player reached a money bag
    const playerPos = this.player.getGridPosition();
    if (playerPos.y === 0) {
      let reachedMoneyBag = false;
      
      for (const goal of this.goals) {
        if (!goal.isReached() && goal.contains(playerPos.x * this.cellWidth + this.cellWidth / 2)) {
          goal.setReached(true);
          this.score += POINTS_FOR_MONEYBAG;
          this.callbacks.updateScore(this.score);
          
          // Log collection
          console.log("Money bag collected! Getting rich, pardner!");
          
          // Play success sound
          const { playSuccess } = useAudio.getState();
          playSuccess();
          
          reachedMoneyBag = true;
          break;
        }
      }
      
      if (reachedMoneyBag) {
        // Reset player position to starting position (45% from bottom)
        this.player.reset(Math.floor(GRID_CELLS_X / 2), Math.floor(GRID_CELLS_Y * 0.55));
      } else if (!this.player.isMoving()) {
        // Player reached top but not in a money bag, reset position to starting position
        this.player.reset(Math.floor(GRID_CELLS_X / 2), Math.floor(GRID_CELLS_Y * 0.55));
      }
    }
    
    // Check if level is complete (all money bags collected)
    if (this.goals.every(goal => goal.isReached())) {
      this.handleLevelComplete();
    }
    
    // Check if time ran out
    const elapsedTime = this.p.millis() - this.levelStartTime;
    if (elapsedTime > this.levelTimeLimit) {
      this.handleGameOver();
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
    
    // Draw money bags
    for (const moneyBag of this.goals) {
      moneyBag.draw();
    }
    
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
    // Check if player is invincible - if so, ignore the collision
    if (this.player && this.player.isInvincible()) {
      console.log("Player is invincible - ignoring collision");
      return;
    }
    
    // Play hit sound
    const { playHit } = useAudio.getState();
    playHit();
    
    this.lives--;
    this.callbacks.onLifeLost(this.lives);
    
    if (this.lives <= 0) {
      this.handleGameOver();
    } else {
      // Instead of resetting position, make player invincible for 2 seconds
      if (this.player) {
        // Make player invincible for 2 seconds (2000 milliseconds)
        this.player.makeInvincible(2000);
      }
    }
  }
  
  private handleGameOver() {
    this.callbacks.onGameOver();
  }
  
  private handleLevelComplete() {
    // Calculate time bonus
    const elapsedTime = this.p.millis() - this.levelStartTime;
    const timeRemaining = Math.max(0, this.levelTimeLimit - elapsedTime);
    const timeBonus = Math.floor(timeRemaining / 1000) * TIME_BONUS_FACTOR;
    
    this.score += timeBonus;
    this.callbacks.updateScore(this.score);
    
    // Trigger level complete
    this.callbacks.onLevelComplete(this.score);
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
