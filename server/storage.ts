import { users, highScores, type User, type InsertUser, type HighScore, type InsertHighScore } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // High score methods
  getHighScores(limit?: number): Promise<HighScore[]>;
  createHighScore(score: InsertHighScore): Promise<HighScore>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private highScores: Map<number, HighScore>;
  private userCurrentId: number;
  private scoreCurrentId: number;

  constructor() {
    this.users = new Map();
    this.highScores = new Map();
    this.userCurrentId = 1;
    this.scoreCurrentId = 1;
    
    // Add some default high scores for testing
    this.addDefaultHighScores();
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async getHighScores(limit: number = 10): Promise<HighScore[]> {
    // Convert Map to array, sort by score descending, and limit the results
    return Array.from(this.highScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
  
  async createHighScore(insertScore: InsertHighScore): Promise<HighScore> {
    const id = this.scoreCurrentId++;
    
    // Create the high score with current date
    const highScore: HighScore = { 
      ...insertScore, 
      id, 
      date: new Date() 
    };
    
    this.highScores.set(id, highScore);
    return highScore;
  }
  
  // Helper method to add some default high scores
  private addDefaultHighScores() {
    const defaultScores = [
      { playerName: "BUCK", score: 9500, level: 3 },
      { playerName: "COLTY", score: 8200, level: 3 },
      { playerName: "JESS", score: 7800, level: 3 },
      { playerName: "WYATT", score: 6500, level: 2 },
      { playerName: "CALAMJ", score: 5300, level: 2 }
    ];
    
    for (const score of defaultScores) {
      this.createHighScore(score);
    }
  }
}

export const storage = new MemStorage();
