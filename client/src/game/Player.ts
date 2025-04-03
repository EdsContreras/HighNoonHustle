import p5 from 'p5';
import { PLAYER_WIDTH, PLAYER_HEIGHT, PLAYER_MOVE_COOLDOWN, KEYS, GRID_CELLS_X, GRID_CELLS_Y } from './constants';
import { loadImage } from './assets';

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
  
  constructor(p: p5, startX: number, startY: number, cellWidth: number, cellHeight: number) {
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
      this.image = await loadImage(this.p, '/assets/cowboy.svg');
    } catch (error) {
      console.error('Failed to load player image:', error);
    }
  }
  
  public update() {
    // Move the player towards the target position
    const moveSpeed = 10;
    const currentX = this.x * this.cellWidth;
    const currentY = this.y * this.cellHeight;
    const targetX = this.targetX * this.cellWidth;
    const targetY = this.targetY * this.cellHeight;
    
    const distX = targetX - currentX;
    const distY = targetY - currentY;
    
    if (Math.abs(distX) > 0.1 || Math.abs(distY) > 0.1) {
      this.x += distX * 0.2;
      this.y += distY * 0.2;
      this.moving = true;
    } else {
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
      this.p.image(
        this.image, 
        0, 
        0, 
        PLAYER_WIDTH, 
        PLAYER_HEIGHT
      );
    } else {
      // Fallback if image isn't loaded
      this.p.fill(200, 100, 50);
      this.p.rectMode(this.p.CENTER);
      this.p.rect(0, 0, PLAYER_WIDTH, PLAYER_HEIGHT);
    }
    
    this.p.pop();
  }
  
  public handleKeyPress(keyCode: number) {
    const currentTime = this.p.millis();
    
    // Check if enough time has passed since the last move
    if (currentTime - this.lastMoveTime < PLAYER_MOVE_COOLDOWN || this.moving) {
      return false;
    }
    
    let moved = false;
    const oldX = this.targetX;
    const oldY = this.targetY;
    
    // Handle movement keys
    if ((keyCode === KEYS.UP || keyCode === KEYS.W) && this.targetY > 0) {
      this.targetY -= 1;
      moved = true;
    } else if ((keyCode === KEYS.DOWN || keyCode === KEYS.S) && this.targetY < GRID_CELLS_Y - 1) {
      this.targetY += 1;
      moved = true;
    } else if ((keyCode === KEYS.LEFT || keyCode === KEYS.A) && this.targetX > 0) {
      this.targetX -= 1;
      moved = true;
    } else if ((keyCode === KEYS.RIGHT || keyCode === KEYS.D) && this.targetX < GRID_CELLS_X - 1) {
      this.targetX += 1;
      moved = true;
    }
    
    if (moved) {
      this.lastMoveTime = currentTime;
    }
    
    return moved;
  }
  
  public getRect() {
    return {
      x: this.x * this.cellWidth,
      y: this.y * this.cellHeight,
      width: PLAYER_WIDTH,
      height: PLAYER_HEIGHT
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
      y: Math.round(this.y)
    };
  }
}
