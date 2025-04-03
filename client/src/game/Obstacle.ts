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
  }
  
  public draw() {
    this.p.push();
    this.p.translate(this.x, this.y);
    
    // Flip the image if moving left
    if (this.direction < 0) {
      this.p.scale(-1, 1);
    }
    
    // Draw the obstacle sprite
    if (this.image) {
      this.p.imageMode(this.p.CENTER);
      this.p.image(
        this.image, 
        0, 
        0, 
        this.width, 
        this.height
      );
    } else {
      // Fallback if image isn't loaded
      this.p.fill(150, 100, 50);
      this.p.rectMode(this.p.CENTER);
      this.p.rect(0, 0, this.width, this.height);
    }
    
    this.p.pop();
  }
  
  public getRect() {
    return {
      x: this.x - this.width / 2,
      y: this.y - this.height / 2,
      width: this.width,
      height: this.height
    };
  }
  
  public isDeadly(): boolean {
    return OBSTACLE_PROPERTIES[this.type].deadly;
  }
}
