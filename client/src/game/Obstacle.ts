import p5 from 'p5';
import { ObstacleType, OBSTACLE_PROPERTIES } from './constants';
import { loadImage } from './assets';

export class Obstacle {
  private p: p5;
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public speed: number;
  public type: ObstacleType;
  private direction: number;
  private image: p5.Image | null;
  private animationFrame: number = 0;
  private animationSpeed: number = 0.2; // Controls animation speed
  private rotationAngle: number = 0; // For spinning tumbleweeds
  
  constructor(
    p: p5, 
    x: number, 
    y: number, 
    type: ObstacleType, 
    speed: number, 
    direction: number
  ) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.type = type;
    this.speed = speed * OBSTACLE_PROPERTIES[type].speedMultiplier;
    this.direction = direction; // 1 for right, -1 for left
    
    // Set dimensions based on obstacle type
    this.width = OBSTACLE_PROPERTIES[type].width;
    this.height = OBSTACLE_PROPERTIES[type].height;
    
    this.image = null;
    this.loadAssets();
  }
  
  private async loadAssets() {
    try {
      // Use PNG for horse and train, SVG for other types
      if (this.type === 'horse' || this.type === 'train') {
        this.image = await loadImage(this.p, `/assets/${this.type}.png`);
      } else {
        this.image = await loadImage(this.p, `/assets/${this.type}.svg`);
      }
    } catch (error) {
      console.error(`Failed to load image for ${this.type}:`, error);
    }
  }
  
  public update(canvasWidth: number) {
    // Move the obstacle
    this.x += this.speed * this.direction;
    
    // Wrap around when off-screen
    if (this.direction > 0 && this.x > canvasWidth + this.width / 2) {
      this.x = -this.width / 2;
    } else if (this.direction < 0 && this.x < -this.width / 2) {
      this.x = canvasWidth + this.width / 2;
    }
    
    // Update animation frame
    this.animationFrame += this.animationSpeed;
    
    // Update rotation for tumbleweeds
    if (this.type === ObstacleType.TUMBLEWEED) {
      // Spin faster in the direction of movement
      this.rotationAngle += 0.1 * this.direction;
    }
  }
  
  public draw() {
    this.p.push();
    this.p.translate(this.x, this.y);
    
    // Apply tumbleweed rotation
    if (this.type === ObstacleType.TUMBLEWEED) {
      this.p.rotate(this.rotationAngle);
      // Make tumbleweeds darker for better visibility
      this.p.tint(120, 80, 40); // Darker brown
    } else if (this.type === ObstacleType.HORSE) {
      // For horses, apply galloping animation
      const gallop = Math.sin(this.animationFrame) * 2;
      
      // Flip the image if moving left
      if (this.direction < 0) {
        this.p.scale(-1, 1);
      }
      
      // Apply a slight y-offset for galloping effect
      this.p.translate(0, gallop);
      
      // Make horses slightly darker for better visibility
      this.p.tint(170, 140, 110);
    } else if (this.type === ObstacleType.TRAIN) {
      // Flip the image if moving left
      if (this.direction < 0) {
        this.p.scale(-1, 1);
      }
      
      // Make trains darker for better visibility
      this.p.tint(150, 150, 150); // Darker gray
    } else if (this.type === ObstacleType.CACTUS) {
      // Make cacti darker for better visibility
      this.p.tint(0, 120, 0); // Darker green
    } else {
      // Flip the image if moving left
      if (this.direction < 0) {
        this.p.scale(-1, 1);
      }
    }
    
    // Draw the obstacle sprite
    if (this.image) {
      this.p.imageMode(this.p.CENTER);
      
      // For trains, use a slightly reduced visual width to help with overlap issues
      // while maintaining the same hitbox coordinates for collision detection
      let displayWidth = this.width;
      let displayHeight = this.height;
      
      if (this.type === ObstacleType.TRAIN) {
        // Scale down visual train size but keep the same hitbox
        displayWidth = this.width * 0.85; // Visually 85% of original width
      }
      
      this.p.image(
        this.image, 
        0, 
        0, 
        displayWidth, 
        displayHeight
      );
    } else {
      // Fallback if image isn't loaded - with darker colors
      if (this.type === ObstacleType.HORSE) {
        this.p.fill(110, 70, 30); // Darker brown for horses
      } else if (this.type === ObstacleType.TUMBLEWEED) {
        this.p.fill(100, 60, 20); // Darker brown for tumbleweeds
      } else if (this.type === ObstacleType.TRAIN) {
        this.p.fill(70, 70, 70); // Darker gray for trains
      } else if (this.type === ObstacleType.CACTUS) {
        this.p.fill(0, 100, 0); // Darker green for cacti
      } else {
        this.p.fill(100, 60, 20);
      }
      
      this.p.rectMode(this.p.CENTER);
      
      // Scale down the visual representation for trains in the fallback drawing too
      let displayWidth = this.width;
      let displayHeight = this.height;
      
      if (this.type === ObstacleType.TRAIN) {
        displayWidth = this.width * 0.85; // Match the 85% scale used for images
      }
      
      this.p.rect(0, 0, displayWidth, displayHeight);
    }
    
    // Reset tint after drawing
    this.p.noTint();
    
    this.p.pop();
  }
  
  public getRect() {
    // Make the hitbox smaller than the visual size for more forgiving collisions
    // Use different hitbox sizes based on obstacle type
    let hitboxWidthPercentage = 0.9; // Default 90% of visual width
    let hitboxHeightPercentage = 0.9; // Default 90% of visual height
    
    // Make train hitboxes much smaller to help prevent train overlaps
    if (this.type === ObstacleType.TRAIN) {
      hitboxWidthPercentage = 0.7; // Only 70% of visual width for trains
      hitboxHeightPercentage = 0.8; // 80% of visual height
    } else if (this.type === ObstacleType.HORSE) {
      hitboxWidthPercentage = 0.8; // 80% of visual width for horses
    }
    
    const hitboxWidth = this.width * hitboxWidthPercentage;
    const hitboxHeight = this.height * hitboxHeightPercentage;
    
    return {
      x: this.x - hitboxWidth / 2,
      y: this.y - hitboxHeight / 2,
      width: hitboxWidth,
      height: hitboxHeight
    };
  }
  
  public isDeadly(): boolean {
    return OBSTACLE_PROPERTIES[this.type].deadly;
  }
}
