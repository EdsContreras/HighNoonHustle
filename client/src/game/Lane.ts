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
    // Get the obstacle width for this type
    const obstacleWidth = OBSTACLE_PROPERTIES[this.obstacleType].width;
    
    // Ensure much wider spacing based on obstacle width - at least 2.5x obstacle width
    const minSpacing = obstacleWidth * 2.5;
    
    // Use whichever spacing is larger
    const spacing = Math.max(baseSpacing, minSpacing);
    
    // Clear existing obstacles first (to avoid any overlap with pre-existing ones)
    this.obstacles = [];
    
    // Place obstacles at regular intervals with controlled spacing
    const startX = this.direction > 0 ? -100 : width + 100; // Start well offscreen
    const endX = this.direction > 0 ? width + 100 : -100; // End well offscreen
    
    // Calculate total distance to cover
    const totalDistance = Math.abs(endX - startX);
    
    // Determine how many obstacles we can place with proper spacing
    const maxObstacles = Math.floor(totalDistance / spacing);
    
    // Add obstacles with controlled spacing
    for (let i = 0; i < maxObstacles; i++) {
      // Calculate base position with even spacing
      let position;
      
      if (this.direction > 0) {
        position = startX + (i * spacing);
      } else {
        position = startX - (i * spacing);
      }
      
      // Add a small random variation (+/- 10% of spacing)
      const variation = (Math.random() * 0.2 - 0.1) * spacing;
      position += variation;
      
      // Double-check that this position won't cause overlap
      if (!this.wouldOverlap(position)) {
        this.createObstacle(position);
      }
    }
    
    // Debug log
    console.log(`Lane with ${this.obstacleType}: Created ${this.obstacles.length} obstacles with min spacing of ${minSpacing.toFixed(1)}`);
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
    
    // Increase buffer for better spacing (50% of obstacle width instead of 20%)
    const buffer = newObstacleWidth * 0.75; 
    
    // Check against all existing obstacles
    for (const obstacle of this.obstacles) {
      const distance = Math.abs(obstacle.x - x);
      const minDistance = (obstacle.width + newObstacleWidth) / 2 + buffer;
      
      if (distance < minDistance) {
        // Debug log when overlap is detected
        // console.log(`Overlap prevented: distance=${distance.toFixed(1)}, minDistance=${minDistance.toFixed(1)}`);
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
    
    // Draw train tracks for lanes with trains
    if (this.obstacleType === ObstacleType.TRAIN) {
      this.drawTrainTracks(width);
    }
    
    // Draw obstacles
    for (const obstacle of this.obstacles) {
      obstacle.draw();
    }
    
    this.p.pop();
  }
  
  private drawTrainTracks(width: number) {
    // Center everything in the lane
    const y = this.y;
    
    // Draw the two rails first (so sleepers appear on top)
    this.p.strokeWeight(4); // Increased from 3 for better visibility
    this.p.stroke(80, 80, 80); // Darker gray for rails
    
    // Rail spacing - distance between the two rails
    const railSpacing = this.height * 0.45; // Increased from 40% to 45% of lane height
    
    // Top rail
    this.p.line(0, y - railSpacing/2, width, y - railSpacing/2);
    
    // Bottom rail
    this.p.line(0, y + railSpacing/2, width, y + railSpacing/2);
    
    // Draw wooden sleepers (ties) perpendicular to the rails
    this.p.fill(120, 60, 20); // Rich brown color for wooden sleepers
    const sleeperWidth = railSpacing + 15; // Wider sleepers for better visibility
    const sleeperHeight = 10; // Thicker sleepers
    const sleeperSpacing = 35; // Increased spacing for our zoomed view
    
    this.p.rectMode(this.p.CENTER); // Draw from center
    
    for (let x = 0; x < width; x += sleeperSpacing) {
      // Draw each sleeper centered on the track and perpendicular to rails
      this.p.rect(x, y, sleeperHeight, sleeperWidth);
    }
    
    // Draw gravel/ballast under the tracks
    this.p.rectMode(this.p.CORNER);
    this.p.noStroke();
    
    // Reset drawing settings
    this.p.rectMode(this.p.CORNER); // Reset to default
    this.p.noStroke();
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
