import p5 from 'p5';
import { COLORS } from './constants';
import { loadImage } from './assets';

export class Goal {
  private p: p5;
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private reached: boolean;
  private image: p5.Image | null;
  private animationOffset: number;
  
  constructor(p: p5, x: number, y: number, width: number, height: number) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.reached = false;
    this.image = null;
    this.animationOffset = p.random(0, 2 * p.PI); // Random starting point for animation
    
    this.loadAssets();
  }
  
  private async loadAssets() {
    try {
      this.image = await loadImage(this.p, '/assets/moneybag.png');
    } catch (error) {
      console.error('Failed to load money bag image:', error);
    }
  }
  
  public draw() {
    this.p.push();
    
    if (this.image) {
      // Draw with money bag image
      this.p.imageMode(this.p.CENTER);
      
      // Add a slight bobbing animation
      const animationSpeed = 0.05;
      const animationAmount = 3; // pixels up/down
      const yOffset = Math.sin(this.p.frameCount * animationSpeed + this.animationOffset) * animationAmount;
      
      // If reached, draw with a subtle glow effect
      if (this.reached) {
        // Draw a subtle glow background
        this.p.noStroke();
        this.p.fill(255, 215, 0, 100); // Golden glow
        this.p.ellipse(this.x, this.y + yOffset, this.width * 1.2, this.height * 1.2);
      }
      
      // Draw the money bag image with proper proportions
      // The money bag is a square image, so we'll maintain that aspect ratio
      this.p.image(this.image, this.x, this.y + yOffset, this.width, this.height);
      
      // Visual indicator of collect area (for debugging, commented out)
      // this.p.noFill();
      // this.p.stroke(255, 0, 0);
      // const hitboxWidth = this.width * 0.4; // Matches the hitbox in contains()
      // this.p.rect(this.x, this.y + yOffset, hitboxWidth, this.height * 0.5);
      
    } else {
      // Fallback if image fails to load (similar to old version but with golden color)
      this.p.rectMode(this.p.CENTER);
      this.p.noStroke();
      
      // Draw background with golden color for money bag theme
      if (this.reached) {
        // Reached goals have a brighter gold color
        this.p.fill(255, 215, 0); // Brighter gold for collected
      } else {
        this.p.fill(218, 165, 32); // Regular gold color
      }
      
      // Draw the goal as a rounded rectangle to look like a bag
      this.p.rect(this.x, this.y, this.width, this.height, 10);
      
      // Draw a $ symbol
      this.p.fill(139, 69, 19); // Brown color for the $ symbol
      this.p.textSize(this.width * 0.5);
      this.p.textAlign(this.p.CENTER, this.p.CENTER);
      this.p.text('$', this.x, this.y);
    }
    
    this.p.pop();
  }
  
  public contains(pointX: number): boolean {
    // Make the collection hitbox smaller (only 40% of visual width instead of 100%)
    // This makes the player need to be more precise to collect money bags
    const hitboxWidth = this.width * 0.4;
    return pointX > this.x - hitboxWidth / 2 && pointX < this.x + hitboxWidth / 2;
  }
  
  public isReached(): boolean {
    return this.reached;
  }
  
  public setReached(reached: boolean) {
    this.reached = reached;
  }
}
