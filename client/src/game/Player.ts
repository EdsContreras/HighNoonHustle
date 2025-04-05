import p5 from 'p5';
import { useCustomization } from '../lib/stores/useCustomization';
import { 
  Accessory, 
  getAccessoryById 
} from './data/accessories';

export class Player {
  private p: p5;
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private speed: number;
  private image: p5.Image | null;
  private isDead: boolean;
  private flashEffect: boolean;
  private flashStart: number;
  private flashDuration: number;
  private invincible: boolean;
  private movementCooldown: number;
  private lastMoveTime: number;
  private isMoving: boolean;
  private deathAnimationStart: number | null;
  
  // Accessories related properties
  private accessories: Map<string, p5.Image | null>;
  private accessoriesLoaded: boolean;

  constructor(p: p5, x: number, y: number, width: number, height: number) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = height; // One cell height per move
    this.image = null;
    this.isDead = false;
    this.flashEffect = false;
    this.flashStart = 0;
    this.flashDuration = 2000; // 2 seconds of flashing after death
    this.invincible = false;
    this.movementCooldown = 100; // 100ms cooldown between moves
    this.lastMoveTime = 0;
    this.isMoving = false;
    this.deathAnimationStart = null;
    
    // Initialize accessories map
    this.accessories = new Map();
    this.accessoriesLoaded = false;
    
    // Load assets when constructing
    this.loadAssets();
  }

  private async loadAssets() {
    try {
      // Load the base player image
      this.image = await this.p.loadImage('/assets/player.png');
      
      // Load the player's equipped accessories
      await this.loadAccessories();
      
      console.log('Player assets loaded successfully');
    } catch (error) {
      console.error('Error loading player assets:', error);
    }
  }
  
  private async loadAccessories() {
    try {
      // Get the customization state
      const customization = useCustomization.getState();
      
      // Loop through each accessory type and load images
      for (const [type, id] of Object.entries(customization.selectedAccessories)) {
        if (id) {
          const accessory = getAccessoryById(id);
          if (accessory) {
            try {
              // Load the accessory image
              const image = await this.p.loadImage(accessory.imagePath);
              this.accessories.set(id, image);
            } catch (error) {
              console.error(`Error loading accessory ${id}:`, error);
              this.accessories.set(id, null);
            }
          }
        }
      }
      
      this.accessoriesLoaded = true;
    } catch (error) {
      console.error('Error loading accessories:', error);
    }
  }

  public draw(cameraOffsetY: number = 0) {
    if (this.isDead && this.deathAnimationStart) {
      // Handle death animation (spinning and fading out)
      const elapsedTime = this.p.millis() - this.deathAnimationStart;
      const progress = Math.min(elapsedTime / 1000, 1); // 1 second animation
      
      this.p.push();
      this.p.translate(this.x + this.width / 2, this.y - cameraOffsetY + this.height / 2);
      this.p.rotate(progress * this.p.PI * 4); // Spin 2 full rotations
      this.p.scale(1 - progress * 0.5); // Shrink a bit
      this.p.tint(255, 255, 255, 255 * (1 - progress)); // Fade out
      
      if (this.image) {
        this.p.image(
          this.image,
          -this.width / 2,
          -this.height / 2,
          this.width,
          this.height
        );
      } else {
        // Fallback if image isn't loaded
        this.p.fill(139, 69, 19); // Brown
        this.p.rect(-this.width / 2, -this.height / 2, this.width, this.height);
      }
      
      this.p.pop();
      return;
    }
    
    // Normal drawing (possibly with flash effect)
    const shouldDraw = !this.flashEffect || (this.p.millis() % 200 < 100);
    
    if (shouldDraw) {
      this.p.push();
      
      // Draw the base player
      if (this.image) {
        this.p.image(
          this.image,
          this.x,
          this.y - cameraOffsetY,
          this.width,
          this.height
        );
      } else {
        // Fallback if image isn't loaded
        this.p.fill(139, 69, 19); // Brown
        this.p.rect(this.x, this.y - cameraOffsetY, this.width, this.height);
      }
      
      // Draw accessories if loaded
      if (this.accessoriesLoaded) {
        const customization = useCustomization.getState();
        
        // Draw all accessories
        Object.entries(customization.selectedAccessories).forEach(([type, id]) => {
          if (id) {
            const accessory = getAccessoryById(id);
            const accessoryImage = this.accessories.get(id);
            
            if (accessory && accessoryImage) {
              // Draw the accessory with the specified position
              const { offsetX, offsetY, scale } = accessory.position;
              
              this.p.image(
                accessoryImage,
                this.x + offsetX,
                this.y - cameraOffsetY + offsetY,
                accessoryImage.width * scale,
                accessoryImage.height * scale
              );
            }
          }
        });
      }
      
      this.p.pop();
    }
    
    // Update flash effect
    if (this.flashEffect && this.p.millis() - this.flashStart > this.flashDuration) {
      this.flashEffect = false;
      this.invincible = false;
    }
  }

  public update() {
    // Nothing to update in normal state
    if (this.isDead) {
      // Handle any death-related updates here
    }
  }

  public moveUp() {
    const currentTime = this.p.millis();
    if (currentTime - this.lastMoveTime < this.movementCooldown || this.isDead) return;
    
    this.y -= this.speed;
    this.lastMoveTime = currentTime;
    this.isMoving = true;
  }

  public moveDown() {
    const currentTime = this.p.millis();
    if (currentTime - this.lastMoveTime < this.movementCooldown || this.isDead) return;
    
    this.y += this.speed;
    this.lastMoveTime = currentTime;
    this.isMoving = true;
  }

  public moveLeft() {
    const currentTime = this.p.millis();
    if (currentTime - this.lastMoveTime < this.movementCooldown || this.isDead) return;
    
    this.x -= this.speed;
    this.lastMoveTime = currentTime;
    this.isMoving = true;
  }

  public moveRight() {
    const currentTime = this.p.millis();
    if (currentTime - this.lastMoveTime < this.movementCooldown || this.isDead) return;
    
    this.x += this.speed;
    this.lastMoveTime = currentTime;
    this.isMoving = true;
  }

  public getPosition() {
    return { x: this.x, y: this.y, width: this.width, height: this.height };
  }

  public setPosition(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  public die() {
    if (this.invincible) return; // Can't die while invincible
    
    this.isDead = true;
    this.deathAnimationStart = this.p.millis();
  }

  public reset() {
    this.isDead = false;
    this.flashEffect = true;
    this.flashStart = this.p.millis();
    this.invincible = true;
    this.deathAnimationStart = null;
  }

  public isMovingState() {
    const moving = this.isMoving;
    this.isMoving = false; // Reset for next check
    return moving;
  }

  public isDeadState() {
    return this.isDead;
  }

  public isInvincible() {
    return this.invincible;
  }
  
  // Update player accessories when customization changes
  public updateAccessories() {
    this.accessoriesLoaded = false;
    this.loadAccessories();
  }
  
  public handleResize(newWidth: number, newHeight: number) {
    // Calculate scale factors
    const widthScale = newWidth / this.width;
    const heightScale = newHeight / this.height;
    
    // Update dimensions
    this.width = newWidth;
    this.height = newHeight;
    
    // Update speed based on new cell height
    this.speed = newHeight;
    
    // Scale position to maintain relative location
    this.x *= widthScale;
    this.y *= heightScale;
  }
}
