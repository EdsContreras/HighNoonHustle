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
    
    // Expand the coin hitbox slightly to make it more forgiving (110% of original size)
    const expandFactor = 1.1;
    const expandedWidth = this.width * expandFactor;
    const expandedHeight = this.height * expandFactor;
    
    // Calculate coin boundaries with slightly expanded hitbox
    const coinLeft = this.x - expandedWidth / 2;
    const coinRight = this.x + expandedWidth / 2;
    const coinTop = this.y - expandedHeight / 2;
    const coinBottom = this.y + expandedHeight / 2;
    
    // Player rect is already top-left based so we don't need to adjust it
    const playerRight = playerX + playerWidth;
    const playerBottom = playerY + playerHeight;
    
    // Check AABB collision with expanded hitbox
    const isColliding = !(
      playerX > coinRight || 
      playerRight < coinLeft || 
      playerY > coinBottom || 
      playerBottom < coinTop
    );
    
    // Alternative collision check: centers are close enough
    const playerCenterX = playerX + playerWidth / 2;
    const playerCenterY = playerY + playerHeight / 2;
    const distanceX = Math.abs(playerCenterX - this.x);
    const distanceY = Math.abs(playerCenterY - this.y);
    
    // Consider centers close if they're within 75% of sum of half-widths/heights
    const centersClose = 
      distanceX < (expandedWidth + playerWidth) * 0.375 && 
      distanceY < (expandedHeight + playerHeight) * 0.375;
    
    // Coins are collected if either test passes
    const shouldCollect = isColliding || centersClose;
    
    if (shouldCollect) {
      console.log("Coin collision detected!", {
        coin: { x: this.x, y: this.y, width: this.width, height: this.height },
        expanded: { width: expandedWidth, height: expandedHeight },
        coinRect: { left: coinLeft, right: coinRight, top: coinTop, bottom: coinBottom },
        playerRect: { left: playerX, right: playerRight, top: playerY, bottom: playerBottom },
        centersClose: centersClose,
        distance: { x: distanceX, y: distanceY }
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