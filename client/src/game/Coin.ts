import p5 from 'p5';
import { loadImage } from './assets';

export class Coin {
  private p: p5;
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private collected: boolean;
  private image: p5.Image | null;
  private animationOffset: number;
  
  constructor(p: p5, x: number, y: number, width: number, height: number) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.collected = false;
    this.image = null;
    this.animationOffset = p.random(0, 2 * p.PI); // Random starting point for animation
    
    this.loadAssets();
  }
  
  private async loadAssets() {
    try {
      this.image = await loadImage(this.p, '/assets/coin.png');
    } catch (error) {
      console.error('Failed to load coin image:', error);
    }
  }
  
  public draw(cameraOffsetY: number = 0) {
    if (this.collected) return;
    
    this.p.push();
    
    // Apply camera offset for scrolling
    const screenY = this.y - cameraOffsetY;
    
    // Simple hover animation
    const hoverOffset = this.p.sin(this.p.frameCount * 0.05 + this.animationOffset) * 5;
    
    // Draw the coin with animation
    if (this.image) {
      this.p.imageMode(this.p.CENTER);
      this.p.image(
        this.image, 
        this.x, 
        screenY + hoverOffset, 
        this.width, 
        this.height
      );
    } else {
      // Fallback if image isn't loaded
      this.p.fill(255, 215, 0); // Gold color
      this.p.ellipseMode(this.p.CENTER);
      this.p.ellipse(this.x, screenY + hoverOffset, this.width, this.height);
    }
    
    this.p.pop();
  }
  
  public contains(playerX: number, playerY: number, playerWidth: number, playerHeight: number): boolean {
    if (this.collected) return false;
    
    // Simple collision detection
    const coinLeft = this.x - this.width / 2;
    const coinRight = this.x + this.width / 2;
    const coinTop = this.y - this.height / 2;
    const coinBottom = this.y + this.height / 2;
    
    const playerLeft = playerX - playerWidth / 2;
    const playerRight = playerX + playerWidth / 2;
    const playerTop = playerY - playerHeight / 2;
    const playerBottom = playerY + playerHeight / 2;
    
    return !(
      playerLeft > coinRight || 
      playerRight < coinLeft || 
      playerTop > coinBottom || 
      playerBottom < coinTop
    );
  }
  
  public isCollected(): boolean {
    return this.collected;
  }
  
  public collect() {
    this.collected = true;
  }
  
  public getPosition() {
    return { x: this.x, y: this.y };
  }
  
  public handleResize(newWidth: number, newHeight: number) {
    this.width = newWidth;
    this.height = newHeight;
  }
}