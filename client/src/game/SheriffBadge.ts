import p5 from 'p5';
import { loadImage } from './assets';
import { POINTS_FOR_BADGE, INVINCIBILITY_DURATION } from './constants';

// Define a particle effect for the badge collection animation
class InvincibilityParticle {
  private p: p5;
  private x: number;
  private y: number;
  public vx: number;
  public vy: number;
  private alpha: number;
  private color: p5.Color;
  public size: number;
  private trail: {x: number, y: number, alpha: number}[];
  
  constructor(p: p5, x: number, y: number) {
    this.p = p;
    this.x = x;
    this.y = y;
    
    // Random velocity - slightly faster than coin particles
    const angle = p.random(0, p.TWO_PI);
    const speed = p.random(3, 6);
    this.vx = p.cos(angle) * speed;
    this.vy = p.sin(angle) * speed;
    
    // Start fully opaque and fade out
    this.alpha = 255;
    
    // Gold/silver color for sheriff badge
    this.color = p.color(
      p.random(200, 255), // Gold/yellow base
      p.random(160, 220), // Slightly less green for more gold
      p.random(0, 50)     // Very little blue
    );
    
    // Slightly larger particles than coins
    this.size = p.random(5, 10);
    
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
    
    // Keep trail short
    if (this.trail.length > 4) {
      this.trail.shift();
    }
    
    // Decrease alpha of all trail points
    for (let i = 0; i < this.trail.length; i++) {
      this.trail[i].alpha -= 20; // Slightly faster fade than coins
    }
    
    // Move the particle
    this.x += this.vx;
    this.y += this.vy;
    
    // Add a bit of gravity
    this.vy += 0.09;
    
    // Fade out the particle
    this.alpha -= 5;
    
    // Return true if the particle is still visible
    return this.alpha > 0;
  }
  
  draw(cameraOffsetY: number = 0) {
    this.p.push();
    this.p.noStroke();
    
    // Draw trail
    for (const point of this.trail) {
      const screenY = point.y - cameraOffsetY;
      const trailColor = this.p.color(255, 215, 0, point.alpha * 0.6);
      this.p.fill(trailColor);
      const trailSize = this.size * 0.8;
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

export class SheriffBadge {
  private p: p5;
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private collected: boolean;
  private image: p5.Image | null;
  private animationOffset: number;
  private particles: InvincibilityParticle[];
  private collectAnimation: boolean;
  private collectAnimationStart: number;
  private scorePopup: { value: number, alpha: number, y: number } | null;
  
  constructor(p: p5, x: number, y: number, width: number, height: number) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.collected = false;
    this.image = null;
    this.animationOffset = p.random(0, 2 * p.PI); // Random starting point for animation
    this.particles = [];
    this.collectAnimation = false;
    this.collectAnimationStart = 0;
    this.scorePopup = null;
    
    this.loadAssets();
  }
  
  private async loadAssets() {
    try {
      this.image = await loadImage(this.p, '/assets/sheriffbadge.png');
    } catch (error) {
      console.error('Failed to load sheriff badge image:', error);
    }
  }
  
  private createCollectionEffect() {
    // Create more particles for a more dramatic effect than coins
    const particleCount = 70;
    
    // Create the main explosion particles
    for (let i = 0; i < particleCount; i++) {
      const particle = new InvincibilityParticle(this.p, this.x, this.y);
      particle.size *= 1.3; // Larger particles for more impact
      this.particles.push(particle);
    }
    
    // Add a few larger "spark" particles
    for (let i = 0; i < 15; i++) {
      const spark = new InvincibilityParticle(this.p, this.x, this.y);
      // Larger, slower-moving particles
      spark.size = this.p.random(10, 18);
      spark.vx *= 0.7;
      spark.vy *= 0.7;
      this.particles.push(spark);
    }
    
    this.collectAnimation = true;
    this.collectAnimationStart = this.p.millis();
    
    // Log the collection for debugging
    console.log("Sheriff badge collected! Effect created at", this.x, this.y);
  }
  
  public draw(cameraOffsetY: number = 0) {
    // If badge is collected and we're not animating, don't draw anything
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
      
      // Draw "INVINCIBLE!" text below the score
      this.p.textSize(18);
      this.p.fill(255, 255, 255, this.scorePopup.alpha);
      this.p.text("INVINCIBLE!", this.x, screenY + 25);
      
      // Clean up the popup when it's fully transparent
      if (this.scorePopup.alpha <= 0) {
        this.scorePopup = null;
      }
      
      this.p.pop();
    }
    
    // If we're showing the collection animation, update and draw the particles
    if (this.collectAnimation) {
      // Update particles
      this.particles = this.particles.filter(particle => particle.update());
      
      // Draw particles
      for (const particle of this.particles) {
        particle.draw(cameraOffsetY);
      }
      
      // Check if animation is done
      const animationDuration = this.p.millis() - this.collectAnimationStart;
      if (this.particles.length === 0 || animationDuration > 1200) {
        this.collectAnimation = false;
        console.log("Sheriff badge collection animation complete");
      }
      
      // Don't draw the badge itself if it's been collected
      if (this.collected) return;
    }
    
    // Only reach here if badge is not collected or animation is still running
    this.p.push();
    
    // Apply camera offset for scrolling
    const screenY = this.y - cameraOffsetY;
    
    // Hover and rotate animation to make badge stand out
    const hoverOffset = this.p.sin(this.p.frameCount * 0.06 + this.animationOffset) * 6;
    const rotationAngle = this.p.sin(this.p.frameCount * 0.03) * 0.1; // Subtle rotation
    
    // Add a more noticeable "glow" around the badge
    const pulseIntensity = (
      0.4 + // Base opacity of 40%
      0.15 * this.p.sin(this.p.frameCount * 0.1) // Stronger pulsing effect +/- 15%
    );
    
    // Determine if this is a bottom area badge
    const isBottomAreaBadge = this.y > 300;
    
    // Use a larger glow for bottom area badges
    const glowExpandFactor = isBottomAreaBadge ? 1.6 : 1.45;
    
    // Draw the glow circle with a yellow/gold color
    this.p.noStroke();
    this.p.fill(255, 215, 0, 70 * pulseIntensity); // Golden glow with pulsing transparency
    this.p.ellipseMode(this.p.CENTER);
    this.p.ellipse(
      this.x, 
      screenY + hoverOffset, 
      this.width * glowExpandFactor, 
      this.height * glowExpandFactor
    );
    
    // Draw the badge with animation
    if (this.image) {
      this.p.imageMode(this.p.CENTER);
      this.p.push();
      this.p.translate(this.x, screenY + hoverOffset);
      this.p.rotate(rotationAngle); // Apply rotation effect
      this.p.image(
        this.image, 
        0, 
        0, 
        this.width, 
        this.height
      );
      this.p.pop();
    } else {
      // Fallback if image isn't loaded
      this.p.fill(255, 215, 0); // Gold color
      this.p.push();
      this.p.translate(this.x, screenY + hoverOffset);
      this.p.rotate(rotationAngle);
      // Draw a star shape as fallback
      this.p.beginShape();
      const points = 5;
      const outerRadius = this.width / 2;
      const innerRadius = outerRadius * 0.4;
      for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / points;
        const px = Math.cos(angle) * radius;
        const py = Math.sin(angle) * radius;
        this.p.vertex(px, py);
      }
      this.p.endShape(this.p.CLOSE);
      this.p.pop();
    }
    
    this.p.pop();
  }
  
  public contains(playerX: number, playerY: number, playerWidth: number, playerHeight: number): boolean {
    if (this.collected) return false;
    
    // Similar to coin collection but with slightly larger hitbox for sheriff badge
    
    // Determine if this is a "bottom area" badge
    const isBottomAreaBadge = this.y > 300;
    
    // Larger hitboxes for easier collection
    const expandFactor = isBottomAreaBadge ? 1.6 : 1.45;
    
    const expandedWidth = this.width * expandFactor;
    const expandedHeight = this.height * expandFactor;
    
    // Calculate badge boundaries with expanded hitbox
    const badgeLeft = this.x - expandedWidth / 2;
    const badgeRight = this.x + expandedWidth / 2;
    const badgeTop = this.y - expandedHeight / 2;
    const badgeBottom = this.y + expandedHeight / 2;
    
    // Use the player's full hitbox for more consistent collection
    const playerRight = playerX + playerWidth;
    const playerBottom = playerY + playerHeight;
    
    // Check standard AABB collision with expanded hitbox
    const boxCollision = !(
      playerX > badgeRight || 
      playerRight < badgeLeft || 
      playerY > badgeBottom || 
      playerBottom < badgeTop
    );
    
    // Calculate centers for proximity check
    const playerCenterX = playerX + playerWidth / 2;
    const playerCenterY = playerY + playerHeight / 2;
    
    // Calculate distance between centers
    const dx = Math.abs(playerCenterX - this.x);
    const dy = Math.abs(playerCenterY - this.y);
    
    // For bottom badges, use a larger collection threshold
    const centerProximityFactor = isBottomAreaBadge ? 0.55 : 0.45;
    
    // Set threshold for collection based on combined dimensions and location
    const collectionThresholdX = (this.width + playerWidth) * centerProximityFactor;
    const collectionThresholdY = (this.height + playerHeight) * centerProximityFactor;
    
    // Check if centers are close enough
    const centerProximity = (dx < collectionThresholdX && dy < collectionThresholdY);
    
    // Simple distance check from player center to badge center
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Allow collection if player is within a generous distance threshold
    const distanceFactor = isBottomAreaBadge ? 0.3 : 0.25;
    const maxDistance = (this.width + playerWidth + this.height + playerHeight) * distanceFactor;
    const proximityCheck = distance < maxDistance;
    
    // Combine all methods - need to pass at least one test
    const shouldCollect = boxCollision || centerProximity || proximityCheck;
    
    if (shouldCollect) {
      console.log("Sheriff badge collection detected!", {
        location: isBottomAreaBadge ? "bottom_area" : "upper_area",
        y: this.y,
        method: {
          boxCollision,
          centerProximity,
          proximityCheck
        }
      });
    }
    
    return shouldCollect;
  }
  
  public isCollected(): boolean {
    return this.collected;
  }
  
  public collect() {
    this.collected = true;
    this.createCollectionEffect(); // Create the collection effect
    
    // Initialize score popup animation
    this.scorePopup = {
      value: POINTS_FOR_BADGE,
      alpha: 255,  // Fully visible
      y: this.y    // Start at badge's position
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