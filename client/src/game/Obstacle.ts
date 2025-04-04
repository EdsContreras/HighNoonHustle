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
  public vx: number; // Made public so it can be modified
  private vy: number;
  private age: number;
  private maxAge: number;
  
  constructor(p: p5, x: number, y: number) {
    this.p = p;
    this.x = x;
    this.y = y;
    // Start with smaller size, will grow as it rises
    this.size = p.random(4, 8); // Smaller initial size
    this.alpha = p.random(170, 220); // Start with high alpha (opacity)
    
    // Random velocity - more vertical with slight drift
    // More vertical movement for a chimney-like effect
    this.vx = p.random(-0.3, 0.3); // Less horizontal drift
    this.vy = p.random(-1.0, -0.7); // More consistent upward movement
    
    this.age = 0;
    this.maxAge = p.random(30, 45); // Shorter lifespan for quicker dissipation
  }
  
  update() {
    // Move the particle
    this.x += this.vx;
    this.y += this.vy;
    
    // Add a slight wiggle effect for more realistic smoke movement
    // This creates a subtle wandering/billowing motion
    this.vx += this.p.random(-0.03, 0.03);
    
    // Gradually slow down both horizontal and vertical movement as the particle ages
    // This creates the effect of smoke losing momentum as it rises
    this.vx *= 0.99;
    this.vy *= 0.98;
    
    // Increase size slightly as it rises (expanding smoke)
    // Smoke expands more when it's newer, then expansion slows down
    const growthRate = Math.max(0.05, 0.15 - (this.age / this.maxAge) * 0.1);
    this.size += growthRate;
    
    // Reduce opacity as it ages - faster fade near the end of life
    if (this.age > this.maxAge * 0.7) {
      // Fade out faster towards the end
      this.alpha -= this.alpha / (this.maxAge * 0.15);
    } else {
      // Slower fade in the beginning
      this.alpha -= this.alpha / this.maxAge;
    }
    
    // Age the particle
    this.age++;
    
    // Return true if the particle is still alive
    return this.age < this.maxAge && this.alpha > 5;
  }
  
  draw() {
    this.p.push();
    this.p.noStroke();
    
    // More realistic dark gray smoke with current alpha
    // Using darker color initially
    this.p.fill(60, 60, 60, this.alpha);
    this.p.ellipseMode(this.p.CENTER);
    
    // Draw the main smoke particle
    this.p.ellipse(this.x, this.y, this.size, this.size);
    
    // Add a lighter inner part for more depth
    // This creates a subtle gradient effect
    this.p.fill(90, 90, 90, this.alpha * 0.7);
    this.p.ellipse(this.x, this.y, this.size * 0.6, this.size * 0.6);
    
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
        
        // Create particles at the precise position of the train's smokestack
        // After examining the train image closely, we're adjusting the smokestack position
        
        // Determine smokestack position based on the train image from the screenshot
        // Looking at the image, the smokestack is almost at the very front of the train
        // and positioned at the top of the train's body
        
        // Based on the screenshot, the black smokestack is at the very front of the train
        // We need to position this perfectly based on the train image
        const frontOffset = this.width * 0.45; // 45% from center puts it at the very front edge
        const smokeStackX = this.direction > 0 ? -frontOffset : frontOffset;
        
        // Vertical position: looking at the screenshot, the smokestack is at the top of the train
        // But not quite centered - it's a bit lower than the very top edge
        const smokeStackY = -this.height * 0.3; // Slightly below the top edge of the train
        
        // Add the new smoke particles with initial velocity matching train direction
        // This makes the smoke initially move with the train before drifting upward
        const particle = new SmokeParticle(this.p, smokeStackX, smokeStackY);
        // Give an initial horizontal boost in the train's direction
        particle.vx += this.direction * 0.2; // Add some initial velocity in train's direction
        this.smokeParticles.push(particle);
        
        // Occasionally add a second particle for more varied effect
        if (Math.random() > 0.4) { // Increased probability for more particles
          const offsetX = this.p.random(-2, 2);
          const offsetY = this.p.random(-1, 1);
          const particle2 = new SmokeParticle(
            this.p, 
            smokeStackX + offsetX, 
            smokeStackY + offsetY
          );
          // Also give this particle a direction boost
          particle2.vx += this.direction * 0.15;
          this.smokeParticles.push(particle2);
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
