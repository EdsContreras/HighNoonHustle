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
  LEVELS,
  LaneConfig
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
  
  // For infinite lane generation
  private highestLaneY: number; // Y position of the highest lane (smallest Y value since y increases downward)
  private lowestLaneY: number; // Y position of the lowest lane (largest Y value)
  private generatedLanes: number; // Count of total generated lanes
  private laneGenerationBuffer: number; // Generate this many lanes ahead of player
  
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
    
    // Initialize lane generation properties
    this.highestLaneY = 0;
    this.lowestLaneY = 0;
    this.generatedLanes = 0;
    this.laneGenerationBuffer = 20; // Generate 20 lanes ahead of player
    
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
    
    // Reset lane generation tracking
    this.highestLaneY = 0;
    this.lowestLaneY = 0;
    this.generatedLanes = 0;
    
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
    
    // Generate the initial lanes
    this.generateInitialLanes();
  }
  
  // Generate initial lanes for the game start
  private generateInitialLanes() {
    // Use a template from the most difficult level design
    const templateIndex = Math.min(3, Math.floor(this.difficulty));
    const levelConfig = LEVELS[templateIndex] || LEVELS[1];
    
    // Create initial set of lanes
    const laneHeight = this.cellHeight;
    const startY = GRID_CELLS_Y * laneHeight;
    
    // Create the first set of lanes from the bottom of the screen moving up
    for (let i = 0; i < levelConfig.lanes.length; i++) {
      // Position lanes starting from the bottom of visible area and going up
      const laneY = startY - (i * laneHeight);
      
      this.generateLane(laneY, levelConfig.lanes[levelConfig.lanes.length - 1 - i], true);
      
      // Track highest and lowest lane positions
      if (i === 0) {
        this.lowestLaneY = laneY;
      }
      if (i === levelConfig.lanes.length - 1) {
        this.highestLaneY = laneY;
      }
      
      this.generatedLanes++;
    }
    
    // Generate more lanes above the initial set
    this.generateMoreLanesAhead();
    
    // Create goals at the top of the generated lanes
    this.createGoals();
    
    console.log(`Generated initial content with difficulty ${this.difficulty}, lanes: ${this.lanes.length}, goals: ${this.goals.length}`);
    console.log(`Lane range: ${this.lowestLaneY} to ${this.highestLaneY}`);
  }
  
  // Generate a single lane at the given Y position
  private generateLane(laneY: number, laneConfig: LaneConfig, addCoins: boolean = false) {
    let config = {...laneConfig};
    
    // Increase obstacle frequency based on difficulty
    if (config.obstacleFrequency) {
      // Gradually increase frequency based on difficulty (max 100% increase)
      const difficultyFactor = Math.min(2, 1 + (this.difficulty - 1) * 0.2);
      config.obstacleFrequency *= difficultyFactor;
    }
    
    const lane = new Lane(
      this.p,
      laneY,
      config.type,
      config.direction === 'right' ? 1 : -1,
      config.obstacleType,
      config.obstacleFrequency || 0,
      Math.floor(this.difficulty), // Use difficulty as level for speed calculation
      this.cellHeight
    );
    
    this.lanes.push(lane);
    
    // Add coins to safe zones (with some randomness)
    if (addCoins && config.type === 'safe') {
      // More coins at higher difficulties (up to 2x the base amount)
      const maxCoins = Math.floor(COINS_PER_LANE * Math.min(2, 1 + (this.difficulty - 1) * 0.2));
      const coinsForLane = Math.floor(Math.random() * (maxCoins + 1));
      
      for (let j = 0; j < coinsForLane; j++) {
        const x = Math.floor(Math.random() * GRID_CELLS_X) * this.cellWidth + this.cellWidth / 2;
        const y = laneY;
        
        this.coins.push(new Coin(this.p, x, y, COIN_WIDTH, COIN_HEIGHT));
      }
    }
    
    return lane;
  }
  
  // Generate more lanes ahead of the player
  private generateMoreLanesAhead() {
    if (!this.player) return;
    
    // Get the player's current position in grid coordinates
    const playerGridY = this.player.getGridPosition().y;
    
    // Calculate how far we need to generate lanes ahead
    // We convert the player's grid Y position to pixels, then subtract buffer cells
    const playerYInPixels = playerGridY * this.cellHeight;
    const targetY = Math.max(0, playerYInPixels - (this.laneGenerationBuffer * this.cellHeight));
    
    // Only generate if highest lane is not far enough ahead of player
    if (this.highestLaneY <= targetY) {
      console.log(`Already have enough lanes ahead. Highest Y: ${this.highestLaneY}, Target Y: ${targetY}`);
      return;
    }
    
    console.log(`Generating more lanes ahead. Highest Y: ${this.highestLaneY}, Target Y: ${targetY}`);
    
    // Get a template for lane generation
    const templateIndex = Math.min(3, Math.floor(this.difficulty));
    const levelConfig = LEVELS[templateIndex] || LEVELS[1];
    const laneConfigs = levelConfig.lanes;
    
    // Continue generating lanes until we're far enough ahead of the player
    while (this.highestLaneY > targetY) {
      // Calculate the next lane position (one lane height above the highest)
      const nextLaneY = this.highestLaneY - this.cellHeight;
      
      // Choose a random lane configuration from the template
      // Skip the first (starting zone) and last (goal zone) lanes
      const safeIndex = 1 + Math.floor(Math.random() * (laneConfigs.length - 2));
      const laneConfig = laneConfigs[safeIndex];
      
      // Generate the new lane
      this.generateLane(nextLaneY, laneConfig, true);
      
      // Update the highest lane position
      this.highestLaneY = nextLaneY;
      this.generatedLanes++;
    }
    
    // Update goal positions to be above the highest lane
    this.updateGoalPositions();
    
    console.log(`Generated lanes up to Y: ${this.highestLaneY}, Total lanes: ${this.lanes.length}`);
  }
  
  // Clean up lanes that are far behind the player
  private cleanupDistantLanes() {
    if (!this.player) return;
    
    // Get the player's current position in grid coordinates
    const playerGridY = this.player.getGridPosition().y;
    
    // Calculate how far behind the player we should clean up
    // We keep lanes that are within the visible area plus a buffer
    const playerYInPixels = playerGridY * this.cellHeight;
    const cleanupY = playerYInPixels + (VISIBLE_CELLS_Y * this.cellHeight) + (10 * this.cellHeight); // 10 cells buffer
    
    // Remove lanes that are too far below the player (higher Y values)
    let removedCount = 0;
    this.lanes = this.lanes.filter(lane => {
      const keepLane = lane.getY() < cleanupY;
      if (!keepLane) {
        removedCount++;
        
        // Update the lowest lane position if removing the current lowest
        if (lane.getY() === this.lowestLaneY) {
          // Find the new lowest among remaining lanes
          let newLowest = Number.MIN_SAFE_INTEGER;
          for (const l of this.lanes) {
            if (l.getY() > newLowest && l.getY() < cleanupY) {
              newLowest = l.getY();
            }
          }
          this.lowestLaneY = newLowest;
        }
      }
      return keepLane;
    });
    
    // Also clean up coins that are too far behind
    this.coins = this.coins.filter(coin => {
      const position = coin.getPosition();
      return position.y < cleanupY || coin.isCollected();
    });
    
    if (removedCount > 0) {
      console.log(`Cleaned up ${removedCount} distant lanes. Remaining: ${this.lanes.length}`);
    }
  }
  
  // Create goals at the top of the visible area
  private createGoals() {
    // Clear existing goals
    this.goals = [];
    
    // Create goals at the highest lane position
    const goalY = this.highestLaneY;
    
    // Number of goals depends on difficulty
    const baseGoalCount = 3;
    const goalCount = Math.min(5, baseGoalCount + Math.floor((this.difficulty - 1) / 2));
    const goalWidth = this.p.width / goalCount;
    
    for (let i = 0; i < goalCount; i++) {
      const goalX = i * goalWidth + goalWidth / 2;
      
      this.goals.push(new Goal(this.p, goalX, goalY, goalWidth * 0.8, this.cellHeight * 0.8));
    }
    
    console.log(`Created ${this.goals.length} goals at Y: ${goalY}`);
  }
  
  // Update goal positions as player moves up
  private updateGoalPositions() {
    if (!this.player || this.goals.length === 0) return;
    
    // Get player position
    const playerGridY = this.player.getGridPosition().y;
    const playerYInPixels = playerGridY * this.cellHeight;
    
    // Get current goal position
    const goalY = this.goals[0].getY();
    
    // If player is getting close to goals (within ~5 cells), create new goals higher up
    if (Math.abs(playerYInPixels - goalY) < this.cellHeight * 5) {
      // Create new goals at highest lane
      this.createGoals();
    }
  }
  
  // Camera smoothing factor controls how quickly the camera follows the player
  private readonly CAMERA_SMOOTHING = 0.12; // Lower = smoother but slower transitions
    
  public update() {
    if (!this.player) return;
    
    // Generate more lanes if needed
    this.generateMoreLanesAhead();
    
    // Clean up lanes that are far behind
    this.cleanupDistantLanes();
    
    // Update player
    this.player.update();
    
    // Update camera position based on player
    if (this.player) {
      const playerGridY = this.player.getGridPosition().y;
      
      // Adjusted ideal camera position (positioning player 45% from bottom)
      // This makes the player see more of what's ahead by placing player at the 45% mark
      const idealCameraY = (playerGridY - (VISIBLE_CELLS_Y * 0.55)) * this.cellHeight;
      
      // Set target camera position - REMOVED UPPER BOUND to allow infinite scrolling up
      this.targetCameraY = Math.max(0, idealCameraY);
      
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
      if (this.player.isMoving() || this.player.isPlayerInvincible()) continue;
      
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
    
    // Check if player reached a goal
    // Instead of checking for Y=0, we check if the player is at the same Y as goals
    if (!this.player.isMoving() && this.goals.length > 0) {
      const playerPos = this.player.getGridPosition();
      const playerYInPixels = playerPos.y * this.cellHeight;
      const goalY = this.goals[0].getY();
      
      // Check if player is at goal height (with some margin)
      if (Math.abs(playerYInPixels - goalY) < this.cellHeight / 2) {
        let reachedGoal = false;
        
        for (const goal of this.goals) {
          if (!goal.isReached() && goal.contains(playerPos.x * this.cellWidth + this.cellWidth / 2)) {
            goal.setReached(true);
            this.score += POINTS_FOR_GOAL;
            this.callbacks.updateScore(this.score);
            
            // Play success sound
            const { playSuccess } = useAudio.getState();
            playSuccess();
            
            reachedGoal = true;
            console.log("Goal reached at position:", playerPos);
            break;
          }
        }
      }
    }
    
    // Check if all goals reached - increase difficulty and create new goals
    if (this.goals.every(goal => goal.isReached())) {
      this.handleAllGoalsReached();
    }
    
    // Gradually increase difficulty over time
    const elapsedTime = this.p.millis() - this.gameStartTime;
    // Increase difficulty every 30 seconds by 0.5, starting right away
    const newDifficulty = this.level + Math.floor(elapsedTime / 30000) * 0.5;
    
    if (newDifficulty > this.difficulty) {
      console.log(`Difficulty increased to ${newDifficulty} based on time`);
      this.difficulty = newDifficulty;
    }
  }
  
  public draw() {
    // Draw background
    this.p.background(COLORS.BACKGROUND);
    
    // Save current transformation
    this.p.push();
    
    // Apply camera offset for scrolling
    this.p.translate(0, -this.cameraOffsetY);
    
    // Draw background image (tiled vertically)
    if (this.backgroundImage) {
      // Calculate how many tiles needed to cover the visible area
      const tileHeight = this.p.height;
      const startY = Math.floor(this.cameraOffsetY / tileHeight) * tileHeight;
      const endY = startY + this.p.height + tileHeight;
      
      for (let y = startY; y < endY; y += tileHeight) {
        this.p.image(this.backgroundImage, 0, y, this.p.width, tileHeight);
      }
    }
    
    // Draw lanes
    for (const lane of this.lanes) {
      lane.draw(this.p.width);
    }
    
    // Draw goals
    for (const goal of this.goals) {
      goal.draw();
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
    
    // Draw debug info
    if (this.p.frameCount % 60 === 0) {
      console.log(`Game is playing, frame: ${this.p.frameCount}`);
    }
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
      // Make player temporarily invincible with flashing effect
      if (this.player) {
        this.player.startInvincibility();
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
    
    // Create new goals at the highest lane
    this.createGoals();
    
    // Play success sound
    const { playSuccess } = useAudio.getState();
    playSuccess();
    
    // Notify UI of level completion (though player continues seamlessly)
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