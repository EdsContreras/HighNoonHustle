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

    // Use the configurable move speed constant for smoother movement
    if (Math.abs(distX) > 0.01 || Math.abs(distY) > 0.01) {
      // Apply the movement speed - higher value = faster movement
      this.x += distX * PLAYER_MOVE_SPEED;
      this.y += distY * PLAYER_MOVE_SPEED;
      this.moving = true;
    } else {
      // Snap to target position when very close
      this.x = this.targetX;
      this.y = this.targetY;
      this.moving = false;
    }
  }

  public draw() {
    const pixelX = this.x * this.cellWidth;
    const pixelY = this.y * this.cellHeight;

    this.p.push();
    this.p.translate(pixelX + this.cellWidth / 2, pixelY + this.cellHeight / 2);

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

    // Only check for cooldown, no longer block movement if already moving
    // This allows more responsive queueing of the next move
    if (currentTime - this.lastMoveTime < PLAYER_MOVE_COOLDOWN) {
      return false;
    }

    let moved = false;
    const oldX = this.targetX;
    const oldY = this.targetY;

    // If player is already more than one cell away from target, don't queue another move
    // This prevents player from queueing too many moves and losing control
    const distToTarget =
      Math.abs(this.x - this.targetX) + Math.abs(this.y - this.targetY);
    if (distToTarget > 1.0) {
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
}
