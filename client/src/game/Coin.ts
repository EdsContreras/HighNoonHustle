import p5 from 'p5';
import { loadImage } from './assets';

// Firework particle class for the coin collection animation
class FireworkParticle {
  private p: p5;
  private x: number;
  private y: number;
  private vx: number;
  private vy: number;
  private alpha: number;
  private color: p5.Color;
  private size: number;
  
  constructor(p: p5, x: number, y: number) {
    this.p = p;
    this.x = x;
    this.y = y;
    
    // Random velocity for the particle
    const angle = p.random(0, p.TWO_PI);
    const speed = p.random(0.5, 3);
    this.vx = p.cos(angle) * speed;
    this.vy = p.sin(angle) * speed;
    
    // Start fully opaque and fade out
    this.alpha = 255;
    
    // Yellow/gold color variations for the firework
    const colorVariation = p.random(20);
    this.color = p.color(255, 215 - colorVariation, 0);
    
    // Random size for the particle
    this.size = p.random(2, 4);
  }
  
  update() {
    // Move the particle
    this.x += this.vx;
    this.y += this.vy;
    
    // Add a bit of gravity
    this.vy += 0.05;
    
    // Fade out the particle
    this.alpha -= 5;
    
    // Return true if the particle is still visible
    return this.alpha > 0;
  }
  
  draw(cameraOffsetY: number = 0) {
    const screenY = this.y - cameraOffsetY;
    
    this.p.push();
    this.p.noStroke();
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
    // Create multiple particles for the firework effect
    for (let i = 0; i < 25; i++) {
      this.fireworks.push(new FireworkParticle(this.p, this.x, this.y));
    }
    this.collectAnimation = true;
    this.collectAnimationStart = this.p.millis();
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