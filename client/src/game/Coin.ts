import p5 from 'p5';
import { loadImage } from './assets';
import { POINTS_FOR_COIN } from './constants';

// Firework particle class for the coin collection animation
class FireworkParticle {
  private p: p5;
  private x: number;
  private y: number;
  public vx: number; // Made public so it can be modified in createFireworkEffect
  public vy: number; // Made public so it can be modified in createFireworkEffect
  private alpha: number;
  private color: p5.Color;
  public size: number; // Made public so it can be modified in createFireworkEffect
  private trail: {x: number, y: number, alpha: number}[];
  
  constructor(p: p5, x: number, y: number) {
    this.p = p;
    this.x = x;
    this.y = y;
    
    // Random velocity for the particle - moderate speeds for a more subtle effect
    const angle = p.random(0, p.TWO_PI);
    const speed = p.random(2, 5); // Reduced from 4-8 to 2-5 for less intense movement
    this.vx = p.cos(angle) * speed;
    this.vy = p.sin(angle) * speed;
    
    // Start fully opaque and fade out
    this.alpha = 255;
    
    // Brighter color variations with multiple colors
    const hue = p.random(360); // Random hue for varied colors
    this.color = p.color(
      255, // Always full red
      p.random(200, 255), // Varied green for yellow-orange variations
      p.random(50) // Touch of blue for sparkle
    );
    
    // Smaller random size for the particle
    this.size = p.random(4, 8); // Reduced from 8-12 to 4-8
    
    // Trail effect - shorter trail
    this.trail = [];
  }
  
  update() {
    // Add current position to trail with current alpha
    this.trail.push({
      x: this.x,
      y: this.y,
      alpha: this.alpha
    });
    
    // Keep trail shorter for less intense effect
    if (this.trail.length > 3) { // Reduced from 5 to 3
      this.trail.shift();
    }
    
    // Decrease alpha of all trail points faster
    for (let i = 0; i < this.trail.length; i++) {
      this.trail[i].alpha -= 25; // Increased from 15 to 25 for faster fade
    }
    
    // Move the particle
    this.x += this.vx;
    this.y += this.vy;
    
    // Add a bit of gravity (slightly reduced)
    this.vy += 0.08; // Reduced from 0.1
    
    // Fade out the particle slightly faster
    this.alpha -= 6; // Increased from 4 to 6
    
    // Return true if the particle is still visible
    return this.alpha > 0;
  }
  
  draw(cameraOffsetY: number = 0) {
    this.p.push();
    this.p.noStroke();
    
    // Draw trail
    for (const point of this.trail) {
      const screenY = point.y - cameraOffsetY;
      const trailColor = this.p.color(255, 255, 0, point.alpha * 0.5);
      this.p.fill(trailColor);
      const trailSize = this.size * 0.7;
      this.p.ellipse(point.x, screenY, trailSize, trailSize);
    }
    
    // Draw main particle
    const screenY = this.y - cameraOffsetY;
    this.color.setAlpha(this.alpha);
    this.p.fill(this.color);
    this.p.ellipse(this.x, screenY, this.size, this.size);
    
    this.p.pop();
  }
}

export class Coin {
  private p: p5;
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private collected: boolean;
  private image: p5.Image | null;
  private animationOffset: number;
  private fireworks: FireworkParticle[];
  private collectAnimation: boolean;
  private collectAnimationStart: number;
  private scorePopup: { value: number, alpha: number, y: number } | null; // For score popup animation
  
  constructor(p: p5, x: number, y: number, width: number, height: number) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.collected = false;
    this.image = null;
    this.animationOffset = p.random(0, 2 * p.PI); // Random starting point for animation
    this.fireworks = [];
    this.collectAnimation = false;
    this.collectAnimationStart = 0;
    this.scorePopup = null; // Initialize score popup as null
    
    this.loadAssets();
  }
  
  private async loadAssets() {
    try {
      this.image = await loadImage(this.p, '/assets/coin.svg');
    } catch (error) {
      console.error('Failed to load coin image:', error);
    }
  }
  
  private createFireworkEffect() {
    // Create particles for firework effect - reduced by half
    const particleCount = 50; // Reduced from 100 to 50
    
    // Create the main explosion particles
    for (let i = 0; i < particleCount; i++) {
      const particle = new FireworkParticle(this.p, this.x, this.y);
      particle.size *= 1.2; // Reduced from 1.5 to 1.2 (less large)
      this.fireworks.push(particle);
    }
    
    // Add a few larger "spark" particles - reduced number
    for (let i = 0; i < 10; i++) { // Reduced from 20 to 10
      const spark = new FireworkParticle(this.p, this.x, this.y);
      // Smaller, slower-moving particles
      spark.size = this.p.random(8, 14); // Reduced from 12-18 to 8-14
      spark.vx *= 0.8;
      spark.vy *= 0.8;
      this.fireworks.push(spark);
    }
    
    this.collectAnimation = true;
    this.collectAnimationStart = this.p.millis();
    
    // Log the collection for debugging
    console.log("Coin collected! Firework effect created at", this.x, this.y);
  }
  
  public draw(cameraOffsetY: number = 0) {
    // If coin is collected and we're not animating, don't draw anything
    if (this.collected && !this.collectAnimation && !this.scorePopup) {
      return;
    }
    
    // Draw score popup if it exists
    if (this.scorePopup) {
      this.p.push();
      
      // Make the text float upward and fade out
      this.scorePopup.y -= 2; // Move upward
      this.scorePopup.alpha -= 5; // Fade out
      
      // Apply camera offset
      const screenY = this.scorePopup.y - cameraOffsetY;
      
      // Draw the score text with current alpha
      this.p.fill(255, 215, 0, this.scorePopup.alpha); // Gold color with alpha
      this.p.textAlign(this.p.CENTER);
      this.p.textSize(24); // Larger text
      this.p.textStyle(this.p.BOLD);
      this.p.text(`+${this.scorePopup.value}`, this.x, screenY);
      
      // Clean up the popup when it's fully transparent
      if (this.scorePopup.alpha <= 0) {
        this.scorePopup = null;
      }
      
      this.p.pop();
    }
    
    // If we're showing the collection animation, update and draw the firework particles
    if (this.collectAnimation) {
      // Update firework particles
      this.fireworks = this.fireworks.filter(particle => particle.update());
      
      // Draw firework particles
      for (const particle of this.fireworks) {
        particle.draw(cameraOffsetY);
      }
      
      // Check if animation is done (either all particles fade out or max time elapsed)
      const animationDuration = this.p.millis() - this.collectAnimationStart;
      if (this.fireworks.length === 0 || animationDuration > 1000) {
        this.collectAnimation = false;
        console.log("Coin collection animation complete");
      }
      
      // Continue to draw the coin itself if it's in the animation state
      if (this.collected) return;
    }
    
    // Only reach here if coin is not collected or animation is still running
    this.p.push();
    
    // Apply camera offset for scrolling
    const screenY = this.y - cameraOffsetY;
    
    // Simple hover animation
    const hoverOffset = this.p.sin(this.p.frameCount * 0.05 + this.animationOffset) * 5;
    
    // Add a subtle "glow" around the coin to indicate its hitbox
    // This helps players see where they need to be to collect it
    const pulseIntensity = (
      0.3 + // Base opacity of 30%
      0.1 * this.p.sin(this.p.frameCount * 0.08) // Pulsing effect +/- 10%
    );
    
    // Determine if this is a bottom area coin
    const isBottomAreaCoin = this.y > 300;
    
    // Use a larger glow for bottom area coins to match their larger hitbox
    const glowExpandFactor = isBottomAreaCoin ? 1.35 : 1.20; // 35% for bottom coins vs 20% for top coins
    
    // Draw the glow circle - matches the expanded hitbox
    this.p.noStroke();
    this.p.fill(255, 215, 0, 60 * pulseIntensity); // Gold with pulsing transparency
    this.p.ellipseMode(this.p.CENTER);
    this.p.ellipse(
      this.x, 
      screenY + hoverOffset, 
      this.width * glowExpandFactor, // Match the location-based expanded hitbox
      this.height * glowExpandFactor
    );
    
    // Draw the coin with animation
    if (this.image) {
      this.p.imageMode(this.p.CENTER);
      this.p.image(
        this.image, 
        this.x, 
        screenY + hoverOffset, 
        this.width, 
        this.height
      );
    } else {
      // Fallback if image isn't loaded
      this.p.fill(255, 215, 0); // Gold color
      this.p.ellipseMode(this.p.CENTER);
      this.p.ellipse(this.x, screenY + hoverOffset, this.width, this.height);
    }
    
    this.p.pop();
  }
  
  public contains(playerX: number, playerY: number, playerWidth: number, playerHeight: number): boolean {
    if (this.collected) return false;
    
    // IMPROVED WITH LOCATION-BASED ADJUSTMENT: Make coin collection more consistent everywhere
    
    // Determine if this is a "bottom area" coin (closer to starting position)
    // Screen is typically 600 pixels tall, lower half would be y > 300
    const isBottomAreaCoin = this.y > 300;
    
    // Use a larger hitbox for bottom area coins to make them easier to collect
    // Upper coins are already easier to collect due to camera position and attention focus
    const expandFactor = isBottomAreaCoin ? 1.35 : 1.20; // 35% expansion for bottom coins vs 20% for upper coins
    
    const expandedWidth = this.width * expandFactor;
    const expandedHeight = this.height * expandFactor;
    
    // Calculate coin boundaries with expanded hitbox
    const coinLeft = this.x - expandedWidth / 2;
    const coinRight = this.x + expandedWidth / 2;
    const coinTop = this.y - expandedHeight / 2;
    const coinBottom = this.y + expandedHeight / 2;
    
    // Use the player's full hitbox for more consistent collection
    const playerRight = playerX + playerWidth;
    const playerBottom = playerY + playerHeight;
    
    // Check standard AABB collision with expanded hitbox
    const boxCollision = !(
      playerX > coinRight || 
      playerRight < coinLeft || 
      playerY > coinBottom || 
      playerBottom < coinTop
    );
    
    // METHOD 2: Distance-based collision for better feel (more generous for bottom coins)
    // Calculate centers
    const playerCenterX = playerX + playerWidth / 2;
    const playerCenterY = playerY + playerHeight / 2;
    
    // Calculate distance between centers
    const dx = Math.abs(playerCenterX - this.x);
    const dy = Math.abs(playerCenterY - this.y);
    
    // For bottom coins, use a larger collection threshold
    const centerProximityFactor = isBottomAreaCoin ? 0.45 : 0.35; // 45% for bottom coins vs 35% for upper coins
    
    // Set threshold for collection based on combined dimensions and location
    const collectionThresholdX = (this.width + playerWidth) * centerProximityFactor;
    const collectionThresholdY = (this.height + playerHeight) * centerProximityFactor;
    
    // Check if centers are close enough
    const centerProximity = (dx < collectionThresholdX && dy < collectionThresholdY);
    
    // METHOD 3: Check for substantial overlap percentage (more forgiving for bottom coins)
    // Calculate overlap area
    const overlapWidth = Math.max(0, 
      Math.min(playerRight, coinRight) - Math.max(playerX, coinLeft));
    const overlapHeight = Math.max(0, 
      Math.min(playerBottom, coinBottom) - Math.max(playerY, coinTop));
    const overlapArea = overlapWidth * overlapHeight;
    
    // Calculate minimum required overlap (as a percentage of coin area)
    const coinArea = this.width * this.height;
    // Require less overlap for bottom coins (10% vs 15% for upper coins)
    const overlapRequirement = isBottomAreaCoin ? 0.10 : 0.15; 
    const minRequiredOverlap = coinArea * overlapRequirement;
    
    // Check if overlap is substantial
    const hasSubstantialOverlap = overlapArea > minRequiredOverlap;
    
    // SPECIAL METHOD 4: Pure proximity check for bottom coins only
    // This helps with the perspective issue where bottom coins can be harder to visually line up with
    let proximityCheck = false;
    
    if (isBottomAreaCoin) {
      // Simple distance check from player center to coin center
      const distance = Math.sqrt(dx * dx + dy * dy);
      // Allow collection if player is within 75% of combined radius
      const maxDistance = (this.width + playerWidth + this.height + playerHeight) * 0.20;
      proximityCheck = distance < maxDistance;
    }
    
    // Combine all methods - need to pass at least one test
    // Include special proximity check for bottom coins
    const shouldCollect = boxCollision || centerProximity || hasSubstantialOverlap || proximityCheck;
    
    if (shouldCollect) {
      // Log the actual collection data for debugging
      console.log("Coin collection detected!", {
        location: isBottomAreaCoin ? "bottom_area" : "upper_area",
        y: this.y,
        method: {
          boxCollision,
          centerProximity,
          hasSubstantialOverlap,
          proximityCheck
        },
        expandFactor,
        coin: { x: this.x, y: this.y, width: this.width, height: this.height },
        expanded: { width: expandedWidth, height: expandedHeight },
        player: { 
          x: playerX, 
          y: playerY,
          width: playerWidth,
          height: playerHeight
        },
        distances: {
          dx,
          dy,
          thresholdX: collectionThresholdX,
          thresholdY: collectionThresholdY
        }
      });
    }
    
    return shouldCollect;
  }
  
  public isCollected(): boolean {
    return this.collected;
  }
  
  public collect() {
    this.collected = true;
    this.createFireworkEffect(); // Create the firework effect when the coin is collected
    
    // Initialize score popup animation with the current coin value from constants
    this.scorePopup = {
      value: POINTS_FOR_COIN, // Using the imported constant
      alpha: 255,  // Fully visible
      y: this.y    // Start at coin's position
    };
  }
  
  public getPosition() {
    return { x: this.x, y: this.y };
  }
  
  public handleResize(newWidth: number, newHeight: number) {
    this.width = newWidth;
    this.height = newHeight;
  }
}