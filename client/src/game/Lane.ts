import p5 from 'p5';
import { Obstacle } from './Obstacle';
import { ObstacleType, COLORS, INITIAL_OBSTACLE_SPEED, SPEED_INCREMENT_PER_LEVEL, MAX_OBSTACLE_SPEED } from './constants';

export class Lane {
  private p: p5;
  private y: number;
  private type: 'road' | 'river' | 'safe';
  private direction: number;
  private obstacleType?: ObstacleType;
  private obstacleFrequency: number;
  private obstacles: Obstacle[];
  private lastObstacleTime: number;
  private level: number;
  private height: number;
  
  constructor(
    p: p5,
    y: number,
    type: 'road' | 'river' | 'safe',
    direction: number,
    obstacleType?: ObstacleType,
    obstacleFrequency = 0,
    level = 1,
    height = 60
  ) {
    this.p = p;
    this.y = y;
    this.type = type;
    this.direction = direction;
    this.obstacleType = obstacleType;
    this.obstacleFrequency = obstacleFrequency;
    this.obstacles = [];
    this.lastObstacleTime = 0;
    this.level = level;
    this.height = height;
    
    // Pre-populate obstacles for smoother gameplay
    if (type !== 'safe' && obstacleType) {
      this.populateInitialObstacles(p.width);
    }
  }
  
  private populateInitialObstacles(width: number) {
    if (!this.obstacleType || this.type === 'safe') return;
    
    // Calculate obstacle interval
    const interval = 1000 / this.obstacleFrequency;
    
    // Calculate number of obstacles to fit across the screen
    const obstacleSpeed = this.calculateObstacleSpeed();
    const spacing = obstacleSpeed * interval;
    
    // Place obstacles at regular intervals
    for (let x = 0; x < width + spacing; x += spacing * 1.5) {
      this.createObstacle(x - Math.random() * spacing);
    }
  }
  
  private calculateObstacleSpeed(): number {
    // Calculate speed based on level
    let speed = INITIAL_OBSTACLE_SPEED + (this.level - 1) * SPEED_INCREMENT_PER_LEVEL;
    return Math.min(speed, MAX_OBSTACLE_SPEED);
  }
  
  public update(width: number) {
    // Skip updates for safe zones
    if (this.type === 'safe') return;
    
    // Spawn new obstacles based on frequency
    const currentTime = this.p.millis();
    const timeSinceLastObstacle = currentTime - this.lastObstacleTime;
    const obstacleInterval = 1000 / this.obstacleFrequency;
    
    if (timeSinceLastObstacle > obstacleInterval) {
      if (this.obstacleType) {
        this.createObstacle(this.direction > 0 ? -50 : width + 50);
      }
      this.lastObstacleTime = currentTime;
    }
    
    // Update obstacles
    for (const obstacle of this.obstacles) {
      obstacle.update(width);
    }
  }
  
  private createObstacle(x: number) {
    if (!this.obstacleType) return;
    
    const obstacleSpeed = this.calculateObstacleSpeed();
    
    const obstacle = new Obstacle(
      this.p,
      x,
      this.y,
      this.obstacleType,
      obstacleSpeed,
      this.direction
    );
    
    this.obstacles.push(obstacle);
    
    // Limit the number of obstacles for performance
    if (this.obstacles.length > 20) {
      this.obstacles.shift();
    }
  }
  
  public draw(width: number) {
    this.p.push();
    
    // Draw lane background
    this.p.noStroke();
    switch (this.type) {
      case 'road':
        this.p.fill(COLORS.ROAD);
        break;
      case 'river':
        this.p.fill(COLORS.RIVER);
        break;
      case 'safe':
        this.p.fill(COLORS.SAFE_ZONE);
        break;
    }
    this.p.rect(0, this.y - this.height / 2, width, this.height);
    
    // Draw obstacles
    for (const obstacle of this.obstacles) {
      obstacle.draw();
    }
    
    this.p.pop();
  }
  
  public checkCollisions(playerRect: { x: number; y: number; width: number; height: number }) {
    const collisions = [];
    
    for (const obstacle of this.obstacles) {
      const obstacleRect = obstacle.getRect();
      
      // Apply a 10% reduction to obstacle collision size for more forgiving gameplay
      const collisionMargin = 0.1;
      const adjustedObstacleRect = {
        x: obstacleRect.x + obstacleRect.width * collisionMargin / 2,
        y: obstacleRect.y + obstacleRect.height * collisionMargin / 2,
        width: obstacleRect.width * (1 - collisionMargin),
        height: obstacleRect.height * (1 - collisionMargin)
      };
      
      // Basic AABB collision detection with adjusted boundaries
      if (
        playerRect.x < adjustedObstacleRect.x + adjustedObstacleRect.width &&
        playerRect.x + playerRect.width > adjustedObstacleRect.x &&
        playerRect.y < adjustedObstacleRect.y + adjustedObstacleRect.height &&
        playerRect.y + playerRect.height > adjustedObstacleRect.y
      ) {
        // Only add deadly obstacles to collisions
        if (obstacle.isDeadly()) {
          console.log("Obstacle collision details:", {
            obstacleType: obstacle.type,
            originalRect: obstacleRect,
            adjustedRect: adjustedObstacleRect,
            playerRect: playerRect,
            laneY: this.y
          });
          collisions.push(obstacle);
        }
      }
    }
    
    return collisions;
  }
  
  public handleResize(newHeight: number) {
    this.height = newHeight;
  }
}
