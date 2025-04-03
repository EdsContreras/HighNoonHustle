import p5 from 'p5';
import { Player } from './Player';
import { Lane } from './Lane';
import { Goal } from './Goal';
import { 
  GRID_CELLS_X,
  GRID_CELLS_Y,
  STARTING_LIVES,
  POINTS_FOR_CROSSING,
  POINTS_FOR_GOAL,
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
  private cellWidth: number;
  private cellHeight: number;
  private lives: number;
  private score: number;
  private level: number;
  private levelStartTime: number;
  private levelTimeLimit: number;
  private backgroundImage: p5.Image | null;
  
  constructor(p: p5, callbacks: GameCallbacks) {
    this.p = p;
    this.callbacks = callbacks;
    this.player = null;
    this.lanes = [];
    this.goals = [];
    this.cellWidth = 0;
    this.cellHeight = 0;
    this.lives = STARTING_LIVES;
    this.score = 0;
    this.level = 1;
    this.levelStartTime = 0;
    this.levelTimeLimit = 0;
    this.backgroundImage = null;
    
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
    
    // Initialize player at the bottom middle of the screen
    const startX = Math.floor(GRID_CELLS_X / 2);
    const startY = GRID_CELLS_Y - 1;
    
    this.player = new Player(this.p, startX, startY, this.cellWidth, this.cellHeight);
  }
  
  private calculateGrid() {
    this.cellWidth = this.p.width / GRID_CELLS_X;
    this.cellHeight = this.p.height / GRID_CELLS_Y;
  }
  
  public startLevel(level: number) {
    this.level = level;
    
    // Get level configuration
    const levelConfig = LEVELS[level] || LEVELS[1]; // Fallback to level 1 if config not found
    
    // Reset game state
    this.lanes = [];
    this.goals = [];
    this.levelStartTime = this.p.millis();
    this.levelTimeLimit = levelConfig.timeLimit * 1000; // Convert to milliseconds
    
    // Calculate grid
    this.calculateGrid();
    
    // Reset player
    const startX = Math.floor(GRID_CELLS_X / 2);
    const startY = GRID_CELLS_Y - 1;
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
  
  public update() {
    if (!this.player) return;
    
    // Update player
    this.player.update();
    
    // Update lanes and check collisions
    for (const lane of this.lanes) {
      lane.update(this.p.width);
      
      // Skip collision detection if player is still moving
      if (this.player.isMoving()) continue;
      
      // Check collisions with obstacles
      const playerRect = this.player.getRect();
      const collisions = lane.checkCollisions(playerRect);
      
      if (collisions.length > 0) {
        this.handleCollision();
      }
    }
    
    // Check if player reached a goal
    const playerPos = this.player.getGridPosition();
    if (playerPos.y === 0) {
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
          break;
        }
      }
      
      if (reachedGoal) {
        // Reset player position
        this.player.reset(Math.floor(GRID_CELLS_X / 2), GRID_CELLS_Y - 1);
      } else if (!this.player.isMoving()) {
        // Player reached top but not in a goal, reset position
        this.player.reset(Math.floor(GRID_CELLS_X / 2), GRID_CELLS_Y - 1);
      }
    }
    
    // Check if level is complete (all goals reached)
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
    
    // Draw a test rectangle to debug
    this.p.fill(255, 0, 0);
    this.p.rect(100, 100, 100, 100);
    
    console.log("Drawing game, lanes:", this.lanes.length, "goals:", this.goals.length);
    
    if (this.backgroundImage) {
      this.p.image(this.backgroundImage, 0, 0, this.p.width, this.p.height);
    } else {
      console.log("No background image loaded");
    }
    
    // Draw lanes
    for (const lane of this.lanes) {
      lane.draw(this.p.width);
    }
    
    // Draw goals
    for (const goal of this.goals) {
      goal.draw();
    }
    
    // Draw player
    if (this.player) {
      this.player.draw();
    } else {
      console.log("No player to draw");
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
      // Reset player position
      if (this.player) {
        this.player.reset(Math.floor(GRID_CELLS_X / 2), GRID_CELLS_Y - 1);
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
  }
}
