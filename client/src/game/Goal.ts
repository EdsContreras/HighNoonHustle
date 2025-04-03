import p5 from 'p5';
import { COLORS } from './constants';

export class Goal {
  private p: p5;
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private reached: boolean;
  
  constructor(p: p5, x: number, y: number, width: number, height: number) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.reached = false;
  }
  
  public draw() {
    this.p.push();
    
    // Set the drawing mode
    this.p.rectMode(this.p.CENTER);
    this.p.noStroke();
    
    // Draw background
    if (this.reached) {
      // Reached goals have a different color
      this.p.fill(150, 200, 150);
    } else {
      this.p.fill(COLORS.GOAL);
    }
    
    // Draw the goal
    this.p.rect(this.x, this.y, this.width, this.height);
    
    // Draw a marker if the goal is reached
    if (this.reached) {
      this.p.fill(100, 150, 100);
      this.p.ellipse(this.x, this.y, this.width * 0.6, this.height * 0.6);
    }
    
    this.p.pop();
  }
  
  public contains(pointX: number): boolean {
    return pointX > this.x - this.width / 2 && pointX < this.x + this.width / 2;
  }
  
  public isReached(): boolean {
    return this.reached;
  }
  
  public setReached(reached: boolean) {
    this.reached = reached;
  }
}
