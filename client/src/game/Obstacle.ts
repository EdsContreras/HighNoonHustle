import p5 from 'p5';
import { ObstacleType, OBSTACLE_PROPERTIES } from './constants';
import { loadImage } from './assets';

// Smoke particle class for train smoke effect
class SmokeParticle {
  private p: p5;
  private x: number;
  private y: number;
  private size: number;
  private alpha: number;
  private vx: number;
  private vy: number;
  private age: number;
  private maxAge: number;
  
  constructor(p: p5, x: number, y: number) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.size = p.random(5, 15); // Random size between 5 and 15
    this.alpha = p.random(150, 200); // Start with high alpha (opacity)
    // Random velocity - slight upward bias and influence from wind
    this.vx = p.random(-0.5, 0.5);
    this.vy = p.random(-1.2, -0.8); // Upward movement
    this.age = 0;
    this.maxAge = p.random(40, 60); // How long the particle lives
  }
  
  update() {
    // Move the particle
    this.x += this.vx;
    this.y += this.vy;
    
    // Increase size slightly as it rises (expanding smoke)
    this.size += 0.1;
    
    // Reduce opacity as it ages
    this.alpha -= this.alpha / this.maxAge;
    
    // Age the particle
    this.age++;
    
    // Return true if the particle is still alive
    return this.age < this.maxAge;
  }
  
  draw() {
    this.p.push();
    this.p.noStroke();
    
    // Dark gray smoke with current alpha
    this.p.fill(80, 80, 80, this.alpha);
    this.p.ellipseMode(this.p.CENTER);
    this.p.ellipse(this.x, this.y, this.size, this.size);
    
    this.p.pop();
  }
}

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
  private smokeParticles: SmokeParticle[] = []; // For train smoke
  private lastSmokeTime: number = 0; // When we last generated smoke
  
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
    
    // Generate smoke for trains
    if (this.type === ObstacleType.TRAIN) {
      const currentTime = this.p.millis();
      // Create new smoke particles periodically
      if (currentTime - this.lastSmokeTime > 100) { // Every 100ms
        this.lastSmokeTime = currentTime;
        
        // Create two particles at slightly different positions for a more natural effect
        // The smoke stack is positioned based on the direction and near the top of the train
        const smokeStackX = this.direction > 0 ? -this.width * 0.4 : this.width * 0.4;
        const smokeStackY = -this.height * 0.35;
        
        // Add the new smoke particles
        this.smokeParticles.push(
          new SmokeParticle(this.p, smokeStackX, smokeStackY)
        );
        
        // Occasionally add a second particle for more varied effect
        if (Math.random() > 0.5) {
          const offset = this.p.random(-3, 3);
          this.smokeParticles.push(
            new SmokeParticle(this.p, smokeStackX + offset, smokeStackY - 2)
          );
        }
      }
      
      // Update existing smoke particles
      this.smokeParticles = this.smokeParticles.filter(particle => particle.update());
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
    
    // Draw smoke particles for train
    if (this.type === ObstacleType.TRAIN && this.smokeParticles.length > 0) {
      // Draw all smoke particles
      for (const particle of this.smokeParticles) {
        particle.draw();
      }
    }
    
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
