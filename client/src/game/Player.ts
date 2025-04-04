import p5 from "p5";
import {
  PLAYER_WIDTH,
  PLAYER_HEIGHT,
  PLAYER_MOVE_COOLDOWN,
  PLAYER_MOVE_SPEED,
  KEYS,
  GRID_CELLS_X,
  GRID_CELLS_Y,
} from "./constants";
import { loadImage } from "./assets";

export class Player {
  private p: p5;
  public x: number;
  public y: number;
  private targetX: number;
  private targetY: number;
  private cellWidth: number;
  private cellHeight: number;
  private lastMoveTime: number;
  private moving: boolean;
  private image: p5.Image | null;
  private invincible: boolean;
  private invincibilityTime: number;
  private invincibilityDuration: number; // Duration in milliseconds
  private flashInterval: number; // How fast to flash in milliseconds
  private lastFlashTime: number;

  constructor(
    p: p5,
    startX: number,
    startY: number,
    cellWidth: number,
    cellHeight: number,
  ) {
    this.p = p;
    this.cellWidth = cellWidth;
    this.cellHeight = cellHeight;

    // Position player in grid cell coordinates
    this.x = startX;
    this.y = startY;
    this.targetX = startX;
    this.targetY = startY;

    this.lastMoveTime = 0;
    this.moving = false;
    this.image = null;
    
    // Invincibility settings
    this.invincible = false;
    this.invincibilityTime = 0;
    this.invincibilityDuration = 2000; // 2 seconds of invincibility
    this.flashInterval = 200; // Flash every 200ms
    this.lastFlashTime = 0;

    this.loadAssets();
  }

  private async loadAssets() {
    try {
      this.image = await loadImage(this.p, "/assets/outlaw.png");
    } catch (error) {
      console.error("Failed to load player image:", error);
    }
  }

  public update() {
    // Move the player towards the target position
    const currentX = this.x;
    const currentY = this.y;
    const targetX = this.targetX;
    const targetY = this.targetY;

    const distX = targetX - currentX;
    const distY = targetY - currentY;
    
    // Calculate total distance to target
    const totalDist = Math.sqrt(distX * distX + distY * distY);
    
    if (totalDist > 0.001) { // More precise threshold
      // Normalize movement vector for consistent diagonal speed
      const moveX = (distX / totalDist) * PLAYER_MOVE_SPEED;
      const moveY = (distY / totalDist) * PLAYER_MOVE_SPEED;
      
      this.x += moveX;
      this.y += moveY;
      this.moving = true;
      
      // Smoother snap threshold
      if (totalDist < 0.05) {
        this.x = this.targetX;
        this.y = this.targetY;
        this.moving = false;
      }
    } else {
      this.x = this.targetX;
      this.y = this.targetY;
      this.moving = false;
    }
    
    // Check if invincibility has expired
    if (this.invincible) {
      const currentTime = this.p.millis();
      if (currentTime - this.invincibilityTime > this.invincibilityDuration) {
        this.invincible = false;
        console.log("Player invincibility ended");
      }
    }
  }

  public draw() {
    const pixelX = this.x * this.cellWidth;
    const pixelY = this.y * this.cellHeight;

    this.p.push();
    this.p.translate(pixelX + this.cellWidth / 2, pixelY + this.cellHeight / 2);
    
    // Handle flashing effect when invincible
    let visible = true;
    if (this.invincible) {
      const currentTime = this.p.millis();
      
      // Only draw player every other flash interval
      if (currentTime - this.lastFlashTime > this.flashInterval) {
        this.lastFlashTime = currentTime;
        visible = !visible; // Toggle visibility for flashing effect
      }
      
      // Apply a white tint when invincible (alternating with normal appearance)
      if (visible) {
        this.p.tint(255, 255, 255, 180); // Semi-transparent white
      }
    }
    
    // Only draw if visible (for flashing effect)
    if (visible) {
      // Draw the player sprite
      if (this.image) {
        this.p.imageMode(this.p.CENTER);
        this.p.image(this.image, 0, 0, PLAYER_WIDTH, PLAYER_HEIGHT);
      } else {
        // Fallback if image isn't loaded
        this.p.fill(200, 100, 50);
        this.p.rectMode(this.p.CENTER);
        this.p.rect(0, 0, PLAYER_WIDTH, PLAYER_HEIGHT);
      }
    }
    
    // Reset tint
    this.p.noTint();
    
    // Uncomment for debugging to show the hitbox
    // const hitbox = this.getRect();
    // this.p.noFill();
    // this.p.stroke(255, 0, 0);
    // this.p.rectMode(this.p.CORNER);
    // this.p.rect(
    //   hitbox.x - pixelX - this.cellWidth / 2, 
    //   hitbox.y - pixelY - this.cellHeight / 2, 
    //   hitbox.width, 
    //   hitbox.height
    // );

    this.p.pop();
  }

  public handleKeyPress(keyCode: number) {
    const currentTime = this.p.millis();

    // Check for cooldown AND if player is already moving
    if (currentTime - this.lastMoveTime < PLAYER_MOVE_COOLDOWN || this.moving) {
      return false;
    }

    let moved = false;
    const oldX = this.targetX;
    const oldY = this.targetY;

    // Prevent any movement if the player is not exactly at their target position
    // This ensures we only process movement commands when the player is ready to move
    const distanceToTarget = Math.abs(this.x - this.targetX) + Math.abs(this.y - this.targetY);
    if (distanceToTarget > 0.01) {
      return false;
    }

    // Handle movement keys
    if ((keyCode === KEYS.UP || keyCode === KEYS.W) && this.targetY > 0) {
      this.targetY -= 1;
      moved = true;
    } else if (
      (keyCode === KEYS.DOWN || keyCode === KEYS.S) &&
      this.targetY < GRID_CELLS_Y - 1
    ) {
      this.targetY += 1;
      moved = true;
    } else if (
      (keyCode === KEYS.LEFT || keyCode === KEYS.A) &&
      this.targetX > 0
    ) {
      this.targetX -= 1;
      moved = true;
    } else if (
      (keyCode === KEYS.RIGHT || keyCode === KEYS.D) &&
      this.targetX < GRID_CELLS_X - 1
    ) {
      this.targetX += 1;
      moved = true;
    }

    if (moved) {
      this.lastMoveTime = currentTime;
      console.log("Player moving to:", this.targetX, this.targetY);
    }

    return moved;
  }

  public getRect() {
    // Create a smaller hitbox for the player (70% of the actual size)
    // and center it within the cell to avoid false collisions
    const hitboxWidth = PLAYER_WIDTH * 0.7;
    const hitboxHeight = PLAYER_HEIGHT * 0.7;
    
    return {
      x: (this.x * this.cellWidth) + (PLAYER_WIDTH - hitboxWidth) / 2,
      y: (this.y * this.cellHeight) + (PLAYER_HEIGHT - hitboxHeight) / 2,
      width: hitboxWidth,
      height: hitboxHeight,
    };
  }

  public reset(startX: number, startY: number) {
    this.x = startX;
    this.y = startY;
    this.targetX = startX;
    this.targetY = startY;
    this.moving = false;
    
    // Reset invincibility state when position is reset
    this.invincible = false;
  }

  public handleResize(cellWidth: number, cellHeight: number) {
    this.cellWidth = cellWidth;
    this.cellHeight = cellHeight;
  }

  public isMoving(): boolean {
    return this.moving;
  }

  public getGridPosition() {
    return {
      x: Math.round(this.x),
      y: Math.round(this.y),
    };
  }
  
  /**
   * Start the invincibility effect
   * @param duration Optional override for the invincibility duration in milliseconds
   */
  public makeInvincible(duration?: number) {
    this.invincible = true;
    this.invincibilityTime = this.p.millis();
    
    if (duration !== undefined) {
      this.invincibilityDuration = duration;
    }
    
    console.log("Player is now invincible for", this.invincibilityDuration / 1000, "seconds");
  }
  
  /**
   * Check if the player is currently invincible
   */
  public isInvincible(): boolean {
    return this.invincible;
  }
}
