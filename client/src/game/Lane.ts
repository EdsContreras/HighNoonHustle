import p5 from 'p5';
import { Obstacle } from './Obstacle';
import { ObstacleType, COLORS, INITIAL_OBSTACLE_SPEED, SPEED_INCREMENT_PER_LEVEL, MAX_OBSTACLE_SPEED, OBSTACLE_PROPERTIES } from './constants';

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
    const baseSpacing = obstacleSpeed * interval;
    
    // Use a minimum spacing to prevent overlap
    const minSpacing = this.getMinimumSpacing();
    const spacing = Math.max(baseSpacing, minSpacing * 1.5); // Ensure at least 1.5x the obstacle width
    
    // Place obstacles at regular intervals with some randomization but no overlap
    let x = this.direction > 0 ? -50 : width + 50; // Start offscreen
    
    while (x > -200 && x < width + 200) { // Extend beyond screen to ensure proper coverage
      // Determine position with some randomness
      const position = x + (Math.random() * 0.3 * spacing) * (Math.random() > 0.5 ? 1 : -1);
      
      // Create obstacle if it won't overlap
      if (!this.wouldOverlap(position)) {
        this.createObstacle(position);
      }
      
      // Move to next position
      x += spacing;
    }
  }
  
  // Get the minimum spacing based on obstacle width
  private getMinimumSpacing(): number {
    if (!this.obstacleType) return 100;
    return OBSTACLE_PROPERTIES[this.obstacleType].width * 1.2; // 20% buffer between obstacles
  }
  
  // Check if a new obstacle at position x would overlap with existing obstacles
  private wouldOverlap(x: number): boolean {
    if (!this.obstacleType) return false;
    
    const newObstacleWidth = OBSTACLE_PROPERTIES[this.obstacleType].width;
    const buffer = newObstacleWidth * 0.2; // 20% buffer
    
    // Check against all existing obstacles
    for (const obstacle of this.obstacles) {
      const distance = Math.abs(obstacle.x - x);
      const minDistance = (obstacle.width + newObstacleWidth) / 2 + buffer;
      
      if (distance < minDistance) {
        return true; // Would overlap
      }
    }
    
    return false; // No overlap detected
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
        const newX = this.direction > 0 ? -50 : width + 50;
        // Only create obstacle if it won't overlap with existing ones near the spawn point
        if (!this.wouldOverlap(newX)) {
          this.createObstacle(newX);
          this.lastObstacleTime = currentTime;
        }
      }
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
      // The obstacle's getRect() already returns a reduced hitbox (90% of visual size)
      const obstacleRect = obstacle.getRect();
      
      // Basic AABB collision detection
      if (
        playerRect.x < obstacleRect.x + obstacleRect.width &&
        playerRect.x + playerRect.width > obstacleRect.x &&
        playerRect.y < obstacleRect.y + obstacleRect.height &&
        playerRect.y + playerRect.height > obstacleRect.y
      ) {
        // Only add deadly obstacles to collisions
        if (obstacle.isDeadly()) {
          // Log detailed collision information for debugging
          console.log("Collision detected!", {
            obstacleType: obstacle.type,
            obstacleRect,
            playerRect,
            laneY: this.y,
            overlap: {
              left: Math.max(0, playerRect.x + playerRect.width - obstacleRect.x),
              right: Math.max(0, obstacleRect.x + obstacleRect.width - playerRect.x),
              top: Math.max(0, playerRect.y + playerRect.height - obstacleRect.y),
              bottom: Math.max(0, obstacleRect.y + obstacleRect.height - playerRect.y)
            }
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
