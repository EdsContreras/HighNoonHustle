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
    
    // Get the minimum spacing required based on obstacle type - now with increased values
    const minSpacing = this.getMinimumSpacing();
    
    // Calculate obstacle interval 
    const interval = 1000 / this.obstacleFrequency;
    
    // Calculate obstacle speed for this level
    const obstacleSpeed = this.calculateObstacleSpeed();
    const baseSpacing = obstacleSpeed * interval;
    
    // Use whichever spacing is larger, and add an extra 50% for safety (up from 30%)
    const spacing = Math.max(baseSpacing, minSpacing) * 1.5;
    
    // Clear existing obstacles first (to avoid any overlap with pre-existing ones)
    this.obstacles = [];
    
    // Determine range of placement
    // Start further offscreen for wider obstacles to prevent any visual overlap
    let offscreenPadding = 300; // Increased from 200
    
    // Adjust offscreen padding based on obstacle type
    if (this.obstacleType === ObstacleType.TRAIN) {
      offscreenPadding = 500; // Much larger for trains
    } else if (this.obstacleType === ObstacleType.HORSE) {
      offscreenPadding = 400; // Larger for horses
    }
    
    const startX = this.direction > 0 ? -offscreenPadding : width + offscreenPadding;
    const endX = this.direction > 0 ? width + offscreenPadding : -offscreenPadding;
    
    // Calculate total distance to cover
    const totalDistance = Math.abs(endX - startX);
    
    // Calculate actual obstacle width
    const obstacleWidth = OBSTACLE_PROPERTIES[this.obstacleType].width;
    
    // Determine how many obstacles we can place with proper spacing
    // Use a more conservative estimate (distance / larger spacing)
    const safeSpacing = Math.max(spacing, obstacleWidth * 3.5); // At least 3.5x width between obstacles
    const maxObstacles = Math.floor(totalDistance / safeSpacing);
    
    // Create array of potential positions with minimized randomization for more consistent spacing
    const positions = [];
    
    // Use more consistent spacing for larger obstacles
    for (let i = 0; i < maxObstacles; i++) {
      // Calculate base position with even spacing
      let position;
      
      if (this.direction > 0) {
        position = startX + (i * safeSpacing);
      } else {
        position = startX - (i * safeSpacing);
      }
      
      // Use much smaller variation to prevent any chance of overlap
      // Smaller percentage for larger obstacles
      let variationPercentage = 0.05; // Only 5% variation by default (down from 20%)
      
      // Virtually no variation for trains to prevent any overlap possibility
      if (this.obstacleType === ObstacleType.TRAIN) {
        variationPercentage = 0.02; // Only 2% for trains
      } else if (this.obstacleType === ObstacleType.HORSE) {
        variationPercentage = 0.03; // Only 3% for horses
      }
      
      const variation = (Math.random() * 2 * variationPercentage - variationPercentage) * safeSpacing;
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
    if (!this.obstacleType) return 200; // Increased default spacing to 200
    
    // Use much larger spacing multipliers to prevent any chance of overlap
    let spacingMultiplier = 2.5; // 250% spacing by default (up from 200%)
    
    // Drastically increase spacing for trains and horses to fix overlapping
    if (this.obstacleType === ObstacleType.TRAIN) {
      spacingMultiplier = 4.5; // 450% for trains (up from 300%)
    } else if (this.obstacleType === ObstacleType.HORSE) {
      spacingMultiplier = 3.5; // 350% for horses (up from 250%)
    } else if (this.obstacleType === ObstacleType.CACTUS) { 
      spacingMultiplier = 3.0; // 300% for cactus - these are stationary but wide
    }
    
    return OBSTACLE_PROPERTIES[this.obstacleType].width * spacingMultiplier;
  }
  
  // Check if a new obstacle at position x would overlap with existing obstacles
  private wouldOverlap(x: number): boolean {
    if (!this.obstacleType) return false;
    
    const newObstacleWidth = OBSTACLE_PROPERTIES[this.obstacleType].width;
    
    // Use MUCH larger buffer values to completely eliminate any overlap possibility
    // These values are intentionally excessive to guarantee separation
    let bufferMultiplier = 2.0; // 200% of obstacle width by default (up from 150%)
    
    if (this.obstacleType === ObstacleType.TRAIN) {
      bufferMultiplier = 3.0; // 300% for trains (up from 200%)
    } else if (this.obstacleType === ObstacleType.HORSE) {
      bufferMultiplier = 2.5; // 250% for horses (up from 175%)
    }
    
    const buffer = newObstacleWidth * bufferMultiplier;
    
    // Check against all existing obstacles
    for (const obstacle of this.obstacles) {
      const distance = Math.abs(obstacle.x - x);
      
      // Calculate minimum required distance with FULL obstacle width plus buffer
      const minDistance = (obstacle.width + newObstacleWidth) / 2 + buffer;
      
      if (distance < minDistance) {
        // Debug log when overlap is detected, with detailed type info
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
          
          // Position offscreen with much more padding for larger obstacles
          // Use the same generous values as in populateInitialObstacles
          let offscreenPadding = 300; // Increased from 50
          
          if (this.obstacleType === ObstacleType.TRAIN) {
            offscreenPadding = 500; // Much larger for trains (from 150)
          } else if (this.obstacleType === ObstacleType.HORSE) {
            offscreenPadding = 400; // Larger for horses (from 75)
          }
          
          const newX = this.direction > 0 ? -offscreenPadding : width + offscreenPadding;
          
          // Only create obstacle if it won't overlap with existing ones near the spawn point
          if (!this.wouldOverlap(newX)) {
            this.createObstacle(newX);
            this.lastObstacleTime = currentTime;
          } else {
            // If there would be an overlap, increase the cooldown significantly
            // to prevent constant overlap checking, especially for trains and horses
            let cooldownIncrease = 100; // Default increase (up from 50)
            
            // Use longer cooldowns for larger obstacles
            if (this.obstacleType === ObstacleType.TRAIN) {
              cooldownIncrease = 500; // Much longer cooldown for trains
            } else if (this.obstacleType === ObstacleType.HORSE) {
              cooldownIncrease = 300; // Longer cooldown for horses
            }
            
            // Set maximum cooldown based on obstacle type
            const maxCooldown = this.obstacleType === ObstacleType.TRAIN ? 2000 : 1500;
            
            // Increase cooldown, but cap it at the maximum value
            this.spawnCooldown = Math.min(maxCooldown, this.spawnCooldown + cooldownIncrease);
            
            // Log the cooldown increase for debugging
            console.log(`Increased spawn cooldown for ${this.obstacleType} to ${this.spawnCooldown}ms`);
          }
        }
      }
    }
    
    // Update obstacles
    for (const obstacle of this.obstacles) {
      obstacle.update(width);
    }
    
    // Remove obstacles that are far offscreen to improve performance
    // Use bigger offscreen bounds based on obstacle type to ensure we're not removing
    // obstacles that are about to enter the screen (especially for larger obstacles)
    this.obstacles = this.obstacles.filter(obstacle => {
      // Calculate offscreen boundary based on obstacle type
      let offscreenBoundary = 300; // Default offscreen boundary (up from 200)
      
      if (obstacle.type === ObstacleType.TRAIN) {
        offscreenBoundary = 600; // Much larger for trains
      } else if (obstacle.type === ObstacleType.HORSE) {
        offscreenBoundary = 450; // Larger for horses
      }
      
      const isVisible = (
        obstacle.x > -offscreenBoundary && 
        obstacle.x < width + offscreenBoundary
      );
      
      // If an obstacle is being removed due to being offscreen, log it
      if (!isVisible) {
        console.log(`Removing offscreen ${obstacle.type} at position ${obstacle.x.toFixed(1)}`);
      }
      
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
    
    // Limit the number of obstacles for performance and to prevent overcrowding
    // Use different limits based on obstacle type
    let maxObstacles = 15; // Default is now 15 (down from 20)
    
    // Use smaller limits for larger/longer obstacles to prevent train line backups
    if (this.obstacleType === ObstacleType.TRAIN) {
      maxObstacles = 5; // Only allow 5 trains per lane to prevent overcrowding
    } else if (this.obstacleType === ObstacleType.HORSE) {
      maxObstacles = 8; // Only allow 8 horses per lane
    }
    
    // If we're over the limit, remove the oldest obstacles
    if (this.obstacles.length > maxObstacles) {
      // Log when we're hitting the obstacle limit for debugging
      console.log(`Obstacle limit reached for ${this.obstacleType}: removing oldest obstacle`);
      this.obstacles.shift(); // Remove the oldest obstacle
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
