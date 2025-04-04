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
    
    // Get the minimum spacing required based on obstacle type
    const minSpacing = this.getMinimumSpacing();
    
    // Calculate obstacle interval 
    const interval = 1000 / this.obstacleFrequency;
    
    // Calculate obstacle speed for this level
    const obstacleSpeed = this.calculateObstacleSpeed();
    const baseSpacing = obstacleSpeed * interval;
    
    // Use whichever spacing is larger, and add an extra 30% for safety
    const spacing = Math.max(baseSpacing, minSpacing) * 1.3;
    
    // Clear existing obstacles first (to avoid any overlap with pre-existing ones)
    this.obstacles = [];
    
    // Determine range of placement
    // Start well offscreen to give obstacles time to spread out
    const startX = this.direction > 0 ? -200 : width + 200; 
    const endX = this.direction > 0 ? width + 200 : -200;
    
    // Calculate total distance to cover
    const totalDistance = Math.abs(endX - startX);
    
    // Determine how many obstacles we can place with proper spacing
    const maxObstacles = Math.floor(totalDistance / spacing);
    
    // Create array of potential positions with randomized spacing
    const positions = [];
    
    // Randomize positions with staggered spacing 
    for (let i = 0; i < maxObstacles; i++) {
      // Calculate base position with even spacing
      let position;
      
      if (this.direction > 0) {
        position = startX + (i * spacing);
      } else {
        position = startX - (i * spacing);
      }
      
      // Add a random variation that's greater for smaller obstacles (+/- 20% of spacing)
      // This creates more irregular spacing patterns
      let variationPercentage = 0.2; // 20% default
      
      // Less variation for longer trains
      if (this.obstacleType === ObstacleType.TRAIN) {
        variationPercentage = 0.1; // 10% for trains (more regular pattern)
      }
      
      const variation = (Math.random() * 2 * variationPercentage - variationPercentage) * spacing;
      position += variation;
      
      // Store as potential position
      positions.push(position);
    }
    
    // Place obstacles one by one, checking for overlap each time
    for (const position of positions) {
      // Double-check that this position won't cause overlap with already placed obstacles
      if (!this.wouldOverlap(position)) {
        this.createObstacle(position);
      }
    }
    
    // Debug log
    console.log(`Lane with ${this.obstacleType}: Created ${this.obstacles.length} obstacles with spacing of ${spacing.toFixed(1)}`);
  }
  
  // Get the minimum spacing based on obstacle width
  private getMinimumSpacing(): number {
    if (!this.obstacleType) return 150; // Increased default spacing
    
    // Larger buffer for different obstacle types
    let spacingMultiplier = 2.0; // Minimum 200% spacing by default
    
    // Use even larger spacing for trains and horses
    if (this.obstacleType === ObstacleType.TRAIN) {
      spacingMultiplier = 3.0; // 300% for trains since they're longer
    } else if (this.obstacleType === ObstacleType.HORSE) {
      spacingMultiplier = 2.5; // 250% for horses
    }
    
    return OBSTACLE_PROPERTIES[this.obstacleType].width * spacingMultiplier;
  }
  
  // Check if a new obstacle at position x would overlap with existing obstacles
  private wouldOverlap(x: number): boolean {
    if (!this.obstacleType) return false;
    
    const newObstacleWidth = OBSTACLE_PROPERTIES[this.obstacleType].width;
    
    // Use a much larger buffer to ensure obstacles are well-spaced
    // Use different buffers based on obstacle type
    let bufferMultiplier = 1.5; // 150% of obstacle width by default
    
    if (this.obstacleType === ObstacleType.TRAIN) {
      bufferMultiplier = 2.0; // 200% for trains - they need more space
    } else if (this.obstacleType === ObstacleType.HORSE) {
      bufferMultiplier = 1.75; // 175% for horses
    }
    
    const buffer = newObstacleWidth * bufferMultiplier;
    
    // Check against all existing obstacles
    for (const obstacle of this.obstacles) {
      const distance = Math.abs(obstacle.x - x);
      const minDistance = (obstacle.width + newObstacleWidth) / 2 + buffer;
      
      if (distance < minDistance) {
        // Debug log when overlap is detected
        console.log(`Obstacle overlap prevented: type=${this.obstacleType}, distance=${distance.toFixed(1)}, required=${minDistance.toFixed(1)}`);
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
  
  // Adding property to track spawn attempts
  private lastSpawnAttemptTime: number = 0;
  private spawnCooldown: number = 250; // 250ms cooldown before retrying spawn
  
  public update(width: number) {
    // Skip updates for safe zones
    if (this.type === 'safe') return;
    
    // Spawn new obstacles based on frequency
    const currentTime = this.p.millis();
    const timeSinceLastObstacle = currentTime - this.lastObstacleTime;
    const obstacleInterval = 1000 / this.obstacleFrequency;
    
    if (timeSinceLastObstacle > obstacleInterval) {
      if (this.obstacleType) {
        // Check if we're out of the cooldown period for spawn attempts
        const timeSinceLastAttempt = currentTime - this.lastSpawnAttemptTime;
        
        if (timeSinceLastAttempt > this.spawnCooldown) {
          // Update last attempt time
          this.lastSpawnAttemptTime = currentTime;
          
          // Position offscreen with more padding for larger obstacles
          let offscreenPadding = 50; // Default padding
          
          if (this.obstacleType === ObstacleType.TRAIN) {
            offscreenPadding = 150; // Larger padding for trains
          } else if (this.obstacleType === ObstacleType.HORSE) {
            offscreenPadding = 75; // Medium padding for horses
          }
          
          const newX = this.direction > 0 ? -offscreenPadding : width + offscreenPadding;
          
          // Only create obstacle if it won't overlap with existing ones near the spawn point
          if (!this.wouldOverlap(newX)) {
            this.createObstacle(newX);
            this.lastObstacleTime = currentTime;
          } else {
            // If there would be an overlap, log it and increase the cooldown slightly
            // This helps prevent excessive overlap checks
            this.spawnCooldown = Math.min(1000, this.spawnCooldown + 50);
          }
        }
      }
    }
    
    // Update obstacles
    for (const obstacle of this.obstacles) {
      obstacle.update(width);
    }
    
    // Remove obstacles that are far offscreen to improve performance
    this.obstacles = this.obstacles.filter(obstacle => {
      const isVisible = (
        obstacle.x > -200 && 
        obstacle.x < width + 200
      );
      return isVisible;
    });
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
    this.p.strokeWeight(3);
    this.p.stroke(80, 80, 80); // Darker gray for rails
    
    // Rail spacing - distance between the two rails
    const railSpacing = this.height * 0.4; // 40% of lane height
    
    // Top rail
    this.p.line(0, y - railSpacing/2, width, y - railSpacing/2);
    
    // Bottom rail
    this.p.line(0, y + railSpacing/2, width, y + railSpacing/2);
    
    // Draw wooden sleepers (ties) perpendicular to the rails
    this.p.fill(120, 60, 20); // Rich brown color for wooden sleepers
    const sleeperWidth = railSpacing + 10; // Slightly wider than rail spacing
    const sleeperHeight = 8; // Thicker sleepers
    const sleeperSpacing = 30; // Space between sleepers
    
    this.p.rectMode(this.p.CENTER); // Draw from center
    
    for (let x = 0; x < width; x += sleeperSpacing) {
      // Draw each sleeper centered on the track and perpendicular to rails
      this.p.rect(x, y, sleeperHeight, sleeperWidth);
    }
    
    // Reset drawing settings
    this.p.rectMode(this.p.CORNER); // Reset to default
    this.p.noStroke();
  }
  
  public checkCollisions(playerRect: { x: number; y: number; width: number; height: number }): Obstacle[] {
    const collisions: Obstacle[] = [];
    
    // First, check if player is actually in this lane
    // Calculate player center Y coordinate
    const playerCenterY = playerRect.y + playerRect.height / 2;
    
    // Check if player center is within the lane's vertical bounds
    // Use half the lane height for the check
    const laneTop = this.y - this.height / 2;
    const laneBottom = this.y + this.height / 2;
    
    // If player is not in this lane, don't check for collisions
    if (playerCenterY < laneTop || playerCenterY > laneBottom) {
      return collisions; // Empty array - no collisions
    }
    
    // Player is in this lane, check for obstacle collisions
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
            inLane: true, // Now we know the player is in this lane
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
