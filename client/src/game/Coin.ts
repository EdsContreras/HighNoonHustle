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
    const speed = p.random(2, 5);
    this.vx = p.cos(angle) * speed;
    this.vy = p.sin(angle) * speed;
    
    // Start fully opaque and fade out
    this.alpha = 255;
    
    // Bright gold/yellow color variations for more vibrant fireworks
    const colorVariation = p.random(30);
    const brightGold = p.random() > 0.3;
    
    if (brightGold) {
      // Pure bright yellow for most particles
      this.color = p.color(255, 255 - colorVariation, 0);
    } else {
      // Some particles with a more orange/gold tint for variation
      this.color = p.color(255, 200 - colorVariation, 0);
    }
    
    // Random size for the particle
    this.size = p.random(3, 6);
    
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
    
    // Fade out the particle faster
    this.alpha -= 8;
    
    // Return true if the particle is still visible
    return this.alpha > 0;
  }
  
  draw(cameraOffsetY: number = 0) {
    this.p.push();
    this.p.noStroke();
    
    // Draw trail with glowing effect
    for (const point of this.trail) {
      const screenY = point.y - cameraOffsetY;
      
      // Outer glow
      const glowColor = this.p.color(255, 255, 0, point.alpha * 0.2);
      this.p.fill(glowColor);
      const glowSize = this.size * 1.2;
      this.p.ellipse(point.x, screenY, glowSize, glowSize);
      
      // Inner trail
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
    const particleCount = 60; // Increased for even more dramatic effect
    
    // Create the main explosion particles
    for (let i = 0; i < particleCount; i++) {
      this.fireworks.push(new FireworkParticle(this.p, this.x, this.y));
    }
    
    // Add a few larger "spark" particles
    for (let i = 0; i < 15; i++) {
      const spark = new FireworkParticle(this.p, this.x, this.y);
      // Override with larger, slower-moving particles
      spark.size = this.p.random(6, 12);
      spark.vx *= 0.7;
      spark.vy *= 0.7;
      this.fireworks.push(spark);
    }
    
    // Add some special brighter particles in a circular pattern
    const circleParticleCount = 16;
    for (let i = 0; i < circleParticleCount; i++) {
      const angle = (i / circleParticleCount) * this.p.TWO_PI;
      const spark = new FireworkParticle(this.p, this.x, this.y);
      
      // Set velocity directly based on angle
      const speed = this.p.random(4, 6); // Faster to expand quickly
      spark.vx = this.p.cos(angle) * speed;
      spark.vy = this.p.sin(angle) * speed;
      
      // Slightly larger size
      spark.size = this.p.random(5, 8);
      
      this.fireworks.push(spark);
    }
    
    this.collectAnimation = true;
    this.collectAnimationStart = this.p.millis();
    
    // Log the collection for debugging
    console.log("Coin collected! Firework effect created at", this.x, this.y);
  }
  
  public draw(cameraOffsetY: number = 0) {
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
      }
      
      return;
    }
    
    // If coin is collected and animation is done, don't draw anything
    if (this.collected) return;
    
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
    
    // Simple collision detection
    const coinLeft = this.x - this.width / 2;
    const coinRight = this.x + this.width / 2;
    const coinTop = this.y - this.height / 2;
    const coinBottom = this.y + this.height / 2;
    
    const playerLeft = playerX - playerWidth / 2;
    const playerRight = playerX + playerWidth / 2;
    const playerTop = playerY - playerHeight / 2;
    const playerBottom = playerY + playerHeight / 2;
    
    return !(
      playerLeft > coinRight || 
      playerRight < coinLeft || 
      playerTop > coinBottom || 
      playerBottom < coinTop
    );
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