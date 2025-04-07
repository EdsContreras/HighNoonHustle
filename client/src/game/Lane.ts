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
  
  // CRITICAL: Position tracking to detect and fix stalled obstacles
  private obstaclePositions: Map<string, number> = new Map(); // Track obstacle positions 
  private lastPositionCheckTime: number = 0; // When we last checked positions
  
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
    
    // Use whichever spacing is larger, and add an extra 150% for safety (up from 100%)
    // This extreme spacing ensures obstacles never overlap, even on level transitions
    const spacing = Math.max(baseSpacing, minSpacing) * 2.5;
    
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
    const safeSpacing = Math.max(spacing, obstacleWidth * 5.0); // At least 5.0x width between obstacles (up from 3.5x)
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
    
    // Use extreme spacing multipliers to completely eliminate overlap
    let spacingMultiplier = 3.0; // 300% spacing by default (up from 250%)
    
    // Use exceptionally large spacing for trains and horses
    if (this.obstacleType === ObstacleType.TRAIN) {
      spacingMultiplier = 6.0; // 600% for trains (up from 450%)
    } else if (this.obstacleType === ObstacleType.HORSE) {
      spacingMultiplier = 4.5; // 450% for horses (up from 350%)
    } else if (this.obstacleType === ObstacleType.CACTUS) { 
      spacingMultiplier = 3.5; // 350% for cactus (up from 300%)
    } else if (this.obstacleType === ObstacleType.TUMBLEWEED) {
      spacingMultiplier = 3.5; // 350% for tumbleweeds
    }
    
    return OBSTACLE_PROPERTIES[this.obstacleType].width * spacingMultiplier;
  }
  
  // Check if a new obstacle at position x would overlap with existing obstacles
  private wouldOverlap(x: number): boolean {
    if (!this.obstacleType) return false;
    
    const newObstacleWidth = OBSTACLE_PROPERTIES[this.obstacleType].width;
    
    // Define the buffer multipliers for each obstacle type (how much extra space we need)
    const bufferMultipliers = {
      [ObstacleType.TRAIN]: 9.0,    // 900% for trains (up from 800%)
      [ObstacleType.HORSE]: 6.0,    // 600% for horses (up from 500%)
      [ObstacleType.TUMBLEWEED]: 4.5, // 450% for tumbleweeds (up from 400%)
      [ObstacleType.CACTUS]: 4.5,   // 450% for cacti (up from 400%)
      default: 4.0                 // 400% default (up from 350%)
    };
    
    // Define absolute minimum distances in pixels for each obstacle type
    const absoluteMinDistances = {
      [ObstacleType.TRAIN]: 1800,   // 1800px minimum for trains (up from 1200px)
      [ObstacleType.HORSE]: 780,    // 780px minimum for horses (up from 600px)
      [ObstacleType.TUMBLEWEED]: 500, // 500px minimum for tumbleweeds (up from 400px)
      [ObstacleType.CACTUS]: 500,   // 500px minimum for cacti (up from 400px)
      default: 300                 // 300px minimum default (up from 250px)
    };
    
    // Get the buffer multiplier for this obstacle type
    const bufferMultiplier = bufferMultipliers[this.obstacleType] || bufferMultipliers.default;
    
    // Get the absolute minimum distance for this obstacle type
    const absoluteMinDistance = absoluteMinDistances[this.obstacleType] || absoluteMinDistances.default;
    
    // Calculate buffer based on obstacle width
    const buffer = newObstacleWidth * bufferMultiplier;
    
    // Check for potential overlap with each existing obstacle
    for (const obstacle of this.obstacles) {
      const distance = Math.abs(obstacle.x - x);
      
      // Calculate relative minimum distance with FULL obstacle width plus buffer
      const relativeMinDistance = (obstacle.width + newObstacleWidth) / 2 + buffer;
      
      // Use whichever is larger: absolute minimum or relative minimum
      const minDistance = Math.max(absoluteMinDistance, relativeMinDistance);
      
      if (distance < minDistance) {
        // Enhanced debug log with more details
        console.log(`Obstacle overlap prevented: type=${this.obstacleType}, distance=${distance.toFixed(1)}, required=${minDistance.toFixed(1)}`);
        
        // Log the percent of required distance
        const percentOfRequired = ((distance / minDistance) * 100).toFixed(1);
        console.log(`Spacing is only ${percentOfRequired}% of required minimum (${distance.toFixed(1)}px vs ${minDistance.toFixed(1)}px)`);
        
        // For extremely close spawns (less than 50% of required), increase cooldown even more
        if (distance < minDistance * 0.5) {
          const veryClosePenalty = this.obstacleType === ObstacleType.TRAIN ? 800 : 400;
          this.spawnCooldown = Math.min(3000, this.spawnCooldown + veryClosePenalty);
          console.log(`Very close spawn attempt (${percentOfRequired}%), added extra cooldown penalty: +${veryClosePenalty}ms`);
        }
        
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
  
  // Check and fix stalled obstacles
  private checkAndFixStalledObstacles() {
    // Get current time
    const checkTime = this.p.millis();
    
    // Setup position check interval (every 3 seconds)
    const POSITION_CHECK_INTERVAL = 3000; // 3 seconds
    
    // Perform position check and force movement if needed
    if (checkTime - this.lastPositionCheckTime > POSITION_CHECK_INTERVAL) {
      // Update the last check time 
      this.lastPositionCheckTime = checkTime;
      
      // Check each obstacle's position against the last recorded position
      for (const obstacle of this.obstacles) {
        const id = obstacle.x.toString() + "_" + obstacle.y.toString(); // Simple ID for tracking
        
        if (this.obstaclePositions.has(id)) {
          const lastPosition = this.obstaclePositions.get(id);
          // Make sure lastPosition is defined
          if (lastPosition !== undefined) {
            const currentPos = obstacle.x;
            
            // Check if obstacle has moved less than 1 pixel since last check
            if (Math.abs(currentPos - lastPosition) < 1) {
              console.log(`CRITICAL: Detected stalled ${obstacle.type} at ${obstacle.x.toFixed(1)} - FORCING MOVEMENT`);
              
              // FORCE the obstacle to move a significant distance
              // Use obstacle's own direction which is now public
              const forceMovement = 5 * obstacle.direction;
              obstacle.x += forceMovement;
              
              // Reset the speed to guaranteed minimum plus margin
              const absoluteMinSpeeds = {
                [ObstacleType.HORSE]: 1.5,      // Slightly higher than normal mins
                [ObstacleType.TUMBLEWEED]: 1.0,
                [ObstacleType.TRAIN]: 1.0,
                [ObstacleType.CACTUS]: 0.8
              };
              
              // Apply emergency speed boost
              const emergencySpeed = absoluteMinSpeeds[obstacle.type] || 1.0;
              // Use obstacle's own direction which is now public
              obstacle.speed = emergencySpeed * obstacle.direction;
              
              console.log(`Emergency speed correction applied: ${obstacle.speed.toFixed(2)}`);
            }
          }
        }
        
        // Update the position record for next check
        this.obstaclePositions.set(id, obstacle.x);
      }
      
      // Clean up any stale records to prevent memory leaks
      // Only keep records for obstacles that still exist
      const validKeys = new Set<string>();
      for (const obstacle of this.obstacles) {
        const id = obstacle.x.toString() + "_" + obstacle.y.toString();
        validKeys.add(id);
      }
      
      // Remove any keys that don't correspond to current obstacles
      // Convert the keys() iterator to an array to avoid iteration issues
      const keysToCheck = Array.from(this.obstaclePositions.keys());
      for (const key of keysToCheck) {
        if (!validKeys.has(key)) {
          this.obstaclePositions.delete(key);
        }
      }
    }
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
        // Check number of active obstacles first
        // Limit train lanes to 2 trains at a time to prevent overcrowding
        // Limit horse lanes to 3 horses at a time
        const activeObstaclesCount = this.obstacles.length;
        
        let maxObstacles = 4; // Default max for most obstacles
        
        if (this.obstacleType === ObstacleType.TRAIN) {
          maxObstacles = 2; // No more than 2 trains per lane ever
        } else if (this.obstacleType === ObstacleType.HORSE) {
          maxObstacles = 3; // No more than 3 horses per lane
        }
        
        if (activeObstaclesCount >= maxObstacles) {
          // Skip spawning if we already have the maximum number of obstacles
          // This ensures we don't overcrowd the lane
          return;
        }
        
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
            
            // Log when obstacle is created, for debugging
            console.log(`Created new ${this.obstacleType} at ${newX.toFixed(1)}, active count: ${this.obstacles.length}/${maxObstacles}`);
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
    
    // CRITICAL: Update obstacles with guaranteed movement enforcement
    for (const obstacle of this.obstacles) {
      // First normal update
      obstacle.update(width);
      
      // FAILSAFE: Additional check to guarantee movement - every 5 seconds, verify obstacle speeds
      if (Math.random() < 0.005) { // ~30 frames (0.5 seconds) at 60fps 
        // Define minimum speeds for each obstacle type that MUST be maintained
        const absoluteMinSpeeds = {
          [ObstacleType.HORSE]: 1.2,      // Horses move faster
          [ObstacleType.TUMBLEWEED]: 0.8,  // Tumbleweeds match trains
          [ObstacleType.TRAIN]: 0.8,       // Trains are slower but consistent
          [ObstacleType.CACTUS]: 0.6       // Cacti are slowest but must still move
        };
        
        // Get obstacle's current speed
        const currentSpeed = Math.abs(obstacle.speed);
        
        // Get minimum required speed for this type of obstacle
        const minRequiredSpeed = absoluteMinSpeeds[obstacle.type] || 0.8; // Default 0.8
        
        // Check if speed is too low
        if (currentSpeed < minRequiredSpeed) {
          // Force speed reset to minimum for this obstacle type
          const newSpeed = minRequiredSpeed * Math.sign(obstacle.speed);
          
          // Log this critical speed restoration
          console.log(`CRITICAL FAILSAFE: Obstacle movement enforced - ${obstacle.type} speed restored from ${currentSpeed.toFixed(2)} to ${newSpeed.toFixed(2)}`);
          
          // Apply the forced minimum speed
          obstacle.speed = newSpeed;
        }
      }
    }
    
    // Call our position tracking and stalled obstacle detection method
    this.checkAndFixStalledObstacles();
    
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
    
    // Note: We now enforce max obstacles in the update method before attempting to create new ones,
    // so we shouldn't need this code anymore, but keeping it as a safety net with higher values
    // to prevent any possible memory issues or performance degradation.
    
    // Use much higher caps here since we're already enforcing limits earlier
    let safetyMaxObstacles = 20; // Very high default cap as safety net only
    
    // Only need these as failsafes
    if (this.obstacleType === ObstacleType.TRAIN) {
      safetyMaxObstacles = 5; // Safety cap for trains
    } else if (this.obstacleType === ObstacleType.HORSE) {
      safetyMaxObstacles = 8; // Safety cap for horses 
    }
    
    // Only as extreme safety measure
    if (this.obstacles.length > safetyMaxObstacles) {
      console.log(`SAFETY CAP: Removing excess obstacles for ${this.obstacleType}, count: ${this.obstacles.length}`);
      // Remove oldest obstacles until we're under the cap
      while (this.obstacles.length > safetyMaxObstacles) {
        this.obstacles.shift();
      }
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
