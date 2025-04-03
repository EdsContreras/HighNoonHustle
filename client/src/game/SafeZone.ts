import p5 from 'p5';
import { COLORS } from './constants';

export class SafeZone {
  private p: p5;
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  
  constructor(p: p5, x: number, y: number, width: number, height: number) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }
  
  public draw() {
    this.p.push();
    this.p.fill(COLORS.SAFE_ZONE);
    this.p.noStroke();
    this.p.rectMode(this.p.CORNER);
    this.p.rect(this.x, this.y, this.width, this.height);
    this.p.pop();
  }
  
  public contains(playerX: number, playerY: number, playerWidth: number, playerHeight: number): boolean {
    return (
      playerX + playerWidth > this.x &&
      playerX < this.x + this.width &&
      playerY + playerHeight > this.y &&
      playerY < this.y + this.height
    );
  }
}
