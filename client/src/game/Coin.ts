import p5 from 'p5';
import { loadImage } from './assets';

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
    
    // Random velocity for the particle - higher speeds for more dramatic effect
    const angle = p.random(0, p.TWO_PI);
    const speed = p.random(4, 8); // Increased speed range
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
    
    // Larger random size for the particle
    this.size = p.random(8, 12);
    
    // Trail effect
    this.trail = [];
  }
  
  update() {
    // Add current position to trail with current alpha
    this.trail.push({
      x: this.x,
      y: this.y,
      alpha: this.alpha
    });
    
    // Keep trail at a reasonable length
    if (this.trail.length > 5) {
      this.trail.shift();
    }
    
    // Decrease alpha of all trail points
    for (let i = 0; i < this.trail.length; i++) {
      this.trail[i].alpha -= 15;
    }
    
    // Move the particle
    this.x += this.vx;
    this.y += this.vy;
    
    // Add a bit of gravity
    this.vy += 0.1;
    
    // Fade out the particle more slowly
    this.alpha -= 4;
    
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
    // Create more particles for a more impressive firework effect
    const particleCount = 100; // Doubled again for even more particles
    
    // Create the main explosion particles
    for (let i = 0; i < particleCount; i++) {
      const particle = new FireworkParticle(this.p, this.x, this.y);
      particle.size *= 1.5; // Make particles 50% larger
      this.fireworks.push(particle);
    }
    
    // Add more larger "spark" particles
    for (let i = 0; i < 20; i++) {
      const spark = new FireworkParticle(this.p, this.x, this.y);
      // Override with larger, slower-moving particles
      spark.size = this.p.random(12, 18);
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
    if (this.collected && !this.collectAnimation) {
      return;
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
      
      return;
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
    
    // Simple AABB collision detection
    // Note: Unlike earlier code, playerX/Y are now the top-left corner of the player's rect
    // not the center point
    const coinLeft = this.x - this.width / 2;
    const coinRight = this.x + this.width / 2;
    const coinTop = this.y - this.height / 2;
    const coinBottom = this.y + this.height / 2;
    
    // Player rect is already top-left based so we don't need to adjust it
    const playerRight = playerX + playerWidth;
    const playerBottom = playerY + playerHeight;
    
    // Log the collision check for debugging
    const isColliding = !(
      playerX > coinRight || 
      playerRight < coinLeft || 
      playerY > coinBottom || 
      playerBottom < coinTop
    );
    
    if (isColliding) {
      console.log("Coin collision detected!", {
        coin: { x: this.x, y: this.y, width: this.width, height: this.height },
        coinRect: { left: coinLeft, right: coinRight, top: coinTop, bottom: coinBottom },
        playerRect: { left: playerX, right: playerRight, top: playerY, bottom: playerBottom }
      });
    }
    
    return isColliding;
  }
  
  public isCollected(): boolean {
    return this.collected;
  }
  
  public collect() {
    this.collected = true;
    this.createFireworkEffect(); // Create the firework effect when the coin is collected
  }
  
  public getPosition() {
    return { x: this.x, y: this.y };
  }
  
  public handleResize(newWidth: number, newHeight: number) {
    this.width = newWidth;
    this.height = newHeight;
  }
}