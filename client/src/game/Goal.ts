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
  private level: number; // Store the level for size adjustment
  
  constructor(p: p5, x: number, y: number, width: number, height: number, level: number = 1) {
    this.p = p;
    this.x = x;
    this.y = y;
    // Store the original width and height
    this.width = width;
    this.height = height;
    this.reached = false;
    this.image = null;
    this.animationOffset = p.random(0, 2 * p.PI); // Random starting point for animation
    this.level = level; // Save the current level
    
    this.loadAssets();
  }
  
  private async loadAssets() {
    try {
      this.image = await loadImage(this.p, '/assets/moneybag.png');
      
      // Debug log the creation of this money bag with size info
      const sizeMultiplier = this.level === 1 ? 0.7 : 1.0;
      console.log(`Money bag created for Level ${this.level} with size multiplier: ${sizeMultiplier} (${this.width}x${this.height})`);
    } catch (error) {
      console.error('Failed to load money bag image:', error);
    }
  }
  
  public draw() {
    this.p.push();
    
    // Calculate actual display size based on level
    // Apply 30% reduction only for Level 1
    const sizeMultiplier = this.level === 1 ? 0.7 : 1.0; // 70% of original size for level 1
    
    // Calculate the display width and height
    // Note: We're maintaining the aspect ratio of the image even though the end zone is taller
    const displayWidth = this.width * sizeMultiplier;
    const displayHeight = this.height * sizeMultiplier;
    
    if (this.image) {
      // Draw with money bag image
      this.p.imageMode(this.p.CENTER);
      
      // Add a slight bobbing animation
      const animationSpeed = 0.05;
      const animationAmount = 3; // pixels up/down
      const yOffset = Math.sin(this.p.frameCount * animationSpeed + this.animationOffset) * animationAmount;
      
      // If reached, draw with a subtle glow effect
      if (this.reached) {
        // Draw a subtle glow background - make it larger for doubled height
        this.p.noStroke();
        this.p.fill(255, 215, 0, 100); // Golden glow
        this.p.ellipse(this.x, this.y + yOffset, displayWidth * 1.2, displayHeight * 1.2);
      }
      
      // Draw the money bag image with level-specific size
      // We'll keep the image size proportional even though the zone is taller
      this.p.image(this.image, this.x, this.y + yOffset, displayWidth, displayHeight);
      
      // Debug log in first frame
      if (this.p.frameCount < 10) {
        console.log(`Money bag in level ${this.level} drawn at size ${displayWidth.toFixed(1)}x${displayHeight.toFixed(1)} (${sizeMultiplier * 100}% of original) in doubled height zone`);
      }
      
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
      
      // Draw the goal as a rounded rectangle to look like a bag with level-specific size
      this.p.rect(this.x, this.y, displayWidth, displayHeight, 10);
      
      // Draw a $ symbol
      this.p.fill(139, 69, 19); // Brown color for the $ symbol
      this.p.textSize(displayWidth * 0.5);
      this.p.textAlign(this.p.CENTER, this.p.CENTER);
      this.p.text('$', this.x, this.y);
    }
    
    this.p.pop();
  }
  
  public contains(pointX: number): boolean {
    // Apply the same 30% reduction for collision detection in Level 1
    const sizeMultiplier = this.level === 1 ? 0.7 : 1.0;
    const actualWidth = this.width * sizeMultiplier;
    
    // With the doubled height of the end zone, we make the hitbox slightly larger horizontally
    // to make it easier for players to reach the goal
    const hitboxMultiplier = 1.2; // 20% wider hitbox for easier gameplay with taller end zone
    
    // Check if the point is within the adjusted width with hitbox multiplier
    return pointX > this.x - (actualWidth * hitboxMultiplier) / 2 && 
           pointX < this.x + (actualWidth * hitboxMultiplier) / 2;
  }
  
  public isReached(): boolean {
    return this.reached;
  }
  
  public setReached(reached: boolean) {
    this.reached = reached;
  }
}
