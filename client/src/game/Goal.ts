import p5 from 'p5';
import { COLORS } from './constants';

export class Goal {
  private p: p5;
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private reached: boolean;
  private allCoinsCollected: boolean;
  
  constructor(p: p5, x: number, y: number, width: number, height: number) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.reached = false;
    this.allCoinsCollected = false;
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
    } else if (this.allCoinsCollected) {
      // All coins collected but goal not reached yet - bright green
      this.p.fill(80, 220, 80, 220);
    } else {
      // Not all coins collected - show as red/locked
      this.p.fill(220, 80, 80, 180);
    }
    
    // Draw the goal
    this.p.rect(this.x, this.y, this.width, this.height);
    
    // Draw a marker if the goal is reached
    if (this.reached) {
      this.p.fill(100, 150, 100);
      this.p.ellipse(this.x, this.y, this.width * 0.6, this.height * 0.6);
    } else {
      // Draw a visual cue about the goal state
      if (this.allCoinsCollected) {
        // Draw a "ready" symbol (checkmark)
        this.p.stroke(255);
        this.p.strokeWeight(3);
        this.p.noFill();
        this.p.beginShape();
        this.p.vertex(this.x - this.width * 0.2, this.y);
        this.p.vertex(this.x, this.y + this.height * 0.2);
        this.p.vertex(this.x + this.width * 0.2, this.y - this.height * 0.2);
        this.p.endShape();
      } else {
        // Draw a "locked" symbol (X)
        this.p.stroke(255);
        this.p.strokeWeight(3);
        this.p.line(this.x - this.width * 0.2, this.y - this.height * 0.2, 
                   this.x + this.width * 0.2, this.y + this.height * 0.2);
        this.p.line(this.x + this.width * 0.2, this.y - this.height * 0.2, 
                   this.x - this.width * 0.2, this.y + this.height * 0.2);
      }
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
  
  public setAllCoinsCollected(collected: boolean) {
    this.allCoinsCollected = collected;
  }
  
  public areAllCoinsCollected(): boolean {
    return this.allCoinsCollected;
  }
}
